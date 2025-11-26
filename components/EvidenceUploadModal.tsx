"use client";

import { useState } from "react";
import { X, Upload, Camera, Thermometer, Droplets, Wind, Image as ImageIcon, Plus, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { uploadToIPFS } from "@/lib/ipfsService";

interface IoTReading {
  id: string;
  type: "temperature" | "humidity" | "soil_moisture" | "ph_level";
  value: number;
  unit: string;
  timestamp: string;
}

interface EvidenceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneId: string;
  milestoneName: string;
  contractId: string;
  onSubmit: (evidence: {
    images: string[];
    iotReadings: IoTReading[];
    notes: string;
  }) => Promise<void>;
}

export default function EvidenceUploadModal({
  isOpen,
  onClose,
  milestoneId,
  milestoneName,
  contractId,
  onSubmit,
}: EvidenceUploadModalProps) {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [iotReadings, setIotReadings] = useState<IoTReading[]>([]);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

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
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
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
      // Upload images to IPFS
      const imageUrls: string[] = [];
      
      for (const image of images) {
        const ipfsHash = await uploadToIPFS(image);
        imageUrls.push(`ipfs://${ipfsHash}`);
      }

      // Submit evidence
      await onSubmit({
        images: imageUrls,
        iotReadings,
        notes,
      });

      toast.success("Evidence submitted successfully!");
      onClose();
      
      // Reset form
      setImages([]);
      setImagePreviews([]);
      setIotReadings([]);
      setNotes("");
    } catch (error) {
      console.error("Error submitting evidence:", error);
      toast.error("Failed to submit evidence");
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Upload Evidence</h2>
                <p className="text-green-100 mt-1">{milestoneName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
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
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={() => removeImage(index)}
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
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
            <div className="text-sm text-gray-600">
              {images.length} image(s) • {iotReadings.length} reading(s)
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={uploading}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading || images.length === 0}
                className="btn-primary flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading to IPFS...
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
