"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Clock, Package, DollarSign, Send, Loader2, CheckCircle, XCircle, Eye, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
    getOpenSupplyDemands,
    submitBid,
    getBidsByFarmer,
    type SupplyDemand,
    type FarmerBid,
} from "@/lib/biddingService";

interface FarmerBiddingPanelProps {
    farmerId: string;
    isPending?: boolean;
}

export default function FarmerBiddingPanel({ farmerId, isPending }: FarmerBiddingPanelProps) {
    const [demands, setDemands] = useState<SupplyDemand[]>([]);
    const [myBids, setMyBids] = useState<(FarmerBid & { supply_demand?: any })[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDemand, setSelectedDemand] = useState<SupplyDemand | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState<"browse" | "my-bids">("browse");

    const [bidForm, setBidForm] = useState({
        proposed_quantity: "",
        proposed_price_per_unit: "",
        delivery_date: "",
        notes: "",
    });

    useEffect(() => {
        loadData();
    }, [farmerId]);

    const loadData = async () => {
        try {
            const [openDemands, farmerBids] = await Promise.all([
                getOpenSupplyDemands(),
                getBidsByFarmer(farmerId),
            ]);
            setDemands(openDemands);
            setMyBids(farmerBids);
        } catch (error) {
            console.error("Error loading bidding data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitBid = async () => {
        if (!selectedDemand || !bidForm.proposed_quantity || !bidForm.proposed_price_per_unit) {
            toast.error("Quantity and price are required");
            return;
        }

        const price = parseFloat(bidForm.proposed_price_per_unit);
        if (price > selectedDemand.max_price_per_unit) {
            toast.error(`Your price exceeds the max budget of K${selectedDemand.max_price_per_unit}/${selectedDemand.unit}`);
            return;
        }

        setSubmitting(true);
        try {
            await submitBid({
                supply_demand_id: selectedDemand.id!,
                farmer_id: farmerId,
                proposed_quantity: parseFloat(bidForm.proposed_quantity),
                proposed_price_per_unit: price,
                delivery_date: bidForm.delivery_date || undefined,
                notes: bidForm.notes || undefined,
                status: "submitted",
            });
            toast.success("Bid submitted! You'll be notified when reviewed.");
            setSelectedDemand(null);
            setBidForm({ proposed_quantity: "", proposed_price_per_unit: "", delivery_date: "", notes: "" });
            loadData();
        } catch (error) {
            console.error("Error submitting bid:", error);
            toast.error("Failed to submit bid");
        } finally {
            setSubmitting(false);
        }
    };

    const bidStatusIcon: Record<string, React.ReactNode> = {
        submitted: <Clock className="h-4 w-4 text-yellow-600" />,
        accepted: <CheckCircle className="h-4 w-4 text-green-600" />,
        rejected: <XCircle className="h-4 w-4 text-red-600" />,
    };

    const bidStatusColor: Record<string, string> = {
        submitted: "bg-yellow-100 text-yellow-700",
        accepted: "bg-green-100 text-green-700",
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
                <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-3" />
                <p className="text-gray-600">Loading market opportunities...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-1">
                <button onClick={() => setActiveSubTab("browse")} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSubTab === "browse" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"}`}>
                    Browse Demands ({demands.length})
                </button>
                <button onClick={() => setActiveSubTab("my-bids")} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSubTab === "my-bids" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"}`}>
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
                                            <span className="flex items-center gap-1 text-green-600 font-medium"><DollarSign className="h-4 w-4" />Up to K{demand.max_price_per_unit}/{demand.unit}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" />Deadline: {new Date(demand.delivery_deadline).toLocaleDateString()}
                                            {demand.quality_requirements && <span> · Quality: {demand.quality_requirements}</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedDemand(demand); setBidForm({ proposed_quantity: "", proposed_price_per_unit: "", delivery_date: "", notes: "" }); }}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
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
                                        <h3 className="font-semibold text-gray-900">{(bid as any).supply_demand?.title || "Supply Demand"}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                            <span>{(bid as any).supply_demand?.crop_type || "Crop"}</span>
                                            <span>·</span>
                                            <span>{bid.proposed_quantity} {(bid as any).supply_demand?.unit || "units"} @ K{bid.proposed_price_per_unit}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {bidStatusIcon[bid.status]}
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${bidStatusColor[bid.status]}`}>{bid.status}</span>
                                    </div>
                                </div>
                                {bid.admin_notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{bid.admin_notes}</p>}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Bid Submission Modal */}
            <AnimatePresence>
                {selectedDemand && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Place Bid</h3>
                            <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-sm font-medium text-green-800">{selectedDemand.title}</p>
                                <p className="text-xs text-green-600 mt-1">{selectedDemand.required_quantity} {selectedDemand.unit} · Max K{selectedDemand.max_price_per_unit}/{selectedDemand.unit}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Quantity ({selectedDemand.unit}) *</label>
                                <input type="number" value={bidForm.proposed_quantity} onChange={e => setBidForm({ ...bidForm, proposed_quantity: e.target.value })} placeholder={`Max: ${selectedDemand.required_quantity}`} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Price per {selectedDemand.unit} (ZMW) *</label>
                                <input type="number" step="0.01" value={bidForm.proposed_price_per_unit} onChange={e => setBidForm({ ...bidForm, proposed_price_per_unit: e.target.value })} placeholder={`Max: ${selectedDemand.max_price_per_unit}`} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Earliest Delivery Date</label>
                                <input type="date" value={bidForm.delivery_date} onChange={e => setBidForm({ ...bidForm, delivery_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                                <textarea value={bidForm.notes} onChange={e => setBidForm({ ...bidForm, notes: e.target.value })} rows={2} placeholder="Why choose you? Farm experience, certifications..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setSelectedDemand(null)} className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors">Cancel</button>
                                <button onClick={handleSubmitBid} disabled={submitting} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {submitting ? "Submitting..." : "Submit Bid"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
