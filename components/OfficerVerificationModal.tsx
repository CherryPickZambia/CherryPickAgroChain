"use client";

import { useState } from "react";
import { X, Camera, CheckCircle, XCircle, Loader2, MapPin, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import EvidenceUploadModal, { type EvidenceAIAnalysis, IoTReading } from "./EvidenceUploadModal";
import { Milestone } from "@/lib/types";

interface VerificationMilestone extends Milestone {
  metadata?: any;
  contract?: {
    id: string;
    crop_type: string;
    farmer_id: string;
    farmer?: {
      name: string;
      wallet_address: string;
      location_address: string;
    };
  };
}

interface OfficerVerificationModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  milestone: VerificationMilestone;
  onVerificationCompleteAction: () => void;
}

export default function OfficerVerificationModal({
  isOpen,
  onCloseAction,
  milestone,
  onVerificationCompleteAction,
}: OfficerVerificationModalProps) {
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [evidence, setEvidence] = useState<{
    images: string[];
    iotReadings: IoTReading[];
    notes: string;
    aiAnalysis?: EvidenceAIAnalysis | null;
  } | null>(null);
  const [officerNotes, setOfficerNotes] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleEvidenceSubmit = async (evidenceData: {
    images: string[];
    iotReadings: IoTReading[];
    notes: string;
    aiAnalysis?: EvidenceAIAnalysis | null;
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

    if (!officerNotes.trim()) {
      toast.error("Please add verification notes");
      return;
    }

    try {
      setVerifying(true);
      const { officerVerifyMilestone } = await import('@/lib/supabaseService');

      await officerVerifyMilestone(milestone.id, {
        images: evidence.images,
        iot_readings: evidence.iotReadings as unknown as Record<string, unknown>[],
        notes: `${evidence.notes}\n\nOfficer Notes: ${officerNotes}`,
        ai_analysis: evidence.aiAnalysis || null,
      });

      toast.success("Milestone verified successfully! Farmer can now track this milestone as complete.");
      onVerificationCompleteAction();
      onCloseAction();
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to verify milestone. Please try again.");
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
      onVerificationCompleteAction();
      onCloseAction();
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6" style={{ background: '#0C2D3A' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#fff' }}>{milestone.name}</h2>
                  <div className="flex items-center space-x-4 text-sm mt-2" style={{ fontFamily: "'Manrope', sans-serif", color: 'rgba(255,255,255,0.7)' }}>
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {milestone.contract?.farmer?.location_address || 'Unknown Location'}
                    </span>
                    <span>Farmer: {milestone.contract?.farmer?.name || 'Unknown'}</span>
                    <span>Crop: {milestone.contract?.crop_type || 'Unknown'}</span>
                  </div>
                </div>
                <button
                  onClick={onCloseAction}
                  className="p-2 rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <X className="h-6 w-6" style={{ color: 'rgba(255,255,255,0.7)' }} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
              {/* Farm Visit Info */}
              <div className="rounded-2xl p-4 mb-6" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.08)' }}>
                <h3 className="mb-3" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Farm Visit Details</h3>
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
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Field Evidence</h3>
                  <button
                    onClick={() => setShowEvidenceUpload(true)}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {evidence ? "Update Evidence" : "Capture Evidence"}
                  </button>
                </div>

                {evidence ? (
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(191,255,0,0.08)', border: '2px solid rgba(191,255,0,0.2)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5" style={{ color: '#0C2D3A' }} />
                      <span className="font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: '#0C2D3A' }}>Evidence Captured</span>
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
                    {evidence.aiAnalysis && (
                      <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              AI analysis attached to evidence
                            </p>
                            <p className="text-sm text-gray-700 mt-2">{evidence.aiAnalysis.result.diagnosis}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Photo {evidence.aiAnalysis.imageIndex + 1} • Confidence {evidence.aiAnalysis.result.confidenceScore}%
                            </p>
                          </div>
                          <span className="inline-flex px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold whitespace-nowrap">
                            Health {evidence.aiAnalysis.result.healthScore}/100
                          </span>
                        </div>

                        {evidence.aiAnalysis.result.recommendations.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Recommendations</p>
                            <ul className="space-y-1">
                              {evidence.aiAnalysis.result.recommendations.slice(0, 2).map((recommendation) => (
                                <li key={recommendation} className="text-sm text-gray-700">{recommendation}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-2xl p-8 text-center" style={{ background: '#F7F9FB', borderColor: 'rgba(12,45,58,0.15)' }}>
                    <Camera className="h-12 w-12 mx-auto mb-3" style={{ color: '#5A7684' }} />
                    <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>
                      No evidence captured yet. Visit the farm and capture photos and IoT readings.
                    </p>
                  </div>
                )}
              </div>

              {/* Verification Checklist */}
              <div className="mb-6">
                <h3 className="mb-3" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Field Verification Checklist</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'soil_moisture', label: 'Soil Moisture Adequate' },
                    { id: 'ph_level', label: 'Soil pH Level Acceptable' },
                    { id: 'pest_control', label: 'Pest Control Measures in Place' },
                    { id: 'irrigation', label: 'Irrigation System Functional' },
                    { id: 'crop_health', label: 'Crop Health Satisfactory' },
                    { id: 'safety_compliance', label: 'Safety & Compliance Met' },
                  ].map(item => (
                    <label key={item.id} className="flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-colors hover:bg-gray-50" style={{ border: '1px solid rgba(12,45,58,0.1)' }}>
                      <input type="checkbox" className="w-4 h-4 rounded text-[#0C2D3A] focus:ring-[#0C2D3A]" />
                      <span className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#0C2D3A' }}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Officer Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#0C2D3A' }}>
                  Verification Notes *
                </label>
                <textarea
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Add your verification notes, observations, and recommendations..."
                  rows={4}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent resize-none" style={{ borderColor: 'rgba(12,45,58,0.15)', fontFamily: "'Manrope', sans-serif" }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for both approval and rejection
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center justify-between border-t" style={{ background: '#F7F9FB' }}>
              <button
                onClick={onCloseAction}
                disabled={verifying}
                className="btn-secondary"
              >
                Cancel
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={verifying || !officerNotes.trim()}
                  className="px-6 py-2 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors flex items-center gap-2" style={{ background: '#0C2D3A', fontFamily: "'Manrope', sans-serif" }}
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
                  className="px-6 py-2 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors flex items-center gap-2" style={{ background: '#BFFF00', color: '#0C2D3A', fontFamily: "'Manrope', sans-serif" }}
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
        onCloseAction={() => setShowEvidenceUpload(false)}
        milestoneId={milestone.id}
        milestoneName={milestone.name}
        contractId={milestone.contract?.id || ''}
        cropType={milestone.contract?.crop_type}
        onSubmitAction={handleEvidenceSubmit}
      />
    </>
  );
}
