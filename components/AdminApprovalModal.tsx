/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { X, CheckCircle, XCircle, FileText, Image as ImageIcon, Activity, User, Calendar, Loader2, Eye, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const S = {
  dark: '#0C2D3A',
  lime: '#BFFF00',
  muted: '#5A7684',
  bg: '#F7F9FB',
  cardBorder: 'rgba(12,45,58,0.08)',
  heading: "'Syne', sans-serif",
  body: "'Manrope', sans-serif",
};

interface AdminApprovalModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  milestone: {
    id: string;
    name: string;
    description: string;
    farmerName: string;
    farmerActivities: Array<{
      type: string;
      description: string;
      quantity?: number;
      unit?: string;
      date: string;
      notes?: string;
      photos?: string[];
    }>;
    officerEvidence: {
      images: string[];
      iotReadings: Array<{
        type: string;
        value: number;
        unit: string;
        timestamp: string;
      }>;
      notes: string;
      officerName: string;
    };
  };
  onApproveAction: (adminNotes: string) => Promise<void>;
  onRejectAction: (adminNotes: string) => Promise<void>;
}

/**
 * ⚠️ KNOWN ISSUE - Next.js TS71007 Warnings (Safe to Ignore):
 * 
 * The IDE shows warnings about "Props must be serializable" for onClose, onApprove, and onReject.
 * These are FALSE POSITIVES because:
 * 
 * 1. This is a CLIENT component (marked with "use client")
 * 2. It's only used by OTHER CLIENT components (AdminDashboard)
 * 3. Function props NEVER cross server-client boundaries
 * 4. This follows standard React patterns for event handlers
 * 
 * The warnings are a limitation of Next.js static analysis which cannot detect
 * that this component is exclusively used in client-side contexts.
 * 
 * ✅ The code is correct and safe. No changes needed.
 */
