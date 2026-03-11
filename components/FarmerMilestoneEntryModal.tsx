"use client";

import { useState } from "react";
import { X, Calendar, Package, Droplets, Sprout, FileText, Plus, Trash2, Loader2, Camera, Upload, CheckCircle, ListTodo, Thermometer, Wind, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { uploadToIPFS } from "@/lib/ipfsService";
import CropDiagnostics from "./CropDiagnostics";
import { getLatestAIDiagnostic } from "@/lib/traceabilityService";
import { useEffect } from "react";

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

interface FarmActivity {
  id: string;
  entryType: "activity" | "observation";
  type: "planting" | "weeding" | "fertilizer" | "pesticide" | "irrigation" | "pruning" | "harvesting" | "delivery" | "other";
  description: string;
  quantity?: number;
  unit?: string;
  date: string;
  notes?: string;
  recommendations?: string;
  followUpChecklist?: string[];
  fertilizerDetails?: {
    brand: string;
    type: string;
    npkRatio?: string;
  };
  logisticsDetails?: {
    transportCompany: string;
    driverName: string;
    vehicleReg: string;
    contactNumber: string;
    dispatchLocation: string;
  };
  iotReadings?: IoTReading[];
  evidencePhotos?: string[]; // Array of IPFS URLs
  location?: string;
  aiDiagnosis?: AIDiagnosisResult; // Store the AI result to process in the parent component
}

interface FarmerMilestoneEntryModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  milestoneId: string;
  milestoneName: string;
  onSubmitAction: (entries: FarmActivity[]) => Promise<void>;
  hasContract?: boolean;
  batchId?: string;
}

