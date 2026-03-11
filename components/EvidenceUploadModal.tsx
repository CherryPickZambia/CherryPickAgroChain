"use client";

import { useState } from "react";
import { X, Upload, Camera, Thermometer, Droplets, Wind, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { uploadToIPFS } from "@/lib/ipfsService";
import { analyzeCropHealth, fileToBase64, type CropDiagnosisResult } from "@/lib/aiDiagnostics";

export interface IoTReading {
  id: string;
  type: "temperature" | "humidity" | "soil_moisture" | "ph_level";
  value: number;
  unit: string;
  timestamp: string;
}

export interface EvidenceAIAnalysis {
  imageIndex: number;
  imagePreview: string;
  imageUrl?: string;
  analyzedAt: string;
  result: CropDiagnosisResult;
}

interface EvidenceUploadModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  milestoneId: string;
  milestoneName: string;
  contractId: string;
  cropType?: string;
  onSubmitAction: (evidence: {
    images: string[];
    iotReadings: IoTReading[];
    notes: string;
    aiAnalysis?: EvidenceAIAnalysis | null;
  }) => Promise<void>;
}

export default function EvidenceUploadModal({
  isOpen,
  onCloseAction,
  milestoneId,
  milestoneName,
  contractId,
  cropType,
  onSubmitAction,
}: EvidenceUploadModalProps) {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [iotReadings, setIotReadings] = useState<IoTReading[]>([]);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedAiImageIndex, setSelectedAiImageIndex] = useState<number | null>(null);
  const [aiAdditionalContext, setAiAdditionalContext] = useState("");
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<EvidenceAIAnalysis | null>(null);

  // IoT Reading Form State
  const [showIoTForm, setShowIoTForm] = useState(false);
  const [iotType, setIoTType] = useState<IoTReading["type"]>("temperature");
  const [iotValue, setIoTValue] = useState("");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    setImages([...images, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setSelectedAiImageIndex((prev) => prev ?? images.length);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));

    if (selectedAiImageIndex === index) {
      setSelectedAiImageIndex(null);
    } else if (selectedAiImageIndex !== null && selectedAiImageIndex > index) {
      setSelectedAiImageIndex(selectedAiImageIndex - 1);
    }

    if (aiAnalysis?.imageIndex === index) {
      setAiAnalysis(null);
    } else if (aiAnalysis && aiAnalysis.imageIndex > index) {
      setAiAnalysis({
        ...aiAnalysis,
        imageIndex: aiAnalysis.imageIndex - 1,
      });
    }
  };

  const handleAnalyzeSelectedImage = async () => {
    if (selectedAiImageIndex === null || !images[selectedAiImageIndex] || !imagePreviews[selectedAiImageIndex]) {
      toast.error("Select an evidence photo first");
      return;
    }

    setAiAnalyzing(true);

    try {
      const imageBase64 = await fileToBase64(images[selectedAiImageIndex]);
      const additionalContext = [
        `Verifier evidence for milestone: ${milestoneName}`,
        notes.trim() ? `Verifier notes: ${notes.trim()}` : "",
        aiAdditionalContext.trim(),
      ].filter(Boolean).join("\n");

      const result = await analyzeCropHealth({
        imageBase64,
        cropType: cropType || undefined,
        additionalContext: additionalContext || undefined,
      });

      setAiAnalysis({
        imageIndex: selectedAiImageIndex,
        imagePreview: imagePreviews[selectedAiImageIndex],
        analyzedAt: new Date().toISOString(),
        result,
      });

      toast.success("AI analysis attached to evidence");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to analyze selected image";
      toast.error(message);
    } finally {
      setAiAnalyzing(false);
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

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setUploading(true);

    try {
      // Upload images to Pinata IPFS
      const imageUrls: string[] = [];

      for (const image of images) {
        const result = await uploadToIPFS(image);
        // Use the Pinata gateway URL directly
        imageUrls.push(result.url);
      }

      // Submit evidence
      await onSubmitAction({
        images: imageUrls,
        iotReadings,
        notes,
        aiAnalysis: aiAnalysis
          ? {
              ...aiAnalysis,
              imageUrl: imageUrls[aiAnalysis.imageIndex],
            }
          : null,
      });

      toast.success("Evidence uploaded to Pinata successfully!");
      onCloseAction();

      // Reset form
      setImages([]);
      setImagePreviews([]);
      setIotReadings([]);
      setNotes("");
      setSelectedAiImageIndex(null);
      setAiAdditionalContext("");
      setAiAnalysis(null);
    } catch (error: unknown) {
      console.error("Error submitting evidence:", error instanceof Error ? error.message : JSON.stringify(error));
      toast.error("Failed to upload evidence to Pinata");
    } finally {
      setUploading(false);
    }
  };

  const getIoTIcon = (type: IoTReading["type"]) => {
    switch (type) {
      case "temperature":
        return <Thermometer className="h-4 w-4" />;
      case "humidity":
        return <Droplets className="h-4 w-4" />;
      case "soil_moisture":
        return <Droplets className="h-4 w-4" />;
      case "ph_level":
        return <Wind className="h-4 w-4" />;
    }
  };

  const getIoTLabel = (type: IoTReading["type"]) => {
    switch (type) {
      case "temperature":
        return "Temperature";
      case "humidity":
        return "Humidity";
      case "soil_moisture":
        return "Soil Moisture";
      case "ph_level":
        return "pH Level";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between" style={{ background: '#F7F9FB' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ background: '#0C2D3A' }}>
                <Camera className="h-6 w-6" style={{ color: '#BFFF00' }} />
              </div>
              <div>
                <h2 className="text-2xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Upload Evidence</h2>
                <p className="text-sm mt-0.5" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>{milestoneName}</p>
              </div>
            </div>
            <button
              onClick={onCloseAction}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" style={{ color: '#5A7684' }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Image Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Camera className="h-5 w-5 inline mr-2" />
                Upload Images ({images.length}/10)
              </label>

              {/* Image Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedAiImageIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedAiImageIndex(index);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`relative group text-left rounded-lg overflow-hidden border-2 transition-all ${selectedAiImageIndex === index ? "border-green-500 ring-2 ring-green-100" : "border-gray-200 hover:border-green-300"}`}
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute left-2 bottom-2 px-2 py-1 rounded-full bg-black/65 text-white text-[10px] font-semibold">
                      {selectedAiImageIndex === index ? "Selected for AI" : `Photo ${index + 1}`}
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeImage(index);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {/* Upload Button */}
                {images.length < 10 && (
                  <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Add Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {images.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Crop Analysis for Evidence
                      </h4>
                      <p className="text-xs text-emerald-700 mt-1">
                        Run AI analysis on a captured evidence photo so the diagnosis is stored with the verifier evidence.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAnalyzeSelectedImage}
                      disabled={aiAnalyzing || selectedAiImageIndex === null}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {aiAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Analyze Selected Photo
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    value={aiAdditionalContext}
                    onChange={(e) => setAiAdditionalContext(e.target.value)}
                    placeholder="Optional AI context, e.g. yellow leaves observed near the edges or suspected pest stress..."
                    rows={2}
                    className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none bg-white"
                  />

                  {aiAnalysis && (
                    <div className="rounded-xl border border-emerald-200 bg-white p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{aiAnalysis.result.diagnosis}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Attached to photo {aiAnalysis.imageIndex + 1} • Confidence {aiAnalysis.result.confidenceScore}%
                          </p>
                        </div>
                        <span className="inline-flex px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          Health Score {aiAnalysis.result.healthScore}/100
                        </span>
                      </div>

                      {aiAnalysis.result.identifiedIssues.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Detected Issues</p>
                          <div className="flex flex-wrap gap-2">
                            {aiAnalysis.result.identifiedIssues.map((issue) => (
                              <span key={issue} className="px-2 py-1 rounded-full bg-amber-50 text-amber-800 text-xs border border-amber-200">
                                {issue}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiAnalysis.result.recommendations.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Recommendations</p>
                          <ul className="space-y-1">
                            {aiAnalysis.result.recommendations.slice(0, 3).map((recommendation) => (
                              <li key={recommendation} className="text-sm text-gray-700">
                                {recommendation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* IoT Readings Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  <Thermometer className="h-5 w-5 inline mr-2" />
                  IoT Sensor Readings
                </label>
                <button
                  onClick={() => setShowIoTForm(!showIoTForm)}
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Reading
                </button>
              </div>

              {/* IoT Form */}
              {showIoTForm && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sensor Type
                      </label>
                      <select
                        value={iotType}
                        onChange={(e) => setIoTType(e.target.value as IoTReading["type"])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="temperature">Temperature</option>
                        <option value="humidity">Humidity</option>
                        <option value="soil_moisture">Soil Moisture</option>
                        <option value="ph_level">pH Level</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Value
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={iotValue}
                        onChange={(e) => setIoTValue(e.target.value)}
                        placeholder="Enter value"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={addIoTReading}
                    className="btn-primary text-sm w-full"
                  >
                    Add Reading
                  </button>
                </div>
              )}

              {/* IoT Readings List */}
              {iotReadings.length > 0 && (
                <div className="space-y-2">
                  {iotReadings.map((reading) => (
                    <div
                      key={reading.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                          {getIoTIcon(reading.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getIoTLabel(reading.type)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(reading.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-gray-900">
                          {reading.value} {reading.unit}
                        </span>
                        <button
                          onClick={() => removeIoTReading(reading.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional information about this milestone..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-5 flex items-center justify-between border-t border-gray-100" style={{ background: '#F7F9FB' }}>
            <div className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500, color: '#5A7684' }}>
              {images.length} image(s) • {iotReadings.length} reading(s) • {aiAnalysis ? "AI linked" : "No AI analysis"}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCloseAction}
                disabled={uploading}
                className="px-6 py-2.5 rounded-xl transition-colors"
                style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, border: '1px solid rgba(12,45,58,0.15)', color: '#0C2D3A' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading || images.length === 0}
                className="px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-white disabled:opacity-40"
                style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, background: '#0C2D3A' }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading to Pinata...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Submit Evidence
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
