import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// Lenco signs webhooks with HMAC-SHA512: x-lenco-signature = HMAC_SHA512(rawBody, key).
// The signing key is the "Signature key" shown in the Lenco dashboard
// (Webhooks tab) - that value is the precomputed webhook_hash_key = SHA256(API token).
//
// Set LENCO_WEBHOOK_SECRET (or LENCO_API_TOKEN) in Vercel to the dashboard
// "Signature key". To be robust we accept EITHER the dashboard Signature key
// (used directly as the HMAC key) OR a raw API token (we derive SHA256 of it),
// so verification works regardless of which value was provided.
const LENCO_WEBHOOK_VALUE = process.env.LENCO_WEBHOOK_SECRET || process.env.LENCO_API_TOKEN;

function candidateHashKeys(value: string): string[] {
    const derived = crypto.createHash("sha256").update(value).digest("hex");
    // Prefer the value as-is (dashboard Signature key), then SHA256(value) for a raw token.
    return Array.from(new Set([value, derived]));
}

function computeSignature(payload: string, hashKey: string): string {
    return crypto.createHmac("sha512", hashKey).update(payload).digest("hex");
}

/** Constant-time comparison of two hex signatures, length-safe. */
function signaturesMatch(expectedHex: string, providedHex: string): boolean {
    try {
        const expected = Buffer.from(expectedHex, "hex");
        const provided = Buffer.from(providedHex, "hex");
        if (expected.length === 0 || expected.length !== provided.length) return false;
        return crypto.timingSafeEqual(expected, provided);
    } catch {
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-lenco-signature");

        // 1. Security Verification - MANDATORY. This webhook credits user balances,
        // so it must never be processed without a valid signature.
        if (!LENCO_WEBHOOK_VALUE) {
            console.error("❌ Lenco Webhook: LENCO_WEBHOOK_SECRET is not configured - rejecting.");
            return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
        }
        if (!signature) {
            console.error("❌ Lenco Webhook: Missing signature header");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify against the raw body (preferred) and a compacted re-serialization
        // fallback, using either the dashboard Signature key directly or SHA256(value).
        const payloadCandidates = [rawBody];
        try {
            payloadCandidates.push(JSON.stringify(JSON.parse(rawBody)));
        } catch {
            // rawBody isn't valid JSON on its own - ignore the fallback.
        }
        const hashKeys = candidateHashKeys(LENCO_WEBHOOK_VALUE);
        const signatureValid = hashKeys.some((key) =>
            payloadCandidates.some((payload) =>
                signaturesMatch(computeSignature(payload, key), signature),
            ),
        );
        if (!signatureValid) {
            console.error("❌ Lenco Webhook: Invalid signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
        console.log("✅ Lenco Webhook: Signature verified");

        const event = JSON.parse(rawBody);
        console.log("🔔 Received Lenco Webhook Event:", event.event || event.type || "unknown");

        const status = event.status || (event.data && event.data.status);
        const data = event.data || event;

        // Lenco may surface the identifier under different keys depending on the
        // product (collection vs transfer). We stored OUR reference as the
        // transaction_hash, but match every plausible field so a deposit is never
        // stranded due to a reference/id mismatch.
        const candidateRefs = Array.from(
            new Set(
                [
                    data.reference,
                    data.transactionReference,
                    data.transaction_reference,
                    data.merchantReference,
                    data.id,
                    event.reference,
                    event.id,
                ].filter((r): r is string => typeof r === "string" && r.length > 0),
            ),
        );
        const reference = candidateRefs[0];

        if (candidateRefs.length === 0) {
            console.warn("⚠️ Lenco Webhook: no reference/id found in payload");
            return NextResponse.json({ success: true, message: "No reference to process" });
        }

        // 2. Process payment outcome
        if (status === "successful" || status === "success") {
            console.log(`Processing successful Lenco payment for references: ${candidateRefs.join(", ")}`);

            if (supabase) {
                const { data: updated, error } = await supabase
                    .from('payments')
                    .update({
                        status: 'confirmed',
                        confirmed_at: new Date().toISOString(),
                    })
                    .in('transaction_hash', candidateRefs)
                    .eq('status', 'pending')
                    .select();

                if (error) {
                    console.error("❌ Supabase update error:", error);
                    return NextResponse.json({ error: "Database update failed" }, { status: 500 });
                }

                if (updated && updated.length > 0) {
                    console.log(`✅ Balance updated for reference: ${reference}`);
                } else {
                    console.warn(`⚠️ No pending payment found for references: ${candidateRefs.join(", ")}`);
                }
            }
        } else if (
            status === "failed" || status === "cancelled" || status === "rejected" || status === "declined"
        ) {
            console.log(`Marking failed Lenco payment for references: ${candidateRefs.join(", ")}`);

            if (supabase) {
                await supabase
                    .from('payments')
                    .update({ status: 'failed' })
                    .in('transaction_hash', candidateRefs)
                    .eq('status', 'pending');
            }
        }

        return NextResponse.json({ success: true, message: "Webhook processed" });

    } catch (err: any) {
        console.error("Lenco Webhook Processing Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
