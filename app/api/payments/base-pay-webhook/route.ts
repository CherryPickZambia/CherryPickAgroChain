import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

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
        const signature = req.headers.get("x-cb-signature");
        const rawBody = await req.text();

        // Signature verification is MANDATORY - this webhook marks contracts as
        // funded/active, so it must never be processed unverified.
        const secret = process.env.BASE_PAY_WEBHOOK_SECRET;
        if (!secret) {
            console.error("BASE_PAY_WEBHOOK_SECRET is not configured - rejecting webhook.");
            return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
        }
        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 401 });
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("hex");

        if (!signaturesMatch(expectedSignature, signature)) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const event = JSON.parse(rawBody);

        console.log("🔔 Received Base Pay Webhook Event:", event.type);

        if (event.type === "charge.completed" || event.type === "payment.success") {
            const { metadata, amount, id, transaction_hash } = event.data;

            const contractId = metadata?.contract_id;
            const amountPaid = amount?.value;

            if (!contractId || !amountPaid) {
                console.error("Webhook event missing critical metadata:", event.data);
                return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
            }

            // Find the contract
            const { data: contract, error: contractErr } = await supabase
                .from('contracts')
                .select('*')
                .eq('id', contractId)
                .single();

            if (contractErr) {
                console.error("Contract not found for webhook charge:", contractId);
                return NextResponse.json({ error: "Contract not found" }, { status: 404 });
            }

            // Update contract status to active or paid
            await supabase
                .from('contracts')
                .update({ status: 'active' })
                .eq('id', contractId);

            // Log the funding transaction
            await supabase.from('escrow_transactions').insert({
                contract_id: contractId,
                amount: parseFloat(amountPaid),
                status: 'funded',
                destination_wallet: 'Base Pay Escrow / CDP Server Wallet',
                server_tx_hash: transaction_hash || id // Keep track of base pay charge ID or hash
            });

            console.log(`✅ Successfully processed Base Pay funding for Contract ${contractId}`);
        }

        return NextResponse.json({ success: true, message: "Webhook processed" });

    } catch (err: any) {
        console.error("Base Pay Webhook Processing Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
