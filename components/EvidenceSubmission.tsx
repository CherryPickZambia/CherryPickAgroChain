"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, MapPin, Upload, X, CheckCircle, Loader2 } from "lucide-react";
import { uploadEvidencePhotos } from "@/lib/ipfsService";
import { createEvidence } from "@/lib/supabaseService";

interface EvidenceSubmissionProps {
  milestoneId: string;
  onSuccessAction: () => void;
  onCancelAction: () => void;
}

interface Location {
  lat: number;
  lng: number;
  accuracy: number;
}

export default function EvidenceSubmission({
  milestoneId,
  onSuccessAction,
  onCancelAction,
}: EvidenceSubmissionProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<Location | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get GPS location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.error("Location error:", error);
          setError("Unable to get location. Please enable location services.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      setError("Unable to access camera. Please grant camera permissions.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCapturing(false);
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `evidence-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          addPhoto(file);
        }
      }, "image/jpeg", 0.9);
    }
  };

  // Add photo to list
  const addPhoto = (file: File) => {
    setPhotos((prev) => [...prev, file]);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreviews((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(addPhoto);
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit evidence
  const handleSubmit = async () => {
    if (photos.length === 0) {
      setError("Please add at least one photo");
      return;
    }

    if (!location) {
      setError("Location is required. Please enable location services.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // Upload photos to IPFS
      const photoUrls = await uploadEvidencePhotos(photos);

      // Save evidence to database
      await createEvidence({
        milestone_id: milestoneId,
        photos: photoUrls,
        notes,
        geo_lat: location.lat,
        geo_lng: location.lng,
        timestamp: new Date().toISOString(),
      });

      stopCamera();
      onSuccessAction();
    } catch (error: any) {
      console.error("Submission error:", error);
      setError(error.message || "Failed to submit evidence");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1a1a1a]">Submit Evidence</h2>
          <button
            onClick={() => {
              stopCamera();
              onCancelAction();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Location Status */}
          <div className={`flex items-center gap-3 p-4 rounded-xl ${
            location ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"
          }`}>
            <MapPin className={`h-5 w-5 ${location ? "text-green-600" : "text-yellow-600"}`} />
            <div className="flex-1">
              <p className={`font-semibold ${location ? "text-green-900" : "text-yellow-900"}`}>
                {location ? "Location Captured" : "Getting Location..."}
              </p>
              {location && (
                <p className="text-sm text-green-700">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          {/* Camera Section */}
          {isCapturing ? (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-xl bg-black"
              />
              <div className="flex gap-3">
                <button
                  onClick={capturePhoto}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Camera className="h-5 w-5" />
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={startCamera}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Camera className="h-5 w-5" />
                Open Camera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Upload className="h-5 w-5" />
                Upload Photos
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Photo Previews */}
          {photoPreviews.length > 0 && (
            <div>
              <h3 className="font-semibold text-[#1a1a1a] mb-3">
                Photos ({photoPreviews.length})
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-semibold text-[#1a1a1a] mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this milestone..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-2 focus:outline-[#2d5f3f] resize-none"
              rows={4}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
              <X className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isUploading || photos.length === 0 || !location}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading to Pinata...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Submit Evidence
              </>
            )}
          </button>
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
