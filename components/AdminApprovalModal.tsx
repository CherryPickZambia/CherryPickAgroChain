/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { X, CheckCircle, XCircle, FileText, Image as ImageIcon, Activity, User, Calendar, Loader2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

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

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Admin Review & Approval</h2>
                  <p className="text-purple-100 mt-1">{milestone.name}</p>
                </div>
                <button
                  onClick={onCloseAction}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Farmer Activities */}
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Farmer Activities</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Submitted by: <span className="font-medium">{milestone.farmerName}</span>
                    </p>

                    <div className="space-y-3">
                      {milestone.farmerActivities.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No farmer activities logged yet</p>
                        </div>
                      ) : (
                        milestone.farmerActivities.map((activity, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-green-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-gray-900">
                                {activity.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(activity.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{activity.description}</p>
                            {activity.quantity && (
                              <p className="text-xs text-gray-600">
                                Quantity: {activity.quantity} {activity.unit}
                              </p>
                            )}
                            {activity.notes && (
                              <p className="text-xs text-gray-500 italic mt-1">{activity.notes}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Officer Evidence */}
                <div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Officer Verification</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Verified by: <span className="font-medium">{milestone.officerEvidence.officerName}</span>
                    </p>

                    {/* Photos */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        Field Photos ({milestone.officerEvidence.images.length})
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {milestone.officerEvidence.images.map((image, index) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(image)}
                          >
                            <img
                              src={image}
                              alt={`Evidence ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                              <Eye className="h-5 w-5 text-white opacity-0 hover:opacity-100" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* IoT Readings */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        IoT Sensor Readings ({milestone.officerEvidence.iotReadings.length})
                      </h4>
                      {milestone.officerEvidence.iotReadings.length === 0 ? (
                        <div className="text-center py-4 text-gray-400">
                          <Activity className="h-6 w-6 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">No IoT readings recorded</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {milestone.officerEvidence.iotReadings.map((reading, index) => (
                            <div key={index} className="bg-white rounded-lg p-2 border border-blue-100 flex items-center justify-between">
                              <div>
                                <span className="text-sm text-gray-700 font-medium">
                                  {reading.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </span>
                                {reading.timestamp && (
                                  <span className="text-xs text-gray-400 ml-2">
                                    {new Date(reading.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-gray-900">
                                {reading.value} {reading.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Officer Notes */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Officer Notes</h4>
                      <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <p className="text-sm text-gray-700">{milestone.officerEvidence.notes}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Compliance History Timeline */}
              <div className="mt-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Compliance History Timeline</h3>
                  <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    {milestone.farmerActivities.length + milestone.officerEvidence.iotReadings.length + (milestone.officerEvidence.images.length > 0 ? 1 : 0) + (milestone.officerEvidence.notes ? 1 : 0)} entries
                  </span>
                </div>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-purple-200" />

                  <div className="space-y-3">
                    {/* Farmer Activities */}
                    {milestone.farmerActivities.map((activity, index) => (
                      <div key={`fa-${index}`} className="relative pl-8">
                        <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                        <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Farmer</span>
                            <span className="text-xs text-gray-500">
                              {new Date(activity.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{activity.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
                          {activity.quantity && (
                            <p className="text-xs text-gray-500 mt-0.5">Qty: {activity.quantity} {activity.unit}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* IoT Readings */}
                    {milestone.officerEvidence.iotReadings.map((reading, index) => (
                      <div key={`iot-${index}`} className="relative pl-8">
                        <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                        <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">IoT Sensor</span>
                            {reading.timestamp && (
                              <span className="text-xs text-gray-500">
                                {new Date(reading.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{reading.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                            <span className="text-sm font-bold text-blue-700">{reading.value} {reading.unit}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Verifier Evidence Entry */}
                    {(milestone.officerEvidence.images.length > 0 || milestone.officerEvidence.notes) && (
                      <div className="relative pl-8">
                        <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
                        <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Verifier</span>
                            <span className="text-xs text-gray-500">Officer: {milestone.officerEvidence.officerName}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">Field Verification Completed</p>
                          <p className="text-xs text-gray-600 mt-0.5">{milestone.officerEvidence.notes}</p>
                          {milestone.officerEvidence.images.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">{milestone.officerEvidence.images.length} photo(s) submitted as evidence</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {milestone.farmerActivities.length === 0 && milestone.officerEvidence.iotReadings.length === 0 && !milestone.officerEvidence.notes && milestone.officerEvidence.images.length === 0 && (
                      <div className="text-center py-6 text-gray-400">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No compliance history available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Admin Decision Notes *
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add your review notes and decision rationale..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for both approval and rejection
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
              <button
                onClick={onCloseAction}
                disabled={processing}
                className="btn-secondary"
              >
                Cancel
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={processing || !adminNotes.trim()}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Reject Milestone
                    </>
                  )}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing || !adminNotes.trim()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Approve & Release Payment
                    </>
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
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}
