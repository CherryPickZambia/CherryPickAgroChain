"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sprout, Loader2 } from "lucide-react";
import { createBatch } from "@/lib/traceabilityService";
import toast from "react-hot-toast";

interface CreateBatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    farmerId: string;
    onSuccess: () => void;
}

export default function CreateBatchModal({ isOpen, onClose, farmerId, onSuccess }: CreateBatchModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        crop_type: "",
        variety: "",
        total_quantity: "",
        unit: "kg",
        is_organic: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.crop_type || !formData.total_quantity) {
            toast.error("Please fill in required fields");
            return;
        }

        setLoading(true);
        try {
            await createBatch({
                farmer_id: farmerId,
                crop_type: formData.crop_type,
                variety: formData.variety,
                total_quantity: Number(formData.total_quantity),
                unit: formData.unit,
                organic_certified: formData.is_organic,
                current_status: 'growing',
            });

            toast.success("New batch created successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error creating batch:", error);
            toast.error(error.message || "Failed to create batch");
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
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Sprout className="w-5 h-5 text-green-600" />
                                Start New Batch
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Crop Type *</label>
                                    <select
                                        required
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        value={formData.crop_type}
                                        onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                                    >
                                        <option value="">Select Crop</option>
                                        <option value="Maize">Maize</option>
                                        <option value="Wheat">Wheat</option>
                                        <option value="Soybean">Soybean</option>
                                        <option value="Coffee">Coffee</option>
                                        <option value="Tomato">Tomato</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Variety</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Cherry, Roma"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                        value={formData.variety}
                                        onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Estimated Quantity *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="0.00"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                        value={formData.total_quantity}
                                        onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Unit</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="kg">kg</option>
                                        <option value="tonnes">tonnes</option>
                                        <option value="crates">crates</option>
                                        <option value="bags">bags</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                                <input
                                    type="checkbox"
                                    id="organic"
                                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
                                    checked={formData.is_organic}
                                    onChange={(e) => setFormData({ ...formData, is_organic: e.target.checked })}
                                />
                                <label htmlFor="organic" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    This batch is Certified Organic
                                </label>
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
                                    Create Batch
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