export default function AdminApprovalModal({
  isOpen,
  onCloseAction,
  milestone,
  onApproveAction,
  onRejectAction,
}: AdminApprovalModalProps) {
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!adminNotes.trim()) {
      toast.error("Please add approval notes");
      return;
    }

    setProcessing(true);
    try {
      await onApproveAction(adminNotes);
      toast.success("Milestone approved! Payment will be released.");
      onCloseAction();
    } catch (error) {
      console.error("Error approving milestone:", error);
      toast.error("Failed to approve milestone");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      toast.error("Please add rejection reason");
      return;
    }

    setProcessing(true);
    try {
      await onRejectAction(adminNotes);
      toast.success("Milestone rejected");
      onCloseAction();
    } catch (error) {
      console.error("Error rejecting milestone:", error);
      toast.error("Failed to reject milestone");
    } finally {
      setProcessing(false);
    }
  };

  const timelineEntryCount = milestone.farmerActivities.length + milestone.officerEvidence.iotReadings.length + (milestone.officerEvidence.images.length > 0 ? 1 : 0) + (milestone.officerEvidence.notes ? 1 : 0);

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between" style={{ background: S.bg }}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{ background: S.dark }}>
                  <Shield className="h-6 w-6" style={{ color: S.lime }} />
                </div>
                <div>
                  <h2 className="text-2xl" style={{ fontFamily: S.heading, fontWeight: 700, color: S.dark }}>
                    Admin Review & Approval
                  </h2>
                  <p className="text-sm mt-0.5" style={{ fontFamily: S.body, color: S.muted }}>{milestone.name} — {milestone.description}</p>
                </div>
              </div>
              <button
                onClick={onCloseAction}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" style={{ color: S.muted }} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Farmer Activities */}
                <div className="p-5 rounded-2xl" style={{ background: S.bg, border: `1px solid ${S.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg" style={{ fontFamily: S.body, color: S.lime, background: S.dark, fontSize: 10 }}>Farmer Activities</span>
                  </div>
                  <p className="text-sm mb-4" style={{ fontFamily: S.body, color: S.muted }}>
                    Submitted by: <span style={{ fontWeight: 600, color: S.dark }}>{milestone.farmerName}</span>
                  </p>

                  <div className="space-y-3">
                    {milestone.farmerActivities.length === 0 ? (
                      <div className="text-center py-8" style={{ color: S.muted }}>
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm" style={{ fontFamily: S.body }}>No farmer activities logged yet</p>
                        <p className="text-xs mt-1 opacity-60" style={{ fontFamily: S.body }}>Activities will appear here once the farmer logs updates</p>
                      </div>
                    ) : (
                      milestone.farmerActivities.map((activity, index) => (
                        <div key={index} className="p-3 rounded-xl bg-white" style={{ border: `1px solid ${S.cardBorder}` }}>
                          <div className="flex items-center justify-between mb-1">
                            <span style={{ fontFamily: S.heading, fontWeight: 700, fontSize: 14, color: S.dark }}>
                              {activity.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                            <span className="text-xs flex items-center gap-1" style={{ fontFamily: S.body, color: S.muted }}>
                              <Calendar className="h-3 w-3" />
                              {new Date(activity.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm" style={{ fontFamily: S.body, color: S.muted }}>{activity.description}</p>
                          {activity.quantity && (
                            <p className="text-xs mt-1" style={{ fontFamily: S.body, color: S.muted }}>
                              Quantity: <span style={{ fontWeight: 600, color: S.dark }}>{activity.quantity} {activity.unit}</span>
                            </p>
                          )}
                          {activity.notes && (
                            <p className="text-xs mt-1 italic" style={{ fontFamily: S.body, color: S.muted }}>{activity.notes}</p>
                          )}
                          {activity.photos && activity.photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-1 mt-2">
                              {activity.photos.map((photo, pi) => (
                                <div key={pi} className="aspect-square rounded-lg overflow-hidden cursor-pointer" onClick={() => setSelectedImage(photo)}>
                                  <img src={photo} alt={`Activity photo ${pi + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Column - Officer Evidence */}
                <div className="p-5 rounded-2xl" style={{ background: S.bg, border: `1px solid ${S.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg" style={{ fontFamily: S.body, color: S.lime, background: S.dark, fontSize: 10 }}>Officer Verification</span>
                  </div>
                  <p className="text-sm mb-4" style={{ fontFamily: S.body, color: S.muted }}>
                    Verified by: <span style={{ fontWeight: 600, color: S.dark }}>{milestone.officerEvidence.officerName}</span>
                  </p>

                  {/* Photos */}
                  <div className="mb-5">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5" style={{ fontFamily: S.heading, fontWeight: 700, color: S.dark, fontSize: 13 }}>
                      <ImageIcon className="h-4 w-4" />
                      Field Photos ({milestone.officerEvidence.images.length})
                    </h4>
                    {milestone.officerEvidence.images.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {milestone.officerEvidence.images.map((image, index) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(image)}
                          >
                            <img src={image} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Eye className="h-5 w-5 text-white opacity-0 hover:opacity-100" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ fontFamily: S.body, color: S.muted }}>No photos submitted</p>
                    )}
                  </div>

                  {/* IoT Readings */}
                  <div className="mb-5">
                    <h4 className="text-sm font-medium mb-2" style={{ fontFamily: S.heading, fontWeight: 700, color: S.dark, fontSize: 13 }}>
                      IoT Sensor Readings ({milestone.officerEvidence.iotReadings.length})
                    </h4>
                    {milestone.officerEvidence.iotReadings.length === 0 ? (
                      <div className="text-center py-4" style={{ color: S.muted }}>
                        <Activity className="h-5 w-5 mx-auto mb-1 opacity-40" />
                        <p className="text-xs" style={{ fontFamily: S.body }}>No IoT readings recorded</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {milestone.officerEvidence.iotReadings.map((reading, index) => (
                          <div key={index} className="p-2.5 rounded-xl bg-white flex items-center justify-between" style={{ border: `1px solid ${S.cardBorder}` }}>
                            <div>
                              <span className="text-sm font-medium" style={{ fontFamily: S.body, color: S.dark }}>
                                {reading.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </span>
                              {reading.timestamp && (
                                <span className="text-xs ml-2" style={{ color: S.muted }}>
                                  {new Date(reading.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <span className="text-sm" style={{ fontFamily: S.heading, fontWeight: 700, color: S.dark }}>
                              {reading.value} {reading.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Officer Notes */}
                  {milestone.officerEvidence.notes && (
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ fontFamily: S.heading, fontWeight: 700, color: S.dark, fontSize: 13 }}>Officer Notes</h4>
                      <div className="p-3 rounded-xl bg-white" style={{ border: `1px solid ${S.cardBorder}` }}>
                        <p className="text-sm" style={{ fontFamily: S.body, color: S.muted, lineHeight: 1.6 }}>{milestone.officerEvidence.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance History Timeline */}
              <div className="mt-8 p-5 rounded-2xl" style={{ background: S.bg, border: `1px solid ${S.cardBorder}` }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="flex items-center gap-2" style={{ fontFamily: S.heading, fontWeight: 700, color: S.dark }}>
                    <FileText className="h-5 w-5" style={{ color: S.dark }} />
                    Compliance History Timeline
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ fontFamily: S.body, color: S.lime, background: S.dark, fontSize: 10 }}>
                    {timelineEntryCount} entries
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-2 bottom-2 w-0.5" style={{ background: 'rgba(12,45,58,0.1)' }} />

                  <div className="space-y-3">
                    {milestone.farmerActivities.map((activity, index) => (
                      <div key={`fa-${index}`} className="relative pl-8">
                        <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: S.lime }} />
                        <div className="p-3 rounded-xl bg-white" style={{ border: `1px solid ${S.cardBorder}` }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ color: S.lime, background: S.dark }}>Farmer</span>
                            <span className="text-xs" style={{ color: S.muted }}>
                              {new Date(activity.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm" style={{ fontFamily: S.heading, fontWeight: 700, color: S.dark }}>{activity.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                          <p className="text-xs mt-0.5" style={{ fontFamily: S.body, color: S.muted }}>{activity.description}</p>
                          {activity.quantity && (
                            <p className="text-xs mt-0.5" style={{ fontFamily: S.body, color: S.muted }}>Qty: {activity.quantity} {activity.unit}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {milestone.officerEvidence.iotReadings.map((reading, index) => (
                      <div key={`iot-${index}`} className="relative pl-8">
                        <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: S.dark }} />
                        <div className="p-3 rounded-xl bg-white" style={{ border: `1px solid ${S.cardBorder}` }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ color: '#fff', background: S.muted }}>IoT Sensor</span>
                            {reading.timestamp && (
                              <span className="text-xs" style={{ color: S.muted }}>
                                {new Date(reading.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm" style={{ fontFamily: S.heading, fontWeight: 700, color: S.dark }}>{reading.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                            <span className="text-sm" style={{ fontFamily: S.heading, fontWeight: 700, color: S.dark }}>{reading.value} {reading.unit}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(milestone.officerEvidence.images.length > 0 || milestone.officerEvidence.notes) && (
                      <div className="relative pl-8">
                        <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: S.dark }} />
                        <div className="p-3 rounded-xl bg-white" style={{ border: `1px solid ${S.cardBorder}` }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ color: S.lime, background: S.dark }}>Verifier</span>
                            <span className="text-xs" style={{ color: S.muted }}>Officer: {milestone.officerEvidence.officerName}</span>
                          </div>
                          <p className="text-sm" style={{ fontFamily: S.heading, fontWeight: 700, color: S.dark }}>Field Verification Completed</p>
                          <p className="text-xs mt-0.5" style={{ fontFamily: S.body, color: S.muted }}>{milestone.officerEvidence.notes}</p>
                          {milestone.officerEvidence.images.length > 0 && (
                            <p className="text-xs mt-1" style={{ fontFamily: S.body, color: S.muted }}>{milestone.officerEvidence.images.length} photo(s) submitted as evidence</p>
                          )}
                        </div>
                      </div>
                    )}

                    {timelineEntryCount === 0 && (
                      <div className="text-center py-6" style={{ color: S.muted }}>
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm" style={{ fontFamily: S.body }}>No compliance history available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="mt-8">
                <label className="block text-sm mb-2" style={{ fontFamily: S.heading, fontWeight: 700, color: S.dark }}>
                  Admin Decision Notes *
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add your review notes and decision rationale..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl resize-none transition-colors focus:outline-none"
                  style={{ fontFamily: S.body, border: `1px solid ${S.cardBorder}`, background: S.bg, color: S.dark }}
                  onFocus={(e) => { e.target.style.borderColor = S.dark; }}
                  onBlur={(e) => { e.target.style.borderColor = S.cardBorder; }}
                />
                <p className="text-xs mt-1" style={{ fontFamily: S.body, color: S.muted }}>
                  Required for both approval and rejection
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-between" style={{ background: S.bg }}>
              <button
                onClick={onCloseAction}
                disabled={processing}
                className="px-6 py-2.5 rounded-xl transition-colors"
                style={{ fontFamily: S.body, fontWeight: 600, border: `1px solid rgba(12,45,58,0.15)`, color: S.dark }}
              >
                Cancel
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={processing || !adminNotes.trim()}
                  className="px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-40"
                  style={{ fontFamily: S.body, fontWeight: 600, background: '#DC2626', color: '#fff' }}
                >
                  {processing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Rejecting...</>
                  ) : (
                    <><XCircle className="h-4 w-4" /> Reject Milestone</>
                  )}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing || !adminNotes.trim()}
                  className="px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-40"
                  style={{ fontFamily: S.body, fontWeight: 600, background: S.dark, color: '#fff' }}
                >
                  {processing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Approving...</>
                  ) : (
                    <><CheckCircle className="h-4 w-4" /> Approve & Release Payment</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[10001] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="Full size" className="max-w-full max-h-full object-contain rounded-xl" />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>
      )}
    </>
  );
}
