"use client";

import { useState } from "react";
import { X, Calendar, Package, Droplets, Sprout, FileText, Plus, Trash2, Loader2, Camera, Upload, CheckCircle, ListTodo } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { uploadToIPFS } from "@/lib/ipfsService";

interface FarmActivity {
  id: string;
  type: "planting" | "weeding" | "fertilizer" | "pesticide" | "irrigation" | "pruning" | "harvesting" | "other";
  description: string;
  quantity?: number;
  unit?: string;
  date: string;
  notes?: string;
  recommendations?: string;
  followUpChecklist?: string[];
  isKeyMilestone?: boolean;
  fertilizerDetails?: {
    brand: string;
    type: string;
    npkRatio?: string;
  };
  evidencePhotos?: string[]; // Array of IPFS URLs
}

interface FarmerMilestoneEntryModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  milestoneId: string;
  milestoneName: string;
  onSubmitAction: (entries: FarmActivity[]) => Promise<void>;
}

// @ts-ignore - Next.js client component props warning
export default function FarmerMilestoneEntryModal({
  isOpen,
  onCloseAction,
  milestoneId,
  milestoneName,
  onSubmitAction,
}: FarmerMilestoneEntryModalProps) {
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Activity Form State
  const [activityType, setActivityType] = useState<FarmActivity["type"]>("planting");
  const [isKeyMilestone, setIsKeyMilestone] = useState(false);
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

  // New State for Recommendations & Checklist
  const [recommendations, setRecommendations] = useState("");
  const [currentChecklistItem, setCurrentChecklistItem] = useState("");
  const [checklistItems, setChecklistItems] = useState<string[]>([]);

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
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (evidenceImages.length > 0 && uploadedImageUrls.length === 0) {
      toast.error("Please upload the images first or remove them");
      return;
    }

    const newActivity: FarmActivity = {
      id: Date.now().toString(),
      type: activityType,
      description: description.trim(),
      quantity: quantity ? parseFloat(quantity) : undefined,
      unit: quantity ? unit : undefined,
      date,
      notes: notes.trim() || undefined,
      recommendations: recommendations.trim() || undefined,
      followUpChecklist: checklistItems.length > 0 ? checklistItems : undefined,
      isKeyMilestone,
      fertilizerDetails: activityType === 'fertilizer' ? {
        brand: fertilizerBrand,
        type: fertilizerType,
        npkRatio: npkRatio || undefined,
      } : undefined,
      evidencePhotos: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined
    };

    setActivities([...activities, newActivity]);

    // Reset form
    setDescription("");
    setQuantity("");
    setNotes("");
    setRecommendations("");
    setChecklistItems([]);
    setCurrentChecklistItem("");
    setIsKeyMilestone(false);
    setFertilizerBrand("");
    setFertilizerType("organic");
    setNpkRatio("");
    setEvidenceImages([]);
    setImagePreviews([]);
    setUploadedImageUrls([]);
    setShowActivityForm(false);
    toast.success("Activity added");
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
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityLabel = (type: FarmActivity["type"]) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Farm Activity Log</h2>
                <p className="text-green-100 mt-1">{milestoneName}</p>
              </div>
              <button onClick={onCloseAction} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Record all farming activities for this milestone.
                Upload evidence photos if available. An officer will visit for verification.
              </p>
            </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type *</label>
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value as FarmActivity["type"])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="planting">Planting</option>
                      <option value="weeding">Weeding</option>
                      <option value="fertilizer">Fertilizer Application</option>
                      <option value="pesticide">Pesticide Application</option>
                      <option value="irrigation">Irrigation</option>
                      <option value="pruning">Pruning</option>
                      <option value="harvesting">Harvesting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Planted Kent mango seedlings"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

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

                  {/* Recommendations & Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observation / Recommendations (Optional)</label>
                    <textarea
                      value={recommendations}
                      onChange={(e) => setRecommendations(e.target.value)}
                      placeholder="Note any issues, pests, or recommendations for next time..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-20 resize-none"
                    />
                  </div>

                  {/* Follow-up Checklist */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Follow-up Checklist (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentChecklistItem}
                        onChange={(e) => setCurrentChecklistItem(e.target.value)}
                        placeholder="Add a to-do item (e.g., 'Apply pesticide in 3 days')"
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

                  {activityType === 'fertilizer' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fertilizer Brand *</label>
                        <input
                          type="text"
                          value={fertilizerBrand}
                          onChange={(e) => setFertilizerBrand(e.target.value)}
                          placeholder="e.g., Compound D"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fertilizer Type</label>
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
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isKeyMilestone}
                        onChange={(e) => setIsKeyMilestone(e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Mark as Key Milestone</span>
                    </label>
                  </div>

                  {/* Evidence Images */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Photos (Optional)</label>
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
                        <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-square">
                          <Camera className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Add Photo</span>
                          <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                        </label>
                      )}
                    </div>
                    {evidenceImages.length > 0 && uploadedImageUrls.length === 0 && (
                      <button
                        onClick={uploadImages}
                        disabled={uploadingImages}
                        className="text-sm text-green-600 font-medium flex items-center gap-1"
                      >
                        {uploadingImages ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {uploadingImages ? "Uploading..." : "Upload Photos"}
                      </button>
                    )}
                    {uploadedImageUrls.length > 0 && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Photos ready
                      </p>
                    )}
                  </div>
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
                          {activity.evidencePhotos && activity.evidencePhotos.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">{activity.evidencePhotos.length} photos attached</p>
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

          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
            <div className="text-sm text-gray-600">
              {activities.length} {activities.length === 1 ? "activity" : "activities"} logged
            </div>
            <div className="flex gap-3">
              <button onClick={onCloseAction} disabled={submitting} className="btn-secondary">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || activities.length === 0} className="btn-primary flex items-center gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Submit for Verification
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
