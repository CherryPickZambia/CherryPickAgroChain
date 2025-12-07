"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, Clock, User, Sprout, CheckCircle, AlertCircle, Phone, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface VerificationRequest {
  id: string;
  milestone_id: string;
  contract_id: string;
  farmer_id: string;
  location_lat: number;
  location_lng: number;
  status: string;
  priority: string;
  activities: any[];
  created_at: string;
  farmer?: {
    name: string;
    phone: string;
    location_address: string;
  };
  contract?: {
    crop_type: string;
  };
  milestone?: {
    name: string;
  };
  distance?: number;
}

interface VerificationMapProps {
  onSelectRequest?: (request: VerificationRequest) => void;
}

export default function VerificationMap({ onSelectRequest }: VerificationMapProps) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadVerificationRequests();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGettingLocation(false);
        },
        (error) => {
          console.warn("Could not get user location:", error);
          // Default to Lusaka, Zambia
          setUserLocation({ lat: -15.4167, lng: 28.2833 });
          setGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const loadVerificationRequests = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          farmer:farmers(name, phone, location_address),
          contract:contracts(crop_type),
          milestone:milestones(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setRequests(data || []);
    } catch (error) {
      console.error("Error loading verification requests:", error);
      toast.error("Failed to load verification requests");
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Sort requests by distance from user
  const sortedRequests = userLocation
    ? [...requests].map(r => ({
        ...r,
        distance: calculateDistance(userLocation.lat, userLocation.lng, r.location_lat, r.location_lng)
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0))
    : requests;

  const handleAcceptRequest = async (request: VerificationRequest) => {
    try {
      await supabase
        .from('verification_requests')
        .update({ status: 'assigned' })
        .eq('id', request.id);

      toast.success("Verification accepted! Navigate to the farm.");
      
      // Open Google Maps navigation
      if (request.location_lat && request.location_lng) {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${request.location_lat},${request.location_lng}`,
          '_blank'
        );
      }
      
      loadVerificationRequests();
      if (onSelectRequest) onSelectRequest(request);
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="card-premium p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Loading nearby verification requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with location status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-50 rounded-2xl">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nearby Farms</h2>
            <p className="text-sm text-gray-600">
              {userLocation 
                ? `${sortedRequests.length} verification${sortedRequests.length !== 1 ? 's' : ''} pending near you`
                : 'Getting your location...'}
            </p>
          </div>
        </div>
        <button
          onClick={getUserLocation}
          disabled={gettingLocation}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Navigation className={`h-4 w-4 ${gettingLocation ? 'animate-pulse' : ''}`} />
          {gettingLocation ? 'Locating...' : 'Refresh Location'}
        </button>
      </div>

      {/* Verification requests list */}
      {sortedRequests.length === 0 ? (
        <div className="card-premium p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Verifications</h3>
          <p className="text-gray-600">All nearby farms have been verified. Check back later.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedRequests.map((request) => (
            <div
              key={request.id}
              className={`card-premium hover:shadow-xl transition-all cursor-pointer ${
                selectedRequest?.id === request.id ? 'ring-2 ring-green-500' : ''
              }`}
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Farmer info */}
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      {request.farmer?.name || 'Unknown Farmer'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                  </div>

                  {/* Crop and milestone */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Sprout className="h-4 w-4 text-green-500" />
                      <span>{request.contract?.crop_type || 'Unknown Crop'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>{request.milestone?.name || 'Milestone Verification'}</span>
                    </div>
                  </div>

                  {/* Location and time */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{request.farmer?.location_address || 'Location unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatTimeAgo(request.created_at)}</span>
                    </div>
                  </div>

                  {/* Distance badge */}
                  {request.distance !== undefined && (
                    <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      <Navigation className="h-3 w-3" />
                      {request.distance < 1 
                        ? `${Math.round(request.distance * 1000)}m away`
                        : `${request.distance.toFixed(1)}km away`}
                    </div>
                  )}
                </div>

                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>

              {/* Expanded details */}
              {selectedRequest?.id === request.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {/* Activities to verify */}
                  {request.activities && request.activities.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Activities to Verify:</p>
                      <div className="flex flex-wrap gap-2">
                        {request.activities.map((activity: any, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                            {activity.type}: {activity.description}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptRequest(request);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Navigation className="h-5 w-5" />
                      Accept & Navigate
                    </button>
                    {request.farmer?.phone && (
                      <a
                        href={`tel:${request.farmer.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Phone className="h-5 w-5" />
                        Call
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
