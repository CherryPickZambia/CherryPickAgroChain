"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle, XCircle, Clock, Eye, Image as ImageIcon, FileText,
  TrendingUp, Award, AlertCircle, Filter, Search, Calendar,
  MapPin, User, Package, DollarSign, Star, ChevronRight, Download
} from "lucide-react";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import toast from "react-hot-toast";

interface PendingVerification {
  id: string;
  type: "listing" | "quality" | "delivery" | "dispute";
  listing_id?: string;
  order_id?: string;
  farmer_name: string;
  farmer_address: string;
  crop_type: string;
  quantity: number;
  price: number;
  location: string;
  harvest_date: string;
  quality_grade: string;
  images: string[];
  description: string;
  certifications: string[];
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
  const [activeTab, setActiveTab] = useState<"pending" | "history" | "stats">("pending");
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [history, setHistory] = useState<VerificationHistory[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - replace with Supabase queries
  useEffect(() => {
    loadVerifications();
  }, [evmAddress]);

  const loadVerifications = () => {
    const mockPending: PendingVerification[] = [
      {
        id: "V1",
        type: "listing",
        listing_id: "L1",
        farmer_name: "John Mwale",
        farmer_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        crop_type: "Mangoes",
        quantity: 500,
        price: 18,
        location: "Lusaka, Zambia",
        harvest_date: "2024-12-15",
        quality_grade: "Premium",
        images: ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80"],
        description: "Premium Kent mangoes, organically grown without pesticides. Ready for harvest in December.",
        certifications: ["Organic", "GlobalGAP"],
        submitted_date: "2024-11-07",
        priority: "high",
      },
      {
        id: "V2",
        type: "listing",
        listing_id: "L2",
        farmer_name: "Mary Banda",
        farmer_address: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
        crop_type: "Tomatoes",
        quantity: 1000,
        price: 12,
        location: "Kabwe, Zambia",
        harvest_date: "2024-11-20",
        quality_grade: "Grade A",
        images: ["https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80"],
        description: "Fresh Roma tomatoes, perfect for processing and canning.",
        certifications: ["HACCP"],
        submitted_date: "2024-11-06",
        priority: "medium",
      },
      {
        id: "V3",
        type: "quality",
        order_id: "O1",
        farmer_name: "Peter Phiri",
        farmer_address: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8",
        crop_type: "Pineapples",
        quantity: 300,
        price: 20,
        location: "Kitwe, Zambia",
        harvest_date: "2024-11-10",
        quality_grade: "Premium",
        images: ["https://images.unsplash.com/photo-1550828520-4cb496926fc9?w=800&q=80"],
        description: "Quality check requested for pineapple delivery.",
        certifications: ["Organic"],
        submitted_date: "2024-11-07",
        priority: "high",
      },
    ];

    const mockHistory: VerificationHistory[] = [
      {
        id: "H1",
        type: "listing",
        crop_type: "Cashew Nuts",
        farmer_name: "Sarah Phiri",
        status: "approved",
        verified_date: "2024-11-05",
        notes: "Excellent quality, all documentation in order",
        fee_earned: 50,
      },
      {
        id: "H2",
        type: "listing",
        crop_type: "Avocados",
        farmer_name: "James Mwamba",
        status: "approved",
        verified_date: "2024-11-04",
        notes: "Good quality, meets standards",
        fee_earned: 50,
      },
      {
        id: "H3",
        type: "quality",
        crop_type: "Mangoes",
        farmer_name: "Alice Banda",
        status: "rejected",
        verified_date: "2024-11-03",
        notes: "Quality below stated grade, requested re-grading",
        fee_earned: 25,
      },
    ];

    setPendingVerifications(mockPending);
    setHistory(mockHistory);
  };

  const stats = {
    pending: pendingVerifications.length,
    approvedToday: 5,
    totalEarnings: 1250,
    approvalRate: 92,
    avgVerificationTime: "12 min",
  };

  const handleApprove = async (verification: PendingVerification) => {
    try {
      // TODO: Update Supabase
      toast.success(`${verification.crop_type} listing approved!`);
      setPendingVerifications(prev => prev.filter(v => v.id !== verification.id));
      setSelectedVerification(null);
      setVerificationNotes("");
    } catch (error) {
      toast.error("Failed to approve verification");
    }
  };

  const handleReject = async (verification: PendingVerification) => {
    if (!verificationNotes.trim()) {
      toast.error("Please provide rejection notes");
      return;
    }
    try {
      // TODO: Update Supabase
      toast.success(`${verification.crop_type} listing rejected`);
      setPendingVerifications(prev => prev.filter(v => v.id !== verification.id));
      setSelectedVerification(null);
      setVerificationNotes("");
    } catch (error) {
      toast.error("Failed to reject verification");
    }
  };

  const filteredVerifications = pendingVerifications.filter(v => {
    const matchesType = filterType === "all" || v.type === filterType;
    const matchesSearch = v.crop_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.farmer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Officer Dashboard</h1>
              <p className="text-gray-600 mt-1">Verify listings and ensure quality standards</p>
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
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Verification Queue */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Verification Queue</h2>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    {filteredVerifications.length} pending
                  </span>
                </div>

                {/* Filters */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Types</option>
                    <option value="listing">New Listings</option>
                    <option value="quality">Quality Checks</option>
                    <option value="delivery">Delivery Verification</option>
                    <option value="dispute">Disputes</option>
                  </select>
                </div>

                {/* Verification List */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredVerifications.map((verification, index) => (
                    <motion.button
                      key={verification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedVerification(verification)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedVerification?.id === verification.id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-green-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{verification.crop_type}</h3>
                          <p className="text-sm text-gray-600">{verification.farmer_name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          verification.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : verification.priority === "medium"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {verification.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center">
                          <Package className="h-3 w-3 mr-1" />
                          {verification.quantity} kg
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {verification.submitted_date}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {verification.type}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Verification Details */}
            <div className="lg:col-span-2">
              {selectedVerification ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedVerification.crop_type}
                        </h2>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {selectedVerification.farmer_name}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {selectedVerification.location}
                          </div>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-lg font-medium ${
                        selectedVerification.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : selectedVerification.priority === "medium"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {selectedVerification.priority} priority
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Images */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <ImageIcon className="h-5 w-5 mr-2" />
                        Product Images
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedVerification.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`${selectedVerification.crop_type} ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <button className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                              <Eye className="h-8 w-8 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Quantity</h4>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedVerification.quantity} kg
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Price per kg</h4>
                        <p className="text-lg font-semibold text-gray-900">
                          K{selectedVerification.price}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Quality Grade</h4>
                        <span className="inline-flex px-3 py-1 bg-green-100 text-green-700 rounded-lg font-medium">
                          {selectedVerification.quality_grade}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Harvest Date</h4>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedVerification.harvest_date}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedVerification.description}
                      </p>
                    </div>

                    {/* Certifications */}
                    {selectedVerification.certifications.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Certifications</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedVerification.certifications.map((cert, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Farmer Info */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Farmer Wallet</h4>
                      <p className="text-sm font-mono text-gray-700 break-all">
                        {selectedVerification.farmer_address}
                      </p>
                    </div>

                    {/* Verification Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Notes
                      </label>
                      <textarea
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        rows={4}
                        placeholder="Add notes about this verification..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleApprove(selectedVerification)}
                        className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>Approve & Earn K50</span>
                      </button>
                      <button
                        onClick={() => handleReject(selectedVerification)}
                        className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="h-5 w-5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                  <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Select a Verification
                  </h3>
                  <p className="text-gray-600">
                    Choose a pending verification from the queue to review
                  </p>
                </div>
              )}
            </div>
          </div>
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
                  <p className="text-2xl font-bold">47 verified</p>
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
    </div>
  );
}
