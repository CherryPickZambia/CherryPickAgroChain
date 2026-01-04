"use client";

import { useState, useEffect } from "react";
import { 
  Users, FileText, TrendingUp, DollarSign, Activity, ArrowUp, ArrowDown,
  MapPin, Clock, CheckCircle2, Settings, Package, Search, Plus, Sun, Menu, 
  ShoppingBag, User, UserPlus, Shield, XCircle, AlertCircle, Eye, 
  MoreVertical, Filter, Download, Calendar, Leaf, Globe, Phone, Mail,
  ChevronRight, ExternalLink, Landmark, Award, BarChart3, PieChart,
  Wallet, Zap, Target, RefreshCw
} from "lucide-react";
import { promoteToOfficer, demoteOfficer, isOfficer } from "./Dashboard";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getUsersByRole } from "@/lib/supabaseService";
import AdminApprovalModal from "./AdminApprovalModal";
import { getVerificationEvidence } from "@/lib/ipfsService";
import { STANDARD_MILESTONES, payMilestoneApproval, getUSDCBalance, calculateVerifierFee, getVerifierFeeBreakdown } from "@/lib/blockchain/contractInteractions";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RePieChart, Pie, Cell } from "recharts";
import FarmerDetailModal from "./FarmerDetailModal";
import NewJobModal, { JobData } from "./NewJobModal";
import FarmMap from "./FarmMap";
import AdminCreateContractModal from "./AdminCreateContractModal";

// Sample jobs data
const SAMPLE_JOBS: JobData[] = [
  { id: "job-1", title: "Harrowing Season", description: "Prepare land for next planting", jobType: "harrowing", farmLocation: "ABY Farm - Bay Land", dueDate: "2024-12-05", priority: "high", status: "pending", createdAt: new Date().toISOString() },
  { id: "job-2", title: "Harrowing Season", description: "Prepare land for next planting", jobType: "harrowing", farmLocation: "YNS Farm - ARD Land", dueDate: "2024-12-08", priority: "medium", status: "pending", createdAt: new Date().toISOString() },
];

