import { supabase } from "./supabase";
import { readStoredCoordinates } from "./farmerMapUtils";

const CROP_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0C2D3A", "#3b82f6", "#ec4899"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface AdminDashboardStats {
  totalFarmers: number;
  activeFarmers: number;
  activeContracts: number;
  marketplaceListings: number;
  totalRevenue: number;
  pendingVerifications: number;
  completedVerifications: number;
}

export interface CropDistributionItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface MonthlyTrendPoint {
  month: string;
  cost: number;
}

export interface FarmerDashboardRow {
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
  contracts: {
    id: string;
    cropType: string;
    status: string;
    value: number;
    createdAt: string;
    harvestDate: string;
    milestones: {
      id: string;
      name: string;
      status: string;
      payment: number;
      dueDate: string;
    }[];
  }[];
}

export interface BuyerDashboardRow {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  wallet: string;
  verified: boolean;
  orders: number;
  spent: number;
  status: "active" | "pending";
}

export interface PaymentDashboardRow {
  id: string;
  from: string;
  to: string;
  amount: string;
  status: string;
  date: string;
  hash: string;
}

export interface GrowthActivityRow {
  id: string;
  title: string;
  location: string;
  date: string;
  activityType: string;
}

export interface MarketplaceOrderRow {
  id: string;
  buyer: string;
  crop: string;
  amount: string;
  date: string;
  status: string;
}

function emptyStats(): AdminDashboardStats {
  return {
    totalFarmers: 0,
    activeFarmers: 0,
    activeContracts: 0,
    marketplaceListings: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
    completedVerifications: 0,
  };
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  if (!supabase) return emptyStats();

  try {
    const [
      farmersRes,
      activeFarmersRes,
      contractsRes,
      listingsRes,
      paymentsRes,
      pendingRes,
      verifiedRes,
    ] = await Promise.all([
      supabase.from("farmers").select("id", { count: "exact", head: true }),
      supabase.from("farmers").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("contracts").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("marketplace_listings").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("payments").select("amount").in("status", ["completed", "confirmed"]),
      supabase.from("milestones").select("id", { count: "exact", head: true }).eq("status", "submitted"),
      supabase.from("milestones").select("id", { count: "exact", head: true }).in("status", ["verified", "paid"]),
    ]);

    const totalRevenue =
      paymentsRes.data?.reduce((sum: number, row: { amount?: number | string }) => sum + Number(row.amount || 0), 0) ?? 0;

    return {
      totalFarmers: farmersRes.count ?? 0,
      activeFarmers: activeFarmersRes.count ?? 0,
      activeContracts: contractsRes.count ?? 0,
      marketplaceListings: listingsRes.count ?? 0,
      totalRevenue,
      pendingVerifications: pendingRes.count ?? 0,
      completedVerifications: verifiedRes.count ?? 0,
    };
  } catch (e) {
    console.error("getAdminDashboardStats:", e);
    return emptyStats();
  }
}

export interface UpcomingObligation {
  id: string;
  contractCode: string;
  milestoneName: string;
  cropType: string;
  amount: number;
  dueDate: string;
  status: string;
}

export interface ContractFinancials {
  totalContractValue: number;
  totalPaid: number;
  totalOutstanding: number;
  dueNext30Days: number;
  pendingMilestoneCount: number;
  availableFiat: number;
  liquidityGap: number; // negative means shortfall vs 30-day obligations
  upcoming: UpcomingObligation[];
}

