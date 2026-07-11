"use client";

import { useState, useEffect, useCallback } from "react";
import {
    ShoppingBag, Clock, Package, DollarSign, Send, Loader2, CheckCircle,
    XCircle, Link2, Upload, Sparkles, ShieldCheck, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
    getOpenSupplyDemands,
    submitBid,
    getBidsByFarmer,
    getBidTraceabilityStrength,
    type SupplyDemand,
    type FarmerBid,
    type BidSourceType,
    type BidTraceabilityMode,
    type BidTraceabilityDetails,
    type BidAIScanResult,
    type LinkedBatchSummary,
} from "@/lib/biddingService";
import { getBatchesByFarmer, type Batch } from "@/lib/traceabilityService";
import { uploadImageToIPFS } from "@/lib/ipfsService";
import { analyzeCropHealth, fileToJpegDataUrl } from "@/lib/aiDiagnostics";

interface FarmerBiddingPanelProps {
    farmerId: string;
    isPending?: boolean;
}

interface BidFormState {
    proposed_quantity: string;
    proposed_price_per_unit: string;
    delivery_date: string;
    notes: string;
    source_type: BidSourceType | "";
    traceability_mode: BidTraceabilityMode | "";
    linked_batch_id: string;
    details: BidTraceabilityDetails;
}

const emptyBidForm = (variety = ""): BidFormState => ({
    proposed_quantity: "",
    proposed_price_per_unit: "",
    delivery_date: "",
    notes: "",
    source_type: "",
    traceability_mode: "",
    linked_batch_id: "",
    details: { variety },
});

const SOURCE_LABELS: Record<BidSourceType, string> = {
    own_produce: "Own produce",
    third_party: "Third-party sourced",
    open_market: "Open market sourced",
};

