"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, MapPin, Truck, Warehouse, Loader2, Sprout } from "lucide-react";
import { addTraceabilityEvent, TraceabilityEventType } from "@/lib/traceabilityService";
import toast from "react-hot-toast";

interface LogEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    batchId: string;
    farmerId: string; // The actor logging the event
    onSuccess: () => void;
}

const EVENT_TYPES: { value: TraceabilityEventType; label: string; icon: any }[] = [
    { value: 'planting', label: 'Planting', icon: Calendar },
    { value: 'germination', label: 'Germination', icon: Sprout },
    { value: 'growth_update', label: 'Growth Update', icon: Calendar },
    { value: 'input_application', label: 'Inputs (Fert/Pesticide)', icon: Calendar },
    { value: 'flowering', label: 'Flowering', icon: Sprout },
    { value: 'harvest', label: 'Harvest', icon: Calendar },
    { value: 'transport_start', label: 'Transport Start', icon: Truck },
    { value: 'storage', label: 'Storage', icon: Warehouse },
    { value: 'processing', label: 'Processing', icon: Calendar },
];

export default function LogEventModal({ isOpen, onClose, batchId, farmerId, onSuccess }: LogEventModalProps) {
    const [loading, setLoading] = useState(false);
    const [eventType, setEventType] = useState<TraceabilityEventType>('growth_update');
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addTraceabilityEvent({
                batch_id: batchId,
                event_type: eventType,
                event_title: title || EVENT_TYPES.find(t => t.value === eventType)?.label || 'Event',
                event_description: description,
                actor_id: farmerId,
                actor_type: 'farmer', // Simplified for now
                location_address: location,
                // In a real app, we'd capture geolocation here
            });

            toast.success("Event logged successfully!");
            onSuccess();
            onClose();
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
                        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl"
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900">Log New Activity</h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Event Type</label>
                                <select
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value as TraceabilityEventType)}
                                >
                                    {EVENT_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Weekly growth check"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Description / Notes</label>
                                <textarea
                                    rows={3}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none"
                                    placeholder="Add details about this activity..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Location (Optional)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Brief location description"
                                        className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save Log
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
