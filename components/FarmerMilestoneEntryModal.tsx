"use client";

import { useState } from "react";
import { X, Calendar, Package, Droplets, Sprout, FileText, Plus, Trash2, Loader2, Camera, Upload, CheckCircle, ListTodo, Thermometer, Wind, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { uploadToIPFS } from "@/lib/ipfsService";
import { getLatestAIDiagnostic } from "@/lib/traceabilityService";
import { analyzeCropHealth, fileToJpegDataUrl } from "@/lib/aiDiagnostics";
import { CONTRACT_UNITS } from "@/lib/config";
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
  /** Unit from the contract (e.g. "kg", "bags"). When provided it is the default and preferred unit. */
  defaultUnit?: string;
  /** The milestone/stage description from the contract, shown so the farmer knows what is expected. */
  milestoneDescription?: string;
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
  defaultUnit,
  milestoneDescription,
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
  const [unit, setUnit] = useState<string>(defaultUnit || "kg");

  useEffect(() => {
    if (defaultUnit) setUnit(defaultUnit);
  }, [defaultUnit]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");

  // Harvest storage capture (compliance) + field-level validation highlighting
  const [storageLocation, setStorageLocation] = useState("");
  const [storageConditions, setStorageConditions] = useState("");
  const [errorFields, setErrorFields] = useState<Record<string, boolean>>({});
  const clearError = (field: string) => setErrorFields(prev => (prev[field] ? { ...prev, [field]: false } : prev));

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

  // AI Diagnostics State — runs on an uploaded evidence photo (same as the officer flow)
  const [aiResult, setAiResult] = useState<AIDiagnosisResult | null>(null);
  const [selectedAiImageIndex, setSelectedAiImageIndex] = useState<number | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiContext, setAiContext] = useState("");
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
    // Default the AI selection to the first photo added.
    setSelectedAiImageIndex((prev) => (prev ?? evidenceImages.length));

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

    // Keep the AI selection / result consistent with the remaining photos.
    if (selectedAiImageIndex === index) {
      setSelectedAiImageIndex(null);
      setAiResult(null);
    } else if (selectedAiImageIndex !== null && selectedAiImageIndex > index) {
      setSelectedAiImageIndex(selectedAiImageIndex - 1);
    }
  };

  const handleAnalyzeEvidencePhoto = async () => {
    if (selectedAiImageIndex === null || !evidenceImages[selectedAiImageIndex]) {
      toast.error("Add and select an evidence photo to analyze");
      return;
    }

    setAiAnalyzing(true);
    try {
      // Normalize to JPEG so iOS HEIC / oversized phone photos analyze reliably.
      const imageBase64 = await fileToJpegDataUrl(evidenceImages[selectedAiImageIndex], { maxDim: 1280, quality: 0.85 });
      const additionalContext = [
        `Farmer evidence for milestone: ${milestoneName}`,
        notes.trim() ? `Farmer notes: ${notes.trim()}` : "",
        aiContext.trim(),
      ].filter(Boolean).join("\n");

      const result = await analyzeCropHealth({
        imageBase64,
        additionalContext: additionalContext || undefined,
      });

      setAiResult({
        disease: result.diagnosis,
        confidence: result.confidenceScore / 100,
        healthScore: result.healthScore,
        treatmentRec: result.recommendations.length > 0 ? result.recommendations[0] : "",
      });
      toast.success("AI analysis attached to your evidence photo");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to analyze photo";
      toast.error(message);
    } finally {
      setAiAnalyzing(false);
    }
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
    const isHarvest = activityType === "harvesting";
    // Location is mandatory where traceability depends on it: any contract
    // milestone log, plus harvest and delivery events.
    const locationRequired = hasContract || isDelivery || isHarvest;

    const errs: Record<string, boolean> = {};
    if (!description.trim()) errs.description = true;
    if (locationRequired && !location.trim()) errs.location = true;
    if (isDelivery) {
      if (!transportCompany) errs.transportCompany = true;
      if (!driverName) errs.driverName = true;
      if (!vehicleReg) errs.vehicleReg = true;
      if (!contactNumber) errs.contactNumber = true;
      if (!dispatchLocation) errs.dispatchLocation = true;
    }

    if (Object.keys(errs).length > 0) {
      setErrorFields(errs);
      toast.error(
        errs.location && !errs.description
          ? "Location is required for this activity"
          : "Please complete the highlighted fields",
      );
      return;
    }
    setErrorFields({});

    // Fold harvest storage details into notes so record continuity is preserved.
    const storageNote = isHarvest && (storageLocation.trim() || storageConditions.trim())
      ? `Storage location: ${storageLocation.trim() || "—"}. Storage conditions: ${storageConditions.trim() || "—"}.`
      : "";
    const combinedNotes = [notes.trim(), storageNote].filter(Boolean).join("\n");

    const newActivity: FarmActivity = {
      id: Date.now().toString(),
      entryType,
      type: isDelivery ? "delivery" : activityType,
      description: description.trim(),
      quantity: quantity ? parseFloat(quantity) : undefined,
      unit: quantity ? unit : undefined,
      date,
      notes: combinedNotes || undefined,
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
    setStorageLocation("");
    setStorageConditions("");
    setErrorFields({});
    setIotReadings([]);
    setEvidenceImages([]);
    setImagePreviews([]);
    setUploadedImageUrls([]);
    setAiResult(null);
    setSelectedAiImageIndex(null);
    setAiContext("");
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
          <div className="p-6 border-b border-gray-100 flex items-center justify-between" style={{ background: '#F7F9FB' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ background: '#0C2D3A' }}>
                <Sprout className="h-6 w-6" style={{ color: '#BFFF00' }} />
              </div>
              <div>
                <h2 className="text-2xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Log New Activity</h2>
              </div>
            </div>
            <button onClick={onCloseAction} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-6 w-6" style={{ color: '#5A7684' }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {hasContract && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                {milestoneDescription && (
                  <div className="mb-2 pb-2 border-b border-blue-100">
                    <p className="text-[11px] uppercase tracking-wide font-bold text-blue-700 mb-1">What this stage requires</p>
                    <p className="text-sm text-blue-900 leading-relaxed">{milestoneDescription}</p>
                  </div>
                )}
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
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-white"
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
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
                        onChange={(e) => { setDescription(e.target.value); clearError("description"); }}
                        placeholder="e.g. Planting Mangoes"
                        className={`w-full px-4 py-3 border rounded-2xl text-sm focus:ring-2 transition-all ${errorFields.description ? "border-red-400 ring-2 ring-red-100" : "border-gray-200 focus:ring-emerald-100 focus:border-emerald-400"}`}
                      />
                    ) : (
                      <div className="space-y-2">
                        <select
                          value={description}
                          onChange={(e) => { setDescription(e.target.value); clearError("description"); }}
                          className={`w-full px-4 py-3 border rounded-2xl text-sm focus:ring-2 transition-all bg-white ${errorFields.description ? "border-red-400 ring-2 ring-red-100" : "border-gray-200 focus:ring-emerald-100 focus:border-emerald-400"}`}
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
                  <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                        <Thermometer className="w-4 h-4" /> IoT Sensor Readings
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowIoTForm(!showIoTForm)}
                        className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 transition-colors"
                      >
                        {showIoTForm ? "Hide Form" : "Add Reading"}
                      </button>
                    </div>

                    {showIoTForm && (
                      <div className="bg-white p-3 rounded-lg border border-emerald-100 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          value={iotType}
                          onChange={(e) => setIoTType(e.target.value as IoTReading["type"])}
                          className="px-3 py-2 border border-gray-300 rounded text-sm"
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
                            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                          <button
                            type="button"
                            onClick={addIoTReading}
                            className="bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {iotReadings.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {iotReadings.map((reading) => (
                          <div key={reading.id} className="bg-white px-3 py-2 rounded-lg border border-emerald-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2">
                              {getIoTIcon(reading.type)}
                              <span className="text-xs font-semibold">{getIoTLabel(reading.type)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-emerald-700">{reading.value}{reading.unit}</span>
                              <button onClick={() => removeIoTReading(reading.id)} className="text-red-400 hover:text-red-600">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-600 italic">No sensor data added yet</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Location {(hasContract || milestoneName.toLowerCase().includes("delivery") || activityType === "harvesting") ? <span className="text-red-500">*</span> : "(Optional)"}
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => { setLocation(e.target.value); clearError("location"); }}
                      placeholder="e.g. Plot 4, North-West Sector"
                      className={`w-full px-4 py-3 border rounded-2xl text-sm focus:ring-2 transition-all ${errorFields.location ? "border-red-400 ring-2 ring-red-100" : "border-gray-200 focus:ring-emerald-100 focus:border-emerald-400"}`}
                    />
                    {errorFields.location && <p className="text-xs text-red-500 mt-1">Location is required for this activity.</p>}
                  </div>

                  {activityType === "harvesting" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Storage Location</label>
                        <input
                          type="text"
                          value={storageLocation}
                          onChange={(e) => setStorageLocation(e.target.value)}
                          placeholder="e.g. Cold room B, Warehouse 2"
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Storage Conditions</label>
                        <input
                          type="text"
                          value={storageConditions}
                          onChange={(e) => setStorageConditions(e.target.value)}
                          placeholder="e.g. 4°C, dry, ventilated"
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                        />
                      </div>
                    </>
                  )}

                  {/* Evidence Photos + AI Diagnostics (AI runs on a selected evidence photo) */}
                  <div className="md:col-span-2 bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                    <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Evidence Photos {hasContract ? "(Recommended)" : "(Optional)"}
                    </label>
                    <p className="text-[11px] text-blue-600 mb-3">Tap a photo to select it, then run AI diagnosis — the result is saved with this log for traceability.</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                      {imagePreviews.map((src, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedAiImageIndex(idx)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedAiImageIndex(idx); } }}
                          className={`relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${selectedAiImageIndex === idx ? "border-emerald-500 ring-2 ring-emerald-100" : "border-transparent hover:border-emerald-300"}`}
                        >
                          <img src={src} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute left-1 bottom-1 px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-semibold">
                            {selectedAiImageIndex === idx ? "Selected for AI" : `Photo ${idx + 1}`}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
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
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {uploadedImageUrls.length} photos ready
                      </p>
                    )}

                    {/* AI Diagnostics on the selected evidence photo */}
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> AI Diagnostics & Quality Grading
                          </h4>
                          <p className="text-[11px] text-emerald-700 mt-1">Detect disease, assess crop health and verify treatment recovery on your evidence photo.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAnalyzeEvidencePhoto}
                          disabled={aiAnalyzing || selectedAiImageIndex === null || !evidenceImages[selectedAiImageIndex ?? -1]}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          {aiAnalyzing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" /> {previousDiagnosis ? "Verify Recovery" : "Analyze Selected Photo"}
                            </>
                          )}
                        </button>
                      </div>

                      {evidenceImages.length === 0 && (
                        <p className="text-[11px] text-emerald-700 italic">Add an evidence photo above to run AI analysis on it.</p>
                      )}

                      {previousDiagnosis && !aiResult && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase mb-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Recovery Verification Needed
                          </div>
                          <p className="text-[11px] text-amber-700 leading-relaxed">
                            Previous scan detected <strong>{previousDiagnosis.disease}</strong> (Health: {previousDiagnosis.health_score}/100).
                            Analyze a fresh evidence photo to verify recovery and treatment success.
                          </p>
                        </div>
                      )}

                      {evidenceImages.length > 0 && (
                        <textarea
                          value={aiContext}
                          onChange={(e) => setAiContext(e.target.value)}
                          placeholder="Optional context for the AI, e.g. yellowing on leaf edges, recent heavy rain..."
                          rows={2}
                          className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm bg-white resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      )}

                      {aiResult && (
                        <div className="bg-white p-3 rounded-xl border border-emerald-200">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase">AI Assessment Result</span>
                            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Health: {aiResult.healthScore}/100</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">{aiResult.disease}</p>
                          <p className="text-xs text-gray-600 mb-2">
                            Confidence: {(aiResult.confidence * 100).toFixed(1)}%
                            {selectedAiImageIndex !== null && <span> • Attached to photo {selectedAiImageIndex + 1}</span>}
                          </p>
                          {aiResult.treatmentRec && (
                            <div className="bg-amber-50 p-2 rounded text-xs text-amber-800 border border-amber-100">
                              <p className="italic mb-2"><strong>Recommendation:</strong> {aiResult.treatmentRec}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  const rec = aiResult.treatmentRec.trim();
                                  if (rec && !checklistItems.includes(rec)) {
                                    setChecklistItems(prev => [...prev, rec]);
                                    toast.success("Added AI recommendation to follow-up checklist");
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-600 text-white text-[11px] font-semibold hover:bg-amber-700 transition-colors"
                              >
                                <ListTodo className="w-3 h-3" /> Add to follow-up checklist
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {entryType === "activity" && (
                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
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
                          {CONTRACT_UNITS.map(u => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                          ))}
                          {defaultUnit && !CONTRACT_UNITS.some(u => u.value === defaultUnit) && (
                            <option value={defaultUnit}>{defaultUnit}</option>
                          )}
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm h-28 resize-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
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
                  <div key={activity.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">{getActivityIcon(activity.type)}</div>
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
                                <div key={r.id} className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-medium">
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
                            <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">AI Verified Data</span>
                                <span className="text-[10px] font-black bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">Score: {activity.aiDiagnosis.healthScore}</span>
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

          <div className="px-6 py-5 flex items-center justify-between border-t border-gray-100" style={{ background: '#F7F9FB' }}>
            <div className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500, color: '#5A7684' }}>
              {activities.length} {activities.length === 1 ? "activity" : "activities"} logged
            </div>
            <div className="flex gap-3">
              <button onClick={onCloseAction} disabled={submitting} className="px-6 py-2.5 rounded-xl transition-colors" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, border: '1px solid rgba(12,45,58,0.15)', color: '#0C2D3A' }}>Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || activities.length === 0} className="px-8 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-white disabled:opacity-40" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, background: '#0C2D3A' }}>
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