// Aggregates milestone-based cash-flow exposure for wallet/liquidity planning.
export async function getContractFinancials(): Promise<ContractFinancials> {
  const empty: ContractFinancials = {
    totalContractValue: 0, totalPaid: 0, totalOutstanding: 0, dueNext30Days: 0,
    pendingMilestoneCount: 0, availableFiat: 0, liquidityGap: 0, upcoming: [],
  };
  if (!supabase) return empty;

  try {
    const [contractsRes, milestonesRes, paymentsRes] = await Promise.all([
      supabase.from("contracts").select("id, contract_code, crop_type, total_value, status"),
      supabase.from("milestones").select("id, contract_id, name, status, payment_amount, expected_date"),
      supabase.from("payments").select("amount, status, payment_type"),
    ]);

    const contracts = contractsRes.data || [];
    const milestones = milestonesRes.data || [];
    const payments = paymentsRes.data || [];

    const contractById: Record<string, { code: string; crop: string }> = {};
    let totalContractValue = 0;
    contracts.forEach((c: any) => {
      contractById[c.id] = { code: c.contract_code || c.id?.slice(0, 8), crop: c.crop_type || "-" };
      if (c.status !== "cancelled") totalContractValue += Number(c.total_value || 0);
    });

    let totalPaid = 0;
    let totalOutstanding = 0;
    let dueNext30Days = 0;
    let pendingMilestoneCount = 0;
    const now = Date.now();
    const in30 = now + 30 * 24 * 60 * 60 * 1000;
    const upcoming: UpcomingObligation[] = [];

    milestones.forEach((m: any) => {
      const amount = Number(m.payment_amount || 0);
      const status = (m.status || "").toLowerCase();
      if (["paid", "completed"].includes(status)) {
        totalPaid += amount;
      } else if (status !== "rejected") {
        totalOutstanding += amount;
        pendingMilestoneCount += 1;
        const due = m.expected_date ? new Date(m.expected_date).getTime() : 0;
        if (due && due <= in30) dueNext30Days += amount;
        upcoming.push({
          id: m.id,
          contractCode: contractById[m.contract_id]?.code || "-",
          milestoneName: m.name || "Milestone",
          cropType: contractById[m.contract_id]?.crop || "-",
          amount,
          dueDate: m.expected_date || "",
          status,
        });
      }
    });

    upcoming.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));

    // Available fiat = confirmed/completed inbound payments to platform ledger.
    const availableFiat = payments
      .filter((p: any) => ["completed", "confirmed"].includes((p.status || "").toLowerCase()))
      .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

    return {
      totalContractValue,
      totalPaid,
      totalOutstanding,
      dueNext30Days,
      pendingMilestoneCount,
      availableFiat,
      liquidityGap: availableFiat - dueNext30Days,
      upcoming: upcoming.slice(0, 12),
    };
  } catch (e) {
    console.error("getContractFinancials:", e);
    return empty;
  }
}

export async function getCropDistribution(): Promise<CropDistributionItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase.from("contracts").select("crop_type, total_value");
  if (error || !data?.length) return [];

  const totals: Record<string, number> = {};
  for (const row of data) {
    const crop = (row.crop_type as string) || "Unknown";
    totals[crop] = (totals[crop] || 0) + Number(row.total_value || 0);
  }

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0) || 1;

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value: Math.round(value),
      percentage: Math.round((value / grandTotal) * 100),
      color: CROP_COLORS[index % CROP_COLORS.length],
    }));
}

export async function getMonthlyPaymentTrend(): Promise<MonthlyTrendPoint[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("payments")
    .select("amount, created_at")
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  if (error) return [];

  const buckets: Record<string, number> = {};
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets[`${d.getFullYear()}-${d.getMonth()}`] = 0;
  }

  data?.forEach((row: { created_at: string; amount?: number | string }) => {
    const d = new Date(row.created_at as string);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key in buckets) buckets[key] += Number(row.amount || 0);
  });

  return Object.entries(buckets).map(([key, cost]) => {
    const monthIndex = Number(key.split("-")[1]);
    return { month: MONTHS[monthIndex], cost: Math.round(cost * 100) / 100 };
  });
}

function resolveFarmerCoordinates(f: Record<string, unknown>): { lat: number; lng: number } {
  const stored = readStoredCoordinates(f);
  if (stored) return stored;
  return { lat: 0, lng: 0 };
}

