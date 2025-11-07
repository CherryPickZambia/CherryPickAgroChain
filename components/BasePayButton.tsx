"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { processPayment, pollPaymentStatus } from "@/lib/basePay";
import { createPayment } from "@/lib/supabaseService";

interface BasePayButtonProps {
  amount: string;
  recipientAddress: string;
  contractId: string;
  milestoneId?: string;
  recipientId: string;
  recipientType: "farmer" | "officer";
  description?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  colorScheme?: "light" | "dark";
}

export default function BasePayButton({
  amount,
  recipientAddress,
  contractId,
  milestoneId,
  recipientId,
  recipientType,
  description,
  onSuccess,
  onError,
  colorScheme = "light",
}: BasePayButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const isLight = colorScheme === "light";

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Process payment with Base Pay
      const payment = await processPayment({
        amount,
        to: recipientAddress,
        description,
        testnet: true, // Set to false for mainnet
        payerInfo: {
          requests: [
            { type: "email" },
            { type: "onchainAddress" },
          ],
        },
      });

      // Save payment to database
      const dbPayment = await createPayment({
        contract_id: contractId,
        milestone_id: milestoneId || null,
        recipient_id: recipientId,
        recipient_type: recipientType,
        amount: parseFloat(amount),
        transaction_hash: payment.id,
        status: "processing",
        completed_at: null,
      });

      // Poll for payment completion
      const status = await pollPaymentStatus(payment.id, true, 30, 2000);

      if (status === "completed") {
        // Update payment status in database
        await createPayment({
          ...dbPayment,
          status: "completed",
          completed_at: new Date().toISOString(),
        });

        onSuccess?.(payment.id);
      } else if (status === "failed") {
        throw new Error("Payment failed");
      } else {
        throw new Error("Payment timeout - please check transaction status");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      onError?.(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={isProcessing}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 16px",
        backgroundColor: isLight ? "#ffffff" : "#0000FF",
        border: "none",
        borderRadius: "8px",
        cursor: isProcessing ? "not-allowed" : "pointer",
        fontFamily: "system-ui, -apple-system, sans-serif",
        minWidth: "180px",
        height: "44px",
        opacity: isProcessing ? 0.6 : 1,
      }}
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin mr-2" style={{ color: isLight ? "#000000" : "#ffffff" }} />
          <span style={{ color: isLight ? "#000000" : "#ffffff", fontSize: "14px", fontWeight: "500" }}>
            Processing...
          </span>
        </>
      ) : (
        <img
          src={isLight ? "/images/base-account/BasePayBlueLogo.png" : "/images/base-account/BasePayWhiteLogo.png"}
          alt="Base Pay"
          style={{
            height: "20px",
            width: "auto",
          }}
          onError={(e) => {
            // Fallback if images don't exist
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement!.innerHTML = `
              <div style="width: 16px; height: 16px; background-color: ${isLight ? "#0000FF" : "#FFFFFF"}; border-radius: 2px; flex-shrink: 0; margin-right: 8px;"></div>
              <span style="color: ${isLight ? "#000000" : "#ffffff"}; font-size: 14px; font-weight: 500;">Pay with Base</span>
            `;
          }}
        />
      )}
    </button>
  );
}
