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
import CropDiagnostics from "./CropDiagnostics";
import { supabase } from "@/lib/supabase";
import type { Milestone } from "@/lib/types";
import { dc } from "@/lib/dashboardTheme";

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

  // Load milestone verification tasks from Supabase
  useEffect(() => {
    loadVerifications();
  }, [evmAddress]);

  const loadVerifications = async () => {
    try {
      setLoading(true);

      // Check if Supabase is available
      if (!supabase) {
        setPendingVerifications([]);
        setHistory([]);
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

      // Transform to verification tasks (only milestones that still have a contract).
      // The DB stores the value as `payment_amount`; map it to the `paymentAmount`
      // field the UI expects so the value isn't shown as K0.
      const tasks: MilestoneVerificationTask[] = (milestones || [])
        .filter((m: any) => m && m.contract)
        .map((m: any) => ({
          id: m.id as string,
          milestone: {
            ...m,
            paymentAmount: Number(m.payment_amount ?? m.paymentAmount ?? 0),
          } as MilestoneVerificationTask['milestone'],
          submitted_date: (m.completed_date as string) || (m.created_at as string),
          priority: calculatePriority(m),
        }));

      // Surface the most urgent work first: sort by priority (high → low),
      // then oldest submission within the same priority band.
      const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
      tasks.sort((a, b) => {
        const pr = (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3);
        if (pr !== 0) return pr;
        return new Date(a.submitted_date || 0).getTime() - new Date(b.submitted_date || 0).getTime();
      });

      setPendingVerifications(tasks);

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
          id: m.id as string,
          type: 'milestone',
          crop_type: (m.contract?.crop_type as string) || 'Unknown',
          farmer_name: (m.contract?.farmer?.name as string) || 'Unknown',
          status: m.status === 'verified' ? 'approved' : 'rejected',
          verified_date: new Date(m.updated_at).toLocaleDateString(),
          notes: (m.evidence?.[0]?.metadata?.notes as string) || '',
          fee_earned: 50,
        }));
        setHistory(historyItems);
      } else {
        setHistory([]);
      }
    } catch (error: unknown) {
      console.error('Error loading verifications:', error instanceof Error ? error.message : JSON.stringify(error));
      setPendingVerifications([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const calculatePriority = (milestone: any): "high" | "medium" | "low" => {
    const dateStr = (milestone.completed_date || milestone.created_at) as string;
    const daysOld = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
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
    const cropType = v.milestone?.contract?.crop_type || '';
    const farmerName = v.milestone?.contract?.farmer?.name || '';
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
    <div className="min-h-screen dashboard-shell" style={{ background: "#F7F9FB" }}>
      {/* Header - ARKTOS */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", marginBottom: 8 }}>Verification Officer Portal v1.0</div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.5rem)", lineHeight: 0.95, letterSpacing: "-0.03em", color: "#0C2D3A" }}>
                OFFICER DASHBOARD
              </h1>
            </div>
            <div className="flex items-center space-x-3 px-4 py-2 rounded-2xl" style={{ background: "#F7F9FB", border: "1px solid rgba(12,45,58,0.08)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#0C2D3A" }}>
                <Award className="h-4 w-4" style={{ color: "#BFFF00" }} />
              </div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "#0C2D3A" }}>Verified Officer</span>
            </div>
          </div>

          {/* Tabs - ARKTOS */}
          <div className="flex space-x-1 mt-6 border-b border-gray-100">
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
                  onClick={() => setActiveTab(tab.id as "pending" | "map" | "history" | "stats")}
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                  className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all relative ${activeTab === tab.id
                    ? "text-[#0C2D3A]"
                    : "text-[#5A7684] hover:text-[#0C2D3A]"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id
                      ? "text-[#0C2D3A]"
                      : "text-[#5A7684]"
                      }`} style={{ background: activeTab === tab.id ? "rgba(191,255,0,0.2)" : "rgba(12,45,58,0.05)" }}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: "#BFFF00" }}
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
            {/* Wallet Balance & AI Diagnostics - Top Row */}
            {evmAddress && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WalletBalance walletAddress={evmAddress} userRole="officer" />
                <CropDiagnostics
                  onDiagnosisComplete={(result, imageUrl) => {
                    console.log('Officer AI Diagnosis:', result);
                    toast.success(`AI Analysis: ${result.diagnosis} - ${result.healthScore}% health`);
                  }}
                />
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
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
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
                      className={`text-left p-4 rounded-xl border-2 transition-all ${selectedVerification?.id === verification.id
                        ? "border-emerald-500 bg-emerald-50 shadow-lg"
                        : "border-gray-200 hover:border-emerald-300 hover:shadow-md bg-white"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${verification.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : verification.priority === "medium"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                          }`}>
                          {verification.priority}
                        </span>
                        <span className="text-lg font-bold text-emerald-600">
                          K{verification.milestone?.paymentAmount?.toLocaleString() || 0}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{verification.milestone?.name || 'Milestone'}</h3>
                      <p className="text-sm text-gray-600 mb-2">{verification.milestone?.contract?.farmer?.name || 'Unknown Farmer'}</p>
                      <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full mb-3">
                        {verification.milestone?.contract?.crop_type || 'Unknown Crop'}
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
              {history.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No verification history yet</p>
                </div>
              )}
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
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
                      <p className="text-lg font-bold text-emerald-600">
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
              {[
                { icon: Clock, value: stats.pending, label: "Pending Verifications", delay: 0 },
                { icon: CheckCircle, value: stats.approvedToday, label: "Approved Today", delay: 0.1 },
                { icon: DollarSign, value: `K${stats.totalEarnings}`, label: "Total Earnings", delay: 0.2 },
                { icon: TrendingUp, value: `${stats.approvalRate}%`, label: "Approval Rate", delay: 0.3 },
              ].map(({ icon: Icon, value, label, delay }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay }}
                  className={dc.statCard}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={dc.iconBoxLime}>
                      <Icon className={dc.iconLime} />
                    </div>
                  </div>
                  <p className={dc.value}>{value}</p>
                  <p className={dc.labelSm + " mt-1"}>{label}</p>
                </motion.div>
              ))}
            </div>

            {/* Performance Card */}
            <div className="rounded-2xl p-8 text-white border border-[#0C2D3A]/20" style={{ background: "linear-gradient(135deg, #0C2D3A 0%, #1a4050 100%)" }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Excellent Performance!</h3>
                  <p className="text-[#94B3C1]">You&apos;re in the top 10% of officers</p>
                </div>
                <Award className="h-16 w-16 text-[#BFFF00]" />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-[#94B3C1] text-sm mb-1">Avg. Time</p>
                  <p className="text-2xl font-bold">{stats.avgVerificationTime}</p>
                </div>
                <div>
                  <p className="text-[#94B3C1] text-sm mb-1">This Month</p>
                  <p className="text-2xl font-bold">{history.length} verified</p>
                </div>
                <div>
                  <p className="text-[#94B3C1] text-sm mb-1">Rating</p>
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
          officerId={evmAddress || undefined}
          officerWallet={evmAddress || undefined}
        />
      )}
    </div>
  );
}
