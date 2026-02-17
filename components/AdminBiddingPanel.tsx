"use client";

import { useState, useEffect } from "react";
import { Plus, Search, ShoppingBag, Clock, CheckCircle, XCircle, Eye, ChevronDown, Award, User, MapPin, DollarSign, Loader2, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
    createSupplyDemand,
    getAllSupplyDemands,
    getBidsByDemand,
    updateBidStatus,
    updateSupplyDemandStatus,
    type SupplyDemand,
    type FarmerBid,
} from "@/lib/biddingService";
import { SUPPORTED_CROPS } from "@/lib/config";

export default function AdminBiddingPanel() {
    const [demands, setDemands] = useState<SupplyDemand[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [expandedDemand, setExpandedDemand] = useState<string | null>(null);
    const [demandBids, setDemandBids] = useState<Record<string, (FarmerBid & { farmer?: any })[]>>({});
    const [loadingBids, setLoadingBids] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

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
        } catch (error: any) {
            console.error("Error loading demands:", error?.message || JSON.stringify(error));
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
        } catch (error) {
            console.error("Error creating demand:", error);
            toast.error("Failed to post demand");
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

    const handleBidAction = async (bidId: string, demandId: string, action: "accepted" | "rejected", farmerName?: string) => {
        try {
            await updateBidStatus(bidId, action, action === "rejected" ? "Bid did not meet requirements" : undefined);
            toast.success(`Bid ${action === "accepted" ? "accepted" : "rejected"}${farmerName ? ` for ${farmerName}` : ""}`);
            // Reload bids
            const bids = await getBidsByDemand(demandId);
            setDemandBids(prev => ({ ...prev, [demandId]: bids }));
        } catch (error) {
            console.error("Error updating bid:", error);
            toast.error("Failed to update bid");
        }
    };

    const statusColors: Record<string, string> = {
        open: "bg-green-100 text-green-700",
        partially_filled: "bg-blue-100 text-blue-700",
        filled: "bg-purple-100 text-purple-700",
        closed: "bg-gray-100 text-gray-700",
        submitted: "bg-yellow-100 text-yellow-700",
        accepted: "bg-green-100 text-green-700",
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
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
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
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., 500kg Premium Mangoes needed for export" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type *</label>
                                    <select value={form.crop_type} onChange={e => setForm({ ...form, crop_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                        <option value="">Select crop</option>
                                        {SUPPORTED_CROPS.map(crop => <option key={crop} value={crop}>{crop}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
                                    <input type="text" value={form.variety} onChange={e => setForm({ ...form, variety: e.target.value })} placeholder="e.g., Kent" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Quantity *</label>
                                    <div className="flex gap-2">
                                        <input type="number" value={form.required_quantity} onChange={e => setForm({ ...form, required_quantity: e.target.value })} placeholder="500" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                        <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                            <option value="kg">kg</option>
                                            <option value="tonnes">tonnes</option>
                                            <option value="crates">crates</option>
                                            <option value="bags">bags</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Price per {form.unit} (ZMW) *</label>
                                    <input type="number" step="0.01" value={form.max_price_per_unit} onChange={e => setForm({ ...form, max_price_per_unit: e.target.value })} placeholder="15.00" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Deadline *</label>
                                    <input type="date" value={form.delivery_deadline} onChange={e => setForm({ ...form, delivery_deadline: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quality Requirements</label>
                                    <input type="text" value={form.quality_requirements} onChange={e => setForm({ ...form, quality_requirements: e.target.value })} placeholder="Grade A, no blemishes" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Additional details..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                                <button onClick={handleCreateDemand} disabled={creating} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors">
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
                    <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-3" />
                    <p className="text-gray-600">Loading supply demands...</p>
                </div>
            ) : demands.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No supply demands yet</h3>
                    <p className="text-gray-600 mb-4">Post a supply demand to start receiving farmer bids</p>
                    <button onClick={() => setShowCreateForm(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
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
                                    className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
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
                                                    <p className="text-sm font-medium text-gray-700">{(demandBids[demand.id!] || []).length} bid(s) received</p>
                                                    {(demandBids[demand.id!] || []).map(bid => (
                                                        <div key={bid.id} className="bg-white rounded-lg border border-gray-200 p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="bg-green-50 p-2 rounded-full"><User className="h-5 w-5 text-green-600" /></div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-900">{bid.farmer?.name || "Unknown Farmer"}</p>
                                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                            <MapPin className="h-3 w-3" />{bid.farmer?.location_address || "N/A"}
                                                                            {bid.farmer?.farm_size && <span> · {bid.farmer.farm_size} ha</span>}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-lg font-bold text-gray-900">K{bid.proposed_price_per_unit}/{demand.unit}</p>
                                                                    <p className="text-xs text-gray-500">{bid.proposed_quantity} {demand.unit}</p>
                                                                </div>
                                                            </div>
                                                            {bid.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded p-2">{bid.notes}</p>}
                                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[bid.status]}`}>{bid.status}</span>
                                                                {bid.status === "submitted" && (
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => handleBidAction(bid.id!, demand.id!, "rejected", bid.farmer?.name)} className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">Reject</button>
                                                                        <button onClick={() => handleBidAction(bid.id!, demand.id!, "accepted", bid.farmer?.name)} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">Accept</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
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
