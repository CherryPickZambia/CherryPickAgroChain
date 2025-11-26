"use client";

import { useState } from "react";
import { X, Calendar, Package, Droplets, Sprout, FileText, Plus, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface FarmActivity {
  id: string;
  type: "planting" | "fertilizer" | "pesticide" | "irrigation" | "pruning" | "harvesting" | "other";
  description: string;
  quantity?: number;
  unit?: string;
  date: string;
  notes?: string;
}

interface FarmerMilestoneEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneId: string;
  milestoneName: string;
  onSubmit: (entries: FarmActivity[]) => Promise<void>;
}

// @ts-ignore - Next.js client component props warning
export default function FarmerMilestoneEntryModal({
  isOpen,
  onClose,
  milestoneId,
  milestoneName,
  onSubmit,
}: FarmerMilestoneEntryModalProps) {
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Activity Form State
  const [activityType, setActivityType] = useState<FarmActivity["type"]>("planting");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("seedlings");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");

  const addActivity = () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
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
    };

    setActivities([...activities, newActivity]);
    
    // Reset form
    setDescription("");
    setQuantity("");
    setNotes("");
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
      await onSubmit(activities);
      toast.success("Entries submitted! Awaiting officer verification.");
      onClose();
      
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
      case "planting":
        return <Sprout className="h-4 w-4" />;
      case "fertilizer":
        return <Package className="h-4 w-4" />;
      case "pesticide":
        return <Droplets className="h-4 w-4" />;
      case "irrigation":
        return <Droplets className="h-4 w-4" />;
      case "pruning":
        return <Sprout className="h-4 w-4" />;
      case "harvesting":
        return <Package className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Record all farming activities for this milestone. 
                An officer will visit to verify and collect evidence (photos + IoT data). 
                Then an admin will review and approve.
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
                  {/* Activity Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activity Type *
                    </label>
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value as FarmActivity["type"])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="planting">Planting</option>
                      <option value="fertilizer">Fertilizer Application</option>
                      <option value="pesticide">Pesticide Application</option>
                      <option value="irrigation">Irrigation</option>
                      <option value="pruning">Pruning</option>
                      <option value="harvesting">Harvesting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Planted Kent mango seedlings"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g., 500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit (Optional)
                    </label>
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

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional details..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={addActivity}
                    className="btn-primary text-sm flex-1"
                  >
                    Add Activity
                  </button>
                  <button
                    onClick={() => setShowActivityForm(false)}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Activities List */}
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                          {getActivityIcon(activity.type)}
                        </div>
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
                          {activity.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">{activity.notes}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeActivity(activity.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
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

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
            <div className="text-sm text-gray-600">
              {activities.length} {activities.length === 1 ? "activity" : "activities"} logged
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || activities.length === 0}
                className="btn-primary flex items-center gap-2"
              >
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
