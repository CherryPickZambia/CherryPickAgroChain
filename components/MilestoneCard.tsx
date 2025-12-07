"use client";

import { useState } from "react";
import { CheckCircle, Clock, XCircle, Activity, FileText } from "lucide-react";
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
}

export default function MilestoneCard({ milestone, contractId, canSubmit, isNextActive, onEvidenceSubmitted }: MilestoneCardProps) {
  const [showEntryModal, setShowEntryModal] = useState(false);

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
          <button 
            onClick={() => setShowEntryModal(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2 mt-3"
          >
            <FileText className="h-4 w-4" />
            <span>Log Farm Activities</span>
          </button>
        )}

        {milestone.status === "submitted" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-700 font-medium">
                Verification Requested - Officer will visit farm
              </p>
            </div>
            {milestone.completedDate && (
              <p className="text-xs text-blue-600">
                Requested: {formatDate(milestone.completedDate)}
              </p>
            )}
          </div>
        )}

        {milestone.status === "verified" && milestone.paymentStatus === "completed" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-3">
            <p className="text-xs text-green-700 font-medium text-center">
              ✓ Payment Completed
            </p>
          </div>
        )}
      </div>

      {/* Farmer Entry Modal */}
      <FarmerMilestoneEntryModal
        isOpen={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        milestoneId={milestone.id}
        milestoneName={milestone.name}
        onSubmit={handleFarmerEntries}
      />
    </div>
  );
}