export async function getFarmersWithStats(): Promise<FarmerDashboardRow[]> {
  if (!supabase) return [];

  const { data: farmers, error } = await supabase
    .from("farmers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !farmers?.length) return [];

  const farmerIds = farmers.map((f: { id: string }) => f.id as string);

  const [contractsRes, paymentsRes, milestonesRes] = await Promise.all([
    supabase.from("contracts").select("id, farmer_id, crop_type, status, total_value, created_at").in("farmer_id", farmerIds),
    supabase
      .from("payments")
      .select("recipient_id, amount")
      .eq("status", "completed")
      .in("recipient_id", farmerIds),
    supabase
      .from("milestones")
      .select("id, name, status, payment_amount, expected_date, contract_id, contract:contracts(farmer_id)")
      .not("contract_id", "is", null),
  ]);

  // Group milestone details by contract so the admin farmer modal can render them.
  const milestonesByContract: Record<string, FarmerDashboardRow["contracts"][number]["milestones"]> = {};
  const milestoneStats: Record<string, { completed: number; pending: number }> = {};
  milestonesRes.data?.forEach((m: any) => {
    const contractId = m.contract_id as string | undefined;
    if (contractId) {
      if (!milestonesByContract[contractId]) milestonesByContract[contractId] = [];
      milestonesByContract[contractId].push({
        id: (m.id as string) || "",
        name: (m.name as string) || "Milestone",
        status: (m.status as string) || "pending",
        payment: Number(m.payment_amount || 0),
        dueDate: m.expected_date ? new Date(m.expected_date as string).toLocaleDateString() : "TBD",
      });
    }

    const fid = m.contract?.farmer_id as string | undefined;
    if (!fid) return;
    if (!milestoneStats[fid]) milestoneStats[fid] = { completed: 0, pending: 0 };
    if (m.status === "verified" || m.status === "paid") milestoneStats[fid].completed += 1;
    else if (m.status === "pending" || m.status === "submitted") milestoneStats[fid].pending += 1;
  });

  const contractsByFarmer: Record<string, FarmerDashboardRow["contracts"]> = {};
  contractsRes.data?.forEach((c: any) => {
    const fid = c.farmer_id as string;
    if (!contractsByFarmer[fid]) contractsByFarmer[fid] = [];
    contractsByFarmer[fid].push({
      id: c.id as string,
      cropType: (c.crop_type as string) || "Unknown",
      status: (c.status as string) || "pending",
      value: Number(c.total_value || 0),
      createdAt: c.created_at ? new Date(c.created_at as string).toLocaleDateString() : "-",
      harvestDate: "-",
      milestones: milestonesByContract[c.id as string] || [],
    });
  });

  const earningsByFarmer: Record<string, number> = {};
  paymentsRes.data?.forEach((p: { recipient_id: string; amount?: number | string }) => {
    const fid = p.recipient_id as string;
    earningsByFarmer[fid] = (earningsByFarmer[fid] || 0) + Number(p.amount || 0);
  });

  return farmers.map((f: Record<string, unknown>) => {
    const id = f.id as string;
    const cropsRaw = f.crops_grown;
    const crops = Array.isArray(cropsRaw) ? (cropsRaw as string[]) : [];

    const coords = resolveFarmerCoordinates(f);

    return {
      id,
      wallet: (f.wallet_address as string) || "",
      name: (f.name as string) || "Unknown",
      email: (f.email as string) || "",
      phone: (f.phone as string) || "",
      role: "farmer",
      location: (f.location_address as string) || "Unknown Location",
      locationLat: coords.lat,
      locationLng: coords.lng,
      farmSize: Number(f.farm_size_hectares ?? f.farm_size ?? 0),
      crops,
      joined: f.created_at ? new Date(f.created_at as string).toLocaleDateString() : "-",
      verified: f.status === "approved",
      totalEarnings: earningsByFarmer[id] || 0,
      completedMilestones: milestoneStats[id]?.completed || 0,
      pendingMilestones: milestoneStats[id]?.pending || 0,
      contracts: contractsByFarmer[id] || [],
    };
  });
}

export async function getBuyersWithStats(): Promise<BuyerDashboardRow[]> {
  if (!supabase) return [];

  const [{ data: profiles }, { data: orders }] = await Promise.all([
    supabase.from("buyer_profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("marketplace_orders").select("*"),
  ]);

  if (!profiles?.length) return [];

  return profiles.map((profile: Record<string, unknown>) => {
    const wallet = (profile.wallet_address as string) || "";
    const buyerOrders =
      orders?.filter(
        (o: Record<string, unknown>) =>
          (o.buyer_address as string)?.toLowerCase() === wallet.toLowerCase() ||
          o.buyer_id === profile.id
      ) || [];

    const spent = buyerOrders.reduce((sum: number, o: Record<string, unknown>) => sum + Number(o.total_amount || 0), 0);

    return {
      id: profile.id as string,
      name: (profile.name as string) || "Unknown Buyer",
      company: (profile.company_name as string) || (profile.name as string) || "",
      email: (profile.email as string) || "",
      phone: (profile.phone as string) || "",
      location: (profile.city as string) || (profile.delivery_address as string) || "Zambia",
      wallet,
      verified: Boolean(profile.verified),
      orders: buyerOrders.length,
      spent,
      status: profile.verified ? "active" : "pending",
    };
  });
}

export async function getRecentMarketplaceOrders(limit = 8): Promise<MarketplaceOrderRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("marketplace_orders")
    .select("id, buyer_name, crop_type, total_amount, created_at, status, listing:marketplace_listings(crop_type)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  return data.map((row: any) => ({
    id: row.id as string,
    buyer: (row.buyer_name as string) || "Buyer",
    crop: (row.crop_type as string) || row.listing?.crop_type || "Produce",
    amount: `ZK ${Number(row.total_amount || 0).toLocaleString()}`,
    date: row.created_at ? new Date(row.created_at as string).toLocaleDateString() : "-",
    status: (row.status as string) || "pending",
  }));
}

