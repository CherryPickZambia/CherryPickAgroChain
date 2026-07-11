"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    Plus, ShoppingBag, Clock, Eye, ChevronDown, ChevronUp, User, MapPin,
    DollarSign, Loader2, Package, ShieldCheck, Link2, Images, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
    createSupplyDemand,
    getAllSupplyDemands,
    getBidsByDemand,
    updateBidStatus,
    acceptBidAndCreateContract,
    getBidTraceabilityStrength,
    type SupplyDemand,
    type FarmerBid,
    type BidSourceType,
    type BidTraceabilityMode,
    type BidTraceabilityStrength,
    type LinkedBatchSummary,
} from "@/lib/biddingService";
import { Farmer } from "@/lib/supabase";
import { SUPPORTED_CROPS } from "@/lib/config";

const SOURCE_LABELS: Record<BidSourceType, string> = {
    own_produce: "Own produce",
    third_party: "Third-party sourced",
    open_market: "Open market sourced",
};

const MODE_LABELS: Record<BidTraceabilityMode, string> = {
    existing_batch: "Existing tracked AgroChain batch",
    intake_details: "Intake/source traceability provided",
    basic_declaration: "Basic source declaration",
};

const STRENGTH_STYLES: Record<BidTraceabilityStrength, string> = {
    high: "bg-emerald-100 text-emerald-800 border-emerald-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    basic: "bg-gray-100 text-gray-700 border-gray-200",
};

const TRACEABILITY_RANK: Record<BidTraceabilityStrength, number> = {
    high: 3,
    medium: 2,
    basic: 1,
};

function traceabilityStrengthFor(bid: FarmerBid): BidTraceabilityStrength {
    return bid.traceability_strength || getBidTraceabilityStrength(bid.traceability_mode, bid.linked_batch_id);
}

function sortBidsForEvaluation<T extends FarmerBid>(bids: T[]): T[] {
    return [...bids].sort((a, b) => {
        const strengthDifference = TRACEABILITY_RANK[traceabilityStrengthFor(b)] - TRACEABILITY_RANK[traceabilityStrengthFor(a)];
        return strengthDifference || a.proposed_price_per_unit - b.proposed_price_per_unit;
    });
}

