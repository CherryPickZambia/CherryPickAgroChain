"use client";

import { useState, useEffect } from "react";
import { Plus, FileText, CheckCircle, Clock, DollarSign, QrCode, Calendar, TrendingUp, AlertCircle, Download, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import CreateContractModal from "./CreateContractModal";
import MilestoneCard from "./MilestoneCard";
import { type SmartContract } from "@/lib/types";
import { getContractsByFarmer, getFarmerByWallet, createFarmer } from "@/lib/supabaseService";
import toast from "react-hot-toast";

export default function FarmerDashboard() {
  const { evmAddress } = useEvmAddress();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [farmerId, setFarmerId] = useState<string | null>(null);

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
          email: "",
          phone: "",
          location_lat: 0,
          location_lng: 0,
          location_address: "",
          farm_size: 0,
        });
        toast.success("Welcome! Your farmer profile has been created.");
      }
      
      setFarmerId(farmer.id);
      await loadContracts(farmer.id);
    } catch (error: any) {
      console.error("Error loading farmer data:", error);
      toast.error("Failed to load your data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async (farmerId: string) => {
    try {
      const data = await getContractsByFarmer(farmerId);
      
      const transformedContracts: SmartContract[] = data.map((contract: any) => ({
        id: contract.id,
        farmerId: contract.farmer_id,
        cropType: contract.crop_type,
        variety: contract.variety,
        requiredQuantity: contract.required_quantity,
        discountedPrice: contract.discounted_price,
        standardPrice: contract.standard_price,
        milestones: contract.milestones.map((m: any) => ({
          id: m.id,
          contractId: m.contract_id,
          name: m.name,
          description: m.description,
          expectedDate: new Date(m.expected_date),
          completedDate: m.completed_date ? new Date(m.completed_date) : undefined,
          status: m.status,
          paymentAmount: m.payment_amount,
          paymentStatus: m.payment_status,
        })),
        status: contract.status,
        qrCode: contract.qr_code,
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
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Farmer Dashboard</h1>
        <p className="text-gray-600">Manage your contracts and track your farming progress</p>
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

      {/* Action Button */}
      <div className="mb-8">
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create New Contract</span>
        </button>
      </div>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <div className="card-premium p-16 text-center">
          <div className="bg-gradient-to-br from-[#f0f7f4] to-[#e8f5e9] w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileText className="h-12 w-12 text-[#2d5f3f]" />
          </div>
          <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">No Contracts Yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Create your first smart contract to start farming with AgroChain360 and unlock secure payments
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Your First Contract</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Your Contracts</h2>
            <button className="text-sm font-medium text-[#2d5f3f] hover:text-[#1d4029] flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </button>
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
                      <span className={`badge ${
                        contract.status === "active" ? "badge-success" :
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
                            className={`relative ${
                              isNextActive ? "ring-2 ring-green-500 ring-offset-2" : ""
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
      )}

      {/* Create Contract Modal */}
      {showCreateModal && farmerId && (
        <CreateContractModal
          farmerId={farmerId}
          onClose={() => setShowCreateModal(false)}
          onContractCreated={async (contract: SmartContract) => {
            setShowCreateModal(false);
            if (farmerId) await loadContracts(farmerId);
            setExpandedContracts(prev => new Set(prev).add(contract.id));
            toast.success("Contract created successfully!");
          }}
        />
      )}
    </div>
  );
}
