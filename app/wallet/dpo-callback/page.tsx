"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import Providers from "@/components/Providers";
import { supabase } from "@/lib/supabase";
import {
  DPO_PENDING_WALLET_DEPOSIT_KEY,
  verifyDpoCardPayment,
} from "@/lib/dpo/client";

interface PendingWalletDeposit {
  reference: string;
  transToken: string;
  walletAddress: string;
  amount: number;
  returnPath: string;
}

function DpoWalletCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Confirming your card deposit with DPO...");
  const [returnPath, setReturnPath] = useState("/dashboard");

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const finish = async () => {
      const cancelledPayment = searchParams.get("cancelled") === "1";
      const reference = searchParams.get("ref") || "";

      if (cancelledPayment) {
        sessionStorage.removeItem(DPO_PENDING_WALLET_DEPOSIT_KEY);
        setStatus("failed");
        setMessage("Card deposit was cancelled. You can try again from your wallet.");
        return;
      }

      const raw = sessionStorage.getItem(DPO_PENDING_WALLET_DEPOSIT_KEY);
      if (!raw) {
        setStatus("failed");
        setMessage("We could not find your deposit session. If money was deducted, contact support.");
        return;
      }

      let pending: PendingWalletDeposit;
      try {
        pending = JSON.parse(raw) as PendingWalletDeposit;
      } catch {
        setStatus("failed");
        setMessage("Your deposit session was invalid. Please try again.");
        return;
      }

      if (pending.returnPath) {
        setReturnPath(pending.returnPath);
      }

      if (reference && pending.reference !== reference) {
        setStatus("failed");
        setMessage("Payment reference mismatch. Please contact support if money was deducted.");
        return;
      }

      const tokenFromUrl =
        searchParams.get("TransactionToken") ||
        searchParams.get("TransToken") ||
        searchParams.get("ID") ||
        searchParams.get("transToken");

      const transToken = pending.transToken || tokenFromUrl || "";
      if (!transToken) {
        setStatus("failed");
        setMessage("Missing DPO payment token. Please try again.");
        return;
      }

      const creditWallet = async () => {
        if (supabase) {
          const { data: existing } = await supabase
            .from("payments")
            .select("id")
            .eq("transaction_hash", pending.reference)
            .maybeSingle();

          if (!existing) {
            await supabase.from("payments").insert({
              from_address: "dpo-card",
              to_address: pending.walletAddress,
              amount: pending.amount,
              currency: "ZMW",
              transaction_hash: pending.reference,
              status: "confirmed",
              confirmed_at: new Date().toISOString(),
            });
          }
        }

        sessionStorage.removeItem(DPO_PENDING_WALLET_DEPOSIT_KEY);
        if (!cancelled) {
          setStatus("success");
          setMessage(`K${pending.amount.toLocaleString()} has been deposited to your wallet.`);
          toast.success("Card deposit successful!");
        }
      };

      const verifyOnce = async () => {
        const verify = await verifyDpoCardPayment(transToken);
        if (verify.paid) {
          await creditWallet();
          if (pollTimer) clearInterval(pollTimer);
          return true;
        }
        if (verify.failed) {
          sessionStorage.removeItem(DPO_PENDING_WALLET_DEPOSIT_KEY);
          if (!cancelled) {
            setStatus("failed");
            setMessage(verify.explanation || "Card deposit was not completed.");
          }
          if (pollTimer) clearInterval(pollTimer);
          return true;
        }
        if (!cancelled) {
          setMessage("Waiting for bank confirmation... This can take a minute.");
        }
        return false;
      };

      try {
        const done = await verifyOnce();
        if (done) return;

        pollTimer = setInterval(async () => {
          try {
            await verifyOnce();
          } catch (error) {
            if (!cancelled) {
              setStatus("failed");
              setMessage(error instanceof Error ? error.message : "Verification failed.");
            }
            if (pollTimer) clearInterval(pollTimer);
          }
        }, 5000);
      } catch (error) {
        if (!cancelled) {
          setStatus("failed");
          setMessage(error instanceof Error ? error.message : "Verification failed.");
        }
      }
    };

    finish();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 text-[#0C2D3A] animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-[#0C2D3A] mb-2">Processing card deposit</h1>
            <p className="text-sm text-gray-500">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-[#0C2D3A] mb-2">Deposit successful</h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <Link
              href={returnPath}
              className="inline-flex w-full items-center justify-center py-3.5 bg-[#0C2D3A] text-white rounded-xl font-bold"
            >
              Back to Wallet
            </Link>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-[#0C2D3A] mb-2">Deposit not completed</h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <Link
              href={returnPath}
              className="inline-flex w-full items-center justify-center py-3.5 bg-[#0C2D3A] text-white rounded-xl font-bold"
            >
              Try again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function DpoWalletCallbackPage() {
  return (
    <Providers>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-[#0C2D3A] animate-spin" />
          </div>
        }
      >
        <DpoWalletCallbackContent />
      </Suspense>
    </Providers>
  );
}
