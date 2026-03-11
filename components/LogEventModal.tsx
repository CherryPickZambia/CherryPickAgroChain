"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, MapPin, Truck, Warehouse, Loader2, Sprout, Camera, Upload, Trash2, Thermometer, Droplets, Wind, ListTodo, CheckCircle, Plus, Package, AlertCircle } from "lucide-react";
import CropDiagnostics from "./CropDiagnostics";
import { getLatestAIDiagnostic } from "@/lib/traceabilityService";
import { useEffect } from "react";
import { addTraceabilityEvent, TraceabilityEventType } from "@/lib/traceabilityService";
import { uploadToIPFS } from "@/lib/ipfsService";
import toast from "react-hot-toast";

interface IoTReading {
    id: string;
    type: "temperature" | "humidity" | "soil_moisture" | "ph_level";
    value: number;
    unit: string;
    timestamp: string;
}

interface AIDiagnosisResult {
    disease: string;
    confidence: number;
    healthScore: number;
    treatmentRec: string;
}

interface LogEventModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
    batchId: string;
    farmerId: string; // The actor logging the event
    userId?: string;
    onSuccessAction: () => void;
    isContract?: boolean;
}

const EVENT_TYPES = [
    { value: 'planting', label: 'Planting', icon: Calendar },
    { value: 'germination', label: 'Germination', icon: Sprout },
    { value: 'growth_update', label: 'Growth Update', icon: Calendar },
    { value: 'input_application', label: 'Inputs (Fert/Pesticide)', icon: Calendar },
    { value: 'flowering', label: 'Flowering', icon: Sprout },
    { value: 'harvest', label: 'Harvest', icon: Calendar },
    { value: 'post_harvest_handling', label: 'Post-Harvest Handling', icon: ListTodo },
    { value: 'storage', label: 'Storage', icon: Warehouse },
    { value: 'transport_start', label: 'Transport / Dispatch', icon: Truck },
];