export default function AdminBiddingPanel() {
    const [demands, setDemands] = useState<SupplyDemand[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [expandedDemand, setExpandedDemand] = useState<string | null>(null);
    const [demandBids, setDemandBids] = useState<Record<string, (FarmerBid & { farmer?: Farmer; linked_batch?: LinkedBatchSummary })[]>>({});
    const [loadingBids, setLoadingBids] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [expandedTraceability, setExpandedTraceability] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: "",
        crop_type: "",
        variety: "",
        required_quantity: "",
        unit: "kg",
        max_price_per_unit: "",
        delivery_deadline: "",
        quality_requirements: "",
        description: "",
    });

    useEffect(() => {
        loadDemands();
    }, []);

    const loadDemands = async () => {
        try {
            const data = await getAllSupplyDemands();
            setDemands(data);
        } catch (error: unknown) {
            console.error("Error loading demands:", error instanceof Error ? error.message : JSON.stringify(error));
            toast.error("Failed to load supply demands");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDemand = async () => {
        if (!form.title || !form.crop_type || !form.required_quantity || !form.max_price_per_unit || !form.delivery_deadline) {
            toast.error("Please fill all required fields");
            return;
        }
        setCreating(true);
        try {
            await createSupplyDemand({
                title: form.title,
                crop_type: form.crop_type,
                variety: form.variety || undefined,
                required_quantity: parseFloat(form.required_quantity),
                unit: form.unit,
                max_price_per_unit: parseFloat(form.max_price_per_unit),
                delivery_deadline: form.delivery_deadline,
                quality_requirements: form.quality_requirements || undefined,
                description: form.description || undefined,
                status: "open",
            });
            toast.success("Supply demand posted!");
            setShowCreateForm(false);
            setForm({ title: "", crop_type: "", variety: "", required_quantity: "", unit: "kg", max_price_per_unit: "", delivery_deadline: "", quality_requirements: "", description: "" });
            loadDemands();
        } catch (error: unknown) {
            console.error("Error creating demand:", error instanceof Error ? error.message : JSON.stringify(error));
            toast.error("Failed to post demand: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setCreating(false);
        }
    };

    const loadBidsForDemand = async (demandId: string) => {
        if (expandedDemand === demandId) {
            setExpandedDemand(null);
            return;
        }
        setLoadingBids(demandId);
        setExpandedDemand(demandId);
        try {
            const bids = await getBidsByDemand(demandId);
            setDemandBids(prev => ({ ...prev, [demandId]: bids }));
        } catch (error) {
            console.error("Error loading bids:", error);
            toast.error("Failed to load bids");
        } finally {
            setLoadingBids(null);
        }
    };

    const [actioningBid, setActioningBid] = useState<string | null>(null);

    const handleBidAction = async (
        bid: FarmerBid & { farmer?: Farmer },
        demand: SupplyDemand,
        action: "accepted" | "rejected"
    ) => {
        const farmerName = bid.farmer?.name;
        setActioningBid(bid.id!);
        try {
            if (action === "accepted") {
                // Accepting a bid stands up an active contract + a Delivery milestone
                // (100% payment released on verified delivery), then the batch flows
                // into factory processing for the rest of the traceability chain.
                await acceptBidAndCreateContract({
                    bidId: bid.id!,
                    demandId: demand.id!,
                    farmerId: bid.farmer_id,
                    cropType: demand.crop_type,
                    quantity: bid.proposed_quantity,
                    pricePerUnit: bid.proposed_price_per_unit,
                    unit: demand.unit,
                    variety: bid.traceability_details?.variety || demand.variety,
                    linkedBatchId: bid.linked_batch_id,
                    traceabilityStrength: traceabilityStrengthFor(bid),
                    sourceType: bid.source_type,
                    evidencePhotoUrls: bid.evidence_photo_urls,
                    aiScanResult: bid.ai_scan_result,
                    deliveryDeadline: bid.delivery_date || demand.delivery_deadline,
                    requiredQuantity: demand.required_quantity,
                });
                toast.success(
                    `Bid accepted${farmerName ? ` for ${farmerName}` : ""} - contract created with a Delivery milestone. Payment releases once delivery is verified.`,
                    { duration: 6000 }
                );
            } else {
                await updateBidStatus(bid.id!, "rejected", "Bid did not meet requirements");
                toast.success(`Bid rejected${farmerName ? ` for ${farmerName}` : ""}`);
            }
            // Reload bids + demand statuses
            const bids = await getBidsByDemand(demand.id!);
            setDemandBids(prev => ({ ...prev, [demand.id!]: bids }));
            loadDemands();
        } catch (error) {
            console.error("Error updating bid:", error);
            toast.error("Failed to update bid: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setActioningBid(null);
        }
    };

    const statusColors: Record<string, string> = {
        open: "bg-emerald-100 text-emerald-700",
        partially_filled: "bg-blue-100 text-blue-700",
        filled: "bg-emerald-100 text-emerald-700",
        closed: "bg-gray-100 text-gray-700",
        submitted: "bg-yellow-100 text-yellow-700",
        accepted: "bg-emerald-100 text-emerald-700",
        rejected: "bg-red-100 text-red-700",
        withdrawn: "bg-gray-100 text-gray-700",
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Supply Demands & Bids</h2>
                    <p className="text-sm text-gray-600 mt-1">Post supply demands and review farmer bids</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Post Supply Demand
                </button>
            </div>

            {/* Create Form */}
            <AnimatePresence>
                {showCreateForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">New Supply Demand</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., 500kg Premium Mangoes needed for export" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type *</label>
                                    <select value={form.crop_type} onChange={e => setForm({ ...form, crop_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                        <option value="">Select crop</option>
                                        {SUPPORTED_CROPS.map(crop => <option key={crop} value={crop}>{crop}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
                                    <input type="text" value={form.variety} onChange={e => setForm({ ...form, variety: e.target.value })} placeholder="e.g., Kent" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Quantity *</label>
                                    <div className="flex gap-2">
                                        <input type="number" value={form.required_quantity} onChange={e => setForm({ ...form, required_quantity: e.target.value })} placeholder="500" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                                        <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                            <option value="kg">kg</option>
                                            <option value="tonnes">tonnes</option>
                                            <option value="crates">crates</option>
                                            <option value="bags">bags</option>
                                            <option value="pieces">pieces</option>
                                            <option value="units">units</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Price per {form.unit} (ZMW) *</label>
                                    <input type="number" step="0.01" value={form.max_price_per_unit} onChange={e => setForm({ ...form, max_price_per_unit: e.target.value })} placeholder="15.00" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Deadline *</label>
                                    <input type="date" value={form.delivery_deadline} onChange={e => setForm({ ...form, delivery_deadline: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quality Requirements</label>
                                    <input type="text" value={form.quality_requirements} onChange={e => setForm({ ...form, quality_requirements: e.target.value })} placeholder="Grade A, no blemishes" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Additional details..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                                <button onClick={handleCreateDemand} disabled={creating} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors">
                                    {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {creating ? "Posting..." : "Post Demand"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Demands List */}
            {loading ? (
                <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
                    <p className="text-gray-600">Loading supply demands...</p>
                </div>
            ) : demands.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No supply demands yet</h3>
                    <p className="text-gray-600 mb-4">Post a supply demand to start receiving farmer bids</p>
                    <button onClick={() => setShowCreateForm(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Post First Demand
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {demands.map(demand => (
                        <div key={demand.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900">{demand.title}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                            <span className="flex items-center gap-1"><Package className="h-4 w-4" />{demand.crop_type}{demand.variety ? ` (${demand.variety})` : ""}</span>
                                            <span>{demand.required_quantity} {demand.unit}</span>
                                            <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />Max K{demand.max_price_per_unit}/{demand.unit}</span>
                                            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />Due: {new Date(demand.delivery_deadline).toLocaleDateString()}</span>
                                        </div>
                                        {demand.quality_requirements && <p className="text-xs text-gray-500 mt-1">Quality: {demand.quality_requirements}</p>}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[demand.status] || "bg-gray-100 text-gray-700"}`}>
                                        {demand.status.replace("_", " ")}
                                    </span>
                                </div>
                                <button
                                    onClick={() => loadBidsForDemand(demand.id!)}
                                    className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                                >
                                    <Eye className="h-4 w-4" />
                                    {expandedDemand === demand.id ? "Hide Bids" : "View Bids"}
                                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedDemand === demand.id ? "rotate-180" : ""}`} />
                                </button>
                            </div>

                            {/* Bids Section */}
                            <AnimatePresence>
                                {expandedDemand === demand.id && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                        <div className="border-t border-gray-200 p-5 bg-gray-50">
                                            {loadingBids === demand.id ? (
                                                <div className="text-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto" /></div>
                                            ) : (demandBids[demand.id!] || []).length === 0 ? (
                                                <p className="text-center text-gray-500 py-4">No bids received yet</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">{(demandBids[demand.id!] || []).length} bid(s) received</p>
                                                        <p className="text-xs text-gray-500">Prioritized by traceability strength, then price.</p>
                                                    </div>
                                                    {sortBidsForEvaluation(demandBids[demand.id!] || []).map(bid => {
                                                        const strength = traceabilityStrengthFor(bid);
                                                        const details = bid.traceability_details || {};
                                                        const detailRows: [string, string | undefined][] = [
                                                            ["Harvest date", details.harvest_date],
                                                            ["Expected harvest window", details.expected_harvest_start || details.expected_harvest_end
                                                                ? `${details.expected_harvest_start || "Not set"} to ${details.expected_harvest_end || "Not set"}`
                                                                : undefined],
                                                            ["Variety", details.variety],
                                                            ["Block / orchard / location", details.source_block_or_location],
                                                            ["Supplier/source", details.supplier_name],
                                                            ["Supplier phone / ID", details.supplier_phone_or_id],
                                                            ["Claimed origin", details.claimed_origin],
                                                            ["Seller/source", details.seller_name],
                                                            ["Seller contact", details.seller_contact],
                                                            ["Market / source location", details.market_name_or_location],
                                                            ["Production notes", details.production_notes],
                                                            ["Source notes", details.source_notes],
                                                        ].filter((row): row is [string, string] => Boolean(row[1]));
                                                        const isExpanded = expandedTraceability === bid.id;

                                                        return (
                                                        <div key={bid.id} className={`bg-white rounded-lg border p-4 ${strength === "high" ? "border-emerald-300" : strength === "medium" ? "border-amber-300" : "border-gray-200"}`}>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="bg-emerald-50 p-2 rounded-full"><User className="h-5 w-5 text-emerald-600" /></div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-900">{bid.farmer?.name || "Unknown Farmer"}</p>
                                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                            <MapPin className="h-3 w-3" />{bid.farmer?.location_address || "N/A"}
                                                                            {bid.farmer?.farm_size && <span> · {bid.farmer.farm_size} ha</span>}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className={`mb-1 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold uppercase tracking-wide ${STRENGTH_STYLES[strength]}`}>
                                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                                        {strength}
                                                                    </span>
                                                                    <p className="text-lg font-bold text-gray-900">K{bid.proposed_price_per_unit}/{demand.unit}</p>
                                                                    <p className="text-xs text-gray-500">{bid.proposed_quantity} {demand.unit}</p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 rounded-lg bg-slate-50 p-3">
                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                                                                    <span className="text-gray-700">
                                                                        <strong>Source:</strong> {bid.source_type ? SOURCE_LABELS[bid.source_type] : "Not declared (legacy bid)"}
                                                                    </span>
                                                                    <span className="text-gray-700">
                                                                        <strong>Mode:</strong> {bid.traceability_mode ? MODE_LABELS[bid.traceability_mode] : "Basic information only"}
                                                                    </span>
                                                                    {bid.linked_batch && (
                                                                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                                                            <Link2 className="h-3.5 w-3.5" />
                                                                            {bid.linked_batch.batch_code} · {bid.linked_batch.current_status || "tracked"}
                                                                        </span>
                                                                    )}
                                                                    {(detailRows.length > 0 || bid.evidence_photo_urls?.length || bid.ai_scan_result) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setExpandedTraceability(isExpanded ? null : bid.id!)}
                                                                            className="ml-auto inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900"
                                                                        >
                                                                            {isExpanded ? "Hide evidence" : "View traceability evidence"}
                                                                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {isExpanded && (
                                                                    <div className="mt-3 border-t border-slate-200 pt-3 space-y-3">
                                                                        {detailRows.length > 0 && (
                                                                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                {detailRows.map(([label, value]) => (
                                                                                    <div key={label} className="rounded bg-white p-2">
                                                                                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
                                                                                        <dd className="mt-0.5 text-xs text-gray-800 whitespace-pre-wrap">{value}</dd>
                                                                                    </div>
                                                                                ))}
                                                                            </dl>
                                                                        )}
                                                                        {bid.evidence_photo_urls && bid.evidence_photo_urls.length > 0 && (
                                                                            <div>
                                                                                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-700">
                                                                                    <Images className="h-4 w-4" /> Submitted pictures
                                                                                </p>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {bid.evidence_photo_urls.map((url, index) => (
                                                                                        <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block">
                                                                                            <Image src={url} alt={`Bid evidence ${index + 1}`} width={96} height={96} unoptimized className="h-24 w-24 rounded-lg border border-gray-200 object-cover" />
                                                                                        </a>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {bid.ai_scan_result && (
                                                                            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900">
                                                                                <p className="flex items-center gap-1 font-semibold">
                                                                                    <Sparkles className="h-4 w-4" />
                                                                                    AI scan: {bid.ai_scan_result.healthScore}% health · {bid.ai_scan_result.confidenceScore}% confidence
                                                                                </p>
                                                                                <p className="mt-1">{bid.ai_scan_result.diagnosis}</p>
                                                                                {bid.ai_scan_result.identifiedIssues?.length > 0 && (
                                                                                    <p className="mt-1"><strong>Issues:</strong> {bid.ai_scan_result.identifiedIssues.join(", ")}</p>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {bid.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded p-2">{bid.notes}</p>}
                                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[bid.status]}`}>{bid.status}</span>
                                                                {bid.status === "submitted" && (
                                                                    <div className="flex gap-2">
                                                                        <button disabled={actioningBid === bid.id} onClick={() => handleBidAction(bid, demand, "rejected")} className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">Reject</button>
                                                                        <button disabled={actioningBid === bid.id} onClick={() => handleBidAction(bid, demand, "accepted")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-60">
                                                                            {actioningBid === bid.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                                                            {actioningBid === bid.id ? "Creating contract..." : "Accept & Create Contract"}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
