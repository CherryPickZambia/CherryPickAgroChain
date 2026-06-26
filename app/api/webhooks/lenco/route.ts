import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// Lenco signs webhooks with HMAC-SHA512 using a key DERIVED from your API token:
//   webhook_hash_key = SHA256(API_TOKEN)            (hex)
//   x-lenco-signature = HMAC_SHA512(rawBody, key)   (hex)
// There is no separate "webhook secret" in the Lenco dashboard — set your Lenco
// API token (the same one the VPS backend uses) as LENCO_API_TOKEN in Vercel.
// LENCO_WEBHOOK_SECRET is accepted as a fallback name for that same token value.
const LENCO_API_TOKEN = process.env.LENCO_API_TOKEN || process.env.LENCO_WEBHOOK_SECRET;

function getWebhookHashKey(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
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

        // 1. Security Verification — MANDATORY. This webhook credits user balances,
        // so it must never be processed without a valid signature.
        if (!LENCO_API_TOKEN) {
            console.error("❌ Lenco Webhook: LENCO_API_TOKEN is not configured — rejecting.");
            return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
        }
        if (!signature) {
            console.error("❌ Lenco Webhook: Missing signature header");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const hashKey = getWebhookHashKey(LENCO_API_TOKEN);
        // Verify against the raw body (preferred) and a compacted re-serialization
        // as a fallback, since some Lenco SDKs sign JSON.stringify(body) rather than
        // the exact bytes received.
        const payloadCandidates = [rawBody];
        try {
            payloadCandidates.push(JSON.stringify(JSON.parse(rawBody)));
        } catch {
            // rawBody isn't valid JSON on its own — ignore the fallback.
        }
        const signatureValid = payloadCandidates.some((payload) =>
            signaturesMatch(computeSignature(payload, hashKey), signature),
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