// Comprehensive sample data for demo
const SAMPLE_FARMERS = [
  { 
    id: "1", 
    wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f8E2B1", 
    name: "John Mwale", 
    email: "john@farm.zm",
    phone: "+260 97 123 4567",
    role: "farmer", 
    location: "Lusaka", 
    locationLat: -15.4167,
    locationLng: 28.2833,
    farmSize: 12.5,
    crops: ["Mangoes", "Tomatoes"],
    joined: "Oct 15, 2024", 
    verified: true,
    totalEarnings: 45000,
    completedMilestones: 8,
    pendingMilestones: 2,
    contracts: [
      { id: "c1", cropType: "Mangoes", status: "active" as const, value: 25000, createdAt: "Oct 20, 2024", harvestDate: "Jan 15, 2025", milestones: [
        { id: "m1", name: "Land Preparation", status: "verified" as const, payment: 5000, dueDate: "Oct 25" },
        { id: "m2", name: "Planting Complete", status: "verified" as const, payment: 7500, dueDate: "Nov 10" },
        { id: "m3", name: "Flowering Stage", status: "submitted" as const, payment: 5000, dueDate: "Dec 15" },
        { id: "m4", name: "Harvest Ready", status: "pending" as const, payment: 7500, dueDate: "Jan 15" },
      ]},
      { id: "c2", cropType: "Tomatoes", status: "completed" as const, value: 20000, createdAt: "Aug 10, 2024", harvestDate: "Oct 5, 2024", milestones: [
        { id: "m5", name: "Land Preparation", status: "verified" as const, payment: 5000, dueDate: "Aug 15" },
        { id: "m6", name: "Seedling Stage", status: "verified" as const, payment: 5000, dueDate: "Sep 1" },
        { id: "m7", name: "Harvest Complete", status: "verified" as const, payment: 10000, dueDate: "Oct 5" },
      ]},
    ]
  },
  { 
    id: "2", 
    wallet: "0x8ba1F109551bD432803012645Ac136ddd64DBA72", 
    name: "Mary Banda", 
    email: "mary@farm.zm",
    phone: "+260 96 234 5678",
    role: "farmer", 
    location: "Kabwe", 
    locationLat: -14.4469,
    locationLng: 28.4464,
    farmSize: 8.2,
    crops: ["Pineapples", "Cashews"],
    joined: "Oct 20, 2024", 
    verified: true,
    totalEarnings: 32000,
    completedMilestones: 5,
    pendingMilestones: 3,
    contracts: [
      { id: "c3", cropType: "Pineapples", status: "active" as const, value: 18000, createdAt: "Nov 1, 2024", harvestDate: "Feb 20, 2025", milestones: [
        { id: "m8", name: "Land Preparation", status: "verified" as const, payment: 4000, dueDate: "Nov 5" },
        { id: "m9", name: "Planting Complete", status: "submitted" as const, payment: 6000, dueDate: "Nov 20" },
        { id: "m10", name: "Growth Stage", status: "pending" as const, payment: 4000, dueDate: "Jan 10" },
        { id: "m11", name: "Harvest Ready", status: "pending" as const, payment: 4000, dueDate: "Feb 20" },
      ]},
    ]
  },
  { 
    id: "3", 
    wallet: "0x9f2dF0fed2C77648de5860a4dc508cd0572B6C1a", 
    name: "Peter Phiri", 
    email: "peter@farm.zm",
    phone: "+260 95 345 6789",
    role: "farmer", 
    location: "Kitwe", 
    locationLat: -12.8024,
    locationLng: 28.2132,
    farmSize: 15.0,
    crops: ["Bananas", "Beetroot"],
    joined: "Oct 25, 2024", 
    verified: false,
    totalEarnings: 0,
    completedMilestones: 0,
    pendingMilestones: 4,
    contracts: [
      { id: "c4", cropType: "Bananas", status: "pending" as const, value: 22000, createdAt: "Nov 10, 2024", harvestDate: "Mar 15, 2025", milestones: [
        { id: "m12", name: "Land Preparation", status: "pending" as const, payment: 5000, dueDate: "Nov 15" },
        { id: "m13", name: "Planting Complete", status: "pending" as const, payment: 7000, dueDate: "Dec 1" },
        { id: "m14", name: "Growth Stage", status: "pending" as const, payment: 5000, dueDate: "Feb 1" },
        { id: "m15", name: "Harvest Ready", status: "pending" as const, payment: 5000, dueDate: "Mar 15" },
      ]},
    ]
  },
  { 
    id: "7", 
    wallet: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b", 
    name: "David Tembo", 
    email: "david@farm.zm",
    phone: "+260 97 456 7890",
    role: "farmer", 
    location: "Chipata", 
    locationLat: -13.6333,
    locationLng: 32.6500,
    farmSize: 20.0,
    crops: ["Cashews", "Mangoes"],
    joined: "Sep 10, 2024", 
    verified: true,
    totalEarnings: 68000,
    completedMilestones: 12,
    pendingMilestones: 2,
    contracts: [
      { id: "c5", cropType: "Cashews", status: "active" as const, value: 35000, createdAt: "Sep 15, 2024", harvestDate: "Jan 30, 2025", milestones: [
        { id: "m16", name: "Land Preparation", status: "verified" as const, payment: 8000, dueDate: "Sep 20" },
        { id: "m17", name: "Planting Complete", status: "verified" as const, payment: 10000, dueDate: "Oct 5" },
        { id: "m18", name: "Growth Stage", status: "verified" as const, payment: 7000, dueDate: "Nov 30" },
        { id: "m19", name: "Harvest Ready", status: "pending" as const, payment: 10000, dueDate: "Jan 30" },
      ]},
    ]
  },
  { 
    id: "8", 
    wallet: "0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c", 
    name: "Agnes Mulenga", 
    email: "agnes@farm.zm",
    phone: "+260 96 567 8901",
    role: "farmer", 
    location: "Livingstone", 
    locationLat: -17.8419,
    locationLng: 25.8544,
    farmSize: 6.5,
    crops: ["Tomatoes", "Beetroot"],
    joined: "Nov 1, 2024", 
    verified: true,
    totalEarnings: 18000,
    completedMilestones: 3,
    pendingMilestones: 1,
    contracts: [
      { id: "c6", cropType: "Tomatoes", status: "active" as const, value: 12000, createdAt: "Nov 5, 2024", harvestDate: "Feb 10, 2025", milestones: [
        { id: "m20", name: "Land Preparation", status: "verified" as const, payment: 3000, dueDate: "Nov 10" },
        { id: "m21", name: "Planting Complete", status: "verified" as const, payment: 4000, dueDate: "Nov 25" },
        { id: "m22", name: "Growth Stage", status: "submitted" as const, payment: 2500, dueDate: "Jan 10" },
        { id: "m23", name: "Harvest Ready", status: "pending" as const, payment: 2500, dueDate: "Feb 10" },
      ]},
    ]
  },
];

