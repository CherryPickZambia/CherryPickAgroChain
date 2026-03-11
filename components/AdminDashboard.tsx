"use client";

import { useState, useEffect } from "react";
import {
  Users, FileText, TrendingUp, DollarSign, Activity, ArrowUp, ArrowDown,
  MapPin, Clock, CheckCircle, CheckCircle2, Settings, Package, Search, Plus, Sun, Menu,
  ShoppingBag, User, UserPlus, Shield, XCircle, AlertCircle, Eye,
  MoreVertical, Filter, Download, Calendar, Leaf, Globe, Phone, Mail,
  ChevronRight, ExternalLink, Landmark, Award, BarChart3, PieChart,
  Wallet, Zap, Target, RefreshCw, QrCode, Truck, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getUsersByRole, getFarmers, getAllContracts } from "@/lib/supabaseService";
import AdminApprovalModal from "./AdminApprovalModal";
import { getVerificationEvidence } from "@/lib/ipfsService";
import { STANDARD_MILESTONES, payMilestoneApproval, getUSDCBalance, calculateVerifierFee, getVerifierFeeBreakdown } from "@/lib/blockchain/contractInteractions";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RePieChart, Pie, Cell } from "recharts";
import FarmerDetailModal from "./FarmerDetailModal";
import NewJobModal, { JobData } from "./NewJobModal";
import FarmMap from "./FarmMap";
import AdminCreateContractModal from "./AdminCreateContractModal";
import AdminBiddingPanel from "./AdminBiddingPanel";
import WarehouseProcessingModal, { ProcessingResult } from "./WarehouseProcessingModal";
import UniversalQRCode from "./UniversalQRCode";
import AdminContractDetailModal from "./AdminContractDetailModal";
import AdminTraceabilityHistoryModal from "./AdminTraceabilityHistoryModal";
import { logProcessingEvent, getAllBatches, getRecentTraceabilityEvents, logMilestoneEvent, getBatchesByContract, getBatchTraceability, type Batch, type TraceabilityEvent } from "@/lib/traceabilityService";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import WalletBalance from "./WalletBalance";

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
      {
        id: "c1", cropType: "Mangoes", status: "active" as const, value: 25000, createdAt: "Oct 20, 2024", harvestDate: "Jan 15, 2025", milestones: [
          { id: "m1", name: "Land Preparation", status: "verified" as const, payment: 5000, dueDate: "Oct 25" },
          { id: "m2", name: "Planting Complete", status: "verified" as const, payment: 7500, dueDate: "Nov 10" },
          { id: "m3", name: "Flowering Stage", status: "submitted" as const, payment: 5000, dueDate: "Dec 15" },
          { id: "m4", name: "Harvest Ready", status: "pending" as const, payment: 7500, dueDate: "Jan 15" },
        ]
      },
      {
        id: "c2", cropType: "Tomatoes", status: "completed" as const, value: 20000, createdAt: "Aug 10, 2024", harvestDate: "Oct 5, 2024", milestones: [
          { id: "m5", name: "Land Preparation", status: "verified" as const, payment: 5000, dueDate: "Aug 15" },
          { id: "m6", name: "Seedling Stage", status: "verified" as const, payment: 5000, dueDate: "Sep 1" },
          { id: "m7", name: "Harvest Complete", status: "verified" as const, payment: 10000, dueDate: "Oct 5" },
        ]
      },
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
      {
        id: "c3", cropType: "Pineapples", status: "active" as const, value: 18000, createdAt: "Nov 1, 2024", harvestDate: "Feb 20, 2025", milestones: [
          { id: "m8", name: "Land Preparation", status: "verified" as const, payment: 4000, dueDate: "Nov 5" },
          { id: "m9", name: "Planting Complete", status: "submitted" as const, payment: 6000, dueDate: "Nov 20" },
          { id: "m10", name: "Growth Stage", status: "pending" as const, payment: 4000, dueDate: "Jan 10" },
          { id: "m11", name: "Harvest Ready", status: "pending" as const, payment: 4000, dueDate: "Feb 20" },
        ]
      },
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
      {
        id: "c4", cropType: "Bananas", status: "pending" as const, value: 22000, createdAt: "Nov 10, 2024", harvestDate: "Mar 15, 2025", milestones: [
          { id: "m12", name: "Land Preparation", status: "pending" as const, payment: 5000, dueDate: "Nov 15" },
          { id: "m13", name: "Planting Complete", status: "pending" as const, payment: 7000, dueDate: "Dec 1" },
          { id: "m14", name: "Growth Stage", status: "pending" as const, payment: 5000, dueDate: "Feb 1" },
          { id: "m15", name: "Harvest Ready", status: "pending" as const, payment: 5000, dueDate: "Mar 15" },
        ]
      },
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
      {
        id: "c5", cropType: "Cashews", status: "active" as const, value: 35000, createdAt: "Sep 15, 2024", harvestDate: "Jan 30, 2025", milestones: [
          { id: "m16", name: "Land Preparation", status: "verified" as const, payment: 8000, dueDate: "Sep 20" },
          { id: "m17", name: "Planting Complete", status: "verified" as const, payment: 10000, dueDate: "Oct 5" },
          { id: "m18", name: "Growth Stage", status: "verified" as const, payment: 7000, dueDate: "Nov 30" },
          { id: "m19", name: "Harvest Ready", status: "pending" as const, payment: 10000, dueDate: "Jan 30" },
        ]
      },
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
      {
        id: "c6", cropType: "Tomatoes", status: "active" as const, value: 12000, createdAt: "Nov 5, 2024", harvestDate: "Feb 10, 2025", milestones: [
          { id: "m20", name: "Land Preparation", status: "verified" as const, payment: 3000, dueDate: "Nov 10" },
          { id: "m21", name: "Planting Complete", status: "verified" as const, payment: 4000, dueDate: "Nov 25" },
          { id: "m22", name: "Growth Stage", status: "submitted" as const, payment: 2500, dueDate: "Jan 10" },
          { id: "m23", name: "Harvest Ready", status: "pending" as const, payment: 2500, dueDate: "Feb 10" },
        ]
      },
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
interface VerifiedProduct {
  batchCode: string;
  cropType: string;
  farmerName: string;
  quantity: string;
  grade: string;
  nftTxHash?: string;
  verifiedAt: string;
}

interface ContractUI {
  id: string;
  contract_code?: string;
  crop: string;
  farmer: string;
  farmer_wallet?: string;
  date: string;
  amount: string;
  status: string;
  blockchain_tx?: string;
  farmer_id?: string;
}

interface PendingVerification {
  id: string;
  milestone_id: string;
  milestone_name: string;
  farmer_name: string;
  farmer_id: string;
  farmer_wallet: string;
  crop_type: string;
  payment_amount: number; // USDC amount for farmer
  submitted_date: string;
  officer_name: string;
  officer_wallet: string; // Verifier wallet for payment
  evidence_images: string[];
  officer_notes: string;
  contract_id: string;
  contract?: any;
  blockchain_contract_id?: number;
  // For verifier fee calculation
  total_contract_value: number;
  total_milestones: number;
  custom_verifier_fee_percent?: number; // Admin can override
  // IoT readings from officer verification
  officer_iot_readings: Array<{
    type: string;
    value: number;
    unit: string;
    timestamp: string;
  }>;
  // Farmer activities from traceability events
  farmer_activities: Array<{
    type: string;
    description: string;
    quantity?: number;
    unit?: string;
    date: string;
    notes?: string;
  }>;
  // AI analysis from officer verification
  officer_ai_analysis?: any;
}

interface FarmerUI {
  id: string;
  wallet: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  location: string;
  locationLat: number;
  locationLng: number;
  farmSize: number;
  crops: string[];
  joined: string;
  verified: boolean;
  totalEarnings: number;
  completedMilestones: number;
  pendingMilestones: number;
  contracts: any[]; // Or more specific if known
}

