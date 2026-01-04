"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle, XCircle, Clock, Eye, Image as ImageIcon, FileText,
  TrendingUp, Award, AlertCircle, Filter, Search, Calendar,
  MapPin, User, Package, DollarSign, Star, ChevronRight, Download, Navigation
} from "lucide-react";
import VerificationMap from "./VerificationMap";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import toast from "react-hot-toast";
import OfficerVerificationModal from "./OfficerVerificationModal";
import WalletBalance from "./WalletBalance";
import { supabase } from "@/lib/supabase";
import type { Milestone } from "@/lib/types";

interface MilestoneVerificationTask {
  id: string;
  milestone: Milestone & {
    contract: {
      id: string;
      crop_type: string;
      farmer_id: string;
      farmer: {
        name: string;
        wallet_address: string;
        location_address: string;
      };
    };
  };
  submitted_date: string;
  priority: "high" | "medium" | "low";
}

interface VerificationHistory {
  id: string;
  type: string;
  crop_type: string;
  farmer_name: string;
  status: "approved" | "rejected";
  verified_date: string;
  notes: string;
  fee_earned: number;
}

export default function OfficerDashboard() {
  const { evmAddress } = useEvmAddress();
  const [activeTab, setActiveTab] = useState<"pending" | "map" | "history" | "stats">("pending");
  const [pendingVerifications, setPendingVerifications] = useState<MilestoneVerificationTask[]>([]);
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<MilestoneVerificationTask | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Sample demo data for when database is unavailable
  const DEMO_VERIFICATIONS: MilestoneVerificationTask[] = [
    {
      id: 'demo-1',
      milestone: {
        id: 'demo-1',
        name: 'Land Preparation Complete',
        description: 'Initial land clearing and soil preparation for mango planting',
        status: 'submitted',
        payment_amount: 500,
        expected_date: '2024-12-15',
        completed_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        contract: {
          id: 'contract-1',
          crop_type: 'Mangoes',
          farmer_id: 'farmer-1',
          farmer: {
            name: 'John Mwale',
            wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8E2B1',
            location_address: 'Mkushi, Central Province'
          }
        }
      } as any,
      submitted_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'medium'
    },
    {
      id: 'demo-2',
      milestone: {
        id: 'demo-2',
        name: 'Seedling Transplant',
        description: 'Pineapple seedlings transplanted to main field',
        status: 'submitted',
        payment_amount: 750,
        expected_date: '2024-12-20',
        completed_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        contract: {
          id: 'contract-2',
          crop_type: 'Pineapples',
          farmer_id: 'farmer-2',
          farmer: {
            name: 'Mary Banda',
            wallet_address: '0x8ba1F109551bD432803012645Ac136ddd64DBA72',
            location_address: 'Chisamba, Central Province'
          }
        }
      } as any,
      submitted_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'high'
    },
    {
      id: 'demo-3',
      milestone: {
        id: 'demo-3',
        name: 'Fertilizer Application',
        description: 'First round of NPK fertilizer applied to tomato crops',
        status: 'submitted',
        payment_amount: 300,
        expected_date: '2024-12-18',
        completed_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        contract: {
          id: 'contract-3',
          crop_type: 'Tomatoes',
          farmer_id: 'farmer-3',
          farmer: {
            name: 'Peter Phiri',
            wallet_address: '0x9f2dF0fed2C77648de5860a4dc508cd0572B6C1a',
            location_address: 'Mazabuka, Southern Province'
          }
        }
      } as any,
      submitted_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'low'
    },
    {
      id: 'demo-4',
      milestone: {
        id: 'demo-4',
        name: 'Harvest Ready Inspection',
        description: 'Cashew nuts ready for harvest - quality inspection needed',
        status: 'submitted',
        payment_amount: 1000,
        expected_date: '2024-12-10',
        completed_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        contract: {
          id: 'contract-4',
          crop_type: 'Cashews',
          farmer_id: 'farmer-4',
          farmer: {
            name: 'Grace Tembo',
            wallet_address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            location_address: 'Chipata, Eastern Province'
          }
        }
      } as any,
      submitted_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'high'
    }
  ];

  const DEMO_HISTORY: VerificationHistory[] = [
    { id: 'h1', type: 'milestone', crop_type: 'Maize', farmer_name: 'David Zulu', status: 'approved', verified_date: '2024-12-01', notes: 'Excellent crop condition', fee_earned: 50 },
    { id: 'h2', type: 'milestone', crop_type: 'Soybeans', farmer_name: 'Sarah Mumba', status: 'approved', verified_date: '2024-11-28', notes: 'All requirements met', fee_earned: 50 },
    { id: 'h3', type: 'milestone', crop_type: 'Groundnuts', farmer_name: 'James Sakala', status: 'rejected', verified_date: '2024-11-25', notes: 'Insufficient evidence provided', fee_earned: 0 },
  ];

  // Load milestone verification tasks from Supabase
  useEffect(() => {
    loadVerifications();
  }, [evmAddress]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is available
      if (!supabase) {
        // Use demo data
        setPendingVerifications(DEMO_VERIFICATIONS);
        setHistory(DEMO_HISTORY);
        setLoading(false);
        return;
      }
      
      // Fetch milestones with status 'submitted' (awaiting officer verification)
      const { data: milestones, error } = await supabase
        .from('milestones')
        .select(`
          *,
          contract:contracts(
            id,
            crop_type,
            farmer_id,
            farmer:farmers(
              name,
              wallet_address,
              location_address
            )
          )
        `)
        .eq('status', 'submitted')
        .order('completed_date', { ascending: true });

      if (error) throw error;

      // Transform to verification tasks
      const tasks: MilestoneVerificationTask[] = (milestones || []).map((m: any) => ({
        id: m.id,
        milestone: m,
        submitted_date: m.completed_date || m.created_at,
        priority: calculatePriority(m),
      }));

      // If no data from DB, use demo data
      if (tasks.length === 0) {
        setPendingVerifications(DEMO_VERIFICATIONS);
      } else {
        setPendingVerifications(tasks);
      }

      // Load verification history
      const { data: historyData, error: historyError } = await supabase
        .from('milestones')
        .select(`
          *,
          contract:contracts(
            crop_type,
            farmer:farmers(name)
          ),
          evidence(*)
        `)
        .in('status', ['verified', 'rejected'])
        .order('updated_at', { ascending: false })
        .limit(10);

      if (!historyError && historyData && historyData.length > 0) {
        const historyItems: VerificationHistory[] = historyData.map((m: any) => ({
          id: m.id,
          type: 'milestone',
          crop_type: m.contract?.crop_type || 'Unknown',
          farmer_name: m.contract?.farmer?.name || 'Unknown',
          status: m.status === 'verified' ? 'approved' : 'rejected',
          verified_date: new Date(m.updated_at).toLocaleDateString(),
          notes: m.evidence?.[0]?.metadata?.notes || '',
          fee_earned: 50,
        }));
        setHistory(historyItems);
      } else {
        setHistory(DEMO_HISTORY);
      }
    } catch (error: any) {
      console.error('Error loading verifications:', error?.message || error);
      // Use demo data on error
      setPendingVerifications(DEMO_VERIFICATIONS);
      setHistory(DEMO_HISTORY);
    } finally {
      setLoading(false);
    }
  };

  const calculatePriority = (milestone: any): "high" | "medium" | "low" => {
    const daysOld = Math.floor(
      (Date.now() - new Date(milestone.completed_date || milestone.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysOld > 3) return 'high';
    if (daysOld > 1) return 'medium';
    return 'low';
  };

  const handleVerificationComplete = () => {
    setShowVerificationModal(false);
    setSelectedVerification(null);
    loadVerifications(); // Reload the list
  };

  const filteredVerifications = pendingVerifications.filter(v => {
    const cropType = v.milestone.contract?.crop_type || '';
    const farmerName = v.milestone.contract?.farmer?.name || '';
    const matchesSearch = cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    pending: pendingVerifications.length,
    approvedToday: history.filter(h => h.status === 'approved' && h.verified_date === new Date().toLocaleDateString()).length,
    totalEarnings: history.reduce((sum, h) => sum + h.fee_earned, 0),
    approvalRate: history.length > 0 ? Math.round((history.filter(h => h.status === 'approved').length / history.length) * 100) : 0,
    avgVerificationTime: "12 min",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Officer Dashboard</h1>
              <p className="text-gray-600 mt-1">Verify milestones and ensure quality standards</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Verified Officer</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6 border-b border-gray-200">
            {[
              { id: "pending", label: "Pending Verifications", icon: Clock, count: stats.pending },
              { id: "map", label: "Nearby Farms", icon: Navigation },
              { id: "history", label: "History", icon: FileText },
              { id: "stats", label: "Statistics", icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all relative ${
                    activeTab === tab.id
                      ? "text-green-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.id
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pending Verifications Tab */}
        {activeTab === "pending" && (
          <div className="space-y-6">
            {/* Wallet Balance - Top Row */}
            {evmAddress && (
              <div className="max-w-md">
                <WalletBalance walletAddress={evmAddress} userRole="officer" />
              </div>
            )}
            
            {/* Verification Queue - Full Width */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Verification Queue</h2>
                  <p className="text-sm text-gray-500 mt-1">Click on a task to start verification</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
                    />
                  </div>
                  <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    {filteredVerifications.length} pending
                  </span>
                </div>
              </div>

              {/* Verification Grid - Full Width */}
              {loading ? (
                <div className="text-center py-12">
                  <Clock className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading verification tasks...</p>
                </div>
              ) : filteredVerifications.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">All Caught Up!</h3>
                  <p className="text-sm text-gray-600">No pending verifications</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredVerifications.map((verification, index) => (
                    <motion.button
                      key={verification.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -4 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedVerification(verification);
                        setShowVerificationModal(true);
                      }}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        selectedVerification?.id === verification.id
                          ? "border-green-500 bg-green-50 shadow-lg"
                          : "border-gray-200 hover:border-green-300 hover:shadow-md bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          verification.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : verification.priority === "medium"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {verification.priority}
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          K{verification.milestone.paymentAmount?.toLocaleString() || 0}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{verification.milestone.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{verification.milestone.contract?.farmer?.name || 'Unknown Farmer'}</p>
                      <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full mb-3">
                        {verification.milestone.contract?.crop_type || 'Unknown Crop'}
                      </span>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(verification.submitted_date).toLocaleDateString()}
                        </span>
                        <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          Verify
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map Tab - Nearby Farms */}
        {activeTab === "map" && (
          <VerificationMap 
            onSelectRequest={(request) => {
              // Reload verifications when a request is accepted
              loadVerifications();
            }}
          />
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Verification History</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {history.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{item.crop_type}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Farmer: {item.farmer_name}
                      </p>
                      <p className="text-sm text-gray-500">{item.notes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        +K{item.fee_earned}
                      </p>
                      <p className="text-sm text-gray-500">{item.verified_date}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-600 mt-1">Pending Verifications</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.approvedToday}</p>
                <p className="text-sm text-gray-600 mt-1">Approved Today</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">K{stats.totalEarnings}</p>
                <p className="text-sm text-gray-600 mt-1">Total Earnings</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.approvalRate}%</p>
                <p className="text-sm text-gray-600 mt-1">Approval Rate</p>
              </motion.div>
            </div>

            {/* Performance Card */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Excellent Performance!</h3>
                  <p className="text-green-100">You're in the top 10% of officers</p>
                </div>
                <Award className="h-16 w-16 text-green-200" />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-green-100 text-sm mb-1">Avg. Time</p>
                  <p className="text-2xl font-bold">{stats.avgVerificationTime}</p>
                </div>
                <div>
                  <p className="text-green-100 text-sm mb-1">This Month</p>
                  <p className="text-2xl font-bold">{history.length} verified</p>
                </div>
                <div>
                  <p className="text-green-100 text-sm mb-1">Rating</p>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-300 fill-current mr-1" />
                    <p className="text-2xl font-bold">4.9</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Officer Verification Modal */}
      {selectedVerification && (
        <OfficerVerificationModal
          isOpen={showVerificationModal}
          onCloseAction={() => {
            setShowVerificationModal(false);
            setSelectedVerification(null);
          }}
          milestone={selectedVerification.milestone}
          onVerificationCompleteAction={handleVerificationComplete}
        />
      )}
    </div>
  );
}
