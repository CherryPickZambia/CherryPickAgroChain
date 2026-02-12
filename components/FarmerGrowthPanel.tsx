"use client";

import { useState, useEffect, useRef } from "react";
import { Sprout, Camera, Calendar, Package, Droplets, Loader2, Plus, ChevronDown, Tractor, Upload, MapPin, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { logGrowthActivity, getGrowthActivitiesByFarmer, type GrowthActivity } from "@/lib/growthService";
import { uploadToIPFS } from "@/lib/ipfsService";

interface FarmerGrowthPanelProps {
    farmerId: string;
    contracts: { id: string; cropType: string; variety?: string; status: string }[];
    isPending?: boolean;
}

const ACTIVITY_TYPES = [
    { value: "planting", label: "Planting", icon: "🌱" },
    { value: "weeding", label: "Weeding", icon: "🌿" },
    { value: "fertilizer", label: "Fertilizer Application", icon: "💧" },
    { value: "pesticide", label: "Pesticide/Spray", icon: "🧪" },
    { value: "irrigation", label: "Irrigation", icon: "💦" },
    { value: "pruning", label: "Pruning", icon: "✂️" },
    { value: "harvesting", label: "Harvesting", icon: "🌾" },
    { value: "dispatch", label: "Dispatch/Transport", icon: "🚛" },
    { value: "other", label: "Other", icon: "📋" },
] as const;

export default function FarmerGrowthPanel({ farmerId, contracts, isPending }: FarmerGrowthPanelProps) {
    const [activities, setActivities] = useState<GrowthActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [photos, setPhotos] = useState<string[]>([]);
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        contract_id: "",
        activity_type: "planting" as GrowthActivity["activity_type"],
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        quantity: "",
        unit: "kg",
        // Fertilizer specifics
        fertilizer_brand: "",
        fertilizer_type: "",
        npk_ratio: "",
        // Dispatch specifics
        transport_type: "",
        vehicle_registration: "",
        driver_name: "",
        driver_phone: "",
        origin: "",
        destination: "",
    });

    useEffect(() => {
        loadActivities();
    }, [farmerId]);

    const loadActivities = async () => {
        try {
            const data = await getGrowthActivitiesByFarmer(farmerId);
            setActivities(data);
        } catch (error) {
            console.error("Error loading activities:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (photos.length + files.length > 4) {
            toast.error("Maximum 4 photos per activity");
            return;
        }
        setPhotoFiles(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setPhotos(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async () => {
        if (!form.contract_id || !form.title || !form.date) {
            toast.error("Contract, title, and date are required");
            return;
        }
        setSubmitting(true);
        try {
            // Upload photos to IPFS
            let photoUrls: string[] = [];
            if (photoFiles.length > 0) {
                const uploadPromises = photoFiles.map(file =>
                    uploadToIPFS(file).then(r => r.url).catch(() => null)
                );
                const results = await Promise.all(uploadPromises);
                photoUrls = results.filter((r): r is string => r !== null);
            }

            await logGrowthActivity({
                contract_id: form.contract_id,
                farmer_id: farmerId,
                activity_type: form.activity_type,
                title: form.title,
                description: form.description || undefined,
                date: form.date,
                quantity: form.quantity ? parseFloat(form.quantity) : undefined,
                unit: form.quantity ? form.unit : undefined,
                photos: photoUrls.length > 0 ? photoUrls : undefined,
                fertilizer_brand: form.activity_type === "fertilizer" ? form.fertilizer_brand || undefined : undefined,
                fertilizer_type: form.activity_type === "fertilizer" ? form.fertilizer_type || undefined : undefined,
                npk_ratio: form.activity_type === "fertilizer" ? form.npk_ratio || undefined : undefined,
                transport_type: form.activity_type === "dispatch" ? form.transport_type || undefined : undefined,
                vehicle_registration: form.activity_type === "dispatch" ? form.vehicle_registration || undefined : undefined,
                driver_name: form.activity_type === "dispatch" ? form.driver_name || undefined : undefined,
                driver_phone: form.activity_type === "dispatch" ? form.driver_phone || undefined : undefined,
                origin: form.activity_type === "dispatch" ? form.origin || undefined : undefined,
                destination: form.activity_type === "dispatch" ? form.destination || undefined : undefined,
            });

            toast.success("Activity logged!");
            setShowForm(false);
            setPhotos([]);
            setPhotoFiles([]);
            setForm({ ...form, title: "", description: "", quantity: "", fertilizer_brand: "", fertilizer_type: "", npk_ratio: "", transport_type: "", vehicle_registration: "", driver_name: "", driver_phone: "", origin: "", destination: "" });
            loadActivities();
        } catch (error) {
            console.error("Error logging activity:", error);
            toast.error("Failed to log activity");
        } finally {
            setSubmitting(false);
        }
    };

    const getActivityIcon = (type: string) => {
        return ACTIVITY_TYPES.find(t => t.value === type)?.icon || "📋";
    };

    if (isPending) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-yellow-200">
                <Sprout className="h-16 w-16 text-yellow-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Growth Tracking Locked</h3>
                <p className="text-gray-600">Your account must be approved before you can log growth activities.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Sprout className="h-6 w-6 text-green-600" />Growth & Development</h2>
                    <p className="text-sm text-gray-600 mt-1">Log farm activities, evidence, and track crop progress</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    disabled={contracts.filter(c => c.status === "active").length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Log Activity
                </button>
            </div>

            {contracts.filter(c => c.status === "active").length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                    You need an active contract before you can log growth activities.
                </div>
            )}

            {/* Activity Log Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Log Farm Activity</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract *</label>
                                    <select value={form.contract_id} onChange={e => setForm({ ...form, contract_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                        <option value="">Select contract</option>
                                        {contracts.filter(c => c.status === "active").map(c => <option key={c.id} value={c.id}>{c.cropType}{c.variety ? ` - ${c.variety}` : ""}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type *</label>
                                    <select value={form.activity_type} onChange={e => setForm({ ...form, activity_type: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                        {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Applied NPK 20-10-10 fertilizer" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (optional)</label>
                                    <div className="flex gap-2">
                                        <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="Amount" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                            <option value="kg">kg</option><option value="liters">L</option><option value="bags">bags</option><option value="units">units</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Fertilizer-specific fields */}
                                {form.activity_type === "fertilizer" && (
                                    <>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand</label><input type="text" value={form.fertilizer_brand} onChange={e => setForm({ ...form, fertilizer_brand: e.target.value })} placeholder="e.g., Yara" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">NPK Ratio</label><input type="text" value={form.npk_ratio} onChange={e => setForm({ ...form, npk_ratio: e.target.value })} placeholder="e.g., 20-10-10" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                                    </>
                                )}

                                {/* Dispatch-specific fields */}
                                {form.activity_type === "dispatch" && (
                                    <>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Transport Type</label><input type="text" value={form.transport_type} onChange={e => setForm({ ...form, transport_type: e.target.value })} placeholder="e.g., Truck, Van" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Reg.</label><input type="text" value={form.vehicle_registration} onChange={e => setForm({ ...form, vehicle_registration: e.target.value })} placeholder="ABC 1234" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label><input type="text" value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Driver Phone</label><input type="text" value={form.driver_phone} onChange={e => setForm({ ...form, driver_phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Origin</label><input type="text" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} placeholder="Farm location" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Destination</label><input type="text" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="Warehouse/Market" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                                    </>
                                )}

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Additional details..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
                                </div>

                                {/* Photo Upload */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Photos (max 4)</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {photos.map((photo, i) => (
                                            <div key={i} className="w-20 h-20 rounded-lg overflow-hidden relative">
                                                <img src={photo} alt="" className="w-full h-full object-cover" />
                                                <button onClick={() => { setPhotos(prev => prev.filter((_, idx) => idx !== i)); setPhotoFiles(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                                            </div>
                                        ))}
                                        {photos.length < 4 && (
                                            <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors">
                                                <Camera className="h-5 w-5" />
                                                <span className="text-[10px] mt-1">Add</span>
                                            </button>
                                        )}
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button onClick={() => { setShowForm(false); setPhotos([]); setPhotoFiles([]); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                                <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors">
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {submitting ? "Logging..." : "Log Activity"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Activity Timeline */}
            {loading ? (
                <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-3" /><p className="text-gray-600">Loading activities...</p></div>
            ) : activities.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Sprout className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities logged yet</h3>
                    <p className="text-gray-600">Start logging your farm activities to build a growth record</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activities.map((activity, index) => (
                        <motion.div key={activity.id || index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">{getActivityIcon(activity.activity_type)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                        <span className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</span>
                                    </div>
                                    {activity.description && <p className="text-sm text-gray-600 mt-1">{activity.description}</p>}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {activity.quantity && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{activity.quantity} {activity.unit}</span>}
                                        {activity.fertilizer_brand && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{activity.fertilizer_brand} {activity.npk_ratio}</span>}
                                        {activity.transport_type && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Truck className="h-3 w-3" />{activity.transport_type}</span>}
                                        {activity.origin && <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">{activity.origin} → {activity.destination}</span>}
                                    </div>
                                    {activity.photos && activity.photos.length > 0 && (
                                        <div className="flex gap-2 mt-2">
                                            {activity.photos.map((photo, i) => (
                                                <img key={i} src={photo} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
