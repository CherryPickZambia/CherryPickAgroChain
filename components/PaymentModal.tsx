"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Loader, CheckCircle, XCircle, ExternalLink, AlertCircle, Wallet, CreditCard } from "lucide-react";
import { sendPayment, purchaseViaContract, getExplorerUrl, formatTxHash, getUSDCBalance, MARKETPLACE_ABI, USDC_ABI, MARKETPLACE_ADDRESS, USDC_CONTRACT_ADDRESS } from "@/lib/basePayService";
import { useEvmAddress, useSendUserOperation, useCurrentUser } from "@coinbase/cdp-hooks";
import { encodeFunctionData, parseUnits } from "viem";
import toast from "react-hot-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  order: {
    id: string;
    crop_type: string;
    quantity: number;
    unit: string;
    total_amount: number;
    farmer_name: string;
    farmer_address: string;
  };
  onSuccessAction: (transactionHash: string) => void;
}

export default function PaymentModal({ isOpen, onCloseAction, order, onSuccessAction }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const { evmAddress } = useEvmAddress();
  const { sendUserOperation } = useSendUserOperation();
  const { currentUser } = useCurrentUser();
  const [paymentMethod, setPaymentMethod] = useState<'smart' | 'external'>('smart');

  // Load balance when modal opens
  useEffect(() => {
    if (isOpen && evmAddress) {
      getUSDCBalance(evmAddress as `0x${string}`)
        .then((balance) => setUsdcBalance(Number(balance))) // Explicit cast
        .catch(console.error);

      // Default to smart wallet if available, otherwise external
      const hasSmartWallet = currentUser?.evmSmartAccounts?.[0];
      setPaymentMethod(hasSmartWallet ? 'smart' : 'external');
    }
  }, [isOpen, evmAddress, currentUser]);

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentStatus("processing");
    setErrorMessage("");

    try {
      // 1. Check if using Smart Wallet (CDP) and user selected it
      const smartAccount = currentUser?.evmSmartAccounts?.[0];

      if (paymentMethod === 'smart' && smartAccount) {
        // --- SMART WALLET FLOW (Batch Transaction) ---
        console.log("Using Smart Wallet:", smartAccount);
        toast.loading("Processing with Smart Wallet...", { id: 'payment-status' });

        const usdcAmount = parseUnits(order.total_amount.toString(), 6);

        // a. Encode Approval
        const approveData = encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'approve',
          args: [MARKETPLACE_ADDRESS, usdcAmount]
        });

        // b. Encode Purchase
        const purchaseData = encodeFunctionData({
          abi: MARKETPLACE_ABI,
          functionName: 'purchase',
          args: [order.farmer_address as `0x${string}`, usdcAmount, order.id]
        });

        // c. Send Batch Transaction
        const result = await sendUserOperation({
          evmSmartAccount: smartAccount,
          network: "base", // Or 'base-sepolia' if strictly testing, but usually inferred
          calls: [
            {
              to: USDC_CONTRACT_ADDRESS,
              data: approveData,
              value: BigInt(0)
            },
            {
              to: MARKETPLACE_ADDRESS,
              data: purchaseData,
              value: BigInt(0)
            }
          ]
        });

        toast.dismiss('payment-status');
        setPaymentStatus("success");
        setTransactionHash(result.userOperationHash);
        toast.success("Payment successful!");
        onSuccessAction(result.userOperationHash);

        // Close modal after delay
        setTimeout(() => {
          onCloseAction();
          // resetModal handled via unmount/remount usually but we can reset if needed
        }, 3000);

      } else {
        // --- EXTERNAL WALLET FLOW (Legacy/Extension) ---
        console.log("Using External Wallet (window.ethereum)");
        const result = await purchaseViaContract({
          to: order.farmer_address,
          amount: order.total_amount,
          orderId: order.id,
          cropType: order.crop_type,
          quantity: order.quantity,
        }, (status) => {
          toast.loading(status, { id: 'payment-status' });
        });

        toast.dismiss('payment-status');

        if (result.success && result.transactionHash) {
          setPaymentStatus("success");
          setTransactionHash(result.transactionHash);
          toast.success("Payment successful!");
          onSuccessAction(result.transactionHash);
          setTimeout(() => {
            onCloseAction();
          }, 3000);
        } else {
          setPaymentStatus("error");
          setErrorMessage(result.error || "Payment failed");
          toast.error(result.error || "Payment failed");
        }
      }

    } catch (error: any) {
      console.error("Payment error:", error);
      toast.dismiss('payment-status');
      setPaymentStatus("error");
      setErrorMessage(error.message || "An unexpected error occurred");
      toast.error("Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setPaymentStatus("idle");
    setTransactionHash("");
    setErrorMessage("");
    setIsProcessing(false);
  };

  const handleClose = () => {
    if (!isProcessing) {
      onCloseAction();
      setTimeout(resetModal, 300);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Complete Payment</h2>
                  {!isProcessing && (
                    <button
                      onClick={handleClose}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <p className="text-green-100">
                  Pay {order.farmer_name} for {order.crop_type}
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Payment Method Selector */}
                {paymentStatus === "idle" && (
                  <div className="mb-6 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('smart')}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center ${paymentMethod === 'smart'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-200 text-gray-600'
                        }`}
                    >
                      <Wallet className={`h-6 w-6 mb-2 ${paymentMethod === 'smart' ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-bold">Platform Wallet</span>
                      <span className="text-xs opacity-75">Gasless • Instant</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('external')}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center ${paymentMethod === 'external'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-200 text-gray-600'
                        }`}
                    >
                      <CreditCard className={`h-6 w-6 mb-2 ${paymentMethod === 'external' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-bold">External Wallet</span>
                      <span className="text-xs opacity-75">Base Pay • Metamask</span>
                    </button>
                  </div>
                )}

                {/* Order Details */}
                {paymentStatus === "idle" && (
                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Product</span>
                        <span className="font-semibold text-gray-900">{order.crop_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity</span>
                        <span className="font-semibold text-gray-900">
                          {order.quantity} {order.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Farmer</span>
                        <span className="font-semibold text-gray-900">{order.farmer_name}</span>
                      </div>
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-900 font-medium">Total Amount</span>
                          <span className="text-2xl font-bold text-green-600">
                            K{order.total_amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Farmer Wallet */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Payment will be sent to:</p>
                      <p className="text-xs font-mono text-gray-800 break-all">
                        {order.farmer_address}
                      </p>
                    </div>

                    {/* Sender Balance */}
                    <div className={`p-4 rounded-lg flex justify-between items-center ${usdcBalance >= order.total_amount ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Your Wallet Balance</p>
                        <p className={`text-xl font-bold ${usdcBalance >= order.total_amount ? 'text-green-700' : 'text-red-700'
                          }`}>
                          ${usdcBalance.toFixed(2)} USDC
                        </p>
                      </div>
                      {usdcBalance < order.total_amount && (
                        <div className="text-right">

                          <p className="text-xs text-red-600 font-medium">Insufficient Funds</p>
                          <p className="text-xs text-red-500">Need ${(order.total_amount - usdcBalance).toFixed(2)} more</p>
                        </div>
                      )}
                    </div>

                    {/* Warning */}
                    <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Important</p>
                        <p>
                          This transaction involves 2 steps: Approving USDC and then Completing Purchase.
                          Please confirm both in your wallet.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing State */}
                {paymentStatus === "processing" && (
                  <div className="py-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <Loader className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h3>
                    <p className="text-gray-600">
                      Please confirm the transaction in your wallet...
                    </p>
                  </div>
                )}

                {/* Success State */}
                {paymentStatus === "success" && (
                  <div className="py-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"
                    >
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                    <p className="text-gray-600 mb-4">
                      Your payment has been sent to {order.farmer_name}
                    </p>
                    {transactionHash && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-600 mb-2">Transaction Hash</p>
                        <p className="text-xs font-mono text-gray-800 mb-3 break-all">
                          {formatTxHash(transactionHash)}
                        </p>
                        <a
                          href={getExplorerUrl(transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <span>View on Block Explorer</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Error State */}
                {paymentStatus === "error" && (
                  <div className="py-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h3>
                    <p className="text-gray-600 mb-4">{errorMessage}</p>
                    <button
                      onClick={() => {
                        setPaymentStatus("idle");
                        setErrorMessage("");
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                {paymentStatus === "idle" && (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={isProcessing || usdcBalance < order.total_amount}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <DollarSign className="h-5 w-5" />
                      <span>
                        {usdcBalance < order.total_amount ? 'Insufficient Funds' : `Pay K${order.total_amount.toLocaleString()}`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
