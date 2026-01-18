"use client";

import { useState, useEffect } from "react";
import { Plus, Search, QrCode, ArrowRight, Loader2, Sprout } from "lucide-react";
import { getBatchesByFarmer, Batch } from "@/lib/traceabilityService";
import CreateBatchModal from "./CreateBatchModal";
import LogEventModal from "./LogEventModal";
import Link from "next/link";

interface BatchListProps {
    farmerId: string;
}

export default function BatchList({ farmerId }: BatchListProps) {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
    const [showLogModal, setShowLogModal] = useState(false);

    const fetchBatches = async () => {
        try {
            const data = await getBatchesByFarmer(farmerId);
            setBatches(data);
        } catch (error) {
            console.error("Error fetching batches:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, [farmerId]);

    const handleLogEvent = (batchId: string) => {
        setSelectedBatchId(batchId);
        setShowLogModal(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Your Batches</h2>
                    <p className="text-gray-500">Track production from farm to shelf</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Batch
                </button>
            </div>

            {batches.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sprout className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Batches Yet</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Start tracking your crops by creating your first batch. You'll get a unique QR code for each one.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-green-600 font-semibold hover:text-green-700"
                    >
                        + Create First Batch
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {batches.map((batch) => (
                        <div key={batch.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{batch.crop_type}</h3>
                                    <p className="text-sm text-gray-500">{batch.variety}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${batch.current_status === 'growing' ? 'bg-green-100 text-green-700' :
                                        batch.current_status === 'harvested' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {batch.current_status}
                                </span>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Batch Code:</span>
                                    <span className="font-mono font-medium">{batch.batch_code}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Quantity:</span>
                                    <span className="font-medium">{batch.total_quantity} {batch.unit}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Date:</span>
                                    <span className="font-medium">
                                        {batch.created_at ? new Date(batch.created_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleLogEvent(batch.id!)}
                                    className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                                >
                                    Log Activity
                                </button>
                                <Link
                                    href={`/trace/${batch.batch_code}`}
                                    target="_blank"
                                    className="flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                    title="View Public Page"
                                >
                                    <QrCode className="w-5 h-5" />
                                </Link>
                                <Link
                                    href={`/trace/${batch.batch_code}`}
                                    className="flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <CreateBatchModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                farmerId={farmerId}
                onSuccess={fetchBatches}
            />

            {selectedBatchId && (
                <LogEventModal
                    isOpen={showLogModal}
                    onClose={() => setShowLogModal(false)}
                    batchId={selectedBatchId}
                    farmerId={farmerId}
                    onSuccess={() => {
                        fetchBatches();
                        // Optional: refresh specific batch data
                    }}
                />
            )}
        </div>
    );
}
