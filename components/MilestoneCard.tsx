"use client";

import { CheckCircle, Clock, XCircle, Upload } from "lucide-react";
import { type Milestone } from "@/lib/types";
import { getStatusColor, formatDate } from "@/lib/utils";

interface MilestoneCardProps {
  milestone: Milestone;
  contractId: string;
  canSubmit?: boolean;
  isNextActive?: boolean;
  onEvidenceSubmitted?: () => void;
}

export default function MilestoneCard({ milestone, contractId, canSubmit, isNextActive, onEvidenceSubmitted }: MilestoneCardProps) {
  const getStatusIcon = () => {
    switch (milestone.status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "submitted":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm mb-1">{milestone.name}</h4>
          <p className="text-xs text-gray-600">
            Expected: {formatDate(milestone.expectedDate)}
          </p>
        </div>
        {getStatusIcon()}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Payment:</span>
          <span className="font-semibold text-gray-900">
            K{milestone.paymentAmount.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(milestone.status)}`}>
            {milestone.status}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(milestone.paymentStatus)}`}>
            {milestone.paymentStatus}
          </span>
        </div>

        {milestone.status === "pending" && (
          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2 mt-3">
            <Upload className="h-4 w-4" />
            <span>Submit Evidence</span>
          </button>
        )}

        {milestone.status === "verified" && milestone.paymentStatus === "completed" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-3">
            <p className="text-xs text-green-700 font-medium text-center">
              ✓ Payment Completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