const STRENGTH_STYLES = {
    high: "bg-emerald-100 text-emerald-800 border-emerald-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    basic: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function FarmerBiddingPanel({ farmerId, isPending }: FarmerBiddingPanelProps) {
    const [demands, setDemands] = useState<SupplyDemand[]>([]);
    const [myBids, setMyBids] = useState<(FarmerBid & { supply_demand?: SupplyDemand; linked_batch?: LinkedBatchSummary })[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDemand, setSelectedDemand] = useState<SupplyDemand | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiScanResult, setAiScanResult] = useState<BidAIScanResult | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<"browse" | "my-bids">("browse");

    const [bidForm, setBidForm] = useState<BidFormState>(emptyBidForm());

    const loadData = useCallback(async () => {
        if (!farmerId) return;
        setLoading(true);
        console.log(`FarmerBiddingPanel: Loading data for farmer ${farmerId}`);
        try {
            const [openDemands, farmerBids, farmerBatches] = await Promise.all([
                getOpenSupplyDemands(),
                getBidsByFarmer(farmerId),
                getBatchesByFarmer(farmerId),
            ]);
            console.log(`FarmerBiddingPanel: Loaded ${openDemands.length} demands and ${farmerBids.length} bids.`);
            setDemands(openDemands);
            setMyBids(farmerBids);
            setBatches(farmerBatches);
        } catch (error: unknown) {
            console.error("Error loading bidding data:", error);
            toast.error("Failed to load bidding data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [farmerId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const resetBidForm = (demand?: SupplyDemand) => {
        setBidForm(emptyBidForm(demand?.variety || ""));
        setEvidenceFiles([]);
        setAiScanResult(null);
    };

    const openBidForm = (demand: SupplyDemand) => {
        setSelectedDemand(demand);
        resetBidForm(demand);
    };

    const matchingBatches = selectedDemand
        ? batches.filter((batch) =>
            !batch.contract_id
            && batch.crop_type.trim().toLowerCase() === selectedDemand.crop_type.trim().toLowerCase()
            && batch.current_status !== "sold"
        )
        : [];

    const updateDetails = (updates: Partial<BidTraceabilityDetails>) => {
        setBidForm((current) => ({
            ...current,
            details: { ...current.details, ...updates },
        }));
    };

    const selectSourceType = (sourceType: BidSourceType) => {
        setBidForm((current) => ({
            ...current,
            source_type: sourceType,
            traceability_mode: sourceType === "open_market" ? "basic_declaration" : "",
            linked_batch_id: "",
            details: { variety: selectedDemand?.variety || "" },
        }));
        setEvidenceFiles([]);
        setAiScanResult(null);
    };

    const selectTraceabilityMode = (mode: BidTraceabilityMode) => {
        setBidForm((current) => ({
            ...current,
            traceability_mode: mode,
            linked_batch_id: mode === "existing_batch" ? current.linked_batch_id : "",
        }));
        if (mode !== "intake_details") {
            setEvidenceFiles([]);
            setAiScanResult(null);
        }
    };

    const handleEvidenceFiles = (files: FileList | null) => {
        if (!files) return;
        const selected = Array.from(files);
        const invalid = selected.find((file) =>
            (!file.type.startsWith("image/") && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i))
            || file.size > 10 * 1024 * 1024
        );
        if (invalid) {
            toast.error("Use JPG, PNG, WebP or HEIC images up to 10MB each");
            return;
        }
        setEvidenceFiles((current) => [...current, ...selected].slice(0, 5));
        setAiScanResult(null);
    };

    const runAIScan = async () => {
        if (!evidenceFiles[0] || !selectedDemand) {
            toast.error("Add a crop photo first");
            return;
        }
        setAnalyzing(true);
        try {
            const imageBase64 = await fileToJpegDataUrl(evidenceFiles[0], { maxDim: 1280, quality: 0.85 });
            const result = await analyzeCropHealth({
                imageBase64,
                cropType: selectedDemand.crop_type,
                additionalContext: bidForm.details.production_notes || bidForm.details.source_notes,
            });
            setAiScanResult({
                healthScore: result.healthScore,
                diagnosis: result.diagnosis,
                identifiedIssues: result.identifiedIssues,
                recommendations: result.recommendations,
                confidenceScore: result.confidenceScore,
                cropType: result.cropType,
                growthStage: result.growthStage,
            });
            toast.success("AI scan added to this bid");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "AI scan failed");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmitBid = async () => {
        if (!selectedDemand || !bidForm.proposed_quantity || !bidForm.proposed_price_per_unit) {
            toast.error("Quantity and price are required");
            return;
        }

        const quantity = parseFloat(bidForm.proposed_quantity);
        const price = parseFloat(bidForm.proposed_price_per_unit);
        if (!Number.isFinite(quantity) || quantity <= 0 || quantity > selectedDemand.required_quantity) {
            toast.error(`Quantity must be between 0 and ${selectedDemand.required_quantity} ${selectedDemand.unit}`);
            return;
        }
        if (!Number.isFinite(price) || price <= 0) {
            toast.error("Enter a valid price greater than zero");
            return;
        }
        if (price > selectedDemand.max_price_per_unit) {
            toast.error(`Your price exceeds the max budget of K${selectedDemand.max_price_per_unit}/${selectedDemand.unit}`);
            return;
        }

        if (!bidForm.source_type || !bidForm.traceability_mode) {
            toast.error("Select the produce source and traceability option");
            return;
        }

        if (bidForm.traceability_mode === "existing_batch" && !bidForm.linked_batch_id) {
            toast.error("Select the existing AgroChain batch");
            return;
        }

        if (bidForm.traceability_mode === "intake_details") {
            const details = bidForm.details;
            const hasIntakeDetails = Boolean(
                details.harvest_date
                || details.expected_harvest_start
                || details.expected_harvest_end
                || details.variety
                || details.source_block_or_location
                || details.supplier_name
                || details.claimed_origin
                || details.production_notes
                || details.source_notes
                || evidenceFiles.length > 0
            );
            if (!hasIntakeDetails) {
                toast.error("Add at least one intake traceability detail");
                return;
            }
        }

        if (bidForm.traceability_mode === "basic_declaration") {
            const hasBasicDeclaration = bidForm.source_type === "own_produce"
                ? Boolean(bidForm.details.source_block_or_location || bidForm.details.source_notes)
                : bidForm.source_type === "third_party"
                    ? Boolean(bidForm.details.supplier_name || bidForm.details.claimed_origin || bidForm.details.source_notes)
                    : Boolean(bidForm.details.seller_name || bidForm.details.market_name_or_location || bidForm.details.source_notes);
            if (!hasBasicDeclaration) {
                toast.error("Add at least one source declaration detail");
                return;
            }
        }

        if (
            bidForm.source_type === "open_market"
            && !bidForm.details.seller_name
            && !bidForm.details.market_name_or_location
        ) {
            toast.error("Add the seller name or market/location");
            return;
        }

        setSubmitting(true);
        try {
            const evidencePhotoUrls = evidenceFiles.length > 0
                ? await Promise.all(evidenceFiles.map(async (file) => (await uploadImageToIPFS(file, 1600)).url))
                : [];
            const traceabilityStrength = getBidTraceabilityStrength(
                bidForm.traceability_mode,
                bidForm.linked_batch_id || undefined
            );
            await submitBid({
                supply_demand_id: selectedDemand.id!,
                farmer_id: farmerId,
                proposed_quantity: quantity,
                proposed_price_per_unit: price,
                delivery_date: bidForm.delivery_date || undefined,
                notes: bidForm.notes || undefined,
                source_type: bidForm.source_type,
                traceability_mode: bidForm.traceability_mode,
                linked_batch_id: bidForm.linked_batch_id || undefined,
                traceability_details: bidForm.details,
                evidence_photo_urls: evidencePhotoUrls,
                ai_scan_result: aiScanResult || undefined,
                traceability_strength: traceabilityStrength,
                status: "submitted",
            });
            toast.success("Bid submitted! You'll be notified when reviewed.");
            setSelectedDemand(null);
            resetBidForm();
            loadData();
        } catch (error) {
            console.error("Error submitting bid:", error);
            toast.error(error instanceof Error ? error.message : "Failed to submit bid");
        } finally {
            setSubmitting(false);
        }
    };

    const bidStatusIcon: Record<string, React.ReactNode> = {
        submitted: <Clock className="h-4 w-4 text-yellow-600" />,
        accepted: <CheckCircle className="h-4 w-4 text-emerald-600" />,
        rejected: <XCircle className="h-4 w-4 text-red-600" />,
    };

    const bidStatusColor: Record<string, string> = {
        submitted: "bg-yellow-100 text-yellow-700",
        accepted: "bg-emerald-100 text-emerald-700",
        rejected: "bg-red-100 text-red-700",
        withdrawn: "bg-gray-100 text-gray-700",
    };

    if (isPending) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-yellow-200">
                <ShoppingBag className="h-16 w-16 text-yellow-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bidding Locked</h3>
                <p className="text-gray-600">Your account must be approved before you can bid on supply demands.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-3" />
                <p className="text-gray-600">Loading market opportunities...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-1">
                <button onClick={() => setActiveSubTab("browse")} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSubTab === "browse" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500 hover:text-gray-700"}`}>
                    Browse Demands ({demands.length})
                </button>
                <button onClick={() => setActiveSubTab("my-bids")} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSubTab === "my-bids" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500 hover:text-gray-700"}`}>
                    My Bids ({myBids.length})
                </button>
            </div>

            {activeSubTab === "browse" && (
                <div className="space-y-4">
                    {demands.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No open demands</h3>
                            <p className="text-gray-600">Check back later for new buyer requests</p>
                        </div>
                    ) : (
                        demands.map(demand => (
                            <motion.div key={demand.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{demand.title}</h3>
                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                                            <span className="flex items-center gap-1"><Package className="h-4 w-4" />{demand.crop_type}</span>
                                            <span>{demand.required_quantity} {demand.unit} needed</span>
                                            <span className="flex items-center gap-1 text-emerald-600 font-medium"><DollarSign className="h-4 w-4" />Up to K{demand.max_price_per_unit}/{demand.unit}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" />Deadline: {new Date(demand.delivery_deadline).toLocaleDateString()}
                                            {demand.quality_requirements && <span> · Quality: {demand.quality_requirements}</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openBidForm(demand)}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                                    >
                                        <Send className="h-4 w-4" />
                                        Place Bid
                                    </button>
                                </div>
                                {demand.description && <p className="text-sm text-gray-600 mt-2">{demand.description}</p>}
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {activeSubTab === "my-bids" && (
                <div className="space-y-4">
                    {myBids.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bids yet</h3>
                            <p className="text-gray-600">Browse demands and submit your first bid</p>
                        </div>
                    ) : (
                        myBids.map(bid => (
                            <div key={bid.id} className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{bid.supply_demand?.title || "Supply Demand"}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                            <span>{bid.supply_demand?.crop_type || "Crop"}</span>
                                            <span>·</span>
                                            <span>{bid.proposed_quantity} {bid.supply_demand?.unit || "units"} @ K{bid.proposed_price_per_unit}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {bidStatusIcon[bid.status]}
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${bidStatusColor[bid.status]}`}>{bid.status}</span>
                                    </div>
                                </div>
                                {bid.source_type && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                        <span className="text-gray-600">
                                            Source: <strong>{SOURCE_LABELS[bid.source_type]}</strong>
                                        </span>
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-semibold capitalize ${STRENGTH_STYLES[bid.traceability_strength || getBidTraceabilityStrength(bid.traceability_mode, bid.linked_batch_id)]}`}>
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            {bid.traceability_strength || getBidTraceabilityStrength(bid.traceability_mode, bid.linked_batch_id)} traceability
                                        </span>
                                        {bid.linked_batch && (
                                            <span className="inline-flex items-center gap-1 text-emerald-700">
                                                <Link2 className="h-3.5 w-3.5" />
                                                Batch {bid.linked_batch.batch_code}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {bid.admin_notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{bid.admin_notes}</p>}
                                {bid.status === "accepted" && (
                                    <div className="mt-3 flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                                        <span>
                                            Bid accepted! A contract with a <strong>Delivery milestone</strong> has been created in your <strong>Contracts</strong> tab. Deliver the produce and log the delivery there - your payment is released once delivery is verified.
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Bid Submission Modal */}
            <AnimatePresence>
                {selectedDemand && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Place Bid</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Price, supply timing, and traceability will all be reviewed.</p>
                                </div>
                                <button onClick={() => setSelectedDemand(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full" aria-label="Close bid form">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-3">
                                <p className="text-sm font-medium text-emerald-800">{selectedDemand.title}</p>
                                <p className="text-xs text-emerald-600 mt-1">{selectedDemand.required_quantity} {selectedDemand.unit} · Max K{selectedDemand.max_price_per_unit}/{selectedDemand.unit}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Quantity ({selectedDemand.unit}) *</label>
                                    <input type="number" min="0" value={bidForm.proposed_quantity} onChange={e => setBidForm({ ...bidForm, proposed_quantity: e.target.value })} placeholder={`Max: ${selectedDemand.required_quantity}`} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price/{selectedDemand.unit} (ZMW) *</label>
                                    <input type="number" min="0" step="0.01" value={bidForm.proposed_price_per_unit} onChange={e => setBidForm({ ...bidForm, proposed_price_per_unit: e.target.value })} placeholder={`Max: ${selectedDemand.max_price_per_unit}`} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Earliest Delivery</label>
                                    <input type="date" value={bidForm.delivery_date} onChange={e => setBidForm({ ...bidForm, delivery_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-5 space-y-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900">1. Produce source *</h4>
                                    <p className="text-xs text-gray-500">Tell the reviewer where this supply will come from.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {(Object.entries(SOURCE_LABELS) as [BidSourceType, string][]).map(([value, label]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => selectSourceType(value)}
                                            className={`p-3 rounded-xl border text-left transition-colors ${bidForm.source_type === value ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-gray-200 hover:border-emerald-300 text-gray-700"}`}
                                        >
                                            <span className="text-sm font-semibold">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {bidForm.source_type && (
                                <div className="border-t border-gray-200 pt-5 space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">2. Traceability mode *</h4>
                                        <p className="text-xs text-gray-500">
                                            {bidForm.source_type === "own_produce"
                                                ? "Was this batch already tracked on AgroChain?"
                                                : bidForm.source_type === "third_party"
                                                    ? "How much source information can you provide?"
                                                    : "Provide a basic seller/source declaration."}
                                        </p>
                                    </div>

                                    {bidForm.source_type === "own_produce" && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <button type="button" onClick={() => selectTraceabilityMode("existing_batch")} className={`p-3 rounded-xl border text-left ${bidForm.traceability_mode === "existing_batch" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}>
                                                <span className="block text-sm font-semibold text-gray-900">Yes — link batch</span>
                                                <span className="text-xs text-gray-500">High confidence</span>
                                            </button>
                                            <button type="button" onClick={() => selectTraceabilityMode("intake_details")} className={`p-3 rounded-xl border text-left ${bidForm.traceability_mode === "intake_details" ? "border-amber-500 bg-amber-50" : "border-gray-200"}`}>
                                                <span className="block text-sm font-semibold text-gray-900">No — add details</span>
                                                <span className="text-xs text-gray-500">Medium confidence</span>
                                            </button>
                                            <button type="button" onClick={() => selectTraceabilityMode("basic_declaration")} className={`p-3 rounded-xl border text-left ${bidForm.traceability_mode === "basic_declaration" ? "border-gray-500 bg-gray-50" : "border-gray-200"}`}>
                                                <span className="block text-sm font-semibold text-gray-900">Basic declaration</span>
                                                <span className="text-xs text-gray-500">Basic confidence</span>
                                            </button>
                                        </div>
                                    )}

                                    {bidForm.source_type === "third_party" && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <button type="button" onClick={() => selectTraceabilityMode("intake_details")} className={`p-3 rounded-xl border text-left ${bidForm.traceability_mode === "intake_details" ? "border-amber-500 bg-amber-50" : "border-gray-200"}`}>
                                                <span className="block text-sm font-semibold text-gray-900">Intake/source details available</span>
                                                <span className="text-xs text-gray-500">Medium confidence</span>
                                            </button>
                                            <button type="button" onClick={() => selectTraceabilityMode("basic_declaration")} className={`p-3 rounded-xl border text-left ${bidForm.traceability_mode === "basic_declaration" ? "border-gray-500 bg-gray-50" : "border-gray-200"}`}>
                                                <span className="block text-sm font-semibold text-gray-900">Basic source declaration only</span>
                                                <span className="text-xs text-gray-500">Basic confidence</span>
                                            </button>
                                        </div>
                                    )}

                                    {bidForm.traceability_mode && (
                                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${STRENGTH_STYLES[getBidTraceabilityStrength(bidForm.traceability_mode, bidForm.linked_batch_id || undefined)]}`}>
                                            <ShieldCheck className="h-4 w-4" />
                                            {getBidTraceabilityStrength(bidForm.traceability_mode, bidForm.linked_batch_id || undefined)} traceability
                                        </div>
                                    )}
                                </div>
                            )}

                            {bidForm.traceability_mode === "existing_batch" && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <label className="block text-sm font-semibold text-emerald-900 mb-2">Select your existing {selectedDemand.crop_type} batch *</label>
                                    <select value={bidForm.linked_batch_id} onChange={(e) => setBidForm({ ...bidForm, linked_batch_id: e.target.value })} className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500">
                                        <option value="">Choose a tracked batch</option>
                                        {matchingBatches.map((batch) => (
                                            <option key={batch.id} value={batch.id}>
                                                {batch.batch_code} · {batch.variety || batch.crop_type} · {batch.current_status || "tracked"}
                                            </option>
                                        ))}
                                    </select>
                                    {matchingBatches.length === 0 && (
                                        <p className="text-xs text-amber-700 mt-2">No uncontracted {selectedDemand.crop_type} batches are available. Choose “No — add details” instead.</p>
                                    )}
                                    <p className="text-xs text-emerald-700 mt-2">If accepted, this batch will be linked to the new contract; a duplicate batch will not be created.</p>
                                </div>
                            )}

                            {bidForm.traceability_mode === "intake_details" && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-4">
                                    <h4 className="text-sm font-semibold text-gray-900">Intake traceability details</h4>
                                    {bidForm.source_type === "third_party" && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Supplier/source name</label>
                                                <input value={bidForm.details.supplier_name || ""} onChange={(e) => updateDetails({ supplier_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Phone number / ID</label>
                                                <input value={bidForm.details.supplier_phone_or_id || ""} onChange={(e) => updateDetails({ supplier_phone_or_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Claimed source/origin</label>
                                                <input value={bidForm.details.claimed_origin || ""} onChange={(e) => updateDetails({ claimed_origin: e.target.value })} placeholder="Farm, district, province or aggregation point" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Harvest date (if known)</label>
                                            <input type="date" value={bidForm.details.harvest_date || ""} onChange={(e) => updateDetails({ harvest_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Variety</label>
                                            <input value={bidForm.details.variety || ""} onChange={(e) => updateDetails({ variety: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Expected harvest from</label>
                                            <input type="date" value={bidForm.details.expected_harvest_start || ""} onChange={(e) => updateDetails({ expected_harvest_start: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Expected harvest to</label>
                                            <input type="date" value={bidForm.details.expected_harvest_end || ""} onChange={(e) => updateDetails({ expected_harvest_end: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        </div>
                                        {bidForm.source_type === "own_produce" && (
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Source block / orchard / location</label>
                                                <input value={bidForm.details.source_block_or_location || ""} onChange={(e) => updateDetails({ source_block_or_location: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                            </div>
                                        )}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">{bidForm.source_type === "own_produce" ? "Production notes" : "Source notes"}</label>
                                            <textarea value={(bidForm.source_type === "own_produce" ? bidForm.details.production_notes : bidForm.details.source_notes) || ""} onChange={(e) => updateDetails(bidForm.source_type === "own_produce" ? { production_notes: e.target.value } : { source_notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
                                        </div>
                                    </div>

                                    <div className="border-t border-amber-200 pt-4">
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">Pictures (optional, up to 5)</label>
                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-amber-400 bg-white px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50">
                                            <Upload className="h-4 w-4" />
                                            Add pictures
                                            <input type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={(e) => { handleEvidenceFiles(e.target.files); e.target.value = ""; }} />
                                        </label>
                                        {evidenceFiles.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {evidenceFiles.map((file, index) => (
                                                    <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs text-gray-700">
                                                        <span className="truncate">{file.name}</span>
                                                        <button type="button" onClick={() => { setEvidenceFiles((files) => files.filter((_, i) => i !== index)); setAiScanResult(null); }} className="text-red-500 hover:text-red-700">Remove</button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={runAIScan} disabled={analyzing} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
                                                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                                    {analyzing ? "Scanning first photo..." : "Run AI scan on first photo"}
                                                </button>
                                            </div>
                                        )}
                                        {aiScanResult && (
                                            <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900">
                                                <p className="font-semibold">AI scan: {aiScanResult.healthScore}% health · {aiScanResult.confidenceScore}% confidence</p>
                                                <p className="mt-1">{aiScanResult.diagnosis}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {bidForm.traceability_mode === "basic_declaration" && (
                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-900">Basic source declaration</h4>
                                    {bidForm.source_type === "open_market" ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Seller/source name</label>
                                                <input value={bidForm.details.seller_name || ""} onChange={(e) => updateDetails({ seller_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Seller contact</label>
                                                <input value={bidForm.details.seller_contact || ""} onChange={(e) => updateDetails({ seller_contact: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Market / source location</label>
                                                <input value={bidForm.details.market_name_or_location || ""} onChange={(e) => updateDetails({ market_name_or_location: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Claimed origin (if known)</label>
                                                <input value={bidForm.details.claimed_origin || ""} onChange={(e) => updateDetails({ claimed_origin: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                            </div>
                                        </div>
                                    ) : bidForm.source_type === "third_party" ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input value={bidForm.details.supplier_name || ""} onChange={(e) => updateDetails({ supplier_name: e.target.value })} placeholder="Supplier/source name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                            <input value={bidForm.details.claimed_origin || ""} onChange={(e) => updateDetails({ claimed_origin: e.target.value })} placeholder="Claimed source/origin" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        </div>
                                    ) : (
                                        <input value={bidForm.details.source_block_or_location || ""} onChange={(e) => updateDetails({ source_block_or_location: e.target.value })} placeholder="Farm, block, orchard or source location" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                    )}
                                    <textarea value={bidForm.details.source_notes || ""} onChange={(e) => updateDetails({ source_notes: e.target.value })} rows={2} placeholder="Source declaration notes" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bid notes (optional)</label>
                                <textarea value={bidForm.notes} onChange={e => setBidForm({ ...bidForm, notes: e.target.value })} rows={2} placeholder="Why choose you? Farm experience, certifications..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setSelectedDemand(null)} className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors">Cancel</button>
                                <button onClick={handleSubmitBid} disabled={submitting} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {submitting ? (evidenceFiles.length ? "Uploading & submitting..." : "Submitting...") : "Submit Bid"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
