"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, MapPin, Phone, Mail, Calendar, FileText, CheckCircle2, 
  Clock, DollarSign, TrendingUp, Leaf, Package, Award, 
  ChevronRight, ExternalLink, User, Landmark
} from "lucide-react";

interface FarmerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  wallet: string;
  location: string;
  locationLat: number;
  locationLng: number;
  farmSize: number;
  crops: string[];
  joined: string;
  verified: boolean;
  contracts: ContractData[];
  totalEarnings: number;
  completedMilestones: number;
  pendingMilestones: number;
}

interface ContractData {
  id: string;
  cropType: string;
  status: "active" | "completed" | "pending";
  value: number;
  milestones: MilestoneData[];
  createdAt: string;
  harvestDate: string;
}

interface MilestoneData {
  id: string;
  name: string;
  status: "pending" | "submitted" | "verified" | "rejected";
  payment: number;
  dueDate: string;
}

interface FarmerDetailModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  farmer: FarmerData | null;
}

export default function FarmerDetailModal({ isOpen, onCloseAction, farmer }: FarmerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "contracts" | "map">("overview");

  if (!farmer) return null;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "contracts", label: "Contracts" },
    { id: "map", label: "Farm Location" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseAction}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white">
                <button
                  onClick={onCloseAction}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-bold">
                    {farmer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">{farmer.name}</h2>
                      {farmer.verified && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-emerald-100">
                      <span className="flex items-center gap-1 text-sm">
                        <MapPin className="h-4 w-4" />
                        {farmer.location}
                      </span>
                      <span className="flex items-center gap-1 text-sm">
                        <Landmark className="h-4 w-4" />
                        {farmer.farmSize} hectares
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  {[
                    { label: "Total Earnings", value: `K${farmer.totalEarnings.toLocaleString()}`, icon: DollarSign },
                    { label: "Contracts", value: farmer.contracts.length, icon: FileText },
                    { label: "Completed", value: farmer.completedMilestones, icon: CheckCircle2 },
                    { label: "Pending", value: farmer.pendingMilestones, icon: Clock },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                      <stat.icon className="h-5 w-5 mx-auto mb-1 opacity-80" />
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-xs opacity-80">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-100 px-6">
                <div className="flex gap-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-3 font-medium text-sm relative transition-colors ${
                        activeTab === tab.id
                          ? "text-emerald-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Contact Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{farmer.email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{farmer.phone}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Joined {farmer.joined}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h4 className="font-semibold text-gray-900 mb-3">Wallet Address</h4>
                        <p className="text-xs font-mono text-gray-600 break-all bg-white p-2 rounded-lg border">
                          {farmer.wallet}
                        </p>
                        <div className="mt-3">
                          <h4 className="font-semibold text-gray-900 mb-2">Crops Grown</h4>
                          <div className="flex flex-wrap gap-2">
                            {farmer.crops.map((crop, i) => (
                              <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                {crop}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Recent Contracts</h4>
                      <div className="space-y-3">
                        {farmer.contracts.slice(0, 3).map((contract) => (
                          <div key={contract.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <Leaf className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{contract.cropType}</p>
                                <p className="text-sm text-gray-500">{contract.milestones.length} milestones</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">K{contract.value.toLocaleString()}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                contract.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                contract.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {contract.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "contracts" && (
                  <div className="space-y-4">
                    {farmer.contracts.map((contract) => (
                      <div key={contract.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="p-4 bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-emerald-600" />
                            <div>
                              <p className="font-semibold text-gray-900">{contract.cropType}</p>
                              <p className="text-sm text-gray-500">Created {contract.createdAt}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            contract.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                            contract.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {contract.status}
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="mb-3 flex items-center justify-between text-sm">
                            <span className="text-gray-500">Contract Value</span>
                            <span className="font-bold text-gray-900">K{contract.value.toLocaleString()}</span>
                          </div>
                          <div className="space-y-2">
                            {contract.milestones.map((milestone, i) => (
                              <div key={milestone.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  milestone.status === 'verified' ? 'bg-emerald-500 text-white' :
                                  milestone.status === 'submitted' ? 'bg-amber-500 text-white' :
                                  milestone.status === 'rejected' ? 'bg-red-500 text-white' :
                                  'bg-gray-200 text-gray-600'
                                }`}>
                                  {i + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{milestone.name}</p>
                                  <p className="text-xs text-gray-500">Due: {milestone.dueDate}</p>
                                </div>
                                <span className="text-sm font-semibold text-gray-700">K{milestone.payment}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "map" && (
                  <div className="space-y-4">
                    <div className="aspect-video bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl relative overflow-hidden">
                      {/* Simplified map visualization */}
                      <div className="absolute inset-0 opacity-20">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          {[...Array(10)].map((_, i) => (
                            <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="#059669" strokeWidth="0.2" />
                          ))}
                          {[...Array(10)].map((_, i) => (
                            <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="#059669" strokeWidth="0.2" />
                          ))}
                        </svg>
                      </div>
                      
                      {/* Farm area visualization */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                          <div className="w-32 h-32 bg-emerald-200/50 rounded-full absolute -inset-4 animate-pulse" />
                          <div className="w-24 h-24 bg-emerald-300/60 rounded-lg rotate-12 border-2 border-emerald-500 border-dashed" />
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-8 h-8 bg-emerald-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
                        <p className="text-xs text-gray-500">Farm Location</p>
                        <p className="font-semibold text-gray-900">{farmer.location}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {farmer.locationLat.toFixed(4)}°, {farmer.locationLng.toFixed(4)}°
                        </p>
                      </div>

                      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
                        <p className="text-xs text-gray-500">Farm Size</p>
                        <p className="font-semibold text-gray-900">{farmer.farmSize} hectares</p>
                        <p className="text-xs text-emerald-600 mt-1">≈ {(farmer.farmSize * 2.47).toFixed(1)} acres</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50 rounded-xl">
                        <Award className="h-6 w-6 text-emerald-600 mb-2" />
                        <p className="font-semibold text-gray-900">Land Verified</p>
                        <p className="text-sm text-gray-600">Farm boundaries confirmed by extension officer</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <Leaf className="h-6 w-6 text-blue-600 mb-2" />
                        <p className="font-semibold text-gray-900">Active Crops</p>
                        <p className="text-sm text-gray-600">{farmer.crops.join(", ")}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
