"use client";

import { useState } from "react";
import { CheckCircle, Clock, Upload, Calendar, DollarSign } from "lucide-react";
import { type Milestone } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import EvidenceUploadModal from "./EvidenceUploadModal";
import toast from "react-hot-toast";

interface MilestoneCardUpdatedProps {
  milestone: Milestone;
  contractId: string;
  canSubmit?: boolean;
  onEvidenceSubmitted?: () => void;
}

export default function MilestoneCardUpdated({ 
  milestone, 
  contractId, 
  canSubmit = false,
  onEvidenceSubmitted 
}: MilestoneCardUpdatedProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const getStatusBadge = () => {
    switch (milestone.status) {
      case "verified":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            completed
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            in review
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {milestone.status}
          </span>
        );
    }
  };

  const handleEvidenceSubmit = async (evidence: any) => {
    try {
      // Save evidence to database
      const { supabase } = await import('@/lib/supabase');
      
      await supabase
        .from('milestones')
        .update({
          status: 'submitted',
          completed_date: new Date().toISOString(),
          farmer_evidence: evidence,
        })
        .eq('id', milestone.id);

      toast.success("Evidence uploaded successfully!");
      
      if (onEvidenceSubmitted) {
        onEvidenceSubmitted();
      }
    } catch (error) {
      console.error("Error submitting evidence:", error);
      throw error;
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 text-base">{milestone.name}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {milestone.description}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Date:</span>
            </div>
            <span className="font-medium text-gray-900">
              {formatDate(milestone.expectedDate)}
            </span>
          </div>

          {milestone.paymentAmount && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span>Payment:</span>
              </div>
              <span className="font-semibold text-green-600">
                K{milestone.paymentAmount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {milestone.status === "pending" && canSubmit && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Upload className="h-4 w-4" />
            Upload Milestone
          </button>
        )}

        {milestone.status === "submitted" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-700 font-medium">
                Awaiting officer verification
              </p>
            </div>
          </div>
        )}

        {milestone.status === "verified" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700 font-medium">
                Verified & Payment Processed
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Evidence Upload Modal */}
      <EvidenceUploadModal
        isOpen={showUploadModal}
        onCloseAction={() => setShowUploadModal(false)}
        milestoneId={milestone.id}
        milestoneName={milestone.name}
        contractId={contractId}
        onSubmitAction={handleEvidenceSubmit}
      />
    </>
  );
}
