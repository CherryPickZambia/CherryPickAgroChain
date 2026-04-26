"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, DollarSign, QrCode, Calendar, TrendingUp, AlertCircle, Download, ChevronDown, ChevronUp, Loader2, Sprout, User, MapPin, Phone, Mail, Edit2, Save, X, Plus, ShoppingBag, Package, Camera, Crosshair, Map as MapIcon } from "lucide-react";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import MilestoneCard from "./MilestoneCard";
import WalletBalance from "./WalletBalance";
import CropDiagnostics from "./CropDiagnostics";
import { type SmartContract } from "@/lib/types";
import { getContractsByFarmer, getFarmerByWallet, createFarmer, updateFarmer } from "@/lib/supabaseService";
import { getFarmerListings, type MarketplaceListing } from "@/lib/database";
import { getBatchesByFarmer, Batch } from "@/lib/traceabilityService";
import BatchList from "./BatchList";
import EvidenceUploadModal from "./EvidenceUploadModal";
import { submitMilestoneEvidence } from "@/lib/supabaseService";
import toast from "react-hot-toast";
import FarmerBiddingPanel from "./FarmerBiddingPanel";
import FarmerGrowthPanel from "./FarmerGrowthPanel";
import LocationPickerModal from "./LocationPickerModal";

interface FarmerProfile {
  id: string;
  wallet_address: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  farm_size: number | null;
  status: string;
  nrc_id?: string | null;
  gender?: string | null;
  profile_photo?: string | null;
  bio?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  user_id?: string;
}

