"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Loader, CheckCircle, XCircle, ExternalLink, AlertCircle } from "lucide-react";
import { sendPayment, getExplorerUrl, formatTxHash } from "@/lib/basePayService";
import toast from "react-hot-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    crop_type: string;
    quantity: number;
    unit: string;
    total_amount: number;
    farmer_name: string;
    farmer_address: string;
  };
  onSuccess: (transactionHash: string) => void;
}

export default function PaymentModal({ isOpen, onClose, order, onSuccess }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentStatus("processing");
    setErrorMessage("");

    try {
      const result = await sendPayment({
        to: order.farmer_address,
        amount: order.total_amount,
        orderId: order.id,
        cropType: order.crop_type,
        quantity: order.quantity,
      });

      if (result.success && result.transactionHash) {
        setPaymentStatus("success");
        setTransactionHash(result.transactionHash);
        toast.success("Payment successful!");
        
        // Call success callback
        onSuccess(result.transactionHash);
        
        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
          resetModal();
        }, 3000);
      } else {
        setPaymentStatus("error");
        setErrorMessage(result.error || "Payment failed");
        toast.error(result.error || "Payment failed");
      }
    } catch (error: any) {
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
      onClose();
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

                    {/* Warning */}
                    <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Important</p>
                        <p>
                          This transaction will be processed on the Base blockchain. Make sure you have
                          enough ETH for gas fees.
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
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <DollarSign className="h-5 w-5" />
                      <span>Pay K{order.total_amount.toLocaleString()}</span>
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
