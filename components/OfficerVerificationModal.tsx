"use client";

import { useState } from "react";
import { X, Upload, Camera, Thermometer, Droplets, Wind, CheckCircle, XCircle, Plus, Trash2, Loader2, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { uploadToIPFS } from "@/lib/ipfsService";
import EvidenceUploadModal from "./EvidenceUploadModal";

interface OfficerVerificationModalProps {
  isOpen: boolean;
  // @ts-ignore - Next.js client component props warning
  onClose: () => void;
  milestone: any;
  // @ts-ignore - Next.js client component props warning
  onVerificationComplete: () => void;
}

export default function OfficerVerificationModal({
  isOpen,
  onClose,
  milestone,
  onVerificationComplete,
}: OfficerVerificationModalProps) {
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [evidence, setEvidence] = useState<{
    images: string[];
    iotReadings: any[];
    notes: string;
  } | null>(null);
  const [officerNotes, setOfficerNotes] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleEvidenceSubmit = async (evidenceData: {
    images: string[];
    iotReadings: any[];
    notes: string;
  }) => {
    setEvidence(evidenceData);
    setShowEvidenceUpload(false);
    toast.success("Evidence captured successfully!");
  };

  const handleApprove = async () => {
    if (!evidence) {
      toast.error("Please upload evidence first");
      return;
    }

    try {
      setVerifying(true);
      const { submitMilestoneEvidence } = await import('@/lib/supabaseService');
      
      await submitMilestoneEvidence(milestone.id, {
        images: evidence.images,
        iot_readings: evidence.iotReadings,
        notes: `${evidence.notes}\n\nOfficer Notes: ${officerNotes}`,
      });

      toast.success("Evidence uploaded! Milestone ready for admin approval.");
      onVerificationComplete();
      onClose();
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to submit evidence");
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!officerNotes.trim()) {
      toast.error("Please provide rejection notes");
      return;
    }

    try {
      setVerifying(true);
      const { supabase } = await import('@/lib/supabase');
      
      // Update milestone status to rejected
      await supabase
        .from('milestones')
        .update({
          status: 'rejected',
          metadata: {
            ...milestone.metadata,
            officer_rejection_notes: officerNotes,
            rejected_at: new Date().toISOString(),
          },
        })
        .eq('id', milestone.id);

      toast.success("Milestone rejected");
      onVerificationComplete();
      onClose();
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error("Failed to reject milestone");
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{milestone.name}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {milestone.contract?.farmer?.location_address || 'Unknown Location'}
                    </span>
                    <span>Farmer: {milestone.contract?.farmer?.name || 'Unknown'}</span>
                    <span>Crop: {milestone.contract?.crop_type || 'Unknown'}</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
              {/* Farm Visit Info */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Farm Visit Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Farmer</p>
                    <p className="font-medium">{milestone.contract?.farmer?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Crop Type</p>
                    <p className="font-medium">{milestone.contract?.crop_type || 'Unknown'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Location
                    </p>
                    <p className="font-medium">{milestone.contract?.farmer?.location_address || 'Unknown Location'}</p>
                  </div>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Field Evidence</h3>
                  <button
                    onClick={() => setShowEvidenceUpload(true)}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {evidence ? "Update Evidence" : "Capture Evidence"}
                  </button>
                </div>

                {evidence ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">Evidence Captured</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm text-gray-700">
                      <div>
                        <span className="font-medium">{evidence.images.length}</span> Photos
                      </div>
                      <div>
                        <span className="font-medium">{evidence.iotReadings.length}</span> IoT Readings
                      </div>
                      <div>
                        <span className="font-medium">{evidence.notes ? "✓" : "✗"}</span> Notes
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">
                      No evidence captured yet. Visit the farm and capture photos and IoT readings.
                    </p>
                  </div>
                )}
              </div>

              {/* Officer Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Verification Notes *
                </label>
                <textarea
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Add your verification notes, observations, and recommendations..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for both approval and rejection
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
              <button
                onClick={onClose}
                disabled={verifying}
                className="btn-secondary"
              >
                Cancel
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={verifying || !officerNotes.trim()}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Reject
                    </>
                  )}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={verifying || !evidence || !officerNotes.trim()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Evidence Upload Modal */}
      <EvidenceUploadModal
        isOpen={showEvidenceUpload}
        onClose={() => setShowEvidenceUpload(false)}
        milestoneId={milestone.id}
        milestoneName={milestone.name}
        contractId={milestone.contract?.id || ''}
        onSubmit={handleEvidenceSubmit}
      />
    </>
  );
}