export async function getRecentPayments(limit = 20): Promise<PaymentDashboardRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  const addresses = new Set<string>();
  data.forEach((p: Record<string, unknown>) => {
    if (p.from_address) addresses.add(p.from_address as string);
    if (p.to_address) addresses.add(p.to_address as string);
  });

  const addrList = [...addresses];
  const [{ data: farmers }, { data: buyers }] = await Promise.all([
    addrList.length
      ? supabase.from("farmers").select("wallet_address, name").in("wallet_address", addrList)
      : Promise.resolve({ data: [] }),
    addrList.length
      ? supabase.from("buyer_profiles").select("wallet_address, name, company_name").in("wallet_address", addrList)
      : Promise.resolve({ data: [] }),
  ]);

  const nameByWallet: Record<string, string> = {};
  farmers?.forEach((f: { wallet_address: string; name: string }) => {
    nameByWallet[(f.wallet_address as string).toLowerCase()] = f.name as string;
  });
  buyers?.forEach((b: { wallet_address: string; name: string; company_name?: string }) => {
    nameByWallet[(b.wallet_address as string).toLowerCase()] =
      (b.company_name as string) || (b.name as string);
  });

  const resolve = (addr?: string | null) => {
    if (!addr) return "Unknown";
    return nameByWallet[addr.toLowerCase()] || `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  };

  return data.map((p: Record<string, unknown>) => ({
    id: (p.id as string).slice(0, 8).toUpperCase(),
    from: resolve(p.from_address as string),
    to: resolve(p.to_address as string),
    amount: `ZK ${Number(p.amount || 0).toLocaleString()}`,
    status: (p.status as string) || "pending",
    date: p.created_at ? new Date(p.created_at as string).toLocaleDateString() : "-",
    hash: p.transaction_hash
      ? `${(p.transaction_hash as string).slice(0, 8)}…`
      : "-",
  }));
}

export async function getRecentGrowthActivities(limit = 5): Promise<GrowthActivityRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("growth_activities")
    .select("id, title, activity_type, location_address, date, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    title: (row.title as string) || (row.activity_type as string) || "Activity",
    location: (row.location_address as string) || "Farm",
    date: row.date
      ? new Date(row.date as string).toLocaleDateString()
      : row.created_at
        ? new Date(row.created_at as string).toLocaleDateString()
        : "-",
    activityType: (row.activity_type as string) || "activity",
  }));
}

export function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `ZK ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `ZK ${Math.round(amount / 1_000)}K`;
  return `ZK ${Math.round(amount).toLocaleString()}`;
}

export function computeAnalyticsGrowth(
  trend: MonthlyTrendPoint[]
): { farmerGrowth: string; revenueLabel: string; latestVolume: string } {
  if (trend.length < 2) {
    return { farmerGrowth: "-", revenueLabel: "-", latestVolume: "ZK 0" };
  }
  const prev = trend[trend.length - 2].cost;
  const latest = trend[trend.length - 1].cost;
  const pct = prev > 0 ? Math.round(((latest - prev) / prev) * 100) : latest > 0 ? 100 : 0;
  return {
    farmerGrowth: `${pct >= 0 ? "+" : ""}${pct}%`,
    revenueLabel: `${pct >= 0 ? "+" : ""}${pct}%`,
    latestVolume: `ZK ${latest.toLocaleString()}`,
  };
}
