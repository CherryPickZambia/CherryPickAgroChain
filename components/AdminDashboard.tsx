"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users, FileText, TrendingUp, DollarSign, Activity, ArrowUp, ArrowDown,
  MapPin, Clock, CheckCircle, CheckCircle2, Settings, Package, Search, Plus, Sun, Menu,
  ShoppingBag, User, UserPlus, Shield, XCircle, AlertCircle, Eye,
  MoreVertical, Filter, Download, Calendar, Leaf, Globe, Phone, Mail,
  ChevronRight, ExternalLink, Landmark, Award, BarChart3, PieChart,
  Wallet, Zap, Target, RefreshCw, QrCode, Truck, Loader2, Layout, MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getUsersByRole, getAllContracts, getOrCreateUser, suspendFarmer as suspendFarmerService, reactivateFarmer as reactivateFarmerService, rejectFarmer as rejectFarmerService } from "@/lib/supabaseService";
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
import { dc } from "@/lib/dashboardTheme";
import LandingPageEditor from "./LandingPageEditor";
import AdminConsumerQR from "./AdminConsumerQR";
import AdminBehindTheScenes from "./AdminBehindTheScenes";
import {
  getAdminDashboardStats,
  getCropDistribution,
  getMonthlyPaymentTrend,
  getFarmersWithStats,
  getBuyersWithStats,
  getRecentPayments,
  getRecentGrowthActivities,
  getRecentMarketplaceOrders,
  getContractFinancials,
  getExtendedAnalytics,
  formatRevenue,
  computeAnalyticsGrowth,
  type ContractFinancials,
  type ExtendedAnalytics,
  type AdminDashboardStats,
  type CropDistributionItem,
  type MonthlyTrendPoint,
  type BuyerDashboardRow,
  type PaymentDashboardRow,
  type GrowthActivityRow,
  type MarketplaceOrderRow,
} from "@/lib/adminDashboardData";
import { buildFarmMapEntries } from "@/lib/farmerMapUtils";
import { loadPlatformSettings, savePlatformSettings, DEFAULT_SETTINGS, type PlatformSettings } from "@/lib/platformSettings";

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
  status?: "pending" | "approved" | "rejected" | "suspended";
  suspensionReason?: string | null;
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
  const [verifiedProducts, setVerifiedProducts] = useState<VerifiedProduct[]>([]);

  // Live dashboard metrics (Supabase)
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats>({
    totalFarmers: 0,
    activeFarmers: 0,
    activeContracts: 0,
    marketplaceListings: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
    completedVerifications: 0,
  });
  const [cropData, setCropData] = useState<CropDistributionItem[]>([]);
  const [costData, setCostData] = useState<MonthlyTrendPoint[]>([]);
  const [financials, setFinancials] = useState<ContractFinancials | null>(null);
  const [extendedAnalytics, setExtendedAnalytics] = useState<ExtendedAnalytics | null>(null);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [recentPayments, setRecentPayments] = useState<PaymentDashboardRow[]>([]);
  const [recentActivities, setRecentActivities] = useState<GrowthActivityRow[]>([]);
  const [buyersList, setBuyersList] = useState<BuyerDashboardRow[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<MarketplaceOrderRow[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

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
      } else {
        setVerifiedProducts([]);
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

  // Load farmers from database with contract/payment stats
  const loadFarmers = async () => {
    try {
      setLoadingFarmers(true);
      try {
        await fetch("/api/farmers/ensure-coordinates", { method: "POST" });
      } catch (backfillError) {
        console.warn("Coordinate backfill skipped:", backfillError);
      }
      const mappedFarmers = await getFarmersWithStats();
      setFarmersList(mappedFarmers);
      setUsers(mappedFarmers);
    } catch (error) {
      console.error("Error loading farmers:", error);
      toast.error("Failed to load farmers");
      setFarmersList([]);
      setUsers([]);
    } finally {
      setLoadingFarmers(false);
    }
  };

  const loadDashboardMetrics = async () => {
    try {
      setLoadingDashboard(true);
      const [stats, crops, trend, payments, activities, fin, extended] = await Promise.all([
        getAdminDashboardStats(),
        getCropDistribution(),
        getMonthlyPaymentTrend(),
        getRecentPayments(20),
        getRecentGrowthActivities(5),
        getContractFinancials(),
        getExtendedAnalytics(),
      ]);
      setDashboardStats(stats);
      setCropData(crops);
      setCostData(trend);
      setRecentPayments(payments);
      setRecentActivities(activities);
      setFinancials(fin);
      setExtendedAnalytics(extended);
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadBuyersData = async () => {
    try {
      setLoadingBuyers(true);
      const [buyers, orders] = await Promise.all([
        getBuyersWithStats(),
        getRecentMarketplaceOrders(10),
      ]);
      setBuyersList(buyers);
      setBuyerOrders(orders);
    } catch (error) {
      console.error("Error loading buyers:", error);
      setBuyersList([]);
      setBuyerOrders([]);
    } finally {
      setLoadingBuyers(false);
    }
  };

  const dashboardMapFarms = useMemo(() => buildFarmMapEntries(farmersList), [farmersList]);
  const farmersTabMapFarms = useMemo(
    () => buildFarmMapEntries(farmersList, { active: "#10b981", pending: "#f59e0b" }),
    [farmersList],
  );

  // Approve farmer function
  const approveFarmer = async (farmerId: string, farmerName: string) => {
    try {
      const { error } = await supabase
        .from('farmers')
        .update({ status: 'approved', suspension_reason: null, rejection_reason: null })
        .eq('id', farmerId);

      if (error) throw error;

      toast.success(`${farmerName} has been approved!`);
      loadFarmers();
    } catch (error) {
      console.error('Error approving farmer:', error);
      toast.error('Failed to approve farmer');
    }
  };

  const suspendFarmerAccount = async (farmerId: string, farmerName: string) => {
    const reason = window.prompt(
      `Suspend ${farmerName}? They will lose access to contracts, bidding, batches, and paid features.\n\nOptional reason:`,
      'Suspended by admin'
    );
    if (reason === null) return;
    try {
      await suspendFarmerService(farmerId, reason.trim() || 'Suspended by admin');
      toast.success(`${farmerName} has been suspended`);
      loadFarmers();
      setSelectedFarmer((prev) =>
        prev && prev.id === farmerId
          ? { ...prev, verified: false, status: 'suspended', suspensionReason: reason.trim() || 'Suspended by admin' }
          : prev
      );
    } catch (error) {
      console.error('Error suspending farmer:', error);
      toast.error('Failed to suspend farmer');
    }
  };

  const reactivateFarmerAccount = async (farmerId: string, farmerName: string) => {
    try {
      await reactivateFarmerService(farmerId);
      toast.success(`${farmerName} has been reactivated`);
      loadFarmers();
      setSelectedFarmer((prev) =>
        prev && prev.id === farmerId
          ? { ...prev, verified: true, status: 'approved', suspensionReason: null }
          : prev
      );
    } catch (error) {
      console.error('Error reactivating farmer:', error);
      toast.error('Failed to reactivate farmer');
    }
  };

  const rejectFarmerAccount = async (farmerId: string, farmerName: string) => {
    const reason = window.prompt(`Reject ${farmerName}? Optional reason:`, 'Application rejected');
    if (reason === null) return;
    try {
      await rejectFarmerService(farmerId, reason.trim() || 'Application rejected');
      toast.success(`${farmerName} has been rejected`);
      loadFarmers();
    } catch (error) {
      console.error('Error rejecting farmer:', error);
      toast.error('Failed to reject farmer');
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
    if (loadingVerifications) {
      console.log('Already loading verifications, skipping duplicate call');
      return;
    }
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

      // Fetch farmer traceability activities per contract (parallel)
      const farmerActivitiesByContract: Record<string, Array<{ type: string; description: string; quantity?: number; unit?: string; date: string; notes?: string; photos?: string[] }>> = {};
      await Promise.all(contractIds.map(async (contractId) => {
        try {
          const batches = await getBatchesByContract(contractId);
          if (batches && batches.length > 0) {
            const events = await getBatchTraceability(batches[0].id!);
            // Filter to farmer-logged activities only (exclude system/admin/verifier events)
            const farmerEvents = events.filter((e: TraceabilityEvent) =>
              e.actor_type === 'farmer' || !e.actor_type
            );
            farmerActivitiesByContract[contractId] = farmerEvents.map((e: TraceabilityEvent) => ({
              type: e.event_type || 'update',
              description: e.event_description || e.event_title || '',
              quantity: e.quantity,
              unit: e.unit,
              date: e.created_at || new Date().toISOString(),
              notes: e.location_address ? `Location: ${e.location_address}` : undefined,
              photos: e.photos || undefined,
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
          // Prefer activities the farmer logged through MilestoneCard (stored in milestone.metadata.farmer_activities).
          // Fall back to traceability events when present, otherwise empty array.
          farmer_activities: (() => {
            const fromMetadata = Array.isArray(metadata.farmer_activities)
              ? metadata.farmer_activities.map((a: any) => ({
                  type: a.entryType === 'observation' ? (a.type || 'observation') : (a.type || 'activity'),
                  description: a.description || a.title || '',
                  quantity: a.quantity,
                  unit: a.unit,
                  date: a.date || a.created_at || milestone.completed_date || new Date().toISOString(),
                  notes: a.notes || a.recommendations,
                  photos: a.evidencePhotos || a.photos || [],
                }))
              : [];
            const fromTraceability = farmerActivitiesByContract[milestone.contract_id] || [];
            return fromMetadata.length > 0 ? fromMetadata : fromTraceability;
          })(),
          officer_ai_analysis: metadata.officer_ai_analysis || metadata.ai_analysis || null,
        };
      });

      console.log('Processed verifications with IoT + activities:', verifications);
      setPendingVerifications(verifications);

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
    loadDashboardMetrics();
    loadOfficersFromDB();
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
    if (selectedView === 'buyers') {
      loadBuyersData();
    }
    if (selectedView === 'payments') {
      getRecentPayments(20).then(setRecentPayments);
    }
    if (selectedView === 'analytics' || selectedView === 'dashboard') {
      loadDashboardMetrics();
    }
    if (selectedView === 'settings' || selectedView === 'buyers') {
      loadPlatformSettings().then(setSettings).catch(() => {});
    }
  }, [selectedView]);

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await savePlatformSettings(settings);
      toast.success("Settings saved");
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle creating a new job (local only - growth activities come from farmer logs)
  const handleCreateJob = (_newJob: JobData) => {
    toast.success("Job logged locally. Farm activities sync from farmer milestone logs.");
  };

  // Handle creating a new contract. Reload from the DB so the list reflects the
  // real persisted row (correct id, contract_code, created date, farmer, value) -
  // building an optimistic row here caused "contract undefined", an invalid date,
  // and a fake id that failed to open the detail modal until a manual refresh.
  const handleCreateContract = async () => {
    setShowContractModal(false);
    await loadContracts();
  };

  // Handle farmer card click
  const handleFarmerClick = (farmer: FarmerUI) => {
    setSelectedFarmer(farmer);
    setShowFarmerModal(true);
  };

  const analyticsGrowth = computeAnalyticsGrowth(costData);
  const totalCropValue = cropData.reduce((sum, c) => sum + c.value, 0);
  const latestPaymentVolume = costData.length ? costData[costData.length - 1].cost : 0;

  const stats = {
    totalFarmers: { value: dashboardStats.activeFarmers, subtitle: "Approved Farmers" },
    activeContracts: { value: dashboardStats.activeContracts, subtitle: "Active Contracts" },
    marketplaceListings: { value: dashboardStats.marketplaceListings, subtitle: "Active Listings" },
    totalRevenue: { value: formatRevenue(dashboardStats.totalRevenue), subtitle: "Completed Payments" },
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
    { icon: MessageSquare, label: "Consumer QR", id: "consumer" },
    { icon: Package, label: "Behind Scenes", id: "behind-scenes" },
    { icon: TrendingUp, label: "Analytics", id: "analytics" },
    { icon: DollarSign, label: "Payments", id: "payments" },
    { icon: Award, label: "Bidding", id: "bidding" },
    { icon: Layout, label: "Landing Page", id: "landing" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  const activeMenuItem = menuItems.find((item) => item.id === selectedView) || menuItems[0];

  // Handle promoting a user to officer
  const handlePromoteToOfficer = async (user: FarmerUI) => {
    try {
      if (!user.wallet) {
        toast.error("This farmer has no wallet address on file, so their role cannot be changed.");
        return;
      }
      // Match the users table by wallet address (not the farmers row id). Using
      // getOrCreateUser also creates/updates the users row if it was missing.
      await getOrCreateUser(user.wallet, 'officer', user.name);
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, role: "officer" } : u
      ));
      toast.success(`${user.name} has been promoted to Extension Officer!`);
      setShowPromoteModal(false);
      setSelectedUser(null);
      loadOfficersFromDB();
      loadFarmers();
    } catch (error) {
      toast.error("Failed to promote user");
    }
  };

  // Handle demoting an officer
  const handleDemoteOfficer = async (user: FarmerUI) => {
    try {
      if (!user.wallet) {
        toast.error("This officer has no wallet address on file, so their role cannot be changed.");
        return;
      }
      await getOrCreateUser(user.wallet, 'farmer', user.name);
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, role: "farmer" } : u
      ));
      toast.success(`${user.name} has been demoted from Officer role.`);
      loadOfficersFromDB();
      loadFarmers();
    } catch (error) {
      toast.error("Failed to demote officer");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] dashboard-shell">
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
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-gray-100 overflow-hidden">
              <img src="/logo-new.png" alt="Cherry Pick" className="w-9 h-9 object-contain" />
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
            <p style={{ fontFamily: "'Manrope', sans-serif" }} className="text-[#5A7684] mt-1 text-sm">
              {selectedView === "landing"
                ? "Edit homepage images, copy, metrics, and farmer reviews - saved changes appear on the public site."
                : "Manage farmers, contracts, verifications, payments, and marketplace activity from one place."}
            </p>
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
                      <p className={dc.labelSm + " mb-1"}>Total Farmers</p>
                      <p className={dc.value}>{stats.totalFarmers.value}</p>
                      <p className={dc.sub}>{stats.totalFarmers.subtitle}</p>
                    </div>
                    <div className={dc.iconBoxLime}>
                      <Users className={dc.iconLime} />
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
                      <p className={dc.labelSm + " mb-1"}>Active Contracts</p>
                      <p className={dc.value}>{stats.activeContracts.value}</p>
                      <p className={dc.sub}>{stats.activeContracts.subtitle}</p>
                    </div>
                    <div className={dc.iconBoxLime}>
                      <FileText className={dc.iconLime} />
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
                      <p className={dc.labelSm + " mb-1"}>Marketplace Listings</p>
                      <p className={dc.value}>{stats.marketplaceListings.value}</p>
                      <p className={dc.sub}>{stats.marketplaceListings.subtitle}</p>
                    </div>
                    <div className={dc.iconBoxLime}>
                      <ShoppingBag className={dc.iconLime} />
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
                      <p className={dc.labelSm + " mb-1"}>Platform Revenue</p>
                      <p className={dc.value}>{stats.totalRevenue.value}</p>
                      <p className={dc.sub}>{stats.totalRevenue.subtitle}</p>
                    </div>
                    <div className={dc.iconBoxLime}>
                      <DollarSign className={dc.iconLime} />
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
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      onClick={() => { loadFarmers(); loadDashboardMetrics(); }}
                      disabled={loadingDashboard}
                      className="dashboard-button-secondary flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all"
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingDashboard ? 'animate-spin' : ''}`} />
                      <span className="text-sm font-semibold">Refresh</span>
                    </button>
                  </div>
                  <div className="relative h-96 rounded-xl overflow-hidden">
                    <FarmMap
                      farms={dashboardMapFarms}
                      onFarmClick={(farm) => {
                        const farmer = farmersList.find(x => x.id === farm.id);
                        if (farmer) handleFarmerClick(farmer);
                      }}
                    />
                  </div>
                </motion.div>

                {/* Crop Distribution */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="dashboard-panel rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={dc.heading}>Crop Distribution</h3>
                    <span className={dc.sub}>By contract value</span>
                  </div>
                  {cropData.length === 0 ? (
                    <div className="text-center py-12 text-[#5A7684]">
                      <Leaf className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No contract data yet</p>
                    </div>
                  ) : (
                  <>
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-48 h-48">
                      <ResponsiveContainer width="100%" height={192}>
                        <RePieChart>
                          <Pie data={cropData as { name: string; value: number }[]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2}>
                            {cropData.map((crop) => (
                              <Cell key={crop.name} fill={crop.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => [`ZK ${Number(v).toLocaleString()}`, "Value"]} />
                        </RePieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-2xl font-bold text-gray-800">{formatRevenue(totalCropValue)}</p>
                        <p className="text-xs text-gray-500">Total value</p>
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
                          <p className="text-xs text-gray-500">ZK {crop.value.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  </>
                  )}
                </motion.div>
              </div>

              {/* Bottom Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cost Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`lg:col-span-2 ${dc.panel} p-6`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={dc.heading}>Payment Volume</h3>
                    <span className={dc.sub}>Last 8 months</span>
                  </div>
                  {costData.length === 0 ? (
                    <div className="text-center py-12 text-[#5A7684]">
                      <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No completed payments yet</p>
                    </div>
                  ) : (
                  <>
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
                        stroke="#0C2D3A"
                        strokeWidth={3}
                        dot={{ fill: "#BFFF00", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex items-center justify-center">
                    <div className={dc.metricBadge}>
                      <p>{formatRevenue(latestPaymentVolume)}</p>
                    </div>
                  </div>
                  </>
                  )}
                </motion.div>

                {/* Recent farm activities */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={`${dc.panel} p-6`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={dc.heading}>Recent Farm Activity</h3>
                  </div>
                  <div className="space-y-3">
                    {recentActivities.length === 0 ? (
                      <p className={dc.sub + " text-center py-6"}>No logged farm activities yet</p>
                    ) : recentActivities.map((job) => (
                      <div key={job.id} className={dc.listItem}>
                        <div className={dc.iconBox}>
                          <Clock className={dc.icon} />
                        </div>
                        <div className="flex-1">
                          <p className={dc.valueSm}>{job.title}</p>
                          <p className={dc.sub}>{job.location} • {job.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-6 ${dc.statusBanner}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`${dc.valueSm} mb-1`}>Platform Health</p>
                        <p className={dc.sub}>All systems operational</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={dc.statusDot} />
                        <span className={dc.statusActive}>Active</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {/* Verifications View - ARKTOS */}
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
                    <CheckCircle2 className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
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
                        className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer bg-white"
                        onClick={() => {
                          setSelectedVerification(verification);
                          setShowApprovalModal(true);
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2 bg-emerald-50 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-emerald-600" />
                          </div>
                          <span className="text-lg font-bold text-emerald-600">
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

                        <button className="w-full mt-3 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2">
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

          {/* Contracts View - ARKTOS */}
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
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#0C2D3A" }}>{contract.contract_code || contract.id.slice(0, 8)} · {contract.crop}</div>
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

          {/* Farmers View - ARKTOS */}
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
                    <span>{farmersList.length} farmers</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#BFFF00" }} />Verified</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />Pending</span>
                  </div>
                </div>
                <div className="relative h-96 bg-white overflow-hidden p-0 rounded-xl">
                  <FarmMap
                    farms={farmersTabMapFarms}
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
                        {farmer.status === 'suspended' ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(220,38,38,0.12)' }}>
                            <XCircle className="h-3 w-3" style={{ color: '#b91c1c' }} />
                            <span className="text-xs font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: '#b91c1c' }}>Suspended</span>
                          </div>
                        ) : farmer.verified ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(191,255,0,0.15)' }}>
                            <CheckCircle2 className="h-3 w-3" style={{ color: '#0C2D3A' }} />
                            <span className="text-xs font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: '#0C2D3A' }}>Verified</span>
                          </div>
                        ) : farmer.status === 'rejected' ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(12,45,58,0.08)' }}>
                            <XCircle className="h-3 w-3" style={{ color: '#5A7684' }} />
                            <span className="text-xs font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>Rejected</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(12,45,58,0.06)' }}>
                            <Clock className="h-3 w-3" style={{ color: '#5A7684' }} />
                            <span className="text-xs font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>Pending</span>
                          </div>
                        )}
                      </div>

                      {farmer.status === 'suspended' && farmer.suspensionReason && (
                        <p className="text-xs mb-3 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(220,38,38,0.06)', color: '#b91c1c' }}>
                          {farmer.suspensionReason}
                        </p>
                      )}

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
                          <p className="text-lg font-bold" style={{ color: '#0C2D3A' }}>ZK {farmer.totalEarnings.toLocaleString()}</p>
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
                          {farmer.status === 'pending' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approveFarmer(farmer.id, farmer.name);
                                }}
                                className="px-3 py-1 text-xs font-medium text-white rounded-lg transition-colors" style={{ background: '#0C2D3A' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rejectFarmerAccount(farmer.id, farmer.name);
                                }}
                                className="px-3 py-1 text-xs font-medium rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {farmer.status === 'approved' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                suspendFarmerAccount(farmer.id, farmer.name);
                              }}
                              className="px-3 py-1 text-xs font-medium rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50"
                            >
                              Suspend
                            </button>
                          )}
                          {(farmer.status === 'suspended' || farmer.status === 'rejected') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                reactivateFarmerAccount(farmer.id, farmer.name);
                              }}
                              className="px-3 py-1 text-xs font-medium text-white rounded-lg" style={{ background: '#0C2D3A' }}
                            >
                              Reactivate
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

          {/* Buyers View - ARKTOS-inspired Brand System */}
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

            const BUYERS = buyersList;
            const totalOrders = BUYERS.reduce((s, b) => s + b.orders, 0);
            const totalSpent = BUYERS.reduce((s, b) => s + b.spent, 0);
            const avgOrder = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
            const platformCommission = Math.round(totalSpent * ((settings.platformFeePercent || 0) / 100));

            if (loadingBuyers) {
              return (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0C2D3A]" />
                </div>
              );
            }

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
                        { label: "Total Buyers", value: String(BUYERS.length), bg: BK.lime, color: BK.deep, name: "Registered" },
                        { label: "Total Orders", value: String(totalOrders), bg: BK.deep, color: "#fff", name: "Marketplace" },
                        { label: "Total Spent", value: `ZK ${totalSpent.toLocaleString()}`, bg: BK.stone, color: BK.deep, name: "Buyer spend" },
                        { label: "Platform Commission", value: `ZK ${platformCommission.toLocaleString()}`, bg: "#fff", color: BK.deep, name: `${settings.platformFeePercent || 0}% of spend` },
                        { label: "Avg Order Value", value: avgOrder > 0 ? `ZK ${avgOrder.toLocaleString()}` : "-", bg: "#fff", color: BK.deep, name: "Per Transaction" },
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
                      {BUYERS.length === 0 ? (
                        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 0", background: "#fff", borderRadius: BK.rd, border: "1px dashed rgba(12,45,58,0.15)" }}>
                          <User className="h-12 w-12 mx-auto mb-3" style={{ color: "rgba(12,45,58,0.2)" }} />
                          <p style={{ ...manrope, color: BK.sub }}>No buyer profiles registered yet</p>
                        </div>
                      ) : BUYERS.map((buyer) => (
                        <motion.div key={buyer.id} whileHover={{ y: -3 }} transition={{ duration: 0.25 }}
                          style={{ background: "#fff", padding: 32, borderRadius: BK.rd, border: "1px solid rgba(12,45,58,0.06)", display: "flex", flexDirection: "column", gap: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <h3 style={{ ...syne, fontSize: "1.25rem", color: BK.deep, marginBottom: 4 }}>{buyer.company || buyer.name}</h3>
                              <p style={{ ...manrope, fontSize: "0.85rem", color: BK.sub }}>{buyer.location}</p>
                            </div>
                            <span style={{ display: "inline-flex", padding: "6px 16px", background: buyer.status === "active" ? `rgba(191,255,0,0.15)` : "rgba(44,82,99,0.05)", color: buyer.status === "active" ? BK.deep : BK.mid, borderRadius: BK.pill, fontWeight: 600, fontSize: "0.8rem", ...manrope }}>
                              {buyer.status === "active" ? "● Active" : "◐ Pending"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ display: "inline-flex", padding: "6px 16px", background: "rgba(44,82,99,0.05)", color: BK.deep, borderRadius: BK.pill, fontWeight: 600, fontSize: "0.8rem", border: "1px solid rgba(44,82,99,0.1)", ...manrope }}>{buyer.orders} Orders</span>
                            <span style={{ display: "inline-flex", padding: "6px 16px", background: "rgba(44,82,99,0.05)", color: BK.deep, borderRadius: BK.pill, fontWeight: 600, fontSize: "0.8rem", border: "1px solid rgba(44,82,99,0.1)", ...manrope }}>ZK {buyer.spent.toLocaleString()}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <Mail className="h-4 w-4" style={{ color: BK.sub }} />
                            <span style={{ ...manrope, fontSize: "0.85rem", color: BK.sub }}>{buyer.email || buyer.phone || "No contact"}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: "0 40px 48px" }}>
                    <div style={secLabel}>03. Recent Orders</div>
                    <div style={{ background: BK.deep, borderRadius: BK.rd, padding: 32, color: "#fff" }}>
                      {buyerOrders.length === 0 ? (
                        <p style={{ ...manrope, opacity: 0.7, textAlign: "center", padding: "24px 0" }}>No marketplace orders recorded yet</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {buyerOrders.map((o) => (
                            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                              <div>
                                <div style={{ ...syne, fontWeight: 700, fontSize: "0.95rem" }}>{o.buyer}</div>
                                <div style={{ ...manrope, fontSize: "0.75rem", opacity: 0.6 }}>{o.crop} • {o.date}</div>
                              </div>
                              <span style={{ ...syne, fontWeight: 700, fontSize: "0.9rem", color: BK.lime }}>{o.amount}</span>
                            </div>
                          ))}
                        </div>
                      )}
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
                      <p className="text-3xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>{dbOfficers.length}</p>
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
                      <p className="text-3xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#fff' }}>{farmersList.filter(f => f.verified).length}</p>
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
                      <p className="text-3xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>{dashboardStats.completedVerifications}</p>
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
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleDemoteOfficer({
                              id: officer.id,
                              wallet: officer.wallet_address || '',
                              name: officer.name || 'Officer',
                              email: officer.email || '',
                              phone: officer.phone || '',
                              role: 'officer',
                              location: '',
                              locationLat: 0,
                              locationLng: 0,
                              farmSize: 0,
                              crops: [],
                              joined: '',
                              verified: true,
                              totalEarnings: 0,
                              completedMilestones: 0,
                              pendingMilestones: 0,
                              contracts: [],
                            })}
                            className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center space-x-1"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Demote Officer</span>
                          </button>
                        </div>
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
                      <QrCode className="h-6 w-6 text-emerald-600" />
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
                                className="text-xs font-mono text-emerald-600 hover:text-emerald-800 flex items-center gap-1 mt-1 bg-emerald-50 px-2 py-0.5 rounded w-fit"
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
                      // A contract and its linked traceability batch are the SAME physical
                      // item. When the batch is already shown above, hide the duplicate
                      // contract row so one batch = one processing task (the batch carries
                      // the crop through processing; the contract is just the agreement).
                      const shownBatchContractIds = new Set(
                        activeBatches.map(b => (b as any).contract_id).filter(Boolean)
                      );
                      const completedContracts = contracts.filter(c =>
                        c.status === 'completed' && c.contract_code &&
                        !verifiedBatchCodes.has(c.contract_code) &&
                        !shownBatchContractIds.has(c.id)
                      );

                      if (activeBatches.length === 0 && completedContracts.length === 0) {
                        return <p className="text-sm text-gray-500 text-center py-4">No tasks ready for processing yet.</p>;
                      }

                      return (
                        <div className="space-y-3">
                          {/* Render Batches */}
                          {activeBatches.map((batch) => {
                            const hasSavedProgress = !!savedProcessingData[batch.batch_code];
                            const linkedContract = contracts.find(c => c.id === (batch as any).contract_id);
                            const linkedCode = (linkedContract?.contract_code || '').toUpperCase();
                            const sourceLabel = !linkedContract ? 'Independent' : linkedCode.startsWith('BID-') ? 'Market-Sourced' : 'Farm-Grown';
                            const sourceStyle = !linkedContract
                              ? 'border-gray-200 text-gray-500'
                              : linkedCode.startsWith('BID-')
                                ? 'border-sky-200 text-sky-600'
                                : 'border-emerald-200 text-emerald-600';
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
                                    <span className={`px-2 py-0.5 text-[10px] border rounded-full uppercase font-bold ${sourceStyle}`}>{sourceLabel}</span>
                                  </div>
                                  <p className="text-sm text-gray-600">{batch.farmer_name} • {batch.crop_type} • {batch.total_quantity || 0} {batch.unit || 'kg'}</p>
                                </div>
                                <div className={`px-3 py-1.5 text-white rounded-lg text-sm opacity-80 group-hover:opacity-100 transition-opacity ${hasSavedProgress ? 'bg-amber-600' : 'bg-emerald-600'
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
                                  : 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'
                                  }`}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono font-semibold text-emerald-700">{contract.contract_code || contract.id.slice(0, 8)}</p>
                                    <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-full uppercase font-bold">Delivery Done</span>
                                  </div>
                                  <p className="text-sm text-gray-600">{contract.farmer} • {contract.crop} • {contract.amount}</p>
                                </div>
                                <div className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm opacity-80 group-hover:opacity-100 transition-opacity">
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
                  <Truck className="h-5 w-5 text-emerald-600" />
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
                            <td className="px-4 py-3 font-mono text-sm text-emerald-600 font-semibold">{product.batchCode}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{product.cropType}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{product.farmerName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{product.quantity}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.grade === 'Premium' ? 'bg-yellow-100 text-yellow-800' :
                                product.grade === 'Grade A' ? 'bg-emerald-100 text-emerald-800' :
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
                                  className="text-xs font-mono text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
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
                                className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-flex items-center gap-1"
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

                    // Compute the actual processed weight from packaging sizes if provided
                    const totalProcessedKg = (processingData.packaging.sizes || []).reduce(
                      (s, x) => s + (Number(x.sizeKg) || 0) * (Number(x.count) || 0),
                      0
                    );
                    const fallbackKg = parseFloat(selectedBatch.quantity?.replace(/[^0-9.]/g, '') || '0');
                    const finalTotalQuantity = totalProcessedKg > 0 ? totalProcessedKg : fallbackKg;

                    // Persist warehouse processing details into batch metadata so the
                    // public traceability view can render accurate dates, weight, packaging.
                    const ipfsMetadata = JSON.stringify({
                      productionDate: processingData.productionDate || null,
                      expiryDate: processingData.expiryDate || null,
                      productName: processingData.productName || null,
                      productImage: processingData.productImage || null,
                      packagingSizes: processingData.packaging.sizes || [],
                      packageType: processingData.packaging.packageType,
                      packageCount: processingData.packaging.packageCount,
                      totalWeightKg: totalProcessedKg > 0 ? totalProcessedKg : null,
                      qualityGrade: processingData.qualityCheck.grade,
                      processingMethods: processingData.processing.methods || [],
                      storageConditions: processingData.storageConditions || null,
                      aiDefectScan: processingData.aiDefectScan || null,
                    });

                    if (existingBatch) {
                      // Update existing batch
                      const { error } = await supabase
                        .from('batches')
                        .update({
                          blockchain_tx: processingData.nftTxHash,
                          quality_grade: processingData.qualityCheck.grade,
                          current_status: 'ready_for_distribution',
                          total_quantity: finalTotalQuantity || null,
                          unit: 'kg',
                          harvest_date: processingData.productionDate || null,
                          ipfs_metadata: ipfsMetadata,
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
                          total_quantity: finalTotalQuantity || null,
                          unit: 'kg',
                          harvest_date: processingData.productionDate || null,
                          quality_grade: processingData.qualityCheck.grade,
                          blockchain_tx: processingData.nftTxHash,
                          current_status: 'ready_for_distribution',
                          ipfs_metadata: ipfsMetadata,
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

 // TRACEABILITY LOGGING
                try {
                  const { addTraceabilityEvent, getTraceabilityByBatchCode, logMilestoneEvent } = await import('@/lib/traceabilityService');
                  const traceData = await getTraceabilityByBatchCode(processingData.batchCode);

                  if (traceData?.batch?.id) {
                    const batchId = traceData.batch.id;

                    // 1. Log the Factory Processing Complete event
                    const qaSteps = [
                      `Receiving & Weighing: ${processingData.batchCode} received and weighed`,
                      `Quality Grading: Grade ${processingData.qualityCheck.grade}`,
                      `Sorting: Grade A=${processingData.sorting.gradeA}, Grade B=${processingData.sorting.gradeB}, Rejected=${processingData.sorting.rejected}`,
                      processingData.processing.applicable && processingData.processing.completed ? `Processing: ${processingData.processing.methods.join(', ')} (${processingData.processing.duration})` : null,
                      `Packaging: ${processingData.packaging.packageType}, ${processingData.packaging.packageCount} units`,
                      `Storage Conditions: ${processingData.storageConditions}`,
                      `Ready for Distribution: ${processingData.readyForDistribution ? 'Yes' : 'No'}`,
                    ].filter(Boolean).join(' | ');

                    await addTraceabilityEvent({
                      batch_id: batchId,
                      event_type: 'processing',
                      event_title: 'Factory Processing Complete',
                      event_description: `Batch ${processingData.batchCode} processed at Factory. ${qaSteps}. NFT minted.`,
                      actor_name: 'Factory Admin',
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
                  {farmersList.filter(f => f.verified).map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedUser?.id === user.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-emerald-700">{user.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.location} • {user.email}</p>
                        </div>
                        {user.verified && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                    </div>
                  ))}
                  {farmersList.filter(f => f.verified).length === 0 && (
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

          {/* Analytics View - ARKTOS */}
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
                    { label: "Approved Farmers", value: String(dashboardStats.activeFarmers), bg: "#BFFF00", color: "#0C2D3A", sub: "registered & approved" },
                    { label: "Active Contracts", value: String(dashboardStats.activeContracts), bg: "#0C2D3A", color: "#fff", sub: "in progress" },
                    { label: "Payment Volume Trend", value: analyticsGrowth.revenueLabel, bg: "#E6E2D6", color: "#0C2D3A", sub: "month over month" },
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
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>02. Payment Volume</div>
                <div style={{ background: "#fff", borderRadius: 24, border: "1px solid rgba(12,45,58,0.06)", padding: 32 }}>
                  {costData.every((d) => d.cost === 0) ? (
                    <p style={{ fontFamily: "'Manrope',sans-serif", color: "#5A7684", textAlign: "center", padding: "48px 0" }}>No settled payments in the last 8 months yet</p>
                  ) : (
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
                  )}
                </div>
              </div>

              {/* Contracts & Liquidity */}
              <div style={{ padding: "0 40px 48px" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>03. Contracts &amp; Liquidity</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                  {[
                    { label: "Total Contract Value", value: `K${(financials?.totalContractValue ?? 0).toLocaleString()}`, sub: "all active agreements" },
                    { label: "Paid to Date", value: `K${(financials?.totalPaid ?? 0).toLocaleString()}`, sub: "released to farmers" },
                    { label: "Outstanding", value: `K${(financials?.totalOutstanding ?? 0).toLocaleString()}`, sub: `${financials?.pendingMilestoneCount ?? 0} pending milestones` },
                    { label: "Due in 30 Days", value: `K${(financials?.dueNext30Days ?? 0).toLocaleString()}`, sub: "upcoming obligations" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", padding: 20 }}>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.8rem", color: "#5A7684", marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#0C2D3A" }}>{s.value}</div>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.72rem", color: "#9aa5a8", marginTop: 4 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                {/* Liquidity check */}
                <div style={{ background: (financials?.liquidityGap ?? 0) >= 0 ? "rgba(191,255,0,0.12)" : "rgba(220,38,38,0.08)", border: `1px solid ${(financials?.liquidityGap ?? 0) >= 0 ? "rgba(191,255,0,0.4)" : "rgba(220,38,38,0.3)"}`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
                  <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.85rem", fontWeight: 700, color: "#0C2D3A" }}>
                    {(financials?.liquidityGap ?? 0) >= 0
                      ? `Wallet covers upcoming 30-day obligations (surplus K${(financials?.liquidityGap ?? 0).toLocaleString()}).`
                      : `Funding needed: obligations exceed available fiat by K${Math.abs(financials?.liquidityGap ?? 0).toLocaleString()} for the next 30 days.`}
                  </div>
                  <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.75rem", color: "#5A7684", marginTop: 4 }}>Available fiat: K{(financials?.availableFiat ?? 0).toLocaleString()}</div>
                </div>
                {/* Upcoming obligations table */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", overflow: "hidden" }}>
                  {(financials?.upcoming?.length ?? 0) === 0 ? (
                    <p style={{ fontFamily: "'Manrope',sans-serif", color: "#5A7684", textAlign: "center", padding: "32px 0" }}>No upcoming milestone obligations.</p>
                  ) : (
                    <div>
                      {financials!.upcoming.map((o) => (
                        <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid rgba(12,45,58,0.05)" }}>
                          <div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#0C2D3A" }}>{o.milestoneName} · {o.cropType}</div>
                            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.72rem", color: "#9aa5a8" }}>{o.contractCode} • due {o.dueDate ? new Date(o.dueDate).toLocaleDateString() : "-"} • {o.status}</div>
                          </div>
                          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "#0C2D3A" }}>K{o.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 04. QR → Complaints conversion */}
              <div style={{ padding: "0 40px 48px" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>04. QR Scans → Complaints</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                  {[
                    { label: "Total Scans", value: String(extendedAnalytics?.qrComplaints.totalScans ?? 0), sub: "consumer QR opens" },
                    { label: "Complaints Filed", value: String(extendedAnalytics?.qrComplaints.totalComplaints ?? 0), sub: `${extendedAnalytics?.qrComplaints.openComplaints ?? 0} still open` },
                    { label: "Conversion Rate", value: `${extendedAnalytics?.qrComplaints.conversionPct ?? 0}%`, sub: "complaints / scans" },
                    { label: "Per 1,000 Scans", value: String(extendedAnalytics?.qrComplaints.complaintsPer1000Scans ?? 0), sub: "complaint intensity" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", padding: 20 }}>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.8rem", color: "#5A7684", marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#0C2D3A" }}>{s.value}</div>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.72rem", color: "#9aa5a8", marginTop: 4 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 05. Marketplace GMV vs contract payouts */}
              <div style={{ padding: "0 40px 48px" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>05. Marketplace GMV vs Contract Payouts</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
                  {[
                    { label: "Marketplace GMV", value: `K${(extendedAnalytics?.gmvVsPayouts.marketplaceGmv ?? 0).toLocaleString()}`, sub: `${extendedAnalytics?.gmvVsPayouts.orderCount ?? 0} orders` },
                    { label: "Contract Payouts", value: `K${(extendedAnalytics?.gmvVsPayouts.contractPayouts ?? 0).toLocaleString()}`, sub: `${extendedAnalytics?.gmvVsPayouts.payoutCount ?? 0} milestone payments` },
                    { label: "Payouts / GMV", value: extendedAnalytics?.gmvVsPayouts.ratioLabel ?? "-", sub: "capital intensity" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: i === 0 ? "#0C2D3A" : "#fff", color: i === 0 ? "#fff" : "#0C2D3A", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", padding: 20 }}>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.8rem", opacity: 0.75, marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1.5rem" }}>{s.value}</div>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.72rem", opacity: 0.6, marginTop: 4 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                {(() => {
                  const gmv = extendedAnalytics?.gmvVsPayouts.marketplaceGmv ?? 0;
                  const pay = extendedAnalytics?.gmvVsPayouts.contractPayouts ?? 0;
                  const max = Math.max(gmv, pay, 1);
                  return (
                    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", padding: 20 }}>
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Manrope',sans-serif", fontSize: 12, color: "#5A7684", marginBottom: 6 }}>
                          <span>Marketplace GMV</span><span>K{gmv.toLocaleString()}</span>
                        </div>
                        <div style={{ height: 10, borderRadius: 999, background: "rgba(12,45,58,0.08)", overflow: "hidden" }}>
                          <div style={{ width: `${Math.round((gmv / max) * 100)}%`, height: "100%", background: "#0C2D3A" }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Manrope',sans-serif", fontSize: 12, color: "#5A7684", marginBottom: 6 }}>
                          <span>Contract payouts</span><span>K{pay.toLocaleString()}</span>
                        </div>
                        <div style={{ height: 10, borderRadius: 999, background: "rgba(12,45,58,0.08)", overflow: "hidden" }}>
                          <div style={{ width: `${Math.round((pay / max) * 100)}%`, height: "100%", background: "#BFFF00" }} />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 06. Milestone cycle times */}
              <div style={{ padding: "0 40px 48px" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>06. Time-to-Verify / Time-to-Pay</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                  {[
                    {
                      label: "Avg hours to verify",
                      value: extendedAnalytics?.cycleTimes.avgHoursToVerify != null
                        ? `${extendedAnalytics.cycleTimes.avgHoursToVerify}h`
                        : "-",
                      sub: `${extendedAnalytics?.cycleTimes.verifiedCount ?? 0} milestones with timestamps`,
                    },
                    {
                      label: "Avg hours to pay",
                      value: extendedAnalytics?.cycleTimes.avgHoursToPay != null
                        ? `${extendedAnalytics.cycleTimes.avgHoursToPay}h`
                        : "-",
                      sub: `${extendedAnalytics?.cycleTimes.paidCount ?? 0} paid after verification`,
                    },
                    {
                      label: "Milestones sampled",
                      value: String(extendedAnalytics?.cycleTimes.sampleSize ?? 0),
                      sub: "all milestones in system",
                    },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", padding: 20 }}>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.8rem", color: "#5A7684", marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#0C2D3A" }}>{s.value}</div>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.72rem", color: "#9aa5a8", marginTop: 4 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 07. Crop mix + payment volume by province */}
              <div style={{ padding: "0 40px 48px" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>07. Crop Mix + Payment Volume by Province</div>
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", overflow: "hidden" }}>
                  {(extendedAnalytics?.byProvince?.length ?? 0) === 0 ? (
                    <p style={{ fontFamily: "'Manrope',sans-serif", color: "#5A7684", textAlign: "center", padding: "32px 0" }}>No contract / province data yet.</p>
                  ) : (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr 1fr 1fr", gap: 8, padding: "12px 20px", background: "#F7F9FB", fontFamily: "'Manrope',sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#5A7684" }}>
                        <span>Province</span>
                        <span>Crop</span>
                        <span>Contracts</span>
                        <span>Contract value</span>
                        <span>Paid out</span>
                      </div>
                      {extendedAnalytics!.byProvince.map((row, i) => (
                        <div key={`${row.province}-${row.crop}-${i}`} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr 1fr 1fr", gap: 8, padding: "14px 20px", borderBottom: "1px solid rgba(12,45,58,0.05)", fontFamily: "'Manrope',sans-serif", fontSize: 13, color: "#0C2D3A" }}>
                          <span style={{ fontWeight: 600 }}>{row.province}</span>
                          <span>{row.crop}</span>
                          <span>{row.contracts}</span>
                          <span>K{row.contractValue.toLocaleString()}</span>
                          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>K{row.paymentVolume.toLocaleString()}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payments View - ARKTOS */}
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
                  {recentPayments.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0", background: "#fff", borderRadius: 16, border: "1px dashed rgba(12,45,58,0.15)" }}>
                      <DollarSign className="h-12 w-12 mx-auto mb-3" style={{ color: "rgba(12,45,58,0.2)" }} />
                      <p style={{ fontFamily: "'Manrope',sans-serif", color: "#5A7684" }}>No payment transactions recorded yet</p>
                    </div>
                  ) : recentPayments.map((p) => (
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

          {selectedView === "landing" && (
            <LandingPageEditor />
          )}

          {selectedView === "consumer" && (
            <AdminConsumerQR />
          )}

          {selectedView === "behind-scenes" && (
            <AdminBehindTheScenes />
          )}

          {/* Settings View - ARKTOS */}
          {selectedView === "settings" && (
            <div style={{ background: "#F7F9FB", borderRadius: 24, overflow: "hidden" }}>
              <div style={{ padding: "48px 40px 0" }}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>System Configuration v1.0</div>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 0.9, letterSpacing: "-0.04em", color: "#0C2D3A", marginBottom: 48 }}>PLATFORM<br />SETTINGS</h1>
              </div>
              <div style={{ padding: "0 40px 48px" }}>
                {(() => {
                  const labelStyle: React.CSSProperties = { fontFamily: "'Manrope',sans-serif", fontSize: "0.8rem", color: "#5A7684", marginBottom: 6, display: "block" };
                  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(12,45,58,0.15)", fontFamily: "'Manrope',sans-serif", fontSize: "0.9rem", color: "#0C2D3A", background: "#fff" };
                  const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 24, border: "1px solid rgba(12,45,58,0.06)", padding: 32 };
                  const headStyle: React.CSSProperties = { fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#5A7684", borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 20 };
                  return (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                        <div style={cardStyle}>
                          <div style={headStyle}>01. General</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div><label style={labelStyle}>Platform Name</label><input style={inputStyle} value={settings.platformName} onChange={e => setSettings({ ...settings, platformName: e.target.value })} /></div>
                            <div><label style={labelStyle}>Currency</label><input style={inputStyle} value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })} /></div>
                            <div><label style={labelStyle}>Time Zone</label><input style={inputStyle} value={settings.timezone} onChange={e => setSettings({ ...settings, timezone: e.target.value })} /></div>
                            <div><label style={labelStyle}>Language</label><input style={inputStyle} value={settings.language} onChange={e => setSettings({ ...settings, language: e.target.value })} /></div>
                          </div>
                        </div>
                        <div style={cardStyle}>
                          <div style={headStyle}>02. Verification</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div><label style={labelStyle}>Officer Fee (%)</label><input type="number" style={inputStyle} value={settings.officerFeePercent} onChange={e => setSettings({ ...settings, officerFeePercent: parseFloat(e.target.value) || 0 })} /></div>
                            <div><label style={labelStyle}>Officer Flat Fee (K, above threshold)</label><input type="number" style={inputStyle} value={settings.officerFeeFlat} onChange={e => setSettings({ ...settings, officerFeeFlat: parseFloat(e.target.value) || 0 })} /></div>
                            <div><label style={labelStyle}>Officer Fee Threshold (K)</label><input type="number" style={inputStyle} value={settings.officerFeeThreshold} onChange={e => setSettings({ ...settings, officerFeeThreshold: parseFloat(e.target.value) || 0 })} /></div>
                            <div><label style={labelStyle}>Min Listing Quality</label><input style={inputStyle} value={settings.minListingQuality} onChange={e => setSettings({ ...settings, minListingQuality: e.target.value })} /></div>
                            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                              <input type="checkbox" checked={settings.autoApproveFarmers} onChange={e => setSettings({ ...settings, autoApproveFarmers: e.target.checked })} style={{ width: 18, height: 18 }} />
                              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: "0.85rem", color: "#0C2D3A" }}>Auto-approve farmers</span>
                            </label>
                          </div>
                        </div>
                        <div style={cardStyle}>
                          <div style={headStyle}>03. Payment</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div><label style={labelStyle}>Platform Fee (%)</label><input type="number" style={inputStyle} value={settings.platformFeePercent} onChange={e => setSettings({ ...settings, platformFeePercent: parseFloat(e.target.value) || 0 })} /></div>
                            <div><label style={labelStyle}>Payment Network</label><input style={inputStyle} value={settings.paymentNetwork} onChange={e => setSettings({ ...settings, paymentNetwork: e.target.value })} /></div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                        <button onClick={handleSaveSettings} disabled={savingSettings}
                          style={{ padding: "12px 28px", borderRadius: 12, background: "#0C2D3A", color: "#BFFF00", fontFamily: "'Syne',sans-serif", fontWeight: 700, border: "none", cursor: savingSettings ? "default" : "pointer", opacity: savingSettings ? 0.6 : 1 }}>
                          {savingSettings ? "Saving..." : "Save Settings"}
                        </button>
                      </div>
                    </>
                  );
                })()}
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
        farmers={farmersList.map(f => ({ id: f.id, name: f.name, location: f.location }))}
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
                // Round to 2 decimals (currency) to avoid float artefacts on amounts like 500.08
                const farmerPayment = Math.round((selectedVerification.payment_amount || 0) * 100) / 100;
                const farmerWallet = selectedVerification.farmer_wallet;

                // Resolve verifier wallet - look up from DB if not in metadata
                let resolvedOfficerWallet = selectedVerification.officer_wallet;
                if (!resolvedOfficerWallet && supabase) {
                  const officerName = selectedVerification.officer_name;
                  if (officerName && officerName !== 'Verifier') {
                    const { data: officerUser } = await supabase
                      .from('users')
                      .select('wallet_address')
                      .eq('name', officerName)
                      .eq('role', 'officer')
                      .single();
                    if (officerUser?.wallet_address) {
                      resolvedOfficerWallet = officerUser.wallet_address;
                      console.log('Resolved officer wallet from DB:', resolvedOfficerWallet);
                    }
                  }
                  // Fallback: try officer_id from metadata
                  if (!resolvedOfficerWallet) {
                    const metadata = (await supabase.from('milestones').select('metadata').eq('id', selectedVerification.milestone_id).single()).data?.metadata || {};
                    const officerId = metadata.officer_id || metadata.officer_user_id;
                    if (officerId) {
                      const { data: officerById } = await supabase
                        .from('users')
                        .select('wallet_address')
                        .eq('id', officerId)
                        .single();
                      if (officerById?.wallet_address) {
                        resolvedOfficerWallet = officerById.wallet_address;
                        console.log('Resolved officer wallet from DB by ID:', resolvedOfficerWallet);
                      }
                    }
                  }
                }

                // Calculate verifier fee based on contract value and milestone count
                const feeBreakdown = getVerifierFeeBreakdown(
                  selectedVerification.total_contract_value,
                  selectedVerification.total_milestones,
                  selectedVerification.custom_verifier_fee_percent
                );
                const verifierFee = Math.round((feeBreakdown.feePerMilestone || 0) * 100) / 100;

                // A verifier fee should ONLY be charged when a real officer actually
                // verified this milestone. Milestones with no verification requirement
                // (self/admin-completed) have no officer on file - officer_name stays
                // the placeholder 'Verifier', no officer wallet, and no officer evidence.
                // Previously we recorded a fee for these too, so they showed up as
                // "Verification Fee PENDING" on non-key milestones.
                const hasOfficerVerification = Boolean(
                  resolvedOfficerWallet ||
                  (selectedVerification.officer_name && selectedVerification.officer_name !== 'Verifier') ||
                  selectedVerification.officer_notes ||
                  (selectedVerification.evidence_images && selectedVerification.evidence_images.length > 0) ||
                  (selectedVerification.officer_iot_readings && selectedVerification.officer_iot_readings.length > 0) ||
                  selectedVerification.officer_ai_analysis
                );
                const effectiveVerifierFee = hasOfficerVerification ? verifierFee : 0;
                const totalRequired = farmerPayment + effectiveVerifierFee;

 // PRE-APPROVAL FUND CHECK
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
 // END FUND CHECK

                if (supabase) {
                  // ── STEP 1: Record the money movement FIRST ──
                  // A milestone must never be marked paid/completed unless the payment
                  // rows are actually written. Previously the milestone was updated to
                  // completed BEFORE this insert, so any insert failure (e.g. a missing
                  // farmer wallet -> NOT NULL violation on to_address) left the milestone
                  // showing "completed" while no money moved. We now insert payments
                  // first and abort the whole approval if the insert fails.
                  // Uses only real DB columns: from_address, to_address, amount, currency,
                  // payment_type, reference_id, reference_type, transaction_hash, status, confirmed_at
                  const paymentInserts: Array<Record<string, unknown>> = [
                    {
                      to_address: farmerWallet || 'pending-wallet',
                      from_address: evmAddress || 'platform',
                      amount: farmerPayment,
                      currency: 'ZMW',
                      payment_type: 'milestone',
                      reference_id: selectedVerification.milestone_id,
                      reference_type: 'milestone',
                      transaction_hash: `MS-${selectedVerification.milestone_id}-${Date.now()}`,
                      status: farmerWallet ? 'confirmed' : 'pending',
                      confirmed_at: farmerWallet ? new Date().toISOString() : null,
                    },
                  ];

                  // Record verifier payment only when an officer actually verified.
                  // Mark as confirmed if wallet exists, otherwise pending so admin can resolve it later.
                  if (effectiveVerifierFee > 0) {
                    paymentInserts.push({
                      to_address: resolvedOfficerWallet || 'pending-wallet',
                      from_address: evmAddress || 'platform',
                      amount: effectiveVerifierFee,
                      currency: 'ZMW',
                      payment_type: 'platform_fee',
                      reference_id: selectedVerification.milestone_id,
                      reference_type: 'milestone',
                      transaction_hash: resolvedOfficerWallet
                        ? `VF-${selectedVerification.milestone_id}-${Date.now()}`
                        : `VF-PENDING-${selectedVerification.milestone_id}-${Date.now()}`,
                      status: resolvedOfficerWallet ? 'confirmed' : 'pending',
                      confirmed_at: resolvedOfficerWallet ? new Date().toISOString() : null,
                    });
                  }

                  const { error: paymentError } = await supabase.from('payments').insert(paymentInserts);
                  if (paymentError) {
                    console.error('Error recording payments:', paymentError);
                    throw new Error(
                      `Payment could not be recorded (${paymentError.message}). The milestone was NOT approved - please try again.`
                    );
                  }
                  console.log('Payments recorded successfully for farmer + verifier');

                  // ── STEP 2: Mark the milestone verified / paid ──
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
                      payment_status: farmerWallet ? 'completed' : 'pending',
                      verified_at: new Date().toISOString(),
                      metadata: {
                        ...existingMetadata,
                        admin_notes: adminNotes,
                        approved_at: new Date().toISOString(),
                        farmer_payment_zmw: farmerPayment,
                        verifier_fee_zmw: effectiveVerifierFee,
                        verifier_fee_percent: hasOfficerVerification ? feeBreakdown.feePerMilestonePercent : 0,
                        total_verifier_fee_percent: feeBreakdown.totalFeePercent,
                      },
                    })
                    .eq('id', selectedVerification.milestone_id);

                  if (updateError) {
                    console.error('Error updating milestone:', updateError);
                    throw new Error(`Failed to update milestone: ${updateError.message}`);
                  }

                  console.log('Milestone updated successfully:', selectedVerification.milestone_id);

                  // ── STEP 3: Contract completion + traceability ──
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

 // NEW: Traceability Integration
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
 // END Traceability Integration
                  }


 // TRACEABILITY LOGGING
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
 // END TRACEABILITY LOGGING
                }

                // Show success with payment details. If the farmer had no wallet on
                // file the payment was queued as pending rather than sent, so make
                // that explicit instead of implying money moved.
                if (farmerWallet) {
                  const verifierLine = effectiveVerifierFee > 0
                    ? `\n🔍 Verifier: K${effectiveVerifierFee.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${feeBreakdown.feePerMilestonePercent.toFixed(2)}%) → ${selectedVerification.officer_name}`
                    : '';
                  toast.success(
                    `✅ Milestone Approved!\n` +
                    `💰 Farmer: K${farmerPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })} → ${selectedVerification.farmer_name}` +
                    verifierLine,
                    { duration: 5000 }
                  );
                } else {
                  toast(
                    `⚠️ Milestone approved, but ${selectedVerification.farmer_name} has no wallet on file.\n` +
                    `K${farmerPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })} is queued as PENDING - set the farmer's wallet to release it.`,
                    { duration: 7000, icon: '⚠️' }
                  );
                }

                // Remove from pending list
                setPendingVerifications(prev => prev.filter(v => v.id !== selectedVerification.id));
                setShowApprovalModal(false);
                setShowApprovalModal(false);
                setSelectedVerification(null);
              } catch (error: any) { // Keep any for logging if preferred, or unknown
                console.error('Approval error:', error);
                toast.error(error?.message || 'Failed to process approval', { duration: 6000 });
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