export default function AdminDashboard() {
  const { evmAddress } = useEvmAddress();
  const [selectedView, setSelectedView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<FarmerUI[]>([]);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FarmerUI | null>(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerUI | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [jobs, setJobs] = useState<JobData[]>(SAMPLE_JOBS);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showContractDetailModal, setShowContractDetailModal] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [showAllRecentContracts, setShowAllRecentContracts] = useState(false);

  // Real farmers state (empty until loaded from Supabase)
  const [farmersList, setFarmersList] = useState<FarmerUI[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [contracts, setContracts] = useState<ContractUI[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  // Pending verifications state
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Database officers state
  const [dbOfficers, setDbOfficers] = useState<any[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  // Warehouse processing state
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<{
    batchCode: string;
    cropType: string;
    farmerName: string;
    quantity: string;
    contractId?: string;
    farmerId?: string;
  } | null>(null);
  const [savedProcessingData, setSavedProcessingData] = useState<Record<string, Partial<ProcessingResult>>>({});
  const [verifiedProducts, setVerifiedProducts] = useState<VerifiedProduct[]>([
    // Sample verified products
    { batchCode: "CP-MAN-241115-A2B3", cropType: "Mangoes", farmerName: "Grace Zulu", quantity: "450 kg", grade: "Premium", nftTxHash: "0x1a2b3c4d5e6f7890", verifiedAt: "2024-11-28" },
    { batchCode: "CP-CAS-241120-D2T6", cropType: "Cashews", farmerName: "David Tembo", quantity: "320 kg", grade: "Grade A", nftTxHash: "0xabcdef1234567890", verifiedAt: "2024-11-25" },
  ]);

  // Traceability data state
  const [allBatches, setAllBatches] = useState<(Batch & { farmer_name?: string })[]>([]);
  const [recentEvents, setRecentEvents] = useState<(TraceabilityEvent & { batch_code?: string })[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [processingBatches, setProcessingBatches] = useState<Batch[]>([]);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);

  // Traceability History Modal state
  const [showTraceHistoryModal, setShowTraceHistoryModal] = useState(false);
  const [traceHistoryContractId, setTraceHistoryContractId] = useState<string | null>(null);
  const [traceHistoryBatchId, setTraceHistoryBatchId] = useState<string | null>(null);
  const [traceHistoryBatchCode, setTraceHistoryBatchCode] = useState<string | null>(null);

  // Load verified products (batches with NFTs)
  const loadVerifiedProducts = async () => {
    try {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('batches')
        .select(`
          batch_code,
          crop_type,
          total_quantity,
          quality_grade,
          blockchain_tx,
          updated_at,
          farmer:farmers(name)
        `)
        .not('blockchain_tx', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const transformed = data.map((item: any) => ({
          batchCode: item.batch_code as string,
          cropType: item.crop_type as string,
          farmerName: (item.farmer as any)?.name || 'Unknown',
          quantity: `${item.total_quantity} kg`,
          grade: item.quality_grade || 'Standard',
          nftTxHash: item.blockchain_tx as string,
          verifiedAt: new Date(item.updated_at).toLocaleDateString()
        }));
        setVerifiedProducts(transformed);
      }
    } catch (error) {
      console.error('Error loading verified products:', error);
    }
  };

  // Load traceability data (batches and events from Supabase)
  const loadTraceabilityData = async () => {
    try {
      setLoadingBatches(true);
      const [batchesData, eventsData] = await Promise.all([
        getAllBatches(),
        getRecentTraceabilityEvents(20),
      ]);
      setAllBatches(batchesData);
      setRecentEvents(eventsData);
      setProcessingBatches(batchesData.filter(b => b.current_status === 'at_warehouse' || b.current_status === 'harvested' || b.current_status === 'in_transit' || b.current_status === 'processing'));
    } catch (error: any) {
      console.error('Error loading traceability data:', error?.message || JSON.stringify(error));
    } finally {
      setLoadingBatches(false);
    }
  };

  // Load farmers from database
  const loadFarmers = async () => {
    try {
      setLoadingFarmers(true);
      const data = await getFarmers();

      if (data && data.length > 0) {
        // Transform DB farmers to match UI expectations
        const mappedFarmers = data.map((f: any) => ({
          id: f.id as string,
          wallet: f.wallet_address as string,
          name: f.name as string,
          email: (f.email as string) || "",
          phone: (f.phone as string) || "",
          role: "farmer",
          location: (f.location_address as string) || "Unknown Location",
          locationLat: (f.location_lat as number) || -15.4,
          locationLng: (f.location_lng as number) || 28.3,
          farmSize: (f.farm_size as number) || 0,
          crops: [] as string[],
          joined: new Date(f.created_at).toLocaleDateString(),
          verified: f.status === 'approved',
          totalEarnings: 0,
          completedMilestones: 0,
          pendingMilestones: 0,
          contracts: [] as any[]
        }));

        setFarmersList(mappedFarmers);
        // Also set users list for admin views
        setUsers(mappedFarmers);
      }
    } catch (error) {
      console.error("Error loading farmers:", error);
      toast.error("Failed to load farmers");
    } finally {
      setLoadingFarmers(false);
    }
  };

  // Approve farmer function
  const approveFarmer = async (farmerId: string, farmerName: string) => {
    try {
      const { error } = await supabase
        .from('farmers')
        .update({ status: 'approved' })
        .eq('id', farmerId);

      if (error) throw error;

      toast.success(`${farmerName} has been approved!`);
      // Refresh the farmers list
      loadFarmers();
    } catch (error) {
      console.error('Error approving farmer:', error);
      toast.error('Failed to approve farmer');
    }
  };

  // Load contracts from database
  const loadContracts = async () => {
    try {
      setLoadingContracts(true);
      const data = await getAllContracts();

      if (data && data.length > 0) {
        // Transform DB contracts to match UI expectations
        const mappedContracts = data.map((c: any) => ({
          id: c.id as string,
          contract_code: (c.contract_code as string) || c.id?.slice(0, 8) || 'N/A',
          crop: (c.crop_type as string) || "Unknown",
          farmer: (c.farmer?.name as string) || (c.farmer_name as string) || "Unknown",
          date: c.created_at ? new Date(c.created_at).toLocaleDateString() : "No date",
          amount: `ZK ${(c.total_value ?? 0).toLocaleString()}`,
          status: (c.status as string) || "pending",
          blockchain_tx: c.blockchain_tx as string,
          farmer_id: c.farmer_id as string,
        }));
        setContracts(mappedContracts);
      }
      else {
        setContracts([]);
      }
    } catch (error: any) {
      console.error('Error loading contracts:', error?.message || JSON.stringify(error));
      toast.error('Failed to load contracts');
    } finally {
      setLoadingContracts(false);
    }
  };

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
              wallet_address,
              user_id
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
      const contractIds: string[] = Array.from(new Set<string>(submittedMilestones.map((m: any) => m.contract_id)));
      const { data: milestoneCounts } = await supabase
        .from('milestones')
        .select('contract_id')
        .in('contract_id', contractIds);

      const countByContract: Record<string, number> = {};
      milestoneCounts?.forEach((m: any) => {
        countByContract[m.contract_id] = (countByContract[m.contract_id] || 0) + 1;
      });

      // Fetch farmer traceability activities per contract (parallel with timeout)
      const farmerActivitiesByContract: Record<string, Array<{ type: string; description: string; quantity?: number; unit?: string; date: string; notes?: string }>> = {};
      const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | null> =>
        Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

      await Promise.all(contractIds.map(async (contractId) => {
        try {
          const batches = await withTimeout(getBatchesByContract(contractId), 5000);
          if (batches && batches.length > 0) {
            const events = await withTimeout(getBatchTraceability(batches[0].id!), 5000);
            if (!events) return;
            const farmerEvents = (events as TraceabilityEvent[]).filter((e) => e.actor_type === 'farmer');
            farmerActivitiesByContract[contractId] = farmerEvents.map((e) => ({
              type: e.event_type || 'update',
              description: e.event_description || e.event_title || '',
              quantity: e.quantity,
              unit: e.unit,
              date: e.created_at || new Date().toISOString(),
              notes: e.location_address ? `Location: ${e.location_address}` : undefined,
            }));
          }
        } catch (err) {
          console.warn('Failed to load farmer activities for contract:', contractId, err);
        }
      }));

      // Transform to PendingVerification format
      const verifications: PendingVerification[] = submittedMilestones.map((milestone: any) => {
        const contract = milestone.contract;
        const farmer = contract?.farmer;
        const metadata = milestone.metadata || {};

        // Extract IoT readings from officer verification metadata
        const rawIotReadings = metadata.officer_iot_readings || metadata.iot_readings || [];
        const iotReadings = Array.isArray(rawIotReadings) ? rawIotReadings.map((r: any) => ({
          type: r.type || 'unknown',
          value: typeof r.value === 'number' ? r.value : parseFloat(r.value) || 0,
          unit: r.unit || '',
          timestamp: r.timestamp || metadata.verified_at || new Date().toISOString(),
        })) : [];

        return {
          id: milestone.id,
          milestone_id: milestone.id,
          milestone_name: milestone.name,
          farmer_name: farmer?.name || 'Unknown Farmer',
          farmer_id: farmer?.id || '',
          farmer_wallet: farmer?.wallet_address || '',
          crop_type: contract?.crop_type || 'Unknown',
          payment_amount: milestone.payment_amount || 0,
          submitted_date: milestone.completed_date || new Date().toISOString(),
          officer_name: metadata.officer_name || metadata.officer_id || 'Verifier',
          officer_wallet: metadata.officer_wallet || '',
          evidence_images: metadata.officer_images || metadata.images || [],
          officer_notes: metadata.officer_notes || metadata.notes || '',
          contract_id: milestone.contract_id,
          contract: contract,
          blockchain_contract_id: undefined,
          total_contract_value: contract?.total_value || 5000,
          total_milestones: countByContract[milestone.contract_id] || 4,
          custom_verifier_fee_percent: undefined,
          officer_iot_readings: iotReadings,
          farmer_activities: farmerActivitiesByContract[milestone.contract_id] || [],
          officer_ai_analysis: metadata.officer_ai_analysis || metadata.ai_analysis || null,
        };
      });

      console.log('Processed verifications with IoT + activities:', verifications);
      setPendingVerifications(verifications);

      toast.success(`Found ${verifications.length} milestone(s) awaiting approval`);

      // Log for debugging
      verifications.forEach(v => {
        console.log(`Pending: ${v.milestone_name} for ${v.farmer_name} - ZK ${v.payment_amount}`);
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
  // Load initial data for dashboard overview
  useEffect(() => {
    loadFarmers();
    loadContracts();
    loadPendingVerifications();
    loadVerifiedProducts();
  }, []);

  useEffect(() => {
    if (selectedView === 'verifications') {
      loadPendingVerifications();
    }
    if (selectedView === 'officers') {
      loadOfficersFromDB();
    }
    if (selectedView === 'traceability') {
      loadVerifiedProducts();
      loadTraceabilityData();
      loadContracts();
    }
    if (selectedView === 'farmers') {
      loadFarmers();
    }
    if (selectedView === 'contracts') {
      loadContracts();
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
      contract_code: contract.contractCode,
      farmer: contract.farmerName || "New Farmer",
      crop: contract.cropType,
      amount: `ZK ${Number(contract.totalValue || 0).toLocaleString()}`,
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
    totalRevenue: { value: "ZK 2.5M", subtitle: "Platform Revenue" },
  };

  const menuItems = [
    { icon: Activity, label: "Dashboard", id: "dashboard" },
    { icon: ShoppingBag, label: "Marketplace", id: "marketplace" },
    { icon: FileText, label: "Contracts", id: "contracts" },
    { icon: AlertCircle, label: "Verifications", id: "verifications" },
    { icon: Users, label: "Farmers", id: "farmers" },
    { icon: User, label: "Buyers", id: "buyers" },
    { icon: CheckCircle2, label: "Officers", id: "officers" },
    { icon: QrCode, label: "Traceability", id: "traceability" },
    { icon: TrendingUp, label: "Analytics", id: "analytics" },
    { icon: DollarSign, label: "Payments", id: "payments" },
    { icon: Award, label: "Bidding", id: "bidding" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  const activeMenuItem = menuItems.find((item) => item.id === selectedView) || menuItems[0];

  // Handle promoting a user to officer
  const handlePromoteToOfficer = async (user: typeof SAMPLE_USERS[0]) => {
    try {
      if (supabase) {
        await supabase.from('users').update({ role: 'officer' }).eq('id', user.id);
      }
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
  const handleDemoteOfficer = async (user: typeof SAMPLE_USERS[0]) => {
    try {
      if (supabase) {
        await supabase.from('users').update({ role: 'farmer' }).eq('id', user.id);
      }
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, role: "farmer" } : u
      ));
      toast.success(`${user.name} has been demoted from Officer role.`);
    } catch (error) {
      toast.error("Failed to demote officer");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className="w-72 flex flex-col fixed h-full z-20 bg-white border-r border-gray-200 shadow-sm"
      >
        {/* Logo */}
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-50 shadow-sm border border-red-100">
              <span className="text-2xl" role="img" aria-label="cherry">🍒</span>
            </div>
            <div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }} className="text-xl text-gray-800">Dashboard</span>
              <p style={{ fontFamily: "'Manrope', sans-serif" }} className="text-xs text-slate-500 mt-0.5">Cherry Pick admin</p>
            </div>
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
                style={{ fontFamily: "'Manrope', sans-serif" }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${isActive
                  ? "bg-[#f0ffe0] text-[#0C2D3A] font-semibold shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-[#6fba00]" : "text-gray-400"}`} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all ${sidebarOpen ? "ml-72" : "ml-0"}`}>
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-gray-200 bg-[#F7F9FB]">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search farmers, contracts, batches..."
                style={{ fontFamily: "'Manrope', sans-serif" }}
                className="text-sm w-72 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3 px-4 py-2 rounded-2xl border border-[#E6E2D6] bg-[#F7F9FB]">
              <div className="w-8 h-8 bg-[#0C2D3A] rounded-xl flex items-center justify-center">
                <Shield className="h-4 w-4 text-[#BFFF00]" />
              </div>
              <div>
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }} className="text-sm text-[#0C2D3A]">Administrator</p>
                <p style={{ fontFamily: "'Manrope', sans-serif" }} className="text-xs text-[#5A7684]">Operations control center</p>
              </div>
            </div>
            <div className="[&>button]:!rounded-xl [&>button]:!font-semibold [&>button]:!shadow-sm [&>button]:!border-[#0C2D3A] [&>button]:!bg-[#0C2D3A] [&>button]:!text-white hover:[&>button]:!bg-[#1a4050] [&>button]:!transition-all [&>button]:!px-5 [&>button]:!py-2 [&>button]:!text-sm">
              <AuthButton />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6" style={{ background: "#F7F9FB" }}>
          <div className="mb-6">
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: "-0.03em" }} className="text-3xl text-[#0C2D3A]">{activeMenuItem.label}</h1>
            <p style={{ fontFamily: "'Manrope', sans-serif" }} className="text-[#5A7684] mt-1 text-sm">Manage farmers, contracts, verifications, payments, and marketplace activity from one place.</p>
          </div>
          {selectedView === "dashboard" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Fields */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="dashboard-stat-card rounded-2xl p-5 transition-shadow"
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
                  className="dashboard-stat-card rounded-2xl p-5 transition-shadow"
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
                  className="dashboard-stat-card rounded-2xl p-5 transition-shadow"
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
                  className="dashboard-stat-card rounded-2xl p-5 transition-shadow"
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
                  className="dashboard-panel lg:col-span-2 rounded-2xl overflow-hidden"
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
                      className="dashboard-button-primary flex items-center space-x-2 px-4 py-2.5 text-white rounded-xl transition-all"
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
                  className="dashboard-panel rounded-2xl p-6"
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
                      <p className="text-2xl font-bold text-green-600">ZK 386.50</p>
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

          {/* Verifications View — ARKTOS */}
          {selectedView === "verifications" && (
            <div style={{ background: "#F7F9FB", borderRadius: 24, overflow: "hidden" }}>
              <div style={{ padding: "48px 40px 0" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>Verification Queue v1.0</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }}>
                  <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 0.9, letterSpacing: "-0.04em", color: "#0C2D3A" }}>PENDING<br />VERIFICATIONS</h1>
                  <button onClick={loadPendingVerifications} disabled={loadingVerifications} style={{ padding: "10px 24px", border: "1px solid rgba(12,45,58,0.1)", borderRadius: 12, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Manrope',sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "#5A7684" }}>
                    <RefreshCw className={`h-4 w-4 ${loadingVerifications ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>
              </div>
              {/* Stats Swatches */}
              <div style={{ padding: "0 40px" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>01. Queue Metrics</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 48 }}>
                  {[
                    { label: "Pending Approvals", value: String(pendingVerifications.length), bg: "#BFFF00", color: "#0C2D3A" },
                    { label: "Total Payment Value", value: `K${pendingVerifications.reduce((sum, v) => sum + v.payment_amount, 0).toLocaleString()}`, bg: "#0C2D3A", color: "#fff" },
                    { label: "Unique Farmers", value: String(new Set(pendingVerifications.map(v => v.farmer_wallet)).size), bg: "#E6E2D6", color: "#0C2D3A" },
                  ].map((s, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.02 }} style={{ background: s.bg, color: s.color, borderRadius: 24, padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 160, cursor: "default" }}>
                      <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: "0.85rem", opacity: 0.8 }}>{s.label}</span>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "2rem" }}>{s.value}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
              {/* Pending List */}
              <div style={{ padding: "0 40px 48px" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>02. Review Queue</div>

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
                            ZK {verification.payment_amount.toLocaleString()}
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

          {/* Contracts View — ARKTOS */}
          {selectedView === "contracts" && (
            <div style={{ background: "#F7F9FB", borderRadius: 24, overflow: "hidden" }}>
              <div style={{ padding: "48px 40px 0" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>Contract Management v1.0</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }}>
                  <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 0.9, letterSpacing: "-0.04em", color: "#0C2D3A" }}>ALL<br />CONTRACTS</h1>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={loadContracts} disabled={loadingContracts} style={{ padding: "10px 16px", border: "1px solid rgba(12,45,58,0.1)", borderRadius: 12, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      <RefreshCw className={`h-4 w-4 ${loadingContracts ? 'animate-spin' : ''}`} style={{ color: "#5A7684" }} />
                    </button>
                    <button onClick={() => setShowContractModal(true)} style={{ padding: "10px 24px", background: "#BFFF00", color: "#0C2D3A", borderRadius: 999, border: "none", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(191,255,0,0.3)" }}>
                      <Plus className="h-4 w-4" /> New Contract
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ padding: "0 40px 48px" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>01. Active Agreements</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {loadingContracts ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" style={{ color: "#5A7684" }} />
                      <p style={{ fontFamily: "'Manrope',sans-serif", color: "#5A7684" }}>Loading contracts...</p>
                    </div>
                  ) : contracts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0", background: "#fff", borderRadius: 24, border: "1px dashed rgba(12,45,58,0.15)" }}>
                      <FileText className="h-12 w-12 mx-auto mb-3" style={{ color: "rgba(12,45,58,0.15)" }} />
                      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "#0C2D3A" }}>No contracts found</p>
                      <p style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.85rem", color: "#5A7684", marginTop: 4 }}>Create a new contract to get started</p>
                    </div>
                  ) : (
                    contracts.map((contract) => (
                      <div key={contract.id} onClick={() => { setSelectedContractId(contract.id); setShowContractDetailModal(true); }}
                        style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "border-color .2s" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(191,255,0,0.4)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(12,45,58,0.06)")}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: 40, height: 40, background: "#0C2D3A", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FileText style={{ width: 18, height: 18, color: "#BFFF00" }} />
                          </div>
                          <div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#0C2D3A" }}>{contract.contract_code || contract.id.slice(0, 8)} — {contract.crop}</div>
                            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.8rem", color: "#5A7684" }}>{contract.farmer} • {contract.date}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0C2D3A" }}>{contract.amount}</span>
                          <span style={{ fontFamily: "'Manrope',sans-serif", padding: "4px 14px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, background: contract.status === "active" ? "rgba(191,255,0,0.15)" : "rgba(44,82,99,0.08)", color: contract.status === "active" ? "#0C2D3A" : "#2C5263" }}>
                            {contract.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Farmers View — ARKTOS */}
          {selectedView === "farmers" && (
            <div style={{ background: "#F7F9FB", borderRadius: 24, overflow: "hidden" }}>
              <div style={{ padding: "48px 40px 0" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>Farmer Management v1.0</div>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 0.9, letterSpacing: "-0.04em", color: "#0C2D3A", marginBottom: 48 }}>FARMERS<br />DIRECTORY</h1>
              </div>
              <div style={{ padding: "0 40px" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>01. Farm Locations</div>
              </div>
              <div className="space-y-6" style={{ padding: "0 40px 48px" }}>
              {/* Interactive Map Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: "#fff", borderRadius: 24, border: "1px solid rgba(12,45,58,0.06)", overflow: "hidden" }}
              >
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(12,45,58,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Globe className="h-5 w-5" style={{ color: "#0C2D3A" }} />
                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0C2D3A" }}>Farm Locations Map</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "'Manrope',sans-serif", fontSize: "0.75rem", color: "#5A7684" }}>
                    <span>{SAMPLE_FARMERS.length} farmers</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#BFFF00" }} />Verified</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />Pending</span>
                  </div>
                </div>
                <div className="relative h-96 bg-white overflow-hidden p-0 rounded-xl">
                  <FarmMap
                    farms={farmersList.map(f => ({
                      id: f.id,
                      name: `${f.name}'s Farm`,
                      farmer: f.name,
                      phone: f.phone || "Unknown",
                      location: f.location || "Zambia",
                      lat: f.locationLat || -15.4,
                      lng: f.locationLng || 28.3,
                      crops: f.crops || [],
                      hectares: f.farmSize || 0,
                      status: f.verified ? "active" : "pending",
                      color: f.verified ? "#10b981" : "#f59e0b"
                    }))}
                    onFarmClick={(farm) => {
                      const farmer = farmersList.find(f => f.id === farm.id);
                      if (farmer) handleFarmerClick(farmer);
                    }}
                  />
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
                    <p className="text-sm text-gray-500 mt-1">{farmersList.length} registered farmers</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search farmers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C2D3A] focus:border-transparent text-sm w-64"
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
                  {farmersList.filter(f =>
                    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    f.location.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((farmer) => (
                    <motion.div
                      key={farmer.id}
                      whileHover={{ y: -4 }}
                      onClick={() => handleFarmerClick(farmer)}
                      className="group p-5 border rounded-2xl hover:shadow-lg transition-all cursor-pointer" style={{ background: '#fff', borderColor: 'rgba(12,45,58,0.08)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(12,45,58,0.25)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(12,45,58,0.08)'}

                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: farmer.verified ? '#0C2D3A' : '#E6E2D6', color: farmer.verified ? '#BFFF00' : '#0C2D3A' }}>
                            {farmer.name.charAt(0)}
                          </div>
                          <div>
                            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>{farmer.name}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{farmer.location}
                            </p>
                          </div>
                        </div>
                        {farmer.verified ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(191,255,0,0.15)' }}>
                            <CheckCircle2 className="h-3 w-3" style={{ color: '#0C2D3A' }} />
                            <span className="text-xs font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: '#0C2D3A' }}>Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(12,45,58,0.06)' }}>
                            <Clock className="h-3 w-3" style={{ color: '#5A7684' }} />
                            <span className="text-xs font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>Pending</span>
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
                          <p className="text-lg font-bold" style={{ color: '#0C2D3A' }}>ZK {(farmer.totalEarnings / 1000).toFixed(0)}k</p>
                          <p className="text-xs text-gray-500">Earned</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {farmer.crops.map((crop: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: 'rgba(191,255,0,0.1)', color: '#0C2D3A' }}>
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
                        <div className="flex items-center gap-2">
                          {!farmer.verified && !farmer.id.startsWith('sample') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                approveFarmer(farmer.id, farmer.name);
                              }}
                              className="px-3 py-1 text-xs font-medium text-white rounded-lg transition-colors" style={{ background: '#0C2D3A' }}
                            >
                              Approve
                            </button>
                          )}
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              </div>
            </div>
          )}

          {/* Buyers View — ARKTOS-inspired Brand System */}
          {selectedView === "buyers" && (() => {
            const BK = {
              lime: "#BFFF00", limeHover: "#A3D900", deep: "#0C2D3A", mid: "#2C5263",
              stone: "#E6E2D6", foam: "#F7F9FB", sub: "#5A7684",
              rd: "24px", pill: "999px",
            };
            const syne: React.CSSProperties = { fontFamily: "'Syne', sans-serif", fontWeight: 700 };
            const manrope: React.CSSProperties = { fontFamily: "'Manrope', sans-serif" };
            const secLabel: React.CSSProperties = { ...manrope, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: BK.sub, borderBottom: `1px solid rgba(12,45,58,0.1)`, paddingBottom: 8, marginBottom: 16 };
            const bodySpec: React.CSSProperties = { ...manrope, fontSize: "1rem", color: BK.sub, lineHeight: 1.6, maxWidth: "50ch" };

            const BUYERS = [
              { name: "Fresh Foods Ltd", orders: 12, spent: "ZK 45,000", location: "Lusaka", contact: "john@freshfoods.zm", status: "active" },
              { name: "Market Suppliers Co", orders: 8, spent: "ZK 32,000", location: "Ndola", contact: "info@marketsuppliers.zm", status: "active" },
              { name: "Agro Exports", orders: 15, spent: "ZK 68,000", location: "Kitwe", contact: "sales@agroexports.zm", status: "active" },
              { name: "Farm Fresh Zambia", orders: 6, spent: "ZK 28,000", location: "Lusaka", contact: "orders@farmfresh.zm", status: "pending" },
            ];

            return (
              <>
                {/* Google Fonts for Syne + Manrope */}
                <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

                <div style={{ background: BK.foam, borderRadius: BK.rd, padding: 0, overflow: "hidden" }}>
                  {/* ── Hero Typography ── */}
                  <div style={{ padding: "48px 40px 0" }}>
                    <div style={secLabel}>Buyer Management System v1.0</div>
                    <h1 style={{ ...syne, fontWeight: 800, fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 0.9, letterSpacing: "-0.04em", color: BK.deep, marginBottom: 48 }}>
                      BUYERS<br />DIRECTORY
                    </h1>
                  </div>

                  {/* ── Stat Swatches ── */}
                  <div style={{ padding: "0 40px" }}>
                    <div style={secLabel}>01. Key Metrics</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24, marginBottom: 48 }}>
                      {[
                        { label: "Total Buyers", value: String(BUYERS.length), bg: BK.lime, color: BK.deep, name: "Active Network" },
                        { label: "Total Orders", value: String(BUYERS.reduce((s, b) => s + b.orders, 0)), bg: BK.deep, color: "#fff", name: "Completed" },
                        { label: "Total Spent", value: `ZK ${(45000 + 32000 + 68000 + 28000).toLocaleString()}`, bg: BK.stone, color: BK.deep, name: "Revenue" },
                        { label: "Avg Order Value", value: "ZK 4,220", bg: "#fff", color: BK.deep, name: "Per Transaction" },
                      ].map((s, i) => (
                        <motion.div key={i} whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}
                          style={{ background: s.bg, color: s.color, borderRadius: BK.rd, padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 200, position: "relative", overflow: "hidden", border: s.bg === "#fff" ? "1px solid rgba(0,0,0,0.05)" : "none", cursor: "default" }}>
                          <span style={{ ...manrope, fontWeight: 600, fontSize: "0.85rem", opacity: 0.8 }}>{s.label}</span>
                          <div>
                            <div style={{ ...syne, fontSize: "1.75rem", marginBottom: 4 }}>{s.value}</div>
                            <div style={{ ...manrope, fontSize: "0.8rem", opacity: 0.6 }}>{s.name}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* ── Buyer Component Cards ── */}
                  <div style={{ padding: "0 40px" }}>
                    <div style={secLabel}>02. Registered Buyers</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24, marginBottom: 48 }}>
                      {BUYERS.map((buyer, i) => (
                        <motion.div key={i} whileHover={{ y: -3 }} transition={{ duration: 0.25 }}
                          style={{ background: "#fff", padding: 32, borderRadius: BK.rd, border: "1px solid rgba(12,45,58,0.06)", display: "flex", flexDirection: "column", gap: 16, cursor: "pointer" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <h3 style={{ ...syne, fontSize: "1.25rem", color: BK.deep, marginBottom: 4 }}>{buyer.name}</h3>
                              <p style={{ ...manrope, fontSize: "0.85rem", color: BK.sub }}>{buyer.location}</p>
                            </div>
                            <span style={{ display: "inline-flex", padding: "6px 16px", background: buyer.status === "active" ? `rgba(191,255,0,0.15)` : "rgba(44,82,99,0.05)", color: buyer.status === "active" ? BK.deep : BK.mid, borderRadius: BK.pill, fontWeight: 600, fontSize: "0.8rem", ...manrope }}>
                              {buyer.status === "active" ? "● Active" : "◐ Pending"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ display: "inline-flex", padding: "6px 16px", background: "rgba(44,82,99,0.05)", color: BK.deep, borderRadius: BK.pill, fontWeight: 600, fontSize: "0.8rem", border: "1px solid rgba(44,82,99,0.1)", ...manrope }}>{buyer.orders} Orders</span>
                            <span style={{ display: "inline-flex", padding: "6px 16px", background: "rgba(44,82,99,0.05)", color: BK.deep, borderRadius: BK.pill, fontWeight: 600, fontSize: "0.8rem", border: "1px solid rgba(44,82,99,0.1)", ...manrope }}>{buyer.spent}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <Mail className="h-4 w-4" style={{ color: BK.sub }} />
                            <span style={{ ...manrope, fontSize: "0.85rem", color: BK.sub }}>{buyer.contact}</span>
                          </div>
                          <div style={{ borderTop: "1px solid rgba(12,45,58,0.06)", paddingTop: 12, marginTop: 4 }}>
                            <span style={{ ...syne, fontWeight: 700, fontSize: "0.85rem", color: BK.deep, textDecoration: "none", position: "relative", cursor: "pointer" }}>
                              View Details →
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* ── Interface Mockup: Recent Activity ── */}
                  <div style={{ padding: "0 40px 48px" }}>
                    <div style={secLabel}>03. Activity Overview</div>
                    <div style={{ background: BK.deep, borderRadius: BK.rd, padding: 40, color: "#fff", position: "relative", overflow: "hidden" }}>
                      {/* Decorative glow */}
                      <div style={{ position: "absolute", top: "-50%", right: "-20%", width: 600, height: 600, background: "radial-gradient(circle, rgba(191,255,0,0.1) 0%, rgba(191,255,0,0) 70%)", borderRadius: "50%", pointerEvents: "none" }} />

                      {/* Mock nav */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 24, marginBottom: 32 }}>
                        <span style={{ ...syne, fontWeight: 800, fontSize: "1.25rem" }}>AGROCHAIN 360<span style={{ color: BK.lime }}>.</span></span>
                        <div style={{ display: "flex", gap: 20, ...manrope, fontSize: "0.85rem", fontWeight: 500 }}>
                          <span style={{ opacity: 0.8 }}>Buyers</span>
                          <span style={{ opacity: 0.8 }}>Orders</span>
                          <span style={{ opacity: 0.8 }}>Analytics</span>
                        </div>
                      </div>

                      {/* Mock hero */}
                      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 40, alignItems: "center" }}>
                        <div>
                          <h2 style={{ ...syne, fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2.75rem)", lineHeight: 1, marginBottom: 16 }}>
                            VERIFIED<br /><span style={{ color: BK.lime }}>SUPPLY CHAIN.</span>
                          </h2>
                          <p style={{ ...manrope, fontSize: "0.95rem", color: "rgba(255,255,255,0.65)", marginBottom: 24, maxWidth: 380 }}>
                            Direct access to traceable, quality-verified agricultural produce from trusted Zambian farmers.
                          </p>
                          <button style={{ display: "inline-flex", alignItems: "center", background: BK.lime, color: BK.deep, ...syne, fontWeight: 700, fontSize: "0.9rem", padding: "14px 32px", borderRadius: BK.pill, border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(191,255,0,0.3)", transition: "all 0.3s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = BK.limeHover; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(191,255,0,0.5)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = BK.lime; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(191,255,0,0.3)"; }}>
                            Browse Marketplace
                          </button>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: BK.rd, padding: 28, minHeight: 240, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                          <div style={{ ...syne, fontWeight: 700, fontSize: "1.25rem", marginBottom: 4 }}>Top Buyer</div>
                          <div style={{ ...manrope, fontSize: "0.85rem", opacity: 0.7, marginBottom: 4 }}>Agro Exports — ZK 68,000</div>
                          <div style={{ ...manrope, fontSize: "0.8rem", opacity: 0.5 }}>15 orders • Kitwe, Zambia</div>
                          <div style={{ marginTop: 16 }}>
                            <span style={{ display: "inline-flex", padding: "6px 16px", background: "rgba(191,255,0,0.2)", color: BK.lime, borderRadius: BK.pill, fontWeight: 600, fontSize: "0.8rem", ...manrope }}>Top Performer</span>
                          </div>
                        </div>
                      </div>

                      {/* Recent orders strip */}
                      <div style={{ marginTop: 32, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24 }}>
                        <div style={{ ...manrope, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Recent Orders</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                          {[
                            { buyer: "Fresh Foods Ltd", crop: "Mangoes", amount: "ZK 8,500", date: "Mar 7" },
                            { buyer: "Agro Exports", crop: "Cashews", amount: "ZK 12,000", date: "Mar 6" },
                            { buyer: "Market Suppliers", crop: "Tomatoes", amount: "ZK 5,200", date: "Mar 5" },
                          ].map((o, i) => (
                            <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ ...manrope, fontWeight: 600, fontSize: "0.85rem" }}>{o.buyer}</div>
                                <div style={{ ...manrope, fontSize: "0.75rem", opacity: 0.5 }}>{o.crop} • {o.date}</div>
                              </div>
                              <span style={{ ...syne, fontWeight: 700, fontSize: "0.9rem", color: BK.lime }}>{o.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Officers View */}
          {selectedView === "officers" && (
            <div className="space-y-6">
              {/* Officer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#BFFF00', border: '1px solid rgba(12,45,58,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#0C2D3A', opacity: 0.7 }}>Active Officers</p>
                      <p className="text-3xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>{users.filter(u => u.role === 'officer').length}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: '#0C2D3A' }}>
                      <Shield className="h-6 w-6" style={{ color: '#BFFF00' }} />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#0C2D3A' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: 'rgba(255,255,255,0.7)' }}>Eligible for Promotion</p>
                      <p className="text-3xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#fff' }}>{users.filter(u => u.role === 'farmer' && u.verified).length}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(191,255,0,0.2)' }}>
                      <UserPlus className="h-6 w-6" style={{ color: '#BFFF00' }} />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>Total Verifications</p>
                      <p className="text-3xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>176</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(12,45,58,0.08)' }}>
                      <CheckCircle2 className="h-6 w-6" style={{ color: '#0C2D3A' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Promote User Section */}
              <div className="rounded-2xl p-6" style={{ background: '#0C2D3A' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#fff' }}>Promote Users to Officers</h3>
                    <p className="text-sm mt-1" style={{ fontFamily: "'Manrope', sans-serif", color: 'rgba(255,255,255,0.6)' }}>Select verified users to promote to Extension Officer role</p>
                  </div>
                  <button
                    onClick={() => setShowPromoteModal(true)}
                    className="px-4 py-2 rounded-xl transition-colors flex items-center space-x-2" style={{ background: '#BFFF00', color: '#0C2D3A', fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Promote User</span>
                  </button>
                </div>
              </div>

              {/* Database Officers */}
              <div className="rounded-2xl shadow-sm p-8" style={{ background: '#fff', border: '1px solid rgba(12,45,58,0.06)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Registered Verifiers</h2>
                    <p className="mt-1" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>Officers registered in the database</p>
                  </div>
                  <button
                    onClick={loadOfficersFromDB}
                    disabled={loadingOfficers}
                    className="px-3 py-2 text-sm rounded-xl transition-colors flex items-center gap-2" style={{ background: '#F7F9FB', color: '#0C2D3A', fontFamily: "'Manrope', sans-serif" }}
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
                      <div key={officer.id} className="p-4 rounded-2xl transition-colors" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.08)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(12,45,58,0.25)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(12,45,58,0.08)'}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#0C2D3A' }}>
                            <span className="text-lg font-bold" style={{ color: '#BFFF00' }}>{(officer.name || 'V').charAt(0)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4" style={{ color: '#0C2D3A' }} />
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(191,255,0,0.15)', color: '#0C2D3A', fontFamily: "'Manrope', sans-serif" }}>Database</span>
                          </div>
                        </div>
                        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>{officer.name || 'Unnamed Officer'}</h3>
                        <p className="text-xs mt-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>{officer.email || 'No email'}</p>
                        <p className="text-xs" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>{officer.phone || 'No phone'}</p>
                        <p className="text-xs font-mono mt-1" style={{ color: '#5A7684' }}>{officer.wallet_address?.slice(0, 10)}...{officer.wallet_address?.slice(-6)}</p>
                        <p className="text-xs mt-1" style={{ fontFamily: "'Manrope', sans-serif", color: '#BFFF00' }}>Joined: {officer.created_at ? new Date(officer.created_at).toLocaleDateString() : 'Unknown'}</p>
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
              <div className="rounded-2xl shadow-sm p-8" style={{ background: '#fff', border: '1px solid rgba(12,45,58,0.06)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Session Officers</h2>
                    <p className="mt-1" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>Officers promoted during this session (local state)</p>
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

          {/* Traceability View */}
          {selectedView === "traceability" && (
            <div className="space-y-6">
              {/* Traceability Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <QrCode className="h-6 w-6 text-teal-600" />
                      Traceability Dashboard
                    </h2>
                    <p className="text-gray-600 mt-1">Track batches and supply chain events across all farmers</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search batches..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2D3A] w-64"
                      />
                    </div>
                    <button onClick={() => loadTraceabilityData()} className="px-4 py-2 text-white rounded-xl transition-colors flex items-center gap-2" style={{ background: '#0C2D3A' }}>
                      <RefreshCw className={`h-4 w-4 ${loadingBatches ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              {/* Traceability Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>Total Batches</p>
                      <p className="text-3xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>{allBatches.length}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(191,255,0,0.15)' }}>
                      <Package className="h-6 w-6" style={{ color: '#0C2D3A' }} />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>In Transit</p>
                      <p className="text-3xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>{allBatches.filter(b => b.current_status === 'in_transit').length}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(12,45,58,0.08)' }}>
                      <MapPin className="h-6 w-6" style={{ color: '#0C2D3A' }} />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>At Warehouse</p>
                      <p className="text-3xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>{allBatches.filter(b => b.current_status === 'at_warehouse' || b.current_status === 'processing').length}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(12,45,58,0.08)' }}>
                      <Landmark className="h-6 w-6" style={{ color: '#0C2D3A' }} />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>Distributed</p>
                      <p className="text-3xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>{allBatches.filter(b => b.current_status === 'distributed' || b.current_status === 'at_retail').length}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(12,45,58,0.08)' }}>
                      <Truck className="h-6 w-6" style={{ color: '#0C2D3A' }} />
                    </div>
                  </div>
                </div>

              </div>
              {/* Recent Contracts List */}
              <div className="rounded-2xl shadow-sm p-6" style={{ background: '#fff', border: '1px solid rgba(12,45,58,0.06)' }}>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Recent Contracts{loadingContracts && <Loader2 className="inline h-4 w-4 ml-2 animate-spin" />}</h3>
                  {contracts.length > 3 && (
                    <button
                      onClick={() => setShowAllRecentContracts((prev) => !prev)}
                      className="text-sm font-semibold transition-colors" style={{ color: '#0C2D3A' }}
                    >
                      {showAllRecentContracts ? 'Show less' : 'See all'}
                    </button>
                  )}
                </div>
                {contracts.length === 0 && !loadingContracts ? (
                  <p className="text-sm text-gray-500 text-center py-8">No contracts created yet.</p>
                ) : (
                  <div className="space-y-4">
                    {contracts.slice(0, showAllRecentContracts ? contracts.length : 3).map((contract, index) => (
                      <motion.div
                        key={contract.id || contract.contract_code}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 border rounded-2xl hover:shadow-md transition-all cursor-pointer group" style={{ borderColor: 'rgba(12,45,58,0.1)' }}
                        onClick={() => {
                          setSelectedContractId(contract.id);
                          setShowContractDetailModal(true);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl transition-colors" style={{ background: '#F7F9FB' }}>
                            <FileText className="h-6 w-6" style={{ color: '#0C2D3A' }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 font-mono">{contract.contract_code}</h4>
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                                background: contract.status === 'active' ? 'rgba(191,255,0,0.15)' : contract.status === 'completed' ? 'rgba(12,45,58,0.08)' : 'rgba(90,118,132,0.1)',
                                color: '#0C2D3A', fontFamily: "'Manrope', sans-serif"
                              }}>
                                {(contract.status || 'unknown')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{contract.farmer} • {contract.crop} • {contract.amount}</p>
                            <p className="text-xs text-gray-400 mt-1">Created: {contract.date}</p>
                            {contract.blockchain_tx && (
                              <a
                                href={`https://basescan.org/tx/${contract.blockchain_tx}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono text-purple-600 hover:text-purple-800 flex items-center gap-1 mt-1 bg-purple-50 px-2 py-0.5 rounded w-fit"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Activity className="h-3 w-3" />
                                {contract.blockchain_tx.slice(0, 10)}...
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTraceHistoryContractId(contract.id);
                              setTraceHistoryBatchId(null);
                              setTraceHistoryBatchCode(contract.contract_code || null);
                              setShowTraceHistoryModal(true);
                            }}
                            className="px-4 py-2 rounded-xl transition-colors flex items-center gap-2 text-white" style={{ background: '#0C2D3A' }}
                          >
                            <Clock className="h-4 w-4" />
                            History
                          </button>
                          <button
                            className="px-4 py-2 border rounded-xl transition-colors flex items-center gap-2" style={{ borderColor: '#0C2D3A', color: '#0C2D3A' }}
                          >
                            <Eye className="h-4 w-4" />
                            Details
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>


              {/* Universal QR Code Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl shadow-sm p-6" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.08)' }}>
                  <h3 className="text-lg mb-2" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Universal QR Code for Packaging</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    This QR code points to the public lookup page. Print this on all product packaging -
                    customers will scan it and enter the batch code to view traceability info.
                  </p>
                  <div className="flex justify-center">
                    <UniversalQRCode size={180} showDownload={true} />
                  </div>
                </div>

                <div className="rounded-2xl shadow-sm p-6" style={{ background: '#fff', border: '1px solid rgba(12,45,58,0.06)' }}>
                  <h3 className="text-lg mb-4" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Processing Actions</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select a batch that has arrived at the warehouse to begin processing (quality checks, sorting, processing, packaging).
                  </p>
                  <div className="space-y-3">
                    {(() => {
                      const verifiedBatchCodes = new Set(verifiedProducts.map(p => p.batchCode));
                      const activeBatches = allBatches.filter(b =>
                        !verifiedBatchCodes.has(b.batch_code) &&
                        (b.current_status === 'at_warehouse' || b.current_status === 'harvested' || b.current_status === 'in_transit' || b.current_status === 'processing')
                      );
                      const completedContracts = contracts.filter(c =>
                        c.status === 'completed' && c.contract_code && !verifiedBatchCodes.has(c.contract_code)
                      );

                      if (activeBatches.length === 0 && completedContracts.length === 0) {
                        return <p className="text-sm text-gray-500 text-center py-4">No tasks ready for processing yet.</p>;
                      }

                      return (
                        <div className="space-y-3">
                          {/* Render Batches */}
                          {activeBatches.map((batch) => {
                            const hasSavedProgress = !!savedProcessingData[batch.batch_code];
                            return (
                              <button
                                key={batch.id || batch.batch_code}
                                onClick={() => {
                                  setSelectedBatch({
                                    batchCode: batch.batch_code,
                                    cropType: batch.crop_type,
                                    farmerName: batch.farmer_name || 'Unknown',
                                    quantity: `${batch.total_quantity || 0} ${batch.unit || 'kg'}`,
                                  });
                                  setShowProcessingModal(true);
                                }}
                                className="w-full p-4 border rounded-2xl transition-all text-left flex items-center justify-between group"
                                style={{ borderColor: hasSavedProgress ? 'rgba(191,255,0,0.4)' : 'rgba(12,45,58,0.12)', background: hasSavedProgress ? 'rgba(191,255,0,0.05)' : '#fff' }}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono font-semibold" style={{ color: '#0C2D3A' }}>{batch.batch_code}</p>
                                    {hasSavedProgress && (
                                      <span className="px-2 py-0.5 text-xs bg-amber-200 text-amber-800 rounded-full">
                                        In Progress
                                      </span>
                                    )}
                                    <span className="px-2 py-0.5 text-[10px] border border-purple-200 text-purple-600 rounded-full uppercase font-bold">Batch</span>
                                  </div>
                                  <p className="text-sm text-gray-600">{batch.farmer_name} • {batch.crop_type} • {batch.total_quantity || 0} {batch.unit || 'kg'}</p>
                                </div>
                                <div className={`px-3 py-1.5 text-white rounded-lg text-sm opacity-80 group-hover:opacity-100 transition-opacity ${hasSavedProgress ? 'bg-amber-600' : 'bg-purple-600'
                                  }`}>
                                  {hasSavedProgress ? 'Continue Processing' : 'Start Processing'}
                                </div>
                              </button>
                            );
                          })}

                          {/* Render Completed Contracts */}
                          {completedContracts.map((contract) => {
                            const contractBatchCode = contract.contract_code || contract.id;
                            const hasSavedProgress = !!savedProcessingData[contractBatchCode];
                            return (
                              <button
                                key={contract.id}
                                onClick={() => {
                                  setSelectedBatch({
                                    batchCode: contract.contract_code || contract.id,
                                    cropType: contract.crop,
                                    farmerName: contract.farmer,
                                    quantity: contract.amount, // Using amount string for contracts
                                    contractId: contract.id,
                                    farmerId: contract.farmer_id || ''
                                  });
                                  setShowProcessingModal(true);
                                }}
                                className={`w-full p-4 border rounded-lg transition-all text-left flex items-center justify-between group ${hasSavedProgress
                                  ? 'border-amber-300 bg-amber-50 hover:border-amber-500'
                                  : 'border-green-200 hover:border-green-400 hover:bg-green-50'
                                  }`}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono font-semibold text-green-700">{contract.contract_code || contract.id.slice(0, 8)}</p>
                                    <span className="px-2 py-0.5 text-[10px] bg-green-100 text-green-700 rounded-full uppercase font-bold">Delivery Done</span>
                                  </div>
                                  <p className="text-sm text-gray-600">{contract.farmer} • {contract.crop} • {contract.amount}</p>
                                </div>
                                <div className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm opacity-80 group-hover:opacity-100 transition-opacity">
                                  Start Processing
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Products Ready for Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  Products Ready for Distribution ({verifiedProducts.length})
                </h3>
                {verifiedProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No products verified for distribution yet. Complete warehouse processing to add batches here.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Batch Code</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Farmer</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Grade</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NFT</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Verified</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {verifiedProducts.map((product) => (
                          <tr key={product.batchCode} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-sm text-teal-600 font-semibold">{product.batchCode}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{product.cropType}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{product.farmerName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{product.quantity}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.grade === 'Premium' ? 'bg-yellow-100 text-yellow-800' :
                                product.grade === 'Grade A' ? 'bg-green-100 text-green-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                {product.grade}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {product.nftTxHash ? (
                                <a
                                  href={`https://basescan.org/tx/${product.nftTxHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-mono text-purple-600 hover:text-purple-800 flex items-center gap-1"
                                >
                                  {product.nftTxHash.slice(0, 10)}...
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{product.verifiedAt}</td>
                            <td className="px-4 py-3">
                              <a
                                href={`/trace/${product.batchCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 inline-flex items-center gap-1"
                              >
                                View <Eye className="h-3 w-3" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warehouse Processing Modal */}
          {showProcessingModal && selectedBatch && (
            <WarehouseProcessingModal
              isOpen={showProcessingModal}
              onCloseAction={() => {
                setShowProcessingModal(false);
                setSelectedBatch(null);
              }}
              batch={selectedBatch}
              savedData={savedProcessingData[selectedBatch.batchCode]}
              onSaveAction={(processingData: ProcessingResult) => {
                // Store the saved processing data keyed by batch code
                setSavedProcessingData(prev => ({
                  ...prev,
                  [selectedBatch.batchCode]: processingData
                }));
                toast.success(`Progress saved for batch ${selectedBatch.batchCode}`);
                setShowProcessingModal(false);
                setSelectedBatch(null);
              }}
              onCompleteAction={async (processingData: ProcessingResult) => {
                // Save to Supabase
                if (supabase) {
                  try {
                    // 1. Try to update an existing batch
                    const { data: existingBatch, error: findError } = await supabase
                      .from('batches')
                      .select('id')
                      .eq('batch_code', processingData.batchCode)
                      .maybeSingle();

                    if (findError) console.error('Error finding batch:', findError);

                    if (existingBatch) {
                      // Update existing batch
                      const { error } = await supabase
                        .from('batches')
                        .update({
                          blockchain_tx: processingData.nftTxHash,
                          quality_grade: processingData.qualityCheck.grade,
                          current_status: 'ready_for_distribution',
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', existingBatch.id);

                      if (error) console.error('Error updating batch with NFT:', error);
                      else toast.success('Batch updated with NFT details');
                    } else if (selectedBatch.contractId) {
                      // Create new batch from contract
                      const { error } = await supabase
                        .from('batches')
                        .insert({
                          batch_code: processingData.batchCode,
                          contract_id: selectedBatch.contractId,
                          farmer_id: selectedBatch.farmerId,
                          crop_type: selectedBatch.cropType,
                          total_quantity: parseFloat(selectedBatch.quantity.replace(/[^0-9.]/g, '')),
                          quality_grade: processingData.qualityCheck.grade,
                          blockchain_tx: processingData.nftTxHash,
                          current_status: 'ready_for_distribution',
                          public_url: `/trace/${processingData.batchCode}`
                        });

                      if (error) console.error('Error creating batch from contract:', error);
                      else toast.success('New batch created and linked to NFT');
                    } else {
                      console.error('No existing batch found and no contractId provided for new batch creation.');
                    }
                  } catch (err) {
                    console.error('Failed to persist processing data:', err);
                  }
                }

                // Add to local state (will be refreshed from DB anyway if view changes)
                setVerifiedProducts(prev => [...prev, {
                  batchCode: processingData.batchCode,
                  cropType: selectedBatch.cropType,
                  farmerName: selectedBatch.farmerName,
                  quantity: selectedBatch.quantity,
                  grade: processingData.qualityCheck.grade,
                  nftTxHash: processingData.nftTxHash,
                  verifiedAt: new Date().toISOString().split('T')[0]
                }]);

                // --- TRACEABILITY LOGGING ---
                try {
                  const { addTraceabilityEvent, getTraceabilityByBatchCode, logMilestoneEvent } = await import('@/lib/traceabilityService');
                  const traceData = await getTraceabilityByBatchCode(processingData.batchCode);

                  if (traceData?.batch?.id) {
                    const batchId = traceData.batch.id;

                    // 1. Log the Warehouse Processing Complete event
                    await addTraceabilityEvent({
                      batch_id: batchId,
                      event_type: 'processing',
                      event_title: 'Warehouse Processing Complete',
                      event_description: `Batch ${processingData.batchCode} processed, quality graded as ${processingData.qualityCheck.grade}, and NFT minted.`,
                      actor_name: 'Warehouse Admin',
                      actor_type: 'admin',
                      blockchain_tx: processingData.nftTxHash,
                    });

                    // 2. SYNC PREVIOUS MILESTONES: If this batch was created from a contract, 
                    // pull its verified milestones so the journey is complete
                    if (selectedBatch.contractId) {
                      const { data: milestones } = await supabase
                        .from('milestones')
                        .select('*')
                        .eq('contract_id', selectedBatch.contractId)
                        .eq('status', 'verified')
                        .order('completed_date', { ascending: true });

                      if (milestones && milestones.length > 0) {
                        console.log(`Syncing ${milestones.length} milestones for batch ${processingData.batchCode}`);
                        for (const m of milestones) {
                          await logMilestoneEvent(
                            batchId,
                            m.name,
                            selectedBatch.farmerId || '',
                            selectedBatch.farmerName || 'Farmer',
                            m.notes || '',
                            m.metadata?.images || [],
                            m.metadata?.officer_id || ''
                          );
                        }
                      }
                    }
                  }
                  // Refresh the events list
                  loadTraceabilityData();
                } catch (err) {
                  console.error('Error logging warehouse event:', err);
                }

                // Clear saved data for this batch
                setSavedProcessingData(prev => {
                  const newData = { ...prev };
                  delete newData[selectedBatch.batchCode];
                  return newData;
                });
                setShowProcessingModal(false);
                setSelectedBatch(null);
              }}
            />
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
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedUser?.id === user.id
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

          {/* Analytics View — ARKTOS */}
          {selectedView === "analytics" && (
            <div style={{ background: "#F7F9FB", borderRadius: 24, overflow: "hidden" }}>
              <div style={{ padding: "48px 40px 0" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>Platform Analytics v1.0</div>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 0.9, letterSpacing: "-0.04em", color: "#0C2D3A", marginBottom: 48 }}>ANALYTICS<br />OVERVIEW</h1>
              </div>
              <div style={{ padding: "0 40px" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>01. Key Metrics</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24, marginBottom: 48 }}>
                  {[
                    { label: "Growth Rate", value: "+23%", bg: "#BFFF00", color: "#0C2D3A", sub: "vs last month" },
                    { label: "User Engagement", value: "87%", bg: "#0C2D3A", color: "#fff", sub: "active users" },
                    { label: "Revenue Growth", value: "+31%", bg: "#E6E2D6", color: "#0C2D3A", sub: "this quarter" },
                  ].map((s, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.02 }} style={{ background: s.bg, color: s.color, borderRadius: 24, padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 200, cursor: "default" }}>
                      <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: "0.85rem", opacity: 0.8 }}>{s.label}</span>
                      <div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "2rem", marginBottom: 4 }}>{s.value}</div>
                        <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.8rem", opacity: 0.6 }}>{s.sub}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div style={{ padding: "0 40px 48px" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>02. Cost Analysis</div>
                <div style={{ background: "#fff", borderRadius: 24, border: "1px solid rgba(12,45,58,0.06)", padding: 32 }}>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={costData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,45,58,0.06)" />
                        <XAxis dataKey="month" stroke="#5A7684" style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12 }} />
                        <YAxis stroke="#5A7684" style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12 }} />
                        <Tooltip contentStyle={{ fontFamily: "'Manrope',sans-serif", borderRadius: 12, border: "1px solid rgba(12,45,58,0.1)" }} />
                        <Line type="monotone" dataKey="cost" stroke="#BFFF00" strokeWidth={3} dot={{ fill: "#0C2D3A", r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payments View — ARKTOS */}
          {selectedView === "payments" && (
            <div style={{ background: "#F7F9FB", borderRadius: 24, overflow: "hidden" }}>
              <div style={{ padding: "48px 40px 0" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>Payment Operations v1.0</div>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 0.9, letterSpacing: "-0.04em", color: "#0C2D3A", marginBottom: 48 }}>WALLET &<br />PAYMENTS</h1>
              </div>
              <div style={{ padding: "0 40px" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>01. Wallet Operations</div>
                <div style={{ background: "#fff", borderRadius: 24, border: "1px solid rgba(12,45,58,0.06)", padding: 32, marginBottom: 48 }}>
                  {evmAddress ? (
                    <WalletBalance walletAddress={evmAddress} userRole="admin" userName="Cherry Pick Admin" userEmail="admin@cherrypick.africa" />
                  ) : (
                    <div className="p-8 text-center">
                      <Wallet className="w-12 h-12 mx-auto mb-3" style={{ color: "#5A7684" }} />
                      <p style={{ fontFamily: "'Manrope',sans-serif", color: "#5A7684" }}>Please sign in with Base to view admin balances.</p>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: "0 40px 48px" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>02. Recent Transactions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { id: "TXN001", from: "Fresh Foods Ltd", to: "John Mwale", amount: "K15,000", status: "completed", date: "2024-11-07", hash: "0x742d35..." },
                    { id: "TXN002", from: "Market Suppliers", to: "Mary Banda", amount: "K12,000", status: "completed", date: "2024-11-07", hash: "0x8ba1f1..." },
                    { id: "TXN003", from: "Agro Exports", to: "Peter Phiri", amount: "K8,500", status: "processing", date: "2024-11-07", hash: "0x9f2df0..." },
                    { id: "TXN004", from: "Farm Fresh", to: "Sarah Phiri", amount: "K10,000", status: "completed", date: "2024-11-06", hash: "0x3c8a2b..." },
                  ].map((p) => (
                    <div key={p.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color .2s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(191,255,0,0.4)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(12,45,58,0.06)")}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 40, height: 40, background: "#0C2D3A", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <DollarSign style={{ width: 18, height: 18, color: "#BFFF00" }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#0C2D3A" }}>{p.id}</div>
                          <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.8rem", color: "#5A7684" }}>{p.from} → {p.to}</div>
                          <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.7rem", color: "#9aa5a8" }}>{p.date} • {p.hash}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0C2D3A" }}>{p.amount}</span>
                        <span style={{ fontFamily: "'Manrope',sans-serif", padding: "4px 14px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, background: p.status === "completed" ? "rgba(191,255,0,0.15)" : "rgba(44,82,99,0.08)", color: p.status === "completed" ? "#0C2D3A" : "#2C5263" }}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings View — ARKTOS */}
          {selectedView === "settings" && (
            <div style={{ background: "#F7F9FB", borderRadius: 24, overflow: "hidden" }}>
              <div style={{ padding: "48px 40px 0" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>System Configuration v1.0</div>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 0.9, letterSpacing: "-0.04em", color: "#0C2D3A", marginBottom: 48 }}>PLATFORM<br />SETTINGS</h1>
              </div>
              <div style={{ padding: "0 40px 48px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                  {[
                    { title: "General", items: [{ k: "Platform Name", v: "Cherry Pick" }, { k: "Currency", v: "ZMW (Kwacha)" }, { k: "Time Zone", v: "Africa/Lusaka" }, { k: "Language", v: "English" }] },
                    { title: "Verification", items: [{ k: "Officer Fee", v: "K50" }, { k: "Auto-approve Farmers", v: "Enabled", accent: true }, { k: "Min Listing Quality", v: "Grade B" }] },
                    { title: "Payment", items: [{ k: "Platform Fee", v: "2.5%" }, { k: "Payment Network", v: "Base (Coinbase L2)" }] },
                  ].map((section, si) => (
                    <div key={si} style={{ background: "#fff", borderRadius: 24, border: "1px solid rgba(12,45,58,0.06)", padding: 32 }}>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 20 }}>{`0${si + 1}. ${section.title}`}</div>
                      <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#0C2D3A", marginBottom: 20 }}>{section.title} Settings</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {section.items.map((item, ii) => (
                          <div key={ii} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(12,45,58,0.06)", transition: "border-color .2s" }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(191,255,0,0.3)")}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(12,45,58,0.06)")}>
                            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.85rem", color: "#5A7684" }}>{item.k}</span>
                            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.85rem", color: (item as any).accent ? "#6fba00" : "#0C2D3A" }}>{item.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bidding View */}
          {selectedView === "bidding" && (
            <AdminBiddingPanel />
          )}
        </main>
      </div>

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
      {
        showContractModal && (
          <AdminCreateContractModal
            onCloseAction={() => setShowContractModal(false)}
            onContractCreatedAction={handleCreateContract}
          />
        )
      }

      {/* Contract Detail Modal */}
      {
        showContractDetailModal && selectedContractId && (
          <AdminContractDetailModal
            isOpen={showContractDetailModal}
            onCloseAction={() => {
              setShowContractDetailModal(false);
              setSelectedContractId(null);
            }}
            contractId={selectedContractId}
          />
        )
      }

      {/* Admin Approval Modal for Verifications */}
      {
        showApprovalModal && selectedVerification && (
          <AdminApprovalModal
            isOpen={showApprovalModal}
            onCloseAction={() => {
              setShowApprovalModal(false);
              setSelectedVerification(null);
            }}
            milestone={{
              id: selectedVerification.milestone_id,
              name: selectedVerification.milestone_name,
              description: `${selectedVerification.crop_type} - Payment: K${selectedVerification.payment_amount.toLocaleString()}`,
              farmerName: selectedVerification.farmer_name,
              farmerActivities: selectedVerification.farmer_activities || [],
              officerEvidence: {
                images: selectedVerification.evidence_images,
                iotReadings: selectedVerification.officer_iot_readings || [],
                notes: selectedVerification.officer_notes,
                officerName: selectedVerification.officer_name,
              },
            }}
            onApproveAction={async (adminNotes: string) => {
              // Approve milestone and trigger payment release
              try {
                const farmerPayment = selectedVerification.payment_amount;

                // Calculate verifier fee based on contract value and milestone count
                const feeBreakdown = getVerifierFeeBreakdown(
                  selectedVerification.total_contract_value,
                  selectedVerification.total_milestones,
                  selectedVerification.custom_verifier_fee_percent
                );
                const verifierFee = feeBreakdown.feePerMilestone;
                const totalRequired = farmerPayment + verifierFee;

                // --- PRE-APPROVAL FUND CHECK ---
                // Check if the admin/platform wallet has sufficient funds before approving
                if (supabase && evmAddress) {
                  const { data: adminPayments } = await supabase
                    .from('payments')
                    .select('amount, status, to_address, from_address')
                    .or(`to_address.eq.${evmAddress},from_address.eq.${evmAddress}`);

                  let adminBalance = 0;
                  if (adminPayments) {
                    for (const p of adminPayments) {
                      const status = (p.status || '').toLowerCase();
                      if (status !== 'completed' && status !== 'confirmed') continue;
                      const isIncoming = p.to_address === evmAddress;
                      const isOutgoing = p.from_address === evmAddress;
                      if (isIncoming) adminBalance += Math.abs(p.amount || 0);
                      if (isOutgoing) adminBalance -= Math.abs(p.amount || 0);
                    }
                  }

                  if (adminBalance < totalRequired) {
                    toast.error(
                      `Insufficient platform funds! Need K${totalRequired.toLocaleString(undefined, { minimumFractionDigits: 2 })} but wallet has K${adminBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}.\nPlease deposit funds before approving.`,
                      { duration: 6000 }
                    );
                    return;
                  }
                }
                // --- END FUND CHECK ---

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

                    // --- NEW: Traceability Integration ---
                    // Log the milestone event in traceability system
                    // This will also update the batch status (e.g., to 'at_warehouse' or 'harvested')
                    try {
                      console.log('Syncing milestone to traceability...');
                      // Find associated batch
                      const { data: batchData } = await supabase
                        .from('batches')
                        .select('id')
                        .eq('contract_id', selectedVerification.contract_id)
                        .single();

                      if (batchData) {
                        await logMilestoneEvent(
                          batchData.id,
                          selectedVerification.milestone_name,
                          selectedVerification.farmer_id,
                          selectedVerification.farmer_name,
                          adminNotes,
                          selectedVerification.evidence_images
                        );
                        console.log('Traceability event logged and batch status updated.');
                      } else {
                        console.warn('No batch found for contract', selectedVerification.contract_id);
                      }
                    } catch (traceError) {
                      console.error('Failed to log traceability event:', traceError);
                      // Don't throw, just log. We don't want to break the main approval flow
                    }
                    // --- END Traceability Integration ---
                  }


                  // --- TRACEABILITY LOGGING ---
                  try {
                    console.log('Logging milestone to traceability...');
                    const batches = await getBatchesByContract(selectedVerification.contract_id);
                    if (batches && batches.length > 0) {
                      // Use the most recent batch
                      const batch = batches[0];
                      await logMilestoneEvent(
                        batch.id!,
                        selectedVerification.milestone_name,
                        selectedVerification.farmer_id,
                        selectedVerification.farmer_name,
                        adminNotes,
                        selectedVerification.evidence_images,
                        selectedVerification.contract?.farmer?.user_id
                      );
                      console.log('Traceability event logged successfully');
                    } else {
                      console.warn('No batch found for contract, skipping traceability log');
                    }
                  } catch (traceError) {
                    console.error('Error logging traceability event:', traceError);
                    // Don't fail the whole approval if traceability logging fails
                  }
                  // --- END TRACEABILITY LOGGING ---

                  // Record payments in database for dashboard display
                  // Uses only real DB columns: from_address, to_address, amount, currency, payment_type, reference_id, reference_type, transaction_hash, status, confirmed_at
                  const paymentInserts: Array<Record<string, unknown>> = [
                    {
                      to_address: selectedVerification.farmer_wallet,
                      from_address: evmAddress || 'platform',
                      amount: farmerPayment,
                      currency: 'ZMW',
                      payment_type: 'milestone',
                      reference_id: selectedVerification.milestone_id,
                      reference_type: 'milestone',
                      transaction_hash: `MS-${selectedVerification.milestone_id}-${Date.now()}`,
                      status: 'confirmed',
                      confirmed_at: new Date().toISOString(),
                    },
                  ];

                  // Only add verifier payment if we have a wallet address and fee > 0
                  if (selectedVerification.officer_wallet && verifierFee > 0) {
                    paymentInserts.push({
                      to_address: selectedVerification.officer_wallet,
                      from_address: evmAddress || 'platform',
                      amount: verifierFee,
                      currency: 'ZMW',
                      payment_type: 'platform_fee',
                      reference_id: selectedVerification.milestone_id,
                      reference_type: 'milestone',
                      transaction_hash: `VF-${selectedVerification.milestone_id}-${Date.now()}`,
                      status: 'confirmed',
                      confirmed_at: new Date().toISOString(),
                    });
                  }

                  const { error: paymentError } = await supabase.from('payments').insert(paymentInserts);
                  if (paymentError) {
                    console.error('Error recording payments:', paymentError);
                  } else {
                    console.log('Payments recorded successfully for farmer + verifier');
                  }
                }

                // Show success with payment details
                toast.success(
                  `✅ Milestone Approved!\n` +
                  `💰 Farmer: K${farmerPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })} → ${selectedVerification.farmer_name}\n` +
                  `🔍 Verifier: K${verifierFee.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${feeBreakdown.feePerMilestonePercent.toFixed(2)}%) → ${selectedVerification.officer_name}`,
                  { duration: 5000 }
                );

                // Remove from pending list
                setPendingVerifications(prev => prev.filter(v => v.id !== selectedVerification.id));
                setShowApprovalModal(false);
                setShowApprovalModal(false);
                setSelectedVerification(null);
              } catch (error: any) { // Keep any for logging if preferred, or unknown
                console.error('Approval error:', error);
                toast.error('Failed to process approval');
                throw error;
              }
            }}
            onRejectAction={async (adminNotes: string) => {
              // Reject milestone
              try {
                if (supabase) {
                  // Fetch existing metadata to preserve officer evidence
                  const { data: existingMilestone } = await supabase
                    .from('milestones')
                    .select('metadata')
                    .eq('id', selectedVerification.milestone_id)
                    .single();

                  const existingMetadata = existingMilestone?.metadata || {};

                  await supabase
                    .from('milestones')
                    .update({
                      status: 'rejected',
                      metadata: {
                        ...existingMetadata,
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
              } catch (error: unknown) {
                console.error('Rejection error:', error);
                throw error;
              }
            }}
          />
        )
      }

      {/* Traceability History Modal */}
      {showTraceHistoryModal && (
        <AdminTraceabilityHistoryModal
          isOpen={showTraceHistoryModal}
          onCloseAction={() => {
            setShowTraceHistoryModal(false);
            setTraceHistoryContractId(null);
            setTraceHistoryBatchId(null);
            setTraceHistoryBatchCode(null);
          }}
          contractId={traceHistoryContractId || undefined}
          batchId={traceHistoryBatchId || undefined}
          batchCode={traceHistoryBatchCode || undefined}
        />
      )}
    </div>
  );
}
