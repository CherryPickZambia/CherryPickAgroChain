"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, DollarSign, QrCode, Calendar, TrendingUp, AlertCircle, Download, ChevronDown, ChevronUp, Loader2, Sprout, User, MapPin, Phone, Mail, Edit2, Save, X, Plus, ShoppingBag, Package, List } from "lucide-react";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import MilestoneCard from "./MilestoneCard";
import WalletBalance from "./WalletBalance";
import CropDiagnostics from "./CropDiagnostics";
import { type SmartContract } from "@/lib/types";
import { getContractsByFarmer, getFarmerByWallet, createFarmer, updateFarmer } from "@/lib/supabaseService";
import { getFarmerListings, type MarketplaceListing } from "@/lib/database";
import { getBatchesByFarmer, Batch } from "@/lib/traceabilityService";
import BatchList from "./BatchList";
import toast from "react-hot-toast";

export default function FarmerDashboard() {
  const { evmAddress } = useEvmAddress();
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [farmerData, setFarmerData] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    location_address: '',
    farm_size: 0,
  });
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
  const [activeTab, setActiveTab] = useState<'contracts' | 'listings' | 'traceability'>('contracts');

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
        farm_size: farmer.farm_size || 0,
      });
      await loadContracts(farmer.id);
      await loadMarketplaceListings(farmer.id);
      await loadBatches(farmer.id);
    } catch (error: any) {
      console.error("Error loading farmer data:", error);
      toast.error(`Failed to load data: ${error.message || 'Unknown error'}`);
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
    } catch (error) {
      console.error("Error loading batches:", error);
    }
  };

  const loadContracts = async (farmerId: string) => {
    try {
      const data = await getContractsByFarmer(farmerId);

      const transformedContracts: SmartContract[] = data.map((contract: any) => ({
        id: contract.id,
        farmerId: contract.farmer_id,
        cropType: contract.crop_type,
        variety: contract.variety || '',
        requiredQuantity: contract.required_quantity,
        discountedPrice: contract.price_per_kg || contract.discounted_price || 0,
        standardPrice: contract.price_per_kg || contract.standard_price || 0,
        milestones: (contract.milestones || []).map((m: any) => ({
          id: m.id,
          contractId: m.contract_id,
          name: m.name,
          description: m.description || '',
          expectedDate: new Date(m.expected_date),
          completedDate: m.completed_date ? new Date(m.completed_date) : undefined,
          status: m.status,
          paymentAmount: m.payment_amount,
          paymentStatus: m.payment_status,
        })),
        status: contract.status,
        qrCode: contract.contract_code || contract.qr_code || '',
        createdAt: new Date(contract.created_at),
      }));

      setContracts(transformedContracts);
    } catch (error: any) {
      console.error("Error loading contracts:", error);
      toast.error("Failed to load contracts");
    }
  };

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
    const qrData = `https://cherrypick.co.zm/trace/${contract.id}`;

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
        farm_size: Number(profileForm.farm_size) || 0,
      };

      await updateFarmer(farmerId, updateData);
      setFarmerData({ ...farmerData, ...updateData });
      setIsEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    if (farmerData) {
      setProfileForm({
        name: farmerData.name || '',
        email: farmerData.email || '',
        phone: farmerData.phone || '',
        location_address: farmerData.location_address || '',
        farm_size: farmerData.farm_size || 0,
      });
    }
    setIsEditingProfile(false);
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
          organic: listingForm.organic,
          harvest_date: listingForm.harvest_date || null,
          location: farmerData?.location_address || '',
          status: 'active',
          batch_id: listingForm.batch_id || null,
        });

      if (error) {
        console.error("Supabase error:", error.message, error.code, error.details);
        throw new Error(error.message || 'Database error');
      }

      toast.success("Marketplace listing created successfully!");
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
      await loadMarketplaceListings();
    } catch (error: any) {
      console.error("Error creating listing:", error?.message || error);
      toast.error(error?.message || "Failed to create listing");
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-50 rounded-2xl">
            <Sprout className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a1a1a]">Farmer Dashboard</h1>
            <p className="text-gray-600">Manage your farm and track your progress</p>
          </div>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card-premium group hover:shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Contracts</p>
              <p className="text-4xl font-bold text-[#1a1a1a]">{stats.activeContracts}</p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-50 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <FileText className="h-7 w-7 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-gray-500">View all contracts</span>
          </div>
        </div>

        <div className="card-premium group hover:shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Completed Milestones</p>
              <p className="text-4xl font-bold text-[#1a1a1a]">{stats.completedMilestones}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <CheckCircle className="h-7 w-7 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className="badge badge-success text-xs">verified</span>
          </div>
        </div>

        <div className="card-premium group hover:shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending Payments</p>
              <p className="text-4xl font-bold text-[#1a1a1a]">{stats.pendingPayments}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <Clock className="h-7 w-7 text-yellow-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className="badge badge-warning text-xs">awaiting</span>
          </div>
        </div>

        <div className="card-premium group hover:shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Earnings</p>
              <p className="text-4xl font-bold text-[#2d5f3f]">
                K{stats.totalEarnings.toLocaleString()}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <DollarSign className="h-7 w-7 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-600 font-semibold">+12% this month</span>
          </div>
        </div>
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
              <button
                onClick={() => setIsEditingProfile(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit Profile"
              >
                <Edit2 className="h-5 w-5 text-gray-600" />
              </button>
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

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Farm Location</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={profileForm.location_address}
                  onChange={(e) => setProfileForm({ ...profileForm, location_address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="City, District, Zambia"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{farmerData?.location_address || 'Not set'}</span>
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
          onClick={() => setActiveTab('traceability')}
          className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'traceability' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Traceability
          </div>
          {activeTab === 'traceability' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Traceability Tab */}
      {activeTab === 'traceability' && (
        <BatchList farmerId={farmerId || ''} />
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
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-[#1a1a1a]">
                          {contract.cropType} - {contract.variety}
                        </h3>
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
                    <button
                      onClick={() => handleShowQR(contract)}
                      className="p-2.5 hover:bg-[#f0f7f4] rounded-xl transition-colors"
                      title="View QR Code"
                    >
                      <QrCode className="h-5 w-5 text-[#2d5f3f]" />
                    </button>
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

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleContract(contract.id)}
                    className="w-full border-t border-gray-100 pt-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-700">
                        {isExpanded ? "Hide" : "View"} Milestones
                      </h4>
                      {!isExpanded && nextMilestoneIndex >= 0 && (
                        <span className="badge badge-warning text-xs">
                          Next: {contract.milestones[nextMilestoneIndex].name}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    )}
                  </button>

                  {/* Milestones List */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 pt-6 mt-4">
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
    </div >
  );
}
