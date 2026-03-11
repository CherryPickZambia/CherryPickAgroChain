"use client";

import { useState } from "react";
import { CheckCircle, Clock, XCircle, Activity, FileText, Camera } from "lucide-react";
import { type Milestone } from "@/lib/types";
import { getStatusColor, formatDate } from "@/lib/utils";
import FarmerMilestoneEntryModal from "./FarmerMilestoneEntryModal";
import toast from "react-hot-toast";

interface MilestoneCardProps {
  milestone: Milestone;
  contractId: string;
  canSubmit?: boolean;
  isNextActive?: boolean;
  onEvidenceSubmitted?: () => void;
  milestoneIndex?: number;
  totalMilestones?: number;
  verifiedCount?: number;
}

export default function MilestoneCard({ milestone, contractId, canSubmit, isNextActive, onEvidenceSubmitted, milestoneIndex, totalMilestones, verifiedCount }: MilestoneCardProps) {
  const [showEntryModal, setShowEntryModal] = useState(false);

  const getStatusIcon = () => {
    switch (milestone.status) {
      case "verified":
        return <CheckCircle className="h-5 w-5" style={{ color: '#0C2D3A' }} />;
      case "submitted":
        return <Clock className="h-5 w-5" style={{ color: '#BFFF00' }} />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const handleFarmerEntries = async (activities: any[]) => {
    try {
      // Save farmer entries to database
      const { supabase } = await import('@/lib/supabase');

      // Get GPS location for verification
      let location: { lat: number; lng: number } | null = null;
      const hasKeyMilestone = activities.some((a: any) => a.isKeyMilestone);

      if (hasKeyMilestone && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (geoError) {
          console.warn("Could not get GPS location:", geoError);
        }
      }

      // Store activities in milestone metadata with location
      await supabase
        .from('milestones')
        .update({
          metadata: {
            farmer_activities: activities,
            verification_location: location,
            has_key_milestone: hasKeyMilestone,
            submitted_at: new Date().toISOString()
          },
          status: 'submitted',
          completed_date: new Date().toISOString(),
        })
        .eq('id', milestone.id);

      // --- TRACEABILITY LOGGING ---
      try {
        const { data: batchData } = await supabase
          .from('batches')
          .select('id, farmer_id, farmer_name')
          .eq('contract_id', contractId)
          .maybeSingle();

        if (batchData) {
          const { logFarmerUpdate, logTransportEvent } = await import('@/lib/traceabilityService');

          for (const activity of activities) {
            if (activity.type === 'delivery') {
              const logistics = activity.logisticsDetails;
              await logTransportEvent(batchData.id, 'transport_start', {
                actorId: batchData.farmer_id,
                actorName: batchData.farmer_name || 'Farmer',
                transportMode: 'truck',
                vehicleRegistration: logistics?.vehicleReg,
                driverName: logistics?.driverName,
                driverPhone: logistics?.contactNumber,
                origin: logistics?.dispatchLocation,
                location: location || undefined,
                photos: activity.evidencePhotos
              });
            } else {
              await logFarmerUpdate(
                batchData.id,
                batchData.farmer_id,
                activity.entryType === 'activity' ? 'growth_update' : 'observation',
                `${milestone.name}: ${activity.type}`,
                activity.description,
                activity.evidencePhotos,
                location || undefined,
                activity.aiDiagnosis
              );
            }
          }
        }
      } catch (traceError) {
        console.error("Error logging traceability events:", traceError);
      }
      // --- END TRACEABILITY LOGGING ---

      // If there's a key milestone, create a verification request
      if (hasKeyMilestone && location) {
        // Get contract info for the verification request
        const { data: milestoneData } = await supabase
          .from('milestones')
          .select('contract_id, contract:contracts(farmer_id, crop_type, farmer:farmers(name, location_address))')
          .eq('id', milestone.id)
          .single();

        if (milestoneData) {
          await supabase
            .from('verification_requests')
            .insert({
              milestone_id: milestone.id,
              contract_id: milestoneData.contract_id,
              farmer_id: (milestoneData.contract as any)?.farmer_id,
              location_lat: location.lat,
              location_lng: location.lng,
              status: 'pending',
              priority: 'normal',
              activities: activities.filter((a: any) => a.isKeyMilestone),
              // Compensation Logic
              fee: 100.00, // Fixed fee for milestone verification (K100)
              verification_type: 'milestone',
              distance_km: 0, // Placeholder, calculated when assigned
            });
        }
      }

      toast.success("Entries submitted! Awaiting officer verification.");

      if (onEvidenceSubmitted) {
        onEvidenceSubmitted();
      }
    } catch (error) {
      console.error("Error submitting entries:", error);
      throw error;
    }
  };

  return (
    <div className="border rounded-2xl p-4 transition-colors" style={{ borderColor: 'rgba(12,45,58,0.1)', background: '#fff' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(12,45,58,0.3)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(12,45,58,0.1)'}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-sm mb-1" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>{milestone.name}</h4>
          <p className="text-xs" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>
            Expected: {formatDate(milestone.expectedDate)}
          </p>
        </div>
        {getStatusIcon()}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>Payment:</span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>
            K{milestone.paymentAmount.toLocaleString()} ZMW
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
          <button
            onClick={() => setShowEntryModal(true)}
            className="w-full text-white py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center space-x-2 mt-3"
            style={{ background: '#0C2D3A', fontFamily: "'Manrope', sans-serif" }}
          >
            <Camera className="h-4 w-4" />
            <span>Log Farm Activities</span>
          </button>
        )}

        {milestone.status === "submitted" && (
          <div className="rounded-xl p-3 mt-3" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.08)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4" style={{ color: '#0C2D3A' }} />
              <p className="text-xs font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: '#0C2D3A' }}>
                Verification Requested - Officer will visit farm
              </p>
            </div>
            {milestone.completedDate && (
              <p className="text-xs" style={{ color: '#5A7684' }}>
                Requested: {formatDate(milestone.completedDate)}
              </p>
            )}
          </div>
        )}

        {milestone.status === "verified" && (
          <div className="rounded-xl p-3 mt-3" style={{ background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.2)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" style={{ color: '#0C2D3A' }} />
                <p className="text-xs font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: '#0C2D3A' }}>
                  Verified {verifiedCount !== undefined && totalMilestones ? `${verifiedCount} of ${totalMilestones}` : ''}
                </p>
              </div>
              {milestone.paymentStatus === "completed" && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(191,255,0,0.15)', color: '#0C2D3A' }}>
                  Paid
                </span>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: '#5A7684' }}>
              Payment: K{milestone.paymentAmount.toLocaleString()} ZMW
            </p>
          </div>
        )}
      </div>

      {/* Farmer Entry Modal */}
      <FarmerMilestoneEntryModal
        isOpen={showEntryModal}
        onCloseAction={() => setShowEntryModal(false)}
        milestoneId={milestone.id}
        milestoneName={milestone.name}
        onSubmitAction={handleFarmerEntries}
        batchId={milestone.batchId}
      />
    </div>
  );
}