// @ts-ignore - Next.js client component props warning
export default function FarmerMilestoneEntryModal({
  isOpen,
  onCloseAction,
  milestoneId,
  milestoneName,
  onSubmitAction,
  hasContract = true,
  batchId,
}: FarmerMilestoneEntryModalProps) {
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const observationOptions = [
    "Germination",
    "Growth",
    "Flowering",
    "Fruiting",
    "Pest/Disease Check",
    "Soil Moisture Check",
    "Nutrient Deficiency Check",
    "Delivery",
    "Other"
  ];

  // Activity Form State
  const [entryType, setEntryType] = useState<"activity" | "observation">("activity");
  const [activityType, setActivityType] = useState<FarmActivity["type"]>("planting");
  const [fertilizerBrand, setFertilizerBrand] = useState("");
  const [fertilizerType, setFertilizerType] = useState("organic");
  const [npkRatio, setNpkRatio] = useState("");
  const [evidenceImages, setEvidenceImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("seedlings");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");

  // Logistics State for Delivery
  const [transportCompany, setTransportCompany] = useState("");
  const [driverName, setDriverName] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [dispatchLocation, setDispatchLocation] = useState("");

  // IoT State
  const [iotReadings, setIotReadings] = useState<IoTReading[]>([]);
  const [showIoTForm, setShowIoTForm] = useState(false);
  const [iotType, setIoTType] = useState<IoTReading["type"]>("temperature");
  const [iotValue, setIoTValue] = useState("");

  // New State for Recommendations & Checklist
  const [recommendations, setRecommendations] = useState("");
  const [currentChecklistItem, setCurrentChecklistItem] = useState("");
  const [checklistItems, setChecklistItems] = useState<string[]>([]);

  // AI Diagnostics State
  const [aiResult, setAiResult] = useState<AIDiagnosisResult | null>(null);
  const [showAiScanner, setShowAiScanner] = useState(false);
  const [previousDiagnosis, setPreviousDiagnosis] = useState<{ disease?: string, health_score?: number, treatment_rec?: string } | null>(null);

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
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const addChecklistItem = () => {
    if (!currentChecklistItem.trim()) return;
    setChecklistItems([...checklistItems, currentChecklistItem.trim()]);
    setCurrentChecklistItem("");
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const addActivity = () => {
    const isDelivery = milestoneName.toLowerCase().includes("delivery");

    if (isDelivery && (!transportCompany || !driverName || !vehicleReg || !contactNumber || !dispatchLocation)) {
      toast.error("Please fill in all logistics details for delivery");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    const newActivity: FarmActivity = {
      id: Date.now().toString(),
      entryType,
      type: isDelivery ? "delivery" : activityType,
      description: description.trim(),
      quantity: quantity ? parseFloat(quantity) : undefined,
      unit: quantity ? unit : undefined,
      date,
      notes: notes.trim() || undefined,
      recommendations: recommendations.trim() || undefined,
      followUpChecklist: checklistItems.length > 0 ? checklistItems : undefined,
      fertilizerDetails: activityType === 'fertilizer' ? {
        brand: fertilizerBrand,
        type: fertilizerType,
        npkRatio: npkRatio || undefined,
      } : undefined,
      logisticsDetails: isDelivery ? {
        transportCompany,
        driverName,
        vehicleReg,
        contactNumber,
        dispatchLocation,
      } : undefined,
      iotReadings: iotReadings.length > 0 ? iotReadings : undefined,
      evidencePhotos: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
      location: location.trim() || undefined,
      aiDiagnosis: aiResult || undefined,
    };

    setActivities([...activities, newActivity]);

    // Reset form
    setDescription("");
    setQuantity("");
    setNotes("");
    setRecommendations("");
    setChecklistItems([]);
    setCurrentChecklistItem("");
    setFertilizerBrand("");
    setFertilizerType("organic");
    setNpkRatio("");
    setTransportCompany("");
    setDriverName("");
    setVehicleReg("");
    setContactNumber("");
    setDispatchLocation("");
    setLocation("");
    setIotReadings([]);
    setEvidenceImages([]);
    setImagePreviews([]);
    setUploadedImageUrls([]);
    setAiResult(null);
    setShowAiScanner(false);
    setShowActivityForm(false);
    toast.success(`${entryType === "activity" ? "Activity" : "Observation"} added`);
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

  const removeActivity = (id: string) => {
    setActivities(activities.filter((a) => a.id !== id));
  };

  const handleSubmit = async () => {
    if (activities.length === 0) {
      toast.error("Please add at least one activity");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitAction(activities);
      toast.success("Entries submitted! Awaiting officer verification.");
      onCloseAction();

      // Reset
      setActivities([]);
    } catch (error) {
      console.error("Error submitting entries:", error);
      toast.error("Failed to submit entries");
    } finally {
      setSubmitting(false);
    }
  };

  const getActivityIcon = (type: FarmActivity["type"]) => {
    switch (type) {
      case "planting": return <Sprout className="h-4 w-4" />;
      case "fertilizer": return <Package className="h-4 w-4" />;
      case "pesticide": return <Droplets className="h-4 w-4" />;
      case "irrigation": return <Droplets className="h-4 w-4" />;
      case "pruning": return <Sprout className="h-4 w-4" />;
      case "harvesting": return <Package className="h-4 w-4" />;
      case "delivery": return <Package className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getIoTIcon = (type: IoTReading["type"]) => {
    switch (type) {
      case "temperature": return <Thermometer className="h-4 w-4" />;
      case "humidity": return <Droplets className="h-4 w-4" />;
      case "soil_moisture": return <Droplets className="h-4 w-4" />;
      case "ph_level": return <Wind className="h-4 w-4" />;
    }
  };

  const getIoTLabel = (type: IoTReading["type"]) => {
    switch (type) {
      case "temperature": return "Temperature";
      case "humidity": return "Humidity";
      case "soil_moisture": return "Soil Moisture";
      case "ph_level": return "pH Level";
    }
  };

  const getActivityLabel = (type: FarmActivity["type"]) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10050] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-white border-b p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Log New Activity</h2>
              </div>
              <button onClick={onCloseAction} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {hasContract && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  <strong>Instructions:</strong> Record all farming activities for this milestone.
                  Upload evidence photos if available. An officer will visit for verification.
                </p>
              </div>
            )}

            {/* Add Activity Button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Activities</h3>
              <button
                onClick={() => setShowActivityForm(!showActivityForm)}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Activity
              </button>
            </div>

            {/* Activity Form */}
            {showActivityForm && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                {/* Entry Type Toggle */}
                <div className="flex bg-gray-100/80 rounded-full p-1.5 mb-8 max-w-[280px] mx-auto border border-gray-100 shadow-sm">
                  <button
                    onClick={() => setEntryType("activity")}
                    className={`flex-1 py-1.5 px-6 rounded-full text-sm font-semibold transition-all ${entryType === "activity" ? "bg-white text-blue-600 shadow-md transform scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Activity
                  </button>
                  <button
                    onClick={() => setEntryType("observation")}
                    className={`flex-1 py-1.5 px-6 rounded-full text-sm font-semibold transition-all ${entryType === "observation" ? "bg-white text-blue-600 shadow-md transform scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Observation
                  </button>
                </div>

                {hasContract && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8">
                    <p className="text-sm text-amber-800 flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600" />
                      <span>
                        <strong>Contract Mode:</strong> This log is tied to a smart contract milestone. Once submitted, it will be reviewed for verification and payment release.
                      </span>
                    </p>
                  </div>
                )}

                {!hasContract && (
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
                  {entryType === "activity" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Event Type *</label>
                        <select
                          value={activityType}
                          onChange={(e) => setActivityType(e.target.value as FarmActivity["type"])}
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all bg-white"
                        >
                          <option value="planting">Planting</option>
                          <option value="weeding">Weeding</option>
                          <option value="fertilizer">Fertilizer Application</option>
                          <option value="pesticide">Pesticide Application</option>
                          <option value="irrigation">Irrigation</option>
                          <option value="pruning">Pruning</option>
                          <option value="harvesting">Harvesting</option>
                          <option value="delivery">Delivery</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {activityType === 'fertilizer' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">Brand *</label>
                            <input
                              type="text"
                              value={fertilizerBrand}
                              onChange={(e) => setFertilizerBrand(e.target.value)}
                              placeholder="Compound D"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-700 mb-1">Type</label>
                            <select
                              value={fertilizerType}
                              onChange={(e) => setFertilizerType(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="organic">Organic</option>
                              <option value="inorganic">Inorganic</option>
                              <option value="compound">Compound</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Title / Reference *
                    </label>
                    {entryType === "activity" ? (
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Planting Mangoes"
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                      />
                    ) : (
                      <div className="space-y-2">
                        <select
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all bg-white"
                        >
                          <option value="">Select Observation...</option>
                          {observationOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Logistics Section for Delivery */}
                  {milestoneName.toLowerCase().includes("delivery") && (activityType === "delivery" || description === "Delivery") && (
                    <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-4">
                      <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Logistics Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Transport Company Name *"
                          value={transportCompany}
                          onChange={(e) => setTransportCompany(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Driver Full Name *"
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Vehicle Registration *"
                          value={vehicleReg}
                          onChange={(e) => setVehicleReg(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Contact Number *"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            placeholder="Dispatch Location *"
                            value={dispatchLocation}
                            onChange={(e) => setDispatchLocation(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IoT Sensor Section */}
                  <div className="md:col-span-2 bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-purple-800 flex items-center gap-2">
                        <Thermometer className="w-4 h-4" /> IoT Sensor Readings
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowIoTForm(!showIoTForm)}
                        className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition-colors"
                      >
                        {showIoTForm ? "Hide Form" : "Add Reading"}
                      </button>
                    </div>

                    {showIoTForm && (
                      <div className="bg-white p-3 rounded-lg border border-purple-100 mb-3 grid grid-cols-2 gap-2">
                        <select
                          value={iotType}
                          onChange={(e) => setIoTType(e.target.value as IoTReading["type"])}
                          className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                        >
                          <option value="temperature">Temperature</option>
                          <option value="humidity">Humidity</option>
                          <option value="soil_moisture">Soil Moisture</option>
                          <option value="ph_level">pH Level</option>
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={iotValue}
                            onChange={(e) => setIoTValue(e.target.value)}
                            placeholder="Value"
                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                          <button
                            type="button"
                            onClick={addIoTReading}
                            className="bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {iotReadings.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {iotReadings.map((reading) => (
                          <div key={reading.id} className="bg-white px-3 py-2 rounded-lg border border-purple-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2">
                              {getIoTIcon(reading.type)}
                              <span className="text-xs font-semibold">{getIoTLabel(reading.type)}</span>
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

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location (Optional)</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Plot 4, North-West Sector"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    />
                  </div>

                  {/* AI Diagnostics Section */}
                  <div className="md:col-span-2 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> AI Diagnostics & Quality Grading
                        </h4>
                        <p className="text-xs text-indigo-600 mt-1">Scan crops for disease, predict yield quality, and verify treatment recovery.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAiScanner(!showAiScanner)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm ${previousDiagnosis ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                      >
                        {showAiScanner ? "Hide Scanner" : previousDiagnosis ? "Verify Recovery Scan" : "Enable AI Scan"}
                      </button>
                    </div>

                    {previousDiagnosis && !aiResult && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase mb-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Recovery Verification Needed
                        </div>
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                          Previous scan detected <strong>{previousDiagnosis.disease}</strong> (Health: {previousDiagnosis.health_score}/100).
                          Please perform a follow-up scan to verify recovery and treatment success.
                        </p>
                      </div>
                    )}

                    {showAiScanner && (
                      <div className="bg-white rounded-xl overflow-hidden border border-indigo-100 shadow-sm mt-4">
                        <CropDiagnostics
                          onResult={(result) => {
                            setAiResult({
                              disease: result.disease,
                              confidence: result.confidence,
                              healthScore: result.healthScore,
                              treatmentRec: result.treatmentRec
                            });
                            toast.success("AI Scan Complete! Data appended to log.");
                            setShowAiScanner(false); // Auto-hide after success
                          }}
                        />
                      </div>
                    )}

                    {aiResult && (
                      <div className="mt-4 bg-white p-3 rounded-xl border border-indigo-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-gray-500 uppercase">AI Assessment Result</span>
                          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Health: {aiResult.healthScore}/100</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">{aiResult.disease}</p>
                        <p className="text-xs text-gray-600 mb-2">Confidence: {(aiResult.confidence * 100).toFixed(1)}%</p>
                        {aiResult.treatmentRec && (
                          <div className="bg-amber-50 p-2 rounded text-xs text-amber-800 italic border border-amber-100">
                            <strong>Recommendation:</strong> {aiResult.treatmentRec}
                          </div>
                        )}
                        <div className="mt-2 text-right">
                          <button onClick={() => setAiResult(null)} className="text-xs text-red-500 hover:text-red-700 font-medium tracking-wide">
                            Clear AI Result
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Evidence Images */}
                  <div className="md:col-span-2 bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                    <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Evidence Photos {hasContract ? "(Recommended)" : "(Optional)"}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                      {imagePreviews.map((src, idx) => (
                        <div key={idx} className="relative group aspect-square">
                          <img src={src} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {imagePreviews.length < 5 && (
                        <label className="border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 aspect-square bg-white">
                          <Camera className="w-6 h-6 text-blue-500 mb-1" />
                          <span className="text-xs text-blue-600 font-medium">Add Photo</span>
                          <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                        </label>
                      )}
                    </div>
                    {evidenceImages.length > 0 && uploadedImageUrls.length === 0 && (
                      <button
                        onClick={uploadImages}
                        disabled={uploadingImages}
                        className="text-sm text-blue-600 font-medium flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-blue-200"
                      >
                        {uploadingImages ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {uploadingImages ? "Uploading..." : "Upload Photos"}
                      </button>
                    )}
                    {uploadedImageUrls.length > 0 && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {uploadedImageUrls.length} photos ready
                      </p>
                    )}
                  </div>

                  {entryType === "activity" && (
                    <div className="grid grid-cols-2 gap-4 col-span-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Optional)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="e.g., 500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit (Optional)</label>
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="seedlings">Seedlings</option>
                          <option value="kg">Kilograms (kg)</option>
                          <option value="liters">Liters</option>
                          <option value="bags">Bags</option>
                          <option value="hours">Hours</option>
                          <option value="units">Units</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Description / Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add details about this activity..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm h-28 resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    />
                  </div>

                  {entryType === "activity" && (
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Follow-up Checklist (Optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentChecklistItem}
                          onChange={(e) => setCurrentChecklistItem(e.target.value)}
                          placeholder="Add a to-do item..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                        />
                        <button onClick={addChecklistItem} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium text-sm transition-colors">
                          Add
                        </button>
                      </div>
                      {checklistItems.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                          {checklistItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm p-1.5 bg-white border border-gray-200 rounded shadow-sm">
                              <span className="flex items-center gap-2">
                                <ListTodo className="w-3.5 h-3.5 text-blue-500" />
                                {item}
                              </span>
                              <button onClick={() => removeChecklistItem(idx)} className="text-red-400 hover:text-red-600">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={addActivity} className="btn-primary text-sm flex-1">Add Activity</button>
                  <button onClick={() => setShowActivityForm(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            )}

            {/* Activities List */}
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {getActivityLabel(activity.type)}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              {activity.date}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">{activity.description}</p>

                          {activity.logisticsDetails && (
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs bg-emerald-50 p-2 rounded border border-emerald-100">
                              <p><strong>Company:</strong> {activity.logisticsDetails.transportCompany}</p>
                              <p><strong>Driver:</strong> {activity.logisticsDetails.driverName}</p>
                              <p><strong>Vehicle:</strong> {activity.logisticsDetails.vehicleReg}</p>
                              <p><strong>Phone:</strong> {activity.logisticsDetails.contactNumber}</p>
                              <p className="col-span-2"><strong>From:</strong> {activity.logisticsDetails.dispatchLocation}</p>
                            </div>
                          )}

                          {activity.iotReadings && activity.iotReadings.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {activity.iotReadings.map(r => (
                                <div key={r.id} className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100 font-medium">
                                  {getIoTIcon(r.type)}
                                  {r.value}{r.unit}
                                </div>
                              ))}
                            </div>
                          )}

                          {activity.quantity && (
                            <p className="text-sm text-gray-600">
                              Quantity: <span className="font-medium">{activity.quantity} {activity.unit}</span>
                            </p>
                          )}
                          {activity.recommendations && (
                            <div className="mt-2 text-sm bg-yellow-50 p-2 rounded border border-yellow-100 text-yellow-800">
                              <strong>Recommendation:</strong> {activity.recommendations}
                            </div>
                          )}
                          {activity.followUpChecklist && activity.followUpChecklist.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-600 mb-1">To-Do Next:</p>
                              <ul className="space-y-1">
                                {activity.followUpChecklist.map((item, i) => (
                                  <li key={i} className="text-xs flex items-center gap-1.5 text-gray-600">
                                    <div className="w-3 h-3 border border-gray-400 rounded-sm"></div>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {activity.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">{activity.notes}</p>
                          )}

                          {activity.aiDiagnosis && (
                            <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">AI Verified Data</span>
                                <span className="text-[10px] font-black bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded">Score: {activity.aiDiagnosis.healthScore}</span>
                              </div>
                              <p className="text-xs font-medium text-gray-800">{activity.aiDiagnosis.disease} ({(activity.aiDiagnosis.confidence * 100).toFixed(0)}%)</p>
                            </div>
                          )}

                          {activity.evidencePhotos && activity.evidencePhotos.length > 0 && (
                            <p className="text-xs text-blue-600 mt-2">{activity.evidencePhotos.length} photos attached</p>
                          )}
                        </div>
                      </div>
                      <button onClick={() => removeActivity(activity.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No activities added yet</p>
                <p className="text-sm">Click "Add Activity" to start logging your farm work</p>
              </div>
            )}
          </div>

          <div className="bg-white px-6 py-6 flex items-center justify-between border-t border-gray-100">
            <div className="text-sm font-medium text-gray-500">
              {activities.length} {activities.length === 1 ? "activity" : "activities"} logged
            </div>
            <div className="flex gap-4">
              <button onClick={onCloseAction} disabled={submitting} className="btn-secondary px-6">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || activities.length === 0} className="btn-primary flex items-center gap-2 px-8">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    {hasContract ? "Submit for Verification" : "Save to Marketplace Log"}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