export default function LogEventModal({ isOpen, onCloseAction, batchId, farmerId, userId, onSuccessAction, isContract = false }: LogEventModalProps) {
    const [loading, setLoading] = useState(false);
    const [entryType, setEntryType] = useState<"activity" | "observation">("activity");
    const [eventType, setEventType] = useState<TraceabilityEventType>('growth_update');
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");

    // Evidence / IoT State
    const [evidenceImages, setEvidenceImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    const [iotReadings, setIotReadings] = useState<IoTReading[]>([]);
    const [showIoTForm, setShowIoTForm] = useState(false);
    const [iotType, setIoTType] = useState<IoTReading["type"]>("temperature");
    const [iotValue, setIoTValue] = useState("");

    // Dispatch Fields
    const [transportMode, setTransportMode] = useState("truck");
    const [vehicleReg, setVehicleReg] = useState("");
    const [driverName, setDriverName] = useState("");
    const [driverPhone, setDriverPhone] = useState("");

    // Fertilizer/Pesticide Details
    const [fertilizerBrand, setFertilizerBrand] = useState("");
    const [fertilizerType, setFertilizerType] = useState("organic");
    const [npkRatio, setNpkRatio] = useState("");

    // Quantity Fields
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("kg");

    // Recommendations & Checklist
    const [recommendations, setRecommendations] = useState("");
    const [currentChecklistItem, setCurrentChecklistItem] = useState("");
    const [checklistItems, setChecklistItems] = useState<string[]>([]);

    // AI Diagnostics
    const [aiResult, setAiResult] = useState<AIDiagnosisResult | null>(null);
    const [showAiScanner, setShowAiScanner] = useState(false);
    const [previousDiagnosis, setPreviousDiagnosis] = useState<{ disease?: string, health_score?: number, treatment_rec?: string } | null>(null);

    // Load previous diagnosis if exists
    useEffect(() => {
        if (isOpen && batchId) {
            const checkPreviousHealth = async () => {
                const diagnostic = await getLatestAIDiagnostic(batchId);
                if (diagnostic && (diagnostic.health_score || 0) < 90) {
                    setPreviousDiagnosis(diagnostic);
                }
            };
            checkPreviousHealth();
        }
    }, [isOpen, batchId]);

    const addChecklistItem = () => {
        if (!currentChecklistItem.trim()) return;
        setChecklistItems([...checklistItems, currentChecklistItem.trim()]);
        setCurrentChecklistItem("");
    };

    const removeChecklistItem = (index: number) => {
        setChecklistItems(checklistItems.filter((_, i) => i !== index));
    };

    const availableEventTypes = EVENT_TYPES;

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (evidenceImages.length + files.length > 5) {
            toast.error("Maximum 5 images per activity");
            return;
        }
        setEvidenceImages([...evidenceImages, ...files]);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setEvidenceImages(evidenceImages.filter((_, i) => i !== index));
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
        setUploadedImageUrls(uploadedImageUrls.filter((_, i) => i !== index));
    };

    const uploadImages = async () => {
        if (evidenceImages.length === 0) return;
        setUploadingImages(true);
        try {
            const urls = [];
            for (const file of evidenceImages) {
                const result = await uploadToIPFS(file);
                urls.push(result.url);
            }
            setUploadedImageUrls(urls);
            toast.success("Images uploaded successfully");
            return urls;
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload images");
            return [];
        } finally {
            setUploadingImages(false);
        }
    };

    const addIoTReading = () => {
        if (!iotValue) {
            toast.error("Please enter a value");
            return;
        }

        const units: Record<IoTReading["type"], string> = {
            temperature: "°C",
            humidity: "%",
            soil_moisture: "%",
            ph_level: "pH",
        };

        const newReading: IoTReading = {
            id: Date.now().toString(),
            type: iotType,
            value: parseFloat(iotValue),
            unit: units[iotType],
            timestamp: new Date().toISOString(),
        };

        setIotReadings([...iotReadings, newReading]);
        setIoTValue("");
        setShowIoTForm(false);
        toast.success("IoT reading added");
    };

    const removeIoTReading = (id: string) => {
        setIotReadings(iotReadings.filter((r) => r.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalImageUrls = uploadedImageUrls;
            if (evidenceImages.length > 0 && uploadedImageUrls.length === 0) {
                const urls = await uploadImages();
                if (urls) finalImageUrls = urls;
            }

            // Build extended description with fertilizer details if applicable
            let extendedDescription = description;
            if ((eventType === 'input_application' || eventType === 'fertilization') && fertilizerBrand) {
                extendedDescription += ` | Fertilizer: ${fertilizerBrand} (${fertilizerType})${npkRatio ? `, NPK: ${npkRatio}` : ''}`;
            }
            if (quantity) {
                extendedDescription += ` | Qty: ${quantity} ${unit}`;
            }
            if (recommendations) {
                extendedDescription += ` | Recommendations: ${recommendations}`;
            }
            if (checklistItems.length > 0) {
                extendedDescription += ` | Follow-up: ${checklistItems.join(', ')}`;
            }

            await addTraceabilityEvent({
                batch_id: batchId,
                farmer_id: farmerId,
                event_type: eventType,
                event_title: title || availableEventTypes.find(t => t.value === eventType)?.label || 'Event',
                event_description: extendedDescription,
                actor_id: userId || farmerId,
                actor_type: 'farmer',
                location_address: location,
                photos: finalImageUrls.length > 0 ? finalImageUrls : undefined,
                iot_readings: iotReadings.length > 0 ? (iotReadings as unknown as Record<string, unknown>[]) : undefined,
                quantity: quantity ? parseFloat(quantity) : undefined,
                unit: quantity ? unit : undefined,
                // AI Diagnostics
                ai_disease: aiResult?.disease,
                ai_confidence: aiResult?.confidence,
                ai_health_score: aiResult?.healthScore,
                ai_treatment_rec: aiResult?.treatmentRec,
                // Dispatch details
                transport_mode: eventType === 'transport_start' ? (transportMode as any) : undefined,
                vehicle_registration: eventType === 'transport_start' ? vehicleReg : undefined,
                driver_name: eventType === 'transport_start' ? driverName : undefined,
                driver_phone: eventType === 'transport_start' ? driverPhone : undefined,
            });

            toast.success("Event logged successfully!");
            onSuccessAction();
            onCloseAction();
        } catch (error: any) {
            console.error("Error logging event:", error);
            toast.error(error.message || "Failed to log event");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col h-[95vh] max-h-[95vh]"
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center" style={{ background: '#F7F9FB' }}>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl" style={{ background: '#0C2D3A' }}>
                                    <Sprout className="w-5 h-5" style={{ color: '#BFFF00' }} />
                                </div>
                                <h3 className="text-xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Log New Activity</h3>
                            </div>
                            <button
                                onClick={onCloseAction}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" style={{ color: '#5A7684' }} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Entry Type Toggle */}
                            <div className="flex bg-gray-100/80 rounded-full p-1.5 mb-8 max-w-[280px] mx-auto border border-gray-100 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setEntryType("activity")}
                                    className={`flex-1 py-1.5 px-6 rounded-full text-sm font-semibold transition-all ${entryType === "activity" ? "bg-white text-blue-600 shadow-md transform scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    Activity
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEntryType("observation")}
                                    className={`flex-1 py-1.5 px-6 rounded-full text-sm font-semibold transition-all ${entryType === "observation" ? "bg-white text-blue-600 shadow-md transform scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    Observation
                                </button>
                            </div>

                            {isContract && (
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8">
                                    <p className="text-sm text-amber-800 flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600" />
                                        <span>
                                            <strong>Contract Mode:</strong> These activities will be reviewed by the AgroChain 360 verification officer for milestone approval.
                                        </span>
                                    </p>
                                </div>
                            )}

                            {!isContract && (
                                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-8">
                                    <p className="text-sm text-blue-800 flex items-start gap-2">
                                        <Sprout className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
                                        <span>
                                            <strong>Marketplace Log:</strong> Logging your farm activities builds buyer trust and enhances your product's traceability profile.
                                        </span>
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Event Type</label>
                                    <select
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                                        value={eventType}
                                        onChange={(e) => setEventType(e.target.value as TraceabilityEventType)}
                                    >
                                        {availableEventTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Title / Reference</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={entryType === "activity" ? "e.g. Planting Batch A" : "e.g. Flowering observed"}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                {/* Fertilizer/Pesticide Details */}
                                {(eventType === 'input_application' || eventType === 'fertilization') && (
                                    <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Package className="w-4 h-4" /> Input Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Brand Name *"
                                                value={fertilizerBrand}
                                                onChange={(e) => setFertilizerBrand(e.target.value)}
                                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                                            />
                                            <select
                                                value={fertilizerType}
                                                onChange={(e) => setFertilizerType(e.target.value)}
                                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                                            >
                                                <option value="organic">Organic</option>
                                                <option value="inorganic">Inorganic</option>
                                                <option value="compound">Compound</option>
                                                <option value="pesticide">Pesticide</option>
                                                <option value="herbicide">Herbicide</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="NPK Ratio (e.g. 10-10-10)"
                                                value={npkRatio}
                                                onChange={(e) => setNpkRatio(e.target.value)}
                                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Quantity Fields */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Quantity (Optional)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 500"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Unit</label>
                                    <select
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                    >
                                        <option value="kg">Kilograms (kg)</option>
                                        <option value="liters">Liters</option>
                                        <option value="bags">Bags</option>
                                        <option value="seedlings">Seedlings</option>
                                        <option value="hours">Hours</option>
                                        <option value="units">Units</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Description / Notes</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none resize-none"
                                        placeholder="Add details about this activity..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Location (Optional)</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="e.g. Plot 4, North-West Sector"
                                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* IoT Sensor Readings */}
                            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 space-y-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-2">
                                        <Thermometer className="w-4 h-4" /> IoT Sensor Readings
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowIoTForm(!showIoTForm)}
                                        className="text-[10px] font-bold bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors uppercase tracking-wider"
                                    >
                                        {showIoTForm ? "Hide" : "Add Reading"}
                                    </button>
                                </div>

                                {showIoTForm && (
                                    <div className="bg-white p-3 rounded-xl border border-purple-100 flex gap-2">
                                        <select
                                            value={iotType}
                                            onChange={(e) => setIoTType(e.target.value as any)}
                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                                        >
                                            <option value="temperature">Temperature</option>
                                            <option value="humidity">Humidity</option>
                                            <option value="soil_moisture">Soil Moisture</option>
                                            <option value="ph_level">pH Level</option>
                                        </select>
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={iotValue}
                                                onChange={(e) => setIoTValue(e.target.value)}
                                                placeholder="Value"
                                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                                            />
                                            <button
                                                type="button"
                                                onClick={addIoTReading}
                                                className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {iotReadings.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {iotReadings.map((reading) => (
                                            <div key={reading.id} className="bg-white px-3 py-2 rounded-lg border border-purple-100 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <Thermometer className="w-3.5 h-3.5 text-purple-500" />
                                                    <span className="text-xs font-semibold">{reading.type.replace('_', ' ')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-purple-700">{reading.value}{reading.unit}</span>
                                                    <button onClick={() => removeIoTReading(reading.id)} className="text-red-400 hover:text-red-600">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-purple-600 italic">No sensor data added yet</p>
                                )}
                            </div>

                            {/* Evidence Photos */}
                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-4 mb-6">
                                <label className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                                    <Camera className="w-4 h-4" /> Evidence Photos
                                </label>
                                <div className="grid grid-cols-5 gap-3">
                                    {imagePreviews.map((src, idx) => (
                                        <div key={idx} className="relative aspect-square group">
                                            <img src={src} alt="Preview" className="w-full h-full object-cover rounded-2xl border border-blue-100 shadow-sm" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {imagePreviews.length < 5 && (
                                        <label className="aspect-square border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100/50 bg-white transition-all group">
                                            <Camera className="w-6 h-6 text-blue-300 group-hover:text-blue-500" />
                                            <span className="text-[10px] text-blue-400 font-bold mt-1 uppercase tracking-wider">Add Photo</span>
                                            <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                                        </label>
                                    )}
                                </div>
                                {evidenceImages.length > 0 && uploadedImageUrls.length === 0 && (
                                    <button
                                        type="button"
                                        onClick={uploadImages}
                                        disabled={uploadingImages}
                                        className="w-full py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:bg-blue-400 shadow-md shadow-blue-100"
                                    >
                                        {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        Upload to IPFS
                                    </button>
                                )}
                                {uploadedImageUrls.length > 0 && (
                                    <div className="flex items-center gap-2 text-green-700 text-[10px] font-bold bg-white p-3 rounded-xl border border-green-100 uppercase tracking-wider">
                                        <CheckCircle className="w-4 h-4 text-green-500" /> {uploadedImageUrls.length} Files Securely Logged to IPFS
                                    </div>
                                )}
                            </div>

                            {/* AI Diagnostics Section */}
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> AI Crop Diagnostics
                                        </h4>
                                        <p className="text-[10px] text-indigo-600 mt-1">Scan crops for disease detection and health assessment</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAiScanner(!showAiScanner)}
                                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors ${previousDiagnosis ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                    >
                                        {showAiScanner ? "Hide Scanner" : previousDiagnosis ? "Verify Recovery" : "Enable AI Scan"}
                                    </button>
                                </div>

                                {previousDiagnosis && !aiResult && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                        <div className="flex items-center gap-2 text-amber-800 font-bold text-[10px] uppercase mb-1">
                                            <AlertCircle className="w-3.5 h-3.5" /> Recovery Verification Needed
                                        </div>
                                        <p className="text-[11px] text-amber-700">
                                            Previous scan detected <strong>{previousDiagnosis.disease}</strong> (Health: {previousDiagnosis.health_score}/100).
                                            Please perform a follow-up scan to verify recovery.
                                        </p>
                                    </div>
                                )}

                                {showAiScanner && (
                                    <div className="bg-white rounded-xl overflow-hidden border border-indigo-100 shadow-sm">
                                        <CropDiagnostics
                                            onResult={(result) => {
                                                setAiResult({
                                                    disease: result.disease,
                                                    confidence: result.confidence,
                                                    healthScore: result.healthScore,
                                                    treatmentRec: result.treatmentRec
                                                });
                                                toast.success("AI Scan Complete!");
                                                setShowAiScanner(false);
                                            }}
                                        />
                                    </div>
                                )}

                                {aiResult && (
                                    <div className="bg-white p-3 rounded-xl border border-indigo-200">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">AI Assessment Result</span>
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Health: {aiResult.healthScore}/100</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 mb-1">{aiResult.disease}</p>
                                        <p className="text-xs text-gray-600 mb-2">Confidence: {(aiResult.confidence * 100).toFixed(1)}%</p>
                                        {aiResult.treatmentRec && (
                                            <div className="bg-amber-50 p-2 rounded text-xs text-amber-800 italic border border-amber-100">
                                                <strong>Recommendation:</strong> {aiResult.treatmentRec}
                                            </div>
                                        )}
                                        <div className="mt-2 text-right">
                                            <button type="button" onClick={() => setAiResult(null)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                                                Clear Result
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Recommendations & Follow-up Checklist */}
                            <div className="bg-yellow-50/50 border border-yellow-100 rounded-2xl p-4 space-y-4 mb-6">
                                <h4 className="text-xs font-bold text-yellow-800 uppercase tracking-wider flex items-center gap-2">
                                    <ListTodo className="w-4 h-4" /> Recommendations & Follow-up
                                </h4>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-600">Recommendations (Optional)</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Add any recommendations for next steps..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white resize-none"
                                        value={recommendations}
                                        onChange={(e) => setRecommendations(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-600">Follow-up Checklist</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add a to-do item..."
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                                            value={currentChecklistItem}
                                            onChange={(e) => setCurrentChecklistItem(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                                        />
                                        <button
                                            type="button"
                                            onClick={addChecklistItem}
                                            className="px-4 py-2 bg-yellow-600 text-white rounded-xl text-sm font-medium hover:bg-yellow-700 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    {checklistItems.length > 0 && (
                                        <div className="bg-white rounded-xl p-2 space-y-1 border border-yellow-100">
                                            {checklistItems.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm p-2 bg-yellow-50 rounded-lg">
                                                    <span className="flex items-center gap-2">
                                                        <div className="w-3 h-3 border border-yellow-400 rounded-sm"></div>
                                                        {item}
                                                    </span>
                                                    <button type="button" onClick={() => removeChecklistItem(idx)} className="text-red-400 hover:text-red-600">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dispatch Fields */}
                            {eventType === 'transport_start' && (
                                <div className="space-y-4 pt-2 border-t border-gray-100">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-green-600" /> Dispatch Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500">Transport Method</label>
                                            <select
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                                value={transportMode}
                                                onChange={(e) => setTransportMode(e.target.value)}
                                            >
                                                <option value="truck">Truck</option>
                                                <option value="van">Van</option>
                                                <option value="motorcycle">Motorcycle</option>
                                                <option value="bicycle">Bicycle</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500">Vehicle Reg No.</label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                                placeholder="ABC 1234"
                                                value={vehicleReg}
                                                onChange={(e) => setVehicleReg(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500">Driver Name</label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                                placeholder="John Doe"
                                                value={driverName}
                                                onChange={(e) => setDriverName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500">Driver Number</label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                                placeholder="+260..."
                                                value={driverPhone}
                                                onChange={(e) => setDriverPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer inside form to handle submit properly */}
                            <div className="pt-8 flex justify-between items-center border-t border-gray-100 sticky bottom-0" style={{ background: '#F7F9FB', padding: '1.25rem 0' }}>
                                <button
                                    type="button"
                                    onClick={onCloseAction}
                                    className="px-6 py-2.5 rounded-xl transition-colors"
                                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, border: '1px solid rgba(12,45,58,0.15)', color: '#0C2D3A' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-2.5 text-white rounded-xl transition-all flex items-center gap-2 disabled:opacity-40"
                                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, background: '#0C2D3A' }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            {isContract ? "Submit for Verification" : "Save to Marketplace Log"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
