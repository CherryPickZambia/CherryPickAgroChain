import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.LENCO_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-lenco-signature");

        // 1. Security Verification (if secret is configured)
        if (WEBHOOK_SECRET && signature) {
            const hmac = crypto.createHmac("sha512", WEBHOOK_SECRET);
            const digest = hmac.update(rawBody).digest("hex");

            if (digest !== signature) {
                console.error("❌ Lenco Webhook: Invalid signature");
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
            console.log("✅ Lenco Webhook: Signature verified");
        } else if (WEBHOOK_SECRET && !signature) {
            console.warn("⚠️ Lenco Webhook: Missing signature header, but secret is configured");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const event = JSON.parse(rawBody);
        console.log("🔔 Received Lenco Webhook Event:", event.event || event.type || "unknown");

        const status = event.status || (event.data && event.data.status);
        const data = event.data || event;
        const reference = data.reference;

        // 2. Process Successful Payment
        if ((status === "successful" || status === "success") && reference) {
            console.log(`Processing successful Lenco payment for reference: ${reference}`);

            if (supabase) {
                // Update the payment status from 'pending' to 'confirmed'
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
        }

        return NextResponse.json({ success: true, message: "Webhook processed" });

    } catch (err: any) {
        console.error("Lenco Webhook Processing Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