const SAMPLE_USERS = [
  ...SAMPLE_FARMERS,
  { id: "4", wallet: "0x3c8a2b7e9F1dE6Ca4B5a3e7d9C1f2A8b4D6e5F7a", name: "Sarah Phiri", email: "sarah@buyer.zm", phone: "+260 97 111 2222", role: "buyer", location: "Ndola", locationLat: -12.9587, locationLng: 28.6366, farmSize: 0, crops: [], joined: "Nov 1, 2024", verified: true, totalEarnings: 0, completedMilestones: 0, pendingMilestones: 0, contracts: [] },
  { id: "5", wallet: "0x5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e", name: "James Mwamba", email: "james@buyer.zm", phone: "+260 96 333 4444", role: "buyer", location: "Lusaka", locationLat: -15.3875, locationLng: 28.3228, farmSize: 0, crops: [], joined: "Nov 5, 2024", verified: true, totalEarnings: 0, completedMilestones: 0, pendingMilestones: 0, contracts: [] },
  { id: "6", wallet: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", name: "Grace Zulu", email: "grace@verify.zm", phone: "+260 95 555 6666", role: "officer", location: "Lusaka", locationLat: -15.4000, locationLng: 28.3000, farmSize: 0, crops: [], joined: "Sep 15, 2024", verified: true, totalEarnings: 0, completedMilestones: 0, pendingMilestones: 0, contracts: [] },
];

// Map marker positions (Zambia-centric)
const MAP_POSITIONS = {
  "Lusaka": { x: 55, y: 65 },
  "Kabwe": { x: 54, y: 52 },
  "Kitwe": { x: 48, y: 38 },
  "Ndola": { x: 50, y: 40 },
  "Livingstone": { x: 40, y: 85 },
  "Chipata": { x: 80, y: 55 },
  "Mansa": { x: 52, y: 30 },
};

// Pending verification interface
interface PendingVerification {
  id: string;
  milestone_id: string;
  milestone_name: string;
  farmer_name: string;
  farmer_wallet: string;
  crop_type: string;
  payment_amount: number; // USDC amount for farmer
  submitted_date: string;
  officer_name: string;
  officer_wallet: string; // Verifier wallet for payment
  evidence_images: string[];
  officer_notes: string;
  contract_id: string;
  blockchain_contract_id?: number;
  // For verifier fee calculation
  total_contract_value: number;
  total_milestones: number;
  custom_verifier_fee_percent?: number; // Admin can override
}

export default function AdminDashboard() {
  const [selectedView, setSelectedView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState(SAMPLE_USERS);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof SAMPLE_USERS[0] | null>(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<typeof SAMPLE_FARMERS[0] | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [jobs, setJobs] = useState<JobData[]>(SAMPLE_JOBS);
  const [showContractModal, setShowContractModal] = useState(false);
  
  // Pending verifications state
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  
  // Database officers state
  const [dbOfficers, setDbOfficers] = useState<any[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  
  const [contracts, setContracts] = useState([
    { id: "C001", farmer: "John Mwale", crop: "Mangoes", amount: "K15,000", status: "active", date: "2024-11-01" },
    { id: "C002", farmer: "Mary Banda", crop: "Tomatoes", amount: "K12,000", status: "active", date: "2024-11-03" },
    { id: "C003", farmer: "Peter Phiri", crop: "Pineapples", amount: "K8,500", status: "pending", date: "2024-11-05" },
    { id: "C004", farmer: "Sarah Phiri", crop: "Cashews", amount: "K10,000", status: "active", date: "2024-11-02" },
  ]);

  // Load pending verifications from database - milestones with status 'submitted'
  const loadPendingVerifications = async () => {
    setLoadingVerifications(true);
    try {
      console.log('Loading pending verifications from database...');
      
      if (!supabase) {
        console.log('Supabase not configured');
        setPendingVerifications([]);
        return;
      }

      // Get all milestones with status 'submitted' - these need admin approval
      const { data: submittedMilestones, error } = await supabase
        .from('milestones')
        .select(`
          id,
          name,
          description,
          payment_amount,
          status,
          completed_date,
          metadata,
          contract_id,
          contract:contracts(
            id,
            contract_code,
            crop_type,
            total_value,
            farmer_id,
            farmer:farmers(
              id,
              name,
              wallet_address
            )
          )
        `)
        .eq('status', 'submitted')
        .order('completed_date', { ascending: false });

      if (error) {
        console.error('Error loading submitted milestones:', error);
        throw error;
      }

      console.log('Submitted milestones from DB:', submittedMilestones);

      if (!submittedMilestones || submittedMilestones.length === 0) {
        console.log('No pending verifications found');
        setPendingVerifications([]);
        return;
      }

      // Get total milestone count for each contract
      const contractIds = [...new Set(submittedMilestones.map((m: any) => m.contract_id))];
      const { data: milestoneCounts } = await supabase
        .from('milestones')
        .select('contract_id')
        .in('contract_id', contractIds);

      const countByContract: Record<string, number> = {};
      milestoneCounts?.forEach((m: any) => {
        countByContract[m.contract_id] = (countByContract[m.contract_id] || 0) + 1;
      });

      // Transform to PendingVerification format
      const verifications: PendingVerification[] = submittedMilestones.map((milestone: any) => {
        const contract = milestone.contract;
        const farmer = contract?.farmer;
        const metadata = milestone.metadata || {};
        
        return {
          id: milestone.id,
          milestone_id: milestone.id,
          milestone_name: milestone.name,
          farmer_name: farmer?.name || 'Unknown Farmer',
          farmer_wallet: farmer?.wallet_address || '',
          crop_type: contract?.crop_type || 'Unknown',
          payment_amount: milestone.payment_amount || 0,
          submitted_date: milestone.completed_date || new Date().toISOString(),
          officer_name: metadata.officer_name || 'Verifier',
          officer_wallet: metadata.officer_wallet || '',
          evidence_images: metadata.images || [],
          officer_notes: metadata.notes || '',
          contract_id: milestone.contract_id,
          blockchain_contract_id: undefined,
          total_contract_value: contract?.total_value || 5000,
          total_milestones: countByContract[milestone.contract_id] || 4,
          custom_verifier_fee_percent: undefined,
        };
      });

      console.log('Processed verifications:', verifications);
      setPendingVerifications(verifications);
      
      toast.success(`Found ${verifications.length} milestone(s) awaiting approval`);
      
      // Log for debugging
      verifications.forEach(v => {
        console.log(`Pending: ${v.milestone_name} for ${v.farmer_name} - K${v.payment_amount} ZMW`);
      });
    } catch (error: any) {
      console.error('Error loading verifications:', error?.message || error);
      toast.error('Failed to load verifications');
      setPendingVerifications([]);
    } finally {
      setLoadingVerifications(false);
    }
  };

  // Load officers from database
  const loadOfficersFromDB = async () => {
    setLoadingOfficers(true);
    try {
      const officers = await getUsersByRole('officer');
      setDbOfficers(officers);
      console.log('Loaded officers from database:', officers);
    } catch (error) {
      console.error('Error loading officers:', error);
      toast.error('Failed to load officers from database');
    } finally {
      setLoadingOfficers(false);
    }
  };

  // Load verifications when view changes to verifications
  useEffect(() => {
    if (selectedView === 'verifications') {
      loadPendingVerifications();
    }
    if (selectedView === 'officers') {
      loadOfficersFromDB();
    }
  }, [selectedView]);

  // Handle creating a new job
  const handleCreateJob = (newJob: JobData) => {
    setJobs([newJob, ...jobs]);
  };

  // Handle creating a new contract
  const handleCreateContract = (contract: any) => {
    const newContract = {
      id: `C00${contracts.length + 1}`,
      farmer: contract.farmerName || "New Farmer",
      crop: contract.cropType,
      amount: `K${Number(contract.totalValue || 0).toLocaleString()}`,
      status: "pending",
      date: new Date().toISOString().split('T')[0],
    };
    setContracts([newContract, ...contracts]);
    setShowContractModal(false);
    toast.success("Contract created successfully!");
  };

  // Handle farmer card click
  const handleFarmerClick = (farmer: typeof SAMPLE_FARMERS[0]) => {
    setSelectedFarmer(farmer);
    setShowFarmerModal(true);
  };

  // Cost analysis data
  const costData = [
    { month: "Jan", cost: 150 },
    { month: "Feb", cost: 180 },
    { month: "Mar", cost: 220 },
    { month: "Apr", cost: 310 },
    { month: "May", cost: 280 },
    { month: "Jun", cost: 300 },
    { month: "Jul", cost: 350 },
    { month: "Aug", cost: 386.5 },
  ];

  // Crop distribution data
  const cropData = [
    { name: "Mangoes", value: 8500, percentage: 35, color: "#10b981" },
    { name: "Tomatoes", value: 6200, percentage: 28, color: "#f59e0b" },
    { name: "Pineapples", value: 4800, percentage: 22, color: "#ef4444" },
    { name: "Cashews", value: 3200, percentage: 15, color: "#8b5cf6" },
  ];

  const stats = {
    totalFarmers: { value: 156, subtitle: "Active Farmers" },
    activeContracts: { value: 89, subtitle: "Active Contracts" },
    marketplaceListings: { value: 234, subtitle: "Active Listings" },
    totalRevenue: { value: "K2.5M", subtitle: "Platform Revenue" },
  };

  const menuItems = [
    { icon: Activity, label: "Dashboard", id: "dashboard" },
    { icon: ShoppingBag, label: "Marketplace", id: "marketplace" },
    { icon: FileText, label: "Contracts", id: "contracts" },
    { icon: AlertCircle, label: "Verifications", id: "verifications" },
    { icon: Users, label: "Farmers", id: "farmers" },
    { icon: User, label: "Buyers", id: "buyers" },
    { icon: CheckCircle2, label: "Officers", id: "officers" },
    { icon: TrendingUp, label: "Analytics", id: "analytics" },
    { icon: DollarSign, label: "Payments", id: "payments" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  // Handle promoting a user to officer
  const handlePromoteToOfficer = (user: typeof SAMPLE_USERS[0]) => {
    try {
      promoteToOfficer(user.wallet);
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, role: "officer" } : u
      ));
      toast.success(`${user.name} has been promoted to Extension Officer!`);
      setShowPromoteModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error("Failed to promote user");
    }
  };

  // Handle demoting an officer
  const handleDemoteOfficer = (user: typeof SAMPLE_USERS[0]) => {
    try {
      demoteOfficer(user.wallet);
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, role: "farmer" } : u
      ));
      toast.success(`${user.name} has been demoted from Officer role.`);
    } catch (error) {
      toast.error("Failed to demote officer");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20"
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">▶</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Dashboard</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "marketplace") {
                    window.location.href = "/marketplace";
                  } else {
                    setSelectedView(item.id);
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-green-600" : "text-gray-400"}`} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-700">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {selectedView === "dashboard" && (
            <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Fields */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Farmers</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalFarmers.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.totalFarmers.subtitle}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </motion.div>

            {/* Jobs Active */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Contracts</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.activeContracts.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.activeContracts.subtitle}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </motion.div>

            {/* Jobs Due */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Marketplace Listings</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.marketplaceListings.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.marketplaceListings.subtitle}</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </motion.div>

            {/* Jobs Completed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Platform Revenue</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalRevenue.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.totalRevenue.subtitle}</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Map View */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="relative flex-1 mr-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button 
                  onClick={() => setShowNewJobModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-semibold">New Job</span>
                </button>
                <div className="ml-2 flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Sun className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">18°C</span>
                </div>
              </div>
              <div className="relative h-96 rounded-xl overflow-hidden">
                {/* Real Interactive Map */}
                <FarmMap />
              </div>
            </motion.div>

            {/* Crop Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Crop Distribution</h3>
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>2022</option>
                  <option>2023</option>
                  <option>2024</option>
                </select>
              </div>
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="24"
                      strokeDasharray="251 503"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="24"
                      strokeDasharray="78 503"
                      strokeDashoffset="-251"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="24"
                      strokeDasharray="52 503"
                      strokeDashoffset="-329"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="24"
                      strokeDasharray="34 503"
                      strokeDashoffset="-381"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-gray-800">54,862</p>
                    <p className="text-sm text-gray-500">Hectares</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {cropData.map((crop) => (
                  <div key={crop.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: crop.color }}></div>
                      <span className="text-sm font-medium text-gray-700">{crop.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">({crop.percentage}%)</p>
                      <p className="text-xs text-gray-500">{crop.value.toLocaleString()} Ha</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cost Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">Cost Analysis</h3>
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>Monthly</option>
                  <option>Weekly</option>
                  <option>Yearly</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-center">
                <div className="px-4 py-2 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">$386.50</p>
                </div>
              </div>
            </motion.div>

            {/* Recent Due Jobs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Recent Due Jobs</h3>
                <button className="text-sm text-green-600 hover:text-green-700 font-medium">See All</button>
              </div>
              <div className="space-y-3">
                {[
                  { title: "Harrowing Season", location: "ABY Farm - Bay Land" },
                  { title: "Harrowing Season", location: "YNS Farm - ARD Land" },
                ].map((job, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{job.location}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Upgrade Banner */}
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-1">Platform Health</p>
                    <p className="text-xs text-gray-600">All systems operational</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">Active</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          </>
          )}

          {/* Verifications View */}
          {selectedView === "verifications" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Pending Approvals</p>
                      <p className="text-3xl font-bold text-orange-600">{pendingVerifications.length}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Payment Value</p>
                      <p className="text-3xl font-bold text-green-600">
                        K{pendingVerifications.reduce((sum, v) => sum + v.payment_amount, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Unique Farmers</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {new Set(pendingVerifications.map(v => v.farmer_wallet)).size}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Verifications List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Pending Verifications</h2>
                    <p className="text-gray-600 mt-1">Review and approve milestone verifications submitted by officers</p>
                  </div>
                  <button
                    onClick={loadPendingVerifications}
                    disabled={loadingVerifications}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingVerifications ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingVerifications ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                  </div>
                ) : pendingVerifications.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-16 w-16 text-green-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">All Caught Up!</h3>
                    <p className="text-gray-500 mt-1">No pending verifications to review</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {pendingVerifications.map((verification) => (
                      <motion.div
                        key={verification.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4 }}
                        className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer bg-white"
                        onClick={() => {
                          setSelectedVerification(verification);
                          setShowApprovalModal(true);
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-purple-600" />
                          </div>
                          <span className="text-lg font-bold text-green-600">
                            ${verification.payment_amount.toLocaleString()}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{verification.milestone_name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">{verification.farmer_name}</span>
                        </p>
                        <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full mb-3">
                          {verification.crop_type}
                        </span>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {verification.officer_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(verification.submitted_date).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <button className="w-full mt-3 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2">
                          <Eye className="h-4 w-4" />
                          Review
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contracts View */}
          {selectedView === "contracts" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">All Contracts</h2>
                  <p className="text-gray-600 mt-1">Manage farming contracts and agreements</p>
                </div>
                <button 
                  onClick={() => setShowContractModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/25 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Contract</span>
                </button>
              </div>
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{contract.id} - {contract.crop}</h3>
                        <p className="text-sm text-gray-600">{contract.farmer} • {contract.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-gray-900">{contract.amount}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        contract.status === "active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {contract.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Farmers View */}
          {selectedView === "farmers" && (
            <div className="space-y-6">
              {/* Interactive Map Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-emerald-600" />
                        Farmer Locations Map
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">Click on markers to view farmer details</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{SAMPLE_FARMERS.length} farmers</span>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-xs text-gray-500">Verified</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-xs text-gray-500">Pending</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative h-80 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                  {/* Zambia Map SVG Background */}
                  <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[...Array(10)].map((_, i) => (
                      <g key={i}>
                        <line x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="#059669" strokeWidth="0.1" />
                        <line x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="#059669" strokeWidth="0.1" />
                      </g>
                    ))}
                    {/* Zambia shape approximation */}
                    <path d="M30,25 L70,20 L85,45 L80,70 L55,85 L35,80 L20,55 L30,25" 
                      fill="none" stroke="#059669" strokeWidth="0.5" strokeDasharray="2,2" />
                  </svg>
                  
                  {/* Farmer Markers */}
                  {SAMPLE_FARMERS.map((farmer) => {
                    const pos = MAP_POSITIONS[farmer.location as keyof typeof MAP_POSITIONS] || { x: 50, y: 50 };
                    return (
                      <motion.div
                        key={farmer.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        onHoverStart={() => setHoveredMarker(farmer.id)}
                        onHoverEnd={() => setHoveredMarker(null)}
                        onClick={() => handleFarmerClick(farmer)}
                        className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      >
                        <div className={`relative w-10 h-10 rounded-full flex items-center justify-center border-3 border-white shadow-lg transition-all ${
                          farmer.verified ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}>
                          <span className="text-white font-bold text-sm">{farmer.name.charAt(0)}</span>
                          {/* Pulse effect */}
                          <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                            farmer.verified ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} style={{ animationDuration: '2s' }} />
                        </div>
                        
                        {/* Tooltip */}
                        <AnimatePresence>
                          {hoveredMarker === farmer.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10"
                            >
                              <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 min-w-48">
                                <p className="font-semibold text-gray-900">{farmer.name}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />{farmer.location}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                                    {farmer.farmSize} ha
                                  </span>
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    {farmer.contracts.length} contracts
                                  </span>
                                </div>
                                <p className="text-xs text-emerald-600 mt-2 font-medium">Click to view details →</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                  
                  {/* Map Legend */}
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Zambia Regions</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                      <span>• Lusaka</span>
                      <span>• Kabwe</span>
                      <span>• Kitwe</span>
                      <span>• Chipata</span>
                      <span>• Ndola</span>
                      <span>• Livingstone</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Farmers Directory */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Farmers Directory</h2>
                    <p className="text-sm text-gray-500 mt-1">{SAMPLE_FARMERS.length} registered farmers</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search farmers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm w-64"
                      />
                    </div>
                    <button className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <Filter className="h-4 w-4 text-gray-500" />
                    </button>
                    <button className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <Download className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {SAMPLE_FARMERS.filter(f => 
                    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    f.location.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((farmer) => (
                    <motion.div 
                      key={farmer.id}
                      whileHover={{ y: -4 }}
                      onClick={() => handleFarmerClick(farmer)}
                      className="group p-5 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                            farmer.verified ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'
                          }`}>
                            {farmer.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">{farmer.name}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{farmer.location}
                            </p>
                          </div>
                        </div>
                        {farmer.verified ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-full">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-700">Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-full">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span className="text-xs font-medium text-amber-700">Pending</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
                          <p className="text-lg font-bold text-gray-900">{farmer.farmSize}</p>
                          <p className="text-xs text-gray-500">Hectares</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
                          <p className="text-lg font-bold text-gray-900">{farmer.contracts.length}</p>
                          <p className="text-xs text-gray-500">Contracts</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
                          <p className="text-lg font-bold text-emerald-600">K{(farmer.totalEarnings / 1000).toFixed(0)}k</p>
                          <p className="text-xs text-gray-500">Earned</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {farmer.crops.map((crop, i) => (
                          <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium">
                            {crop}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />{farmer.email}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Buyers View */}
          {selectedView === "buyers" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Buyers Directory</h2>
                  <p className="text-gray-600 mt-1">Active buyers and purchase history</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { name: "Fresh Foods Ltd", orders: 12, spent: "K45,000", location: "Lusaka", contact: "john@freshfoods.zm" },
                  { name: "Market Suppliers Co", orders: 8, spent: "K32,000", location: "Ndola", contact: "info@marketsuppliers.zm" },
                  { name: "Agro Exports", orders: 15, spent: "K68,000", location: "Kitwe", contact: "sales@agroexports.zm" },
                  { name: "Farm Fresh Zambia", orders: 6, spent: "K28,000", location: "Lusaka", contact: "orders@farmfresh.zm" },
                ].map((buyer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{buyer.name}</h3>
                        <p className="text-sm text-gray-600">{buyer.location} • {buyer.orders} orders</p>
                        <p className="text-xs text-gray-500">{buyer.contact}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{buyer.spent}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Officers View */}
          {selectedView === "officers" && (
            <div className="space-y-6">
              {/* Officer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Officers</p>
                      <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'officer').length}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Eligible for Promotion</p>
                      <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'farmer' && u.verified).length}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <UserPlus className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Verifications</p>
                      <p className="text-3xl font-bold text-gray-900">176</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Promote User Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Promote Users to Officers</h3>
                    <p className="text-sm text-gray-600 mt-1">Select verified users to promote to Extension Officer role</p>
                  </div>
                  <button 
                    onClick={() => setShowPromoteModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Promote User</span>
                  </button>
                </div>
              </div>

              {/* Database Officers */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Registered Verifiers</h2>
                    <p className="text-gray-600 mt-1">Officers registered in the database</p>
                  </div>
                  <button
                    onClick={loadOfficersFromDB}
                    disabled={loadingOfficers}
                    className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingOfficers ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                {loadingOfficers ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Loading officers...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dbOfficers.map((officer) => (
                      <div key={officer.id} className="p-4 border border-green-200 rounded-lg bg-green-50 hover:border-green-500 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-green-700">{(officer.name || 'V').charAt(0)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">Database</span>
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900">{officer.name || 'Unnamed Officer'}</h3>
                        <p className="text-xs text-gray-500 mt-2">{officer.email || 'No email'}</p>
                        <p className="text-xs text-gray-500">{officer.phone || 'No phone'}</p>
                        <p className="text-xs font-mono text-gray-400 mt-1">{officer.wallet_address?.slice(0, 10)}...{officer.wallet_address?.slice(-6)}</p>
                        <p className="text-xs text-gray-400 mt-1">Joined: {officer.created_at ? new Date(officer.created_at).toLocaleDateString() : 'Unknown'}</p>
                      </div>
                    ))}
                    {dbOfficers.length === 0 && (
                      <div className="col-span-full text-center py-8">
                        <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No officers registered in database yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Local/Sample Officers */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Session Officers</h2>
                    <p className="text-gray-600 mt-1">Officers promoted during this session (local state)</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.filter(u => u.role === 'officer').map((officer, index) => (
                    <div key={officer.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-blue-700">{officer.name.charAt(0)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">Officer</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900">{officer.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {officer.location}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">{officer.email}</p>
                      <p className="text-xs font-mono text-gray-400 mt-1">{officer.wallet.slice(0, 10)}...{officer.wallet.slice(-6)}</p>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleDemoteOfficer(officer)}
                          className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center space-x-1"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Demote Officer</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {users.filter(u => u.role === 'officer').length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No session officers. Promote verified users above.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Promote User Modal */}
          {showPromoteModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Promote to Extension Officer</h3>
                  <button
                    onClick={() => {
                      setShowPromoteModal(false);
                      setSelectedUser(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      Only verified farmers can be promoted to officers. Officers can verify milestones and earn fees.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {users.filter(u => u.role === 'farmer' && u.verified).map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedUser?.id === user.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-green-700">{user.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.location} • {user.email}</p>
                        </div>
                        {user.verified && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                  {users.filter(u => u.role === 'farmer' && u.verified).length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No eligible users to promote</p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowPromoteModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => selectedUser && handlePromoteToOfficer(selectedUser)}
                    disabled={!selectedUser}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Promote to Officer</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Analytics View */}
          {selectedView === "analytics" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <TrendingUp className="h-8 w-8 text-green-600 mb-3" />
                    <p className="text-sm text-gray-600">Growth Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">+23%</p>
                    <p className="text-xs text-gray-500 mt-1">vs last month</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                    <Users className="h-8 w-8 text-blue-600 mb-3" />
                    <p className="text-sm text-gray-600">User Engagement</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">87%</p>
                    <p className="text-xs text-gray-500 mt-1">active users</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                    <DollarSign className="h-8 w-8 text-purple-600 mb-3" />
                    <p className="text-sm text-gray-600">Revenue Growth</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">+31%</p>
                    <p className="text-xs text-gray-500 mt-1">this quarter</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={costData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip />
                      <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Payments View */}
          {selectedView === "payments" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment Transactions</h2>
                  <p className="text-gray-600 mt-1">Platform payment history and processing</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { id: "TXN001", from: "Fresh Foods Ltd", to: "John Mwale", amount: "K15,000", status: "completed", date: "2024-11-07", hash: "0x742d35..." },
                  { id: "TXN002", from: "Market Suppliers", to: "Mary Banda", amount: "K12,000", status: "completed", date: "2024-11-07", hash: "0x8ba1f1..." },
                  { id: "TXN003", from: "Agro Exports", to: "Peter Phiri", amount: "K8,500", status: "processing", date: "2024-11-07", hash: "0x9f2df0..." },
                  { id: "TXN004", from: "Farm Fresh", to: "Sarah Phiri", amount: "K10,000", status: "completed", date: "2024-11-06", hash: "0x3c8a2b..." },
                ].map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{payment.id}</h3>
                        <p className="text-sm text-gray-600">{payment.from} → {payment.to}</p>
                        <p className="text-xs text-gray-500">{payment.date} • {payment.hash}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-gray-900">{payment.amount}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings View */}
          {selectedView === "settings" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">General Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Platform Name</span>
                      <span className="font-medium">Cherry Pick</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Currency</span>
                      <span className="font-medium">ZMW (Kwacha)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Time Zone</span>
                      <span className="font-medium">Africa/Lusaka</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Language</span>
                      <span className="font-medium">English</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Verification Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Officer Fee per Verification</span>
                      <span className="font-medium">K50</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Auto-approve Verified Farmers</span>
                      <span className="font-medium text-green-600">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Minimum Listing Quality</span>
                      <span className="font-medium">Grade B</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Platform Fee</span>
                      <span className="font-medium">2.5%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Payment Network</span>
                      <span className="font-medium">Base (Coinbase L2)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Farmer Detail Modal */}
      <FarmerDetailModal
        isOpen={showFarmerModal}
        onCloseAction={() => {
          setShowFarmerModal(false);
          setSelectedFarmer(null);
        }}
        farmer={selectedFarmer}
      />

      {/* New Job Modal */}
      <NewJobModal
        isOpen={showNewJobModal}
        onCloseAction={() => setShowNewJobModal(false)}
        onCreateJobAction={handleCreateJob}
        farmers={SAMPLE_FARMERS.map(f => ({ id: f.id, name: f.name, location: f.location }))}
      />

      {/* Create Contract Modal */}
      {showContractModal && (
        <AdminCreateContractModal
          onCloseAction={() => setShowContractModal(false)}
          onContractCreatedAction={handleCreateContract}
        />
      )}

      {/* Admin Approval Modal for Verifications */}
      {showApprovalModal && selectedVerification && (
        <AdminApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedVerification(null);
          }}
          milestone={{
            id: selectedVerification.milestone_id,
            name: selectedVerification.milestone_name,
            description: `${selectedVerification.crop_type} - Payment: K${selectedVerification.payment_amount.toLocaleString()}`,
            farmerName: selectedVerification.farmer_name,
            farmerActivities: [],
            officerEvidence: {
              images: selectedVerification.evidence_images,
              iotReadings: [],
              notes: selectedVerification.officer_notes,
              officerName: selectedVerification.officer_name,
            },
          }}
          onApprove={async (adminNotes: string) => {
            // Approve milestone and trigger USDC payments to farmer and verifier
            try {
              const farmerPayment = selectedVerification.payment_amount;
              
              // Calculate verifier fee based on contract value and milestone count
              // Total verifier fees = 2% of contract value split across milestones
              // Cap at 3% if more than 4 milestones
              const feeBreakdown = getVerifierFeeBreakdown(
                selectedVerification.total_contract_value,
                selectedVerification.total_milestones,
                selectedVerification.custom_verifier_fee_percent
              );
              const verifierFee = feeBreakdown.feePerMilestone;

              // Update milestone status in database
              if (supabase) {
                // First get existing metadata
                const { data: existingMilestone } = await supabase
                  .from('milestones')
                  .select('metadata')
                  .eq('id', selectedVerification.milestone_id)
                  .single();

                const existingMetadata = existingMilestone?.metadata || {};

                const { error: updateError } = await supabase
                  .from('milestones')
                  .update({
                    status: 'verified',
                    payment_status: 'completed',
                    verified_at: new Date().toISOString(),
                    metadata: {
                      ...existingMetadata,
                      admin_notes: adminNotes,
                      approved_at: new Date().toISOString(),
                      farmer_payment_zmw: farmerPayment,
                      verifier_fee_zmw: verifierFee,
                      verifier_fee_percent: feeBreakdown.feePerMilestonePercent,
                      total_verifier_fee_percent: feeBreakdown.totalFeePercent,
                    },
                  })
                  .eq('id', selectedVerification.milestone_id);

                if (updateError) {
                  console.error('Error updating milestone:', updateError);
                  throw new Error(`Failed to update milestone: ${updateError.message}`);
                }

                console.log('Milestone updated successfully:', selectedVerification.milestone_id);

                // Check if this was the last milestone - if so, mark contract as completed
                const { data: contractMilestones } = await supabase
                  .from('milestones')
                  .select('id, status')
                  .eq('contract_id', selectedVerification.contract_id);

                if (contractMilestones) {
                  const allVerified = contractMilestones.every((m: { id: string; status: string }) => 
                    m.id === selectedVerification.milestone_id || m.status === 'verified'
                  );
                  
                  if (allVerified) {
                    // All milestones verified - mark contract as completed
                    await supabase
                      .from('contracts')
                      .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                      })
                      .eq('id', selectedVerification.contract_id);
                    
                    toast.success('🎉 All milestones completed! Contract marked as completed.', { duration: 5000 });
                  }
                }

                // Record payments in database for dashboard display
                await supabase.from('payments').insert([
                  {
                    user_wallet: selectedVerification.farmer_wallet,
                    amount: farmerPayment,
                    currency: 'USDC',
                    type: 'milestone_payment',
                    status: 'completed',
                    milestone_id: selectedVerification.milestone_id,
                    notes: `Payment for ${selectedVerification.milestone_name}`,
                  },
                  {
                    user_wallet: selectedVerification.officer_wallet,
                    amount: verifierFee,
                    currency: 'USDC',
                    type: 'verification_fee',
                    status: 'completed',
                    milestone_id: selectedVerification.milestone_id,
                    notes: `Verification fee for ${selectedVerification.milestone_name} (${feeBreakdown.feePerMilestonePercent.toFixed(2)}% of $${selectedVerification.total_contract_value} contract)`,
                  },
                ]);
              }

              // Show success with payment details
              toast.success(
                `✅ Milestone Approved!\n` +
                `💰 Farmer: $${farmerPayment.toFixed(2)} USDC → ${selectedVerification.farmer_name}\n` +
                `🔍 Verifier: $${verifierFee.toFixed(2)} USDC (${feeBreakdown.feePerMilestonePercent.toFixed(2)}%) → ${selectedVerification.officer_name}`,
                { duration: 5000 }
              );

              // Remove from pending list
              setPendingVerifications(prev => prev.filter(v => v.id !== selectedVerification.id));
              setShowApprovalModal(false);
              setSelectedVerification(null);
            } catch (error: any) {
              console.error('Approval error:', error);
              toast.error('Failed to process approval');
              throw error;
            }
          }}
          onReject={async (adminNotes: string) => {
            // Reject milestone
            try {
              if (supabase) {
                await supabase
                  .from('milestones')
                  .update({
                    status: 'rejected',
                    metadata: {
                      admin_rejection_notes: adminNotes,
                      rejected_at: new Date().toISOString(),
                    },
                  })
                  .eq('id', selectedVerification.milestone_id);
              }

              // Remove from pending list
              setPendingVerifications(prev => prev.filter(v => v.id !== selectedVerification.id));
              setShowApprovalModal(false);
              setSelectedVerification(null);
            } catch (error: any) {
              console.error('Rejection error:', error);
              throw error;
            }
          }}
        />
      )}
    </div>
  );
}
