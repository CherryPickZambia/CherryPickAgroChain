"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Upload, Loader2, AlertTriangle, CheckCircle, 
  Leaf, ThermometerSun, Droplets, Bug, Sparkles, X,
  ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";
import { analyzeCropHealth, fileToBase64, CropDiagnosisResult } from "@/lib/aiDiagnostics";
import toast from "react-hot-toast";

interface CropDiagnosticsProps {
  farmerId?: string;
  contractId?: string;
  cropType?: string;
  onDiagnosisComplete?: (result: CropDiagnosisResult, imageUrl: string) => void;
}

const CROP_TYPES = [
  "Mango", "Pineapple", "Cashew", "Tomato", "Onion", 
  "Potato", "Maize", "Soybean", "Groundnut", "Other"
];

export default function CropDiagnostics({ 
  farmerId, 
  contractId, 
  cropType: initialCropType,
  onDiagnosisComplete 
}: CropDiagnosticsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState(initialCropType || "");
  const [additionalContext, setAdditionalContext] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CropDiagnosisResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const base64 = await fileToBase64(file);
    setSelectedImage(base64);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const diagnosis = await analyzeCropHealth({
        imageBase64: selectedImage,
        cropType: cropType || undefined,
        additionalContext: additionalContext || undefined,
      });

      setResult(diagnosis);
      toast.success('Analysis complete!');

      if (onDiagnosisComplete) {
        onDiagnosisComplete(diagnosis, selectedImage);
      }
    } catch (error: any) {
      console.error('Diagnosis error:', error);
      toast.error(error.message || 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setResult(null);
    setCropType(initialCropType || "");
    setAdditionalContext("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Crop Diagnostics</h2>
            <p className="text-green-100 text-sm">Upload a photo to analyze crop health</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Image Upload Area */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!selectedImage ? (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer"
            >
              <div className="p-4 bg-gray-100 rounded-full">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">Upload Crop Photo</p>
                <p className="text-sm text-gray-500">Click to select or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB</p>
              </div>
            </motion.button>
          ) : (
            <div className="relative">
              <img
                src={selectedImage}
                alt="Selected crop"
                className="w-full h-64 object-cover rounded-2xl"
              />
              <button
                onClick={handleReset}
                className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              {result && (
                <div className={`absolute bottom-3 left-3 px-4 py-2 rounded-full ${getHealthBg(result.healthScore)} text-white font-bold flex items-center gap-2`}>
                  <Leaf className="w-4 h-4" />
                  {result.healthScore}/100
                </div>
              )}
            </div>
          )}
        </div>

        {/* Options */}
        {selectedImage && !result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 mb-6"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Crop Type (Optional)
              </label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
              >
                <option value="">Auto-detect</option>
                {CROP_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Context (Optional)
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="e.g., Leaves started yellowing 3 days ago, recent heavy rainfall..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors resize-none"
                rows={2}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze Crop Health
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Health Score */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Health Assessment</h3>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    result.healthScore >= 80 ? 'bg-green-100 text-green-700' :
                    result.healthScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    result.healthScore >= 40 ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {getHealthLabel(result.healthScore)}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke={result.healthScore >= 80 ? '#22c55e' : result.healthScore >= 60 ? '#eab308' : result.healthScore >= 40 ? '#f97316' : '#ef4444'}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(result.healthScore / 100) * 251.2} 251.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${getHealthColor(result.healthScore)}`}>
                        {result.healthScore}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-gray-700">{result.diagnosis}</p>
                    {result.cropType && (
                      <p className="text-sm text-gray-500 mt-2">
                        <span className="font-medium">Detected Crop:</span> {result.cropType}
                        {result.growthStage && ` (${result.growthStage})`}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Confidence: {result.confidenceScore}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Issues */}
              {result.identifiedIssues.length > 0 && (
                <div className="bg-red-50 rounded-2xl p-6">
                  <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Identified Issues
                  </h3>
                  <ul className="space-y-2">
                    {result.identifiedIssues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2 text-red-800">
                        <Bug className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div className="bg-green-50 rounded-2xl p-6">
                  <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-green-800">
                        <Leaf className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  New Analysis
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex-1 py-3 border-2 border-green-500 text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                >
                  {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  {showDetails ? 'Hide' : 'Show'} Details
                </button>
              </div>

              {/* Raw Response Details */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-900 rounded-xl p-4 overflow-hidden"
                  >
                    <pre className="text-xs text-green-400 overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