export default function FarmerDashboard() {
  const { evmAddress } = useEvmAddress();
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [farmerData, setFarmerData] = useState<FarmerProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    location_address: '',
    location_lat: 0,
    location_lng: 0,
    farm_size: 0,
    nrc_id: '',
    gender: 'male',
    profile_photo: '' as string,
    bio: '' as string,
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [listingForm, setListingForm] = useState({
    crop_type: '',
    quantity: 0,
    price_per_unit: 0,
    quality_grade: 'A',
    description: '',
    harvest_date: '',
    organic: false,
    batch_id: '',
  });
  const [activeTab, setActiveTab] = useState<'contracts' | 'listings' | 'traceability' | 'bidding' | 'growth'>('contracts');

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);


  // Evidence Capture State
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showMilestoneSelector, setShowMilestoneSelector] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<{ id: string, name: string, contractId: string } | null>(null);

  // Note: Evidence capture is now handled within the Milestone Log Modal


  // Load farmer data and contracts
  useEffect(() => {
    if (evmAddress) {
      loadFarmerData();
    } else {
      setLoading(false);
    }
  }, [evmAddress]);

  const loadFarmerData = async () => {
    if (!evmAddress) return;

    try {
      setLoading(true);

      let farmer = await getFarmerByWallet(evmAddress);

      if (!farmer) {
        farmer = await createFarmer({
          wallet_address: evmAddress,
          name: "Farmer",
          email: null,
          phone: null,
          location_lat: null,
          location_lng: null,
          location_address: "",
          farm_size: 0,
          status: "pending",
          rejection_reason: null,
        });
        toast.success("Welcome! Your farmer profile has been created.");
      }

      setFarmerId(farmer.id);
      setFarmerData(farmer);
      setProfileForm({
        name: farmer.name || '',
        email: farmer.email || '',
        phone: farmer.phone || '',
        location_address: farmer.location_address || '',
        location_lat: farmer.location_lat || 0,
        location_lng: farmer.location_lng || 0,
        farm_size: farmer.farm_size || 0,
        nrc_id: farmer.nrc_id || '',
        gender: farmer.gender || 'male',
        profile_photo: farmer.profile_photo || '',
        bio: farmer.bio || '',
      });
      await loadContracts(farmer.id);
      await loadMarketplaceListings(farmer.id);
      await loadBatches(farmer.id);
    } catch (error: unknown) {
      console.error("Error loading farmer data:", error);
      toast.error("Failed to load farmer data. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  const loadMarketplaceListings = async (id?: string) => {
    const targetId = id || farmerId;
    if (!targetId) return;

    try {
      const listings = await getFarmerListings(targetId);
      setMarketplaceListings(listings);
    } catch (error) {
      console.error("Error loading marketplace listings:", error);
    }
  };

  const loadBatches = async (farmerId: string) => {
    try {
      const data = await getBatchesByFarmer(farmerId);
      setBatches(data);
    } catch (error: unknown) {
      console.error("Error loading batches:", error);
    }
  };

  const loadContracts = async (farmerId: string) => {
    try {
      const data = await getContractsByFarmer(farmerId);

      if (!data || !Array.isArray(data)) {
        setContracts([]);
        return;
      }

      const transformedContracts: SmartContract[] = data
        .filter((contract: any) => contract && contract.id)
        .map((contract: any) => ({
          id: contract.id as string,
          farmerId: (contract.farmer_id as string) || farmerId,
          cropType: (contract.crop_type as string) || 'Unknown',
          variety: (contract.variety as string) || '',
          requiredQuantity: (contract.required_quantity as number) || 0,
          discountedPrice: (contract.price_per_kg as number) || (contract.discounted_price as number) || 0,
          standardPrice: (contract.price_per_kg as number) || (contract.standard_price as number) || 0,
          milestones: (contract.milestones || [])
            .filter((m: any) => m && m.id)
            .map((m: any) => ({
              id: m.id as string,
              contractId: m.contract_id as string,
              name: (m.name as string) || 'Unnamed Milestone',
              description: (m.description as string) || '',
              expectedDate: m.expected_date ? new Date(m.expected_date) : new Date(),
              completedDate: m.completed_date ? new Date(m.completed_date) : undefined,
              status: (m.status as string) || 'pending',
              paymentAmount: (m.payment_amount as number) || 0,
              paymentStatus: (m.payment_status as string) || 'pending',
            })),
          status: ((contract.status as string) || 'active') as "active" | "completed" | "cancelled",
          qrCode: (contract.contract_code as string) || (contract.qr_code as string) || '',
          createdAt: contract.created_at ? new Date(contract.created_at) : new Date(),
        }));

      setContracts(transformedContracts);
    } catch (error: unknown) {
      console.error("Error loading contracts:", error instanceof Error ? error.message : JSON.stringify(error));
      toast.error("Failed to load contracts. Please try refreshing.");
      setContracts([]);
    }
  };

  // Pending farmer check — restricts traceability, batches, bidding, contracts
  const isPending = farmerData?.status !== 'approved';

  const stats = {
    activeContracts: contracts.filter(c => c.status === "active").length,
    completedMilestones: contracts.reduce((acc, c) =>
      acc + c.milestones.filter(m => m.status === "verified").length, 0
    ),
    pendingPayments: contracts.reduce((acc, c) =>
      acc + c.milestones.filter(m => m.paymentStatus === "pending").length, 0
    ),
    totalEarnings: contracts.reduce((acc, c) =>
      acc + c.milestones.filter(m => m.paymentStatus === "completed")
        .reduce((sum, m) => sum + m.paymentAmount, 0), 0
    ),
  };

  const toggleContract = (contractId: string) => {
    setExpandedContracts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contractId)) {
        newSet.delete(contractId);
      } else {
        newSet.add(contractId);
      }
      return newSet;
    });
  };

  const handleShowQR = (contract: SmartContract) => {
    const qrData = `https://cherrypick.co.zm/trace/${contract.qrCode || contract.id}`;

    const qrWindow = window.open("", "QR Code", "width=400,height=550");
    if (qrWindow) {
      qrWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contract QR Code</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20px;
              text-align: center;
              background: linear-gradient(135deg, #f0f7f4 0%, #e8f5e9 100%);
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 20px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              max-width: 350px;
              margin: 20px auto;
            }
            h2 { color: #2d5f3f; margin-bottom: 10px; }
            .contract-info {
              background: #f0f7f4;
              padding: 15px;
              border-radius: 10px;
              margin: 20px 0;
            }
            .contract-id {
              font-size: 12px;
              color: #666;
              word-break: break-all;
              margin: 5px 0;
            }
            .crop-type {
              font-weight: bold;
              color: #2d5f3f;
              font-size: 16px;
            }
            #qrcode { margin: 20px 0; }
            .instructions {
              background: #e3f2fd;
              padding: 15px;
              border-radius: 10px;
              font-size: 13px;
              color: #1565c0;
              margin-top: 20px;
            }
            button {
              background: #2d5f3f;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              margin: 10px 5px;
            }
            button:hover { background: #1d4029; }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
        </head>
        <body>
          <div class="container">
            <h2>🌾 Contract QR Code</h2>
            <div class="contract-info">
              <div class="crop-type">${contract.cropType} - ${contract.variety}</div>
              <div class="contract-id">ID: ${contract.id}</div>
            </div>
            <div id="qrcode"></div>
            <div class="instructions">
              <strong>How to use:</strong> Scan this QR code to view contract details and track milestones.
            </div>
            <button onclick="downloadQR()">Download QR Code</button>
            <button onclick="window.print()">Print</button>
          </div>
          <script>
            QRCode.toCanvas(
              document.createElement('canvas'),
              '${qrData}',
              {
                width: 250,
                margin: 2,
                color: { dark: '#2d5f3f', light: '#ffffff' }
              },
              function(error, canvas) {
                if (error) console.error(error);
                document.getElementById('qrcode').appendChild(canvas);
              }
            );
            
            function downloadQR() {
              const canvas = document.querySelector('canvas');
              const url = canvas.toDataURL('image/png');
              const link = document.createElement('a');
              link.download = '${contract.id}-qrcode.png';
              link.href = url;
              link.click();
            }
          </script>
        </body>
        </html>
      `);
      qrWindow.document.close();
    } else {
      toast.error("Please allow popups to view QR code");
    }
  };

  const canSubmitMilestone = (contract: SmartContract, milestoneIndex: number) => {
    if (milestoneIndex === 0) return true;
    const previousMilestone = contract.milestones[milestoneIndex - 1];
    return previousMilestone.status === "verified";
  };

  const getNextActiveMilestone = (contract: SmartContract) => {
    return contract.milestones.findIndex(m => m.status === "pending");
  };

  const handleSaveProfile = async () => {
    if (!farmerId) return;

    try {
      // Ensure farm_size is a number
      const updateData = {
        ...profileForm,
        email: profileForm.email || null,
        phone: profileForm.phone || null,
        location_lat: Number(profileForm.location_lat) || null,
        location_lng: Number(profileForm.location_lng) || null,
        farm_size: Number(profileForm.farm_size) || 0,
        nrc_id: profileForm.nrc_id || null,
        gender: profileForm.gender || null,
      };

      await updateFarmer(farmerId, updateData);
      setFarmerData({ ...farmerData, ...updateData } as FarmerProfile);
      setIsEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      const message = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    }
  };

  const handleCancelEdit = () => {
    if (farmerData) {
      setProfileForm({
        name: farmerData.name || '',
        email: farmerData.email || '',
        phone: farmerData.phone || '',
        location_address: farmerData.location_address || '',
        location_lat: farmerData.location_lat || 0,
        location_lng: farmerData.location_lng || 0,
        farm_size: farmerData.farm_size || 0,
        nrc_id: farmerData.nrc_id || '',
        gender: farmerData.gender || 'male',
        profile_photo: farmerData.profile_photo || '',
        bio: farmerData.bio || '',
      });
    }
    setIsEditingProfile(false);
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type && !file.type.startsWith('image/') && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)) {
      toast.error('Please pick an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Photo must be smaller than 10MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      const { uploadImageToIPFS } = await import('@/lib/ipfsService');
      const result = await uploadImageToIPFS(file);
      setProfileForm(prev => ({ ...prev, profile_photo: result.url }));
      toast.success('Profile photo uploaded');
    } catch (err: any) {
      console.error('Profile photo upload failed:', err);
      toast.error(err?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCreateListing = async () => {
    if (!evmAddress || !farmerId) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!listingForm.crop_type || !listingForm.quantity || !listingForm.price_per_unit) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabase');

      const totalPrice = listingForm.quantity * listingForm.price_per_unit;

      const { error } = await supabase
        .from('marketplace_listings')
        .insert({
          farmer_id: farmerId,
          crop_type: listingForm.crop_type,
          available_quantity: listingForm.quantity,
          unit: 'kg',
          price_per_unit: listingForm.price_per_unit,
          total_price: totalPrice,
          description: listingForm.description,
          quality_grade: listingForm.quality_grade,
          harvest_date: listingForm.harvest_date || null,
          organic: listingForm.organic,
          batch_id: listingForm.batch_id || null,
          status: 'active'
        });

      if (error) throw error;

      toast.success("Listing created successfully!");
      setShowCreateListing(false);
      setListingForm({
        crop_type: '',
        quantity: 0,
        price_per_unit: 0,
        quality_grade: 'A',
        description: '',
        harvest_date: '',
        organic: false,
        batch_id: '',
      });
      loadMarketplaceListings();
    } catch (error: unknown) {
      console.error("Error creating listing:", error);
      const msg = (error as { message?: string })?.message || "Failed to create listing";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!evmAddress) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-premium p-16 text-center">
          <div className="bg-gradient-to-br from-[#f0f7f4] to-[#e8f5e9] w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-12 w-12 text-[#2d5f3f]" />
          </div>
          <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Please connect your wallet to access your farmer dashboard and manage contracts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header — ARKTOS */}
      <div className="mb-8">
        <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>Farmer Portal v1.0</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 0.95, letterSpacing: "-0.03em", color: "#0C2D3A" }}>
          MY FARM<br />DASHBOARD
        </h1>
      </div>

      {/* Pending Approval Banner */}
      {isPending && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800">Account Pending Approval</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Your farm is being verified. You can edit your profile, use AI diagnostics, and view the marketplace.
              Contracts, traceability, and batches will unlock after approval.
            </p>
          </div>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
            {farmerData?.status || 'pending'}
          </span>
        </div>
      )}

      {/* ARKTOS Stats Swatches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: "Active Contracts", value: String(stats.activeContracts), bg: "#BFFF00", color: "#0C2D3A", sub: "In progress" },
          { label: "Completed Milestones", value: String(stats.completedMilestones), bg: "#0C2D3A", color: "#fff", sub: "Verified" },
          { label: "Pending Payments", value: String(stats.pendingPayments), bg: "#E6E2D6", color: "#0C2D3A", sub: "Awaiting release" },
          { label: "Total Earnings", value: `K${stats.totalEarnings.toLocaleString()}`, bg: "#fff", color: "#0C2D3A", sub: "Lifetime" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, color: s.color, borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 160, border: s.bg === "#fff" ? "1px solid rgba(12,45,58,0.06)" : "none", transition: "transform .3s", cursor: "default" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")} onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: "0.8rem", opacity: 0.7 }}>{s.label}</span>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.8rem", marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: "0.7rem", opacity: 0.5 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>


      {/* Wallet Balance & AI Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Wallet Balance */}
        <div>
          <WalletBalance walletAddress={evmAddress} userRole="farmer" />
        </div>

        {/* AI Crop Diagnostics */}
        <div>
          <CropDiagnostics
            farmerId={farmerId || undefined}
            onDiagnosisComplete={(result, imageUrl) => {
              console.log('Diagnosis complete:', result);
              toast.success(`AI Analysis: ${result.diagnosis} - ${result.healthScore}% health score`);
            }}
          />
        </div>
      </div>

      {/* Farmer Profile */}
      <div className="grid grid-cols-1 gap-6 mb-8">

        {/* Farmer Profile Card */}
        <div className="card-premium lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a]">Farmer Profile</h3>
            </div>
            {!isEditingProfile ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  title="Edit Profile"
                >
                  <Edit2 className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md flex items-center gap-2"
                  title="Save Changes"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Profile Photo */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Profile Photo</label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md ring-2 ring-white">
                  {profileForm.profile_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileForm.profile_photo}
                      alt={profileForm.name || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-2xl">
                      {(profileForm.name || farmerData?.name || '?')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(s => s[0]?.toUpperCase())
                        .join('') || '?'}
                    </span>
                  )}
                </div>

                {isEditingProfile && (
                  <div className="flex flex-col gap-2">
                    <label className={`px-4 py-2 rounded-xl font-semibold cursor-pointer text-sm flex items-center gap-2 transition-colors ${uploadingPhoto ? 'bg-gray-100 text-gray-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'}`}>
                      {uploadingPhoto ? 'Uploading…' : (profileForm.profile_photo ? 'Change Photo' : 'Upload Photo')}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoUpload}
                        disabled={uploadingPhoto}
                        className="hidden"
                      />
                    </label>
                    {profileForm.profile_photo && (
                      <button
                        type="button"
                        onClick={() => setProfileForm(prev => ({ ...prev, profile_photo: '' }))}
                        className="text-xs text-red-600 hover:underline self-start"
                      >
                        Remove photo
                      </button>
                    )}
                    <p className="text-xs text-gray-500 max-w-[260px]">This photo appears on the public traceability page so buyers can meet you.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Full Name</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{farmerData?.name || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Email</label>
              {isEditingProfile ? (
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{farmerData?.email || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Phone Number</label>
              {isEditingProfile ? (
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+260 XXX XXX XXX"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{farmerData?.phone || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* NRC/ID Number */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">NRC/ID Number</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profileForm.nrc_id}
                  onChange={(e) => setProfileForm({ ...profileForm, nrc_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. 123456/11/1"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                    {farmerData?.nrc_id || 'Not set'}
                  </span>
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Gender</label>
              {isEditingProfile ? (
                <select
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <span className="capitalize">{farmerData?.gender || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Farm Location</label>
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={profileForm.location_address}
                        onChange={(e) => setProfileForm({ ...profileForm, location_address: e.target.value })}
                        className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        placeholder="City, District, Zambia"
                      />
                    </div>
                    <button
                      onClick={() => setIsLocationModalOpen(true)}
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-2 border border-emerald-100 font-semibold text-sm whitespace-nowrap shadow-sm"
                      title="Set Precise Location"
                      type="button"
                    >
                      <Crosshair className="h-4 w-4" />
                      Precise Pin
                    </button>
                  </div>

                  {profileForm.location_lat !== 0 && (
                    <div className="bg-green-50/50 border border-green-100 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">
                          GPS Locked: {profileForm.location_lat.toFixed(6)}, {profileForm.location_lng.toFixed(6)}
                        </span>
                      </div>
                      <button
                        onClick={() => setIsLocationModalOpen(true)}
                        className="text-[10px] font-bold text-green-700 hover:underline uppercase tracking-wider"
                      >
                        Adjust
                      </button>
                    </div>
                  )}

                  <LocationPickerModal
                    isOpen={isLocationModalOpen}
                    onCloseAction={() => setIsLocationModalOpen(false)}
                    initialLat={profileForm.location_lat || undefined}
                    initialLng={profileForm.location_lng || undefined}
                    initialAddress={profileForm.location_address}
                    onSelectAction={(data) => {
                      setProfileForm(prev => ({
                        ...prev,
                        location_lat: data.lat,
                        location_lng: data.lng,
                        location_address: data.address
                      }));
                      toast.success("Location updated accurately!");
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-900 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{farmerData?.location_address || 'Not set'}</span>
                  {farmerData?.location_lat && farmerData?.location_lat !== 0 && (
                    <a
                      href={`https://maps.google.com/?q=${farmerData.location_lat},${farmerData.location_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1.5 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-wider flex items-center gap-1"
                    >
                      <MapIcon className="h-3 w-3" />
                      Maps
                    </a>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Farm Details Card */}
        <div className="card-premium">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl">
              <Sprout className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1a1a]">Farm Details</h3>
          </div>

          <div className="space-y-4">
            {/* Farm Size */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Farm Size (Hectares)</label>
              {isEditingProfile ? (
                <input
                  type="number"
                  value={profileForm.farm_size}
                  onChange={(e) => setProfileForm({ ...profileForm, farm_size: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                />
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {farmerData?.farm_size || 0} Ha
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Total Contracts</p>
                <p className="text-2xl font-bold text-green-600">{contracts.length}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {contracts.length > 0
                    ? Math.round(
                      (contracts.reduce((acc, c) =>
                        acc + c.milestones.filter(m => m.status === "verified").length, 0
                      ) / contracts.reduce((acc, c) => acc + c.milestones.length, 0)) * 100
                    )
                    : 0}%
                </p>
              </div>
            </div>

            {/* Wallet Address */}
            <div className="bg-gray-50 p-4 rounded-xl mt-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Wallet Address</p>
              <p className="text-xs font-mono text-gray-700 break-all">
                {evmAddress || 'Not connected'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mt-8 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'contracts' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contracts
          </div>
          {activeTab === 'contracts' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'listings' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Marketplace Listings
          </div>
          {activeTab === 'listings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => {
            if (isPending) {
              toast.error('Account pending approval. Traceability unlocks after your farm is verified.');
              return;
            }
            setActiveTab('traceability');
          }}
          className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'traceability' ? 'text-green-600' : isPending ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Traceability
            {isPending && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Locked</span>}
          </div>
          {activeTab === 'traceability' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('bidding')}
          className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'bidding' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Bidding
          </div>
          {activeTab === 'bidding' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => {
            if (isPending) {
              toast.error('Account pending approval. Growth tracking unlocks after verification.');
              return;
            }
            setActiveTab('growth');
          }}
          className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'growth' ? 'text-green-600' : isPending ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5" />
            Growth Log
            {isPending && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Locked</span>}
          </div>
          {activeTab === 'growth' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t-full" />
          )}
        </button>

      </div>

      {/* Growth Tab */}
      {activeTab === 'growth' && (
        <FarmerGrowthPanel
          farmerId={farmerId || ''}
          contracts={contracts.map(c => ({ id: c.id, cropType: c.cropType, variety: c.variety, status: c.status }))}
          batches={batches.map(b => ({ id: b.id || '', batch_code: b.batch_code, crop_type: b.crop_type, current_status: b.current_status || 'growing' }))}
          isPending={isPending}
        />
      )}

      {/* Traceability Tab */}
      {activeTab === 'traceability' && (
        <BatchList farmerId={farmerId || ''} userId={farmerData?.user_id} />
      )}

      {/* Marketplace Listings Tab */}
      {activeTab === 'listings' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1a1a1a]">Marketplace Listings</h2>
                <p className="text-sm text-gray-600">Sell your produce directly to buyers</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateListing(!showCreateListing)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Listing</span>
            </button>
          </div>

          {/* Create Listing Form */}
          {showCreateListing && (
            <div className="card-premium mb-6">
              <h3 className="text-lg font-bold text-[#1a1a1a] mb-4">New Marketplace Listing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Crop Type */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Crop Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={listingForm.crop_type}
                    onChange={(e) => setListingForm({ ...listingForm, crop_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select crop type</option>
                    <option value="Mangoes">Mangoes</option>
                    <option value="Pineapples">Pineapples</option>
                    <option value="Cashew nuts">Cashew nuts</option>
                    <option value="Tomatoes">Tomatoes</option>
                    <option value="Beetroot">Beetroot</option>
                    <option value="Bananas">Bananas</option>
                    <option value="Pawpaw">Pawpaw</option>
                    <option value="Strawberries">Strawberries</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Quantity (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={listingForm.quantity}
                    onChange={(e) => setListingForm({ ...listingForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>

                {/* Price per Unit */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Price per kg (K) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={listingForm.price_per_unit}
                    onChange={(e) => setListingForm({ ...listingForm, price_per_unit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Quality Grade */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Quality Grade</label>
                  <select
                    value={listingForm.quality_grade}
                    onChange={(e) => setListingForm({ ...listingForm, quality_grade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Premium">Premium</option>
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                  </select>
                </div>

                {/* Traceability Batch Link */}
                <div className="md:col-span-2 bg-green-50 p-4 rounded-xl border border-green-100">
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-green-600" />
                    Link Traceability Batch (Optional)
                  </label>
                  <select
                    value={listingForm.batch_id}
                    onChange={(e) => setListingForm({ ...listingForm, batch_id: e.target.value })}
                    className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select a batch to verify origin...</option>
                    {batches.map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batch_code} - {batch.crop_type} ({batch.current_status})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-green-700 mt-2">
                    Linking a batch provides buyers with proof of origin and complete crop history.
                  </p>
                </div>

                {/* Harvest Date */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Harvest Date</label>
                  <input
                    type="date"
                    value={listingForm.harvest_date}
                    onChange={(e) => setListingForm({ ...listingForm, harvest_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Organic Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="organic"
                    checked={listingForm.organic}
                    onChange={(e) => setListingForm({ ...listingForm, organic: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="organic" className="ml-2 text-sm font-medium text-gray-700">
                    Organic Certified
                  </label>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                  <textarea
                    value={listingForm.description}
                    onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Describe your produce, growing conditions, certifications, etc."
                  />
                </div>
              </div>

              {/* Total Price Preview */}
              {listingForm.quantity > 0 && listingForm.price_per_unit > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-green-600">
                    K{(listingForm.quantity * listingForm.price_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateListing}
                  className="btn-primary flex-1"
                >
                  Create Listing
                </button>
                <button
                  onClick={() => {
                    setShowCreateListing(false);
                    setListingForm({
                      crop_type: '',
                      quantity: 0,
                      price_per_unit: 0,
                      quality_grade: 'A',
                      description: '',
                      harvest_date: '',
                      organic: false,
                      batch_id: '',
                    });
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Existing Listings */}
          {marketplaceListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketplaceListings.map((listing) => (
                <div key={listing.id} className="card-premium hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-600" />
                      <h4 className="font-bold text-gray-900">{listing.crop_type}</h4>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${listing.status === 'active' ? 'bg-green-100 text-green-700' :
                      listing.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                      {listing.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-semibold">{listing.available_quantity} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-semibold">K{listing.price_per_unit}/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quality:</span>
                      <span className="font-semibold">{listing.quality_grade}</span>
                    </div>
                    {listing.organic && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Organic</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-lg font-bold text-purple-600">
                      K{listing.total_price.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Listed {new Date(listing.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : !showCreateListing && (
            <div className="card-premium p-8 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No marketplace listings yet</p>
              <button
                onClick={() => setShowCreateListing(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Listing</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contracts List */}
      {activeTab === 'contracts' && (
        contracts.length === 0 ? (
          <div className="card-premium p-16 text-center">
            <div className="bg-gradient-to-br from-[#f0f7f4] to-[#e8f5e9] w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText className="h-12 w-12 text-[#2d5f3f]" />
            </div>
            <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">No Contracts Assigned</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              You don't have any contracts assigned yet. Contracts are created by administrators and assigned to farmers.
            </p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Once a contract is assigned to you, you'll be able to log your farm activities and track milestone progress here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1a1a1a]">Your Assigned Contracts</h2>
                <p className="text-sm text-gray-600 mt-1">Log activities for each milestone to request verification</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => farmerId && loadContracts(farmerId)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Loader2 className="h-4 w-4" />
                  Refresh Status
                </button>
                <button className="text-sm font-medium text-[#2d5f3f] hover:text-[#1d4029] flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </button>
              </div>
            </div>
            {contracts.map((contract) => {
              const isExpanded = expandedContracts.has(contract.id);
              const nextMilestoneIndex = getNextActiveMilestone(contract);
              const completedCount = contract.milestones.filter(m => m.status === "verified").length;
              const totalMilestones = contract.milestones.length;
              const progressPercentage = (completedCount / totalMilestones) * 100;

              return (
                <div key={contract.id} className="card-premium hover:shadow-2xl transition-all">
                  <div
                    onClick={() => toggleContract(contract.id)}
                    className="cursor-pointer hover:bg-gray-50/50 transition-colors p-2 -m-2 rounded-xl mb-2"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-[#1a1a1a]">
                            {contract.cropType} - {contract.variety}
                          </h3>
                          <span className={`px-2 py-1 rounded-lg text-xs font-mono font-bold bg-gray-100 text-gray-600 border border-gray-200`}>
                            {contract.qrCode || 'NO-CODE'}
                          </span>
                          <span className={`badge ${contract.status === "active" ? "badge-success" :
                            contract.status === "completed" ? "badge-info" :
                              "badge-error"
                            }`}>
                            {contract.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Required: {contract.requiredQuantity} kg</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>K{contract.discountedPrice}/kg</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Created: {new Date(contract.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowQR(contract);
                          }}
                          className="p-2.5 hover:bg-[#f0f7f4] rounded-xl transition-colors"
                          title="View QR Code"
                        >
                          <QrCode className="h-5 w-5 text-[#2d5f3f]" />
                        </button>
                        <div className="p-2 text-gray-400 group-hover:text-gray-600">
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progress: {completedCount} of {totalMilestones} milestones
                        </span>
                        <span className="text-sm font-bold text-[#2d5f3f]">
                          {Math.round(progressPercentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {!isExpanded && nextMilestoneIndex >= 0 && (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-800">
                          Next Action Required: {contract.milestones[nextMilestoneIndex].name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Milestones List */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 pt-6 mt-4">
                      {/* Contract Details Card */}
                      <div className="bg-emerald-50 rounded-xl p-6 mb-6 border border-emerald-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-2">Contract Value</p>
                          <p className="text-xl font-bold text-gray-900">
                            K{(contract.requiredQuantity * contract.discountedPrice).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Total ZMW agreement</p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-2">Target Volume</p>
                          <p className="text-xl font-bold text-gray-900">{contract.requiredQuantity.toLocaleString()} kg</p>
                          <p className="text-xs text-gray-500 mt-1">K{contract.discountedPrice} per kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-2">Final Delivery</p>
                          <p className="text-xl font-bold text-gray-900">
                            {contract.milestones.length > 0 && contract.milestones[contract.milestones.length - 1].expectedDate
                              ? new Date(contract.milestones[contract.milestones.length - 1].expectedDate).toLocaleDateString()
                              : 'TBD'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Completion target</p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-2">Current Status</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xl font-bold text-gray-900">{Math.round(progressPercentage)}%</p>
                            <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Verified</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{completedCount} of {totalMilestones} done</p>
                        </div>

                        <div className="col-span-2 md:col-span-2 pt-4 border-t border-emerald-100">
                          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-2">Farmer Information</p>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg border border-emerald-100">
                              <User className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{farmerData?.name || 'Farmer Profile'}</p>
                              <p className="text-xs text-gray-500">{farmerData?.location_address || 'Location registered'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2 md:col-span-2 pt-4 border-t border-emerald-100">
                          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-2">Contract Code</p>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg border border-emerald-100">
                              <FileText className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 font-mono">{contract.qrCode || 'N/A'}</p>
                              <p className="text-xs text-gray-500">Universal Reference ID</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contract.milestones.map((milestone, index) => {
                          const canSubmit = canSubmitMilestone(contract, index);
                          const isNextActive = index === nextMilestoneIndex;

                          return (
                            <div
                              key={milestone.id}
                              className={`relative ${isNextActive ? "ring-2 ring-green-500 ring-offset-2" : ""
                                }`}
                            >
                              {isNextActive && (
                                <div className="absolute -top-2 -right-2 z-10">
                                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                    ACTIVE
                                  </span>
                                </div>
                              )}
                              <MilestoneCard
                                milestone={milestone}
                                contractId={contract.id}
                                canSubmit={canSubmit}
                                isNextActive={isNextActive}
                                milestoneIndex={index}
                                totalMilestones={totalMilestones}
                                verifiedCount={completedCount}
                                onEvidenceSubmitted={() => {
                                  if (farmerId) loadContracts(farmerId);
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {nextMilestoneIndex > 0 && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Complete milestone "{contract.milestones[nextMilestoneIndex - 1].name}" before submitting evidence for the next one.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Bidding Tab */}
      {activeTab === 'bidding' && farmerId && (
        <FarmerBiddingPanel farmerId={farmerId} isPending={isPending} />
      )}

      {/* Milestone Selector Modal */}
      {showMilestoneSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Select Milestone</h3>
              <button
                onClick={() => setShowMilestoneSelector(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Please select which milestone you want to upload evidence for:
            </p>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {contracts.flatMap(c =>
                c.milestones.filter(m => m.status === 'pending').map(m => ({
                  id: m.id,
                  name: m.name,
                  contractId: c.id,
                  contractName: `${c.cropType} - ${c.variety}`,
                  dueDate: m.expectedDate
                }))
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMilestone({
                      id: m.id,
                      name: m.name,
                      contractId: m.contractId
                    });
                    setShowMilestoneSelector(false);
                    setShowEvidenceModal(true);
                  }}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-green-700">{m.contractName}</p>
                      <p className="text-sm text-gray-600 mt-1">Milestone: {m.name}</p>
                    </div>
                    {m.dueDate && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Due: {new Date(m.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
