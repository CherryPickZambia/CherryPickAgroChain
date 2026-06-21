import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.LENCO_WEBHOOK_SECRET;

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
        if (!WEBHOOK_SECRET) {
            console.error("❌ Lenco Webhook: LENCO_WEBHOOK_SECRET is not configured — rejecting.");
            return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
        }
        if (!signature) {
            console.error("❌ Lenco Webhook: Missing signature header");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const digest = crypto.createHmac("sha512", WEBHOOK_SECRET).update(rawBody).digest("hex");
        if (!signaturesMatch(digest, signature)) {
            console.error("❌ Lenco Webhook: Invalid signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
        console.log("✅ Lenco Webhook: Signature verified");

        const event = JSON.parse(rawBody);
        console.log("🔔 Received Lenco Webhook Event:", event.event || event.type || "unknown");

        const status = event.status || (event.data && event.data.status);
        const data = event.data || event;
        const reference = data.reference;

        // 2. Process payment outcome
        if ((status === "successful" || status === "success") && reference) {
            console.log(`Processing successful Lenco payment for reference: ${reference}`);

            if (supabase) {
                const { data: updated, error } = await supabase
                    .from('payments')
                    .update({
                        status: 'confirmed',
                        confirmed_at: new Date().toISOString(),
                    })
                    .eq('transaction_hash', reference)
                    .select();

                if (error) {
                    console.error("❌ Supabase update error:", error);
                    return NextResponse.json({ error: "Database update failed" }, { status: 500 });
                }

                if (updated && updated.length > 0) {
                    console.log(`✅ Balance updated for reference: ${reference}`);
                } else {
                    console.warn(`⚠️ No pending payment found for reference: ${reference}`);
                }
            }
        } else if (
            reference &&
            (status === "failed" || status === "cancelled" || status === "rejected" || status === "declined")
        ) {
            console.log(`Marking failed Lenco payment for reference: ${reference}`);

            if (supabase) {
                await supabase
                    .from('payments')
                    .update({ status: 'failed' })
                    .eq('transaction_hash', reference)
                    .eq('status', 'pending');
            }
        }

        return NextResponse.json({ success: true, message: "Webhook processed" });

    } catch (err: any) {
        console.error("Lenco Webhook Processing Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
