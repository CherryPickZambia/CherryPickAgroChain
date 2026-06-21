"use client";

import { useState, useEffect } from "react";
import { DollarSign, CheckCircle, Clock, XCircle, ExternalLink, Download, Filter } from "lucide-react";
import { getPaymentsByFarmer } from "@/lib/supabaseService";
import type { Payment } from "@/lib/supabase";

interface PaymentHistoryProps {
  farmerId: string;
}

interface PaymentWithDetails extends Payment {
  milestone?: any;
  contract?: any;
}

export default function PaymentHistory({ farmerId }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "pending" | "failed">("all");

  useEffect(() => {
    loadPayments();
  }, [farmerId]);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const data = await getPaymentsByFarmer(farmerId);
      setPayments(data);
    } catch (error) {
      console.error("Failed to load payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter === "all") return true;
    return payment.status === filter;
  });

  const totalEarnings = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments.filter((p) => p.status === "pending").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case "pending":
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      completed: "badge-success",
      pending: "badge-warning",
      processing: "badge-info",
      failed: "badge-error",
    };
    return classes[status as keyof typeof classes] || "badge";
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card-premium">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Earnings</p>
            <DollarSign className="h-5 w-5 text-[#2d5f3f]" />
          </div>
          <p className="text-3xl font-bold text-[#2d5f3f]">
            K{totalEarnings.toLocaleString()}
          </p>
        </div>

        <div className="card-premium">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Completed Payments</p>
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a1a]">
            {payments.filter((p) => p.status === "completed").length}
          </p>
        </div>

        <div className="card-premium">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Pending Payments</p>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a1a]">{pendingPayments}</p>
        </div>
      </div>

      {/* Payment List */}
      <div className="card-premium">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1a1a1a]">Payment History</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-2 focus:outline-[#2d5f3f]"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#f0f7f4] text-[#2d5f3f] rounded-lg font-medium hover:bg-[#e8f5e9] transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d5f3f] mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Payments Found
            </h3>
            <p className="text-gray-600">
              {filter === "all"
                ? "You haven't received any payments yet"
                : `No ${filter} payments found`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-[#f0f7f4] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] rounded-xl group-hover:scale-110 transition-transform">
                    {getStatusIcon(payment.status)}
                  </div>
                  <div>
                    <p className="font-bold text-[#1a1a1a]">
                      {payment.milestone?.name || "Milestone Payment"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {payment.contract?.crop_type} - {payment.contract?.variety}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(payment.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#2d5f3f]">
                      K{payment.amount.toLocaleString()}
                    </p>
                    <span className={`badge ${getStatusBadge(payment.status)} text-xs`}>
                      {payment.status}
                    </span>
                  </div>
                  {payment.transaction_hash && (
                    <a
                      href={`https://sepolia.basescan.org/tx/${payment.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-[#e8f5e9] rounded-lg transition-colors"
                      title="View on BaseScan"
                    >
                      <ExternalLink className="h-5 w-5 text-[#2d5f3f]" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
