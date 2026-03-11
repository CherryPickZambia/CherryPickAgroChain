"use client";

import { useState, useEffect } from "react";
import { Plus, Search, QrCode, ArrowRight, Loader2, Sprout, Star, Leaf, ShieldCheck } from "lucide-react";
import { getBatchesByFarmer, getBatchTraceability, Batch, TraceabilityEvent } from "@/lib/traceabilityService";
import CreateBatchModal from "./CreateBatchModal";
import LogEventModal from "./LogEventModal";
import Link from "next/link";

interface BatchListProps {
    farmerId: string;
    userId?: string;
}

// Calculate traceability score based on logged events
function calculateTraceabilityScore(events: TraceabilityEvent[]): { score: number; level: 'basic' | 'good' | 'excellent' | 'premium' } {
    if (!events || events.length === 0) return { score: 0, level: 'basic' };
    
    let score = 0;
    const eventTypes = new Set(events.map(e => e.event_type));
    
    // Points for different activities
    if (eventTypes.has('planting')) score += 10;
    if (eventTypes.has('germination')) score += 10;
    if (eventTypes.has('growth_update')) score += 5 * events.filter(e => e.event_type === 'growth_update').length;
    if (eventTypes.has('input_application') || eventTypes.has('fertilization')) score += 15;
    if (eventTypes.has('irrigation')) score += 10;
    if (eventTypes.has('pest_control')) score += 10;
    if (eventTypes.has('harvest')) score += 15;
    if (eventTypes.has('storage')) score += 10;
    
    // Bonus for AI diagnostics
    const aiEvents = events.filter(e => e.ai_health_score !== undefined);
    if (aiEvents.length > 0) score += 20;
    
    // Bonus for photos
    const photosCount = events.filter(e => e.photos && e.photos.length > 0).length;
    score += Math.min(photosCount * 5, 20);
    
    // Bonus for IoT readings
    const iotEvents = events.filter(e => e.iot_readings && e.iot_readings.length > 0).length;
    score += Math.min(iotEvents * 5, 15);
    
    // Cap at 100
    score = Math.min(score, 100);
    
    let level: 'basic' | 'good' | 'excellent' | 'premium' = 'basic';
    if (score >= 80) level = 'premium';
    else if (score >= 60) level = 'excellent';
    else if (score >= 30) level = 'good';
    
    return { score, level };
}

export default function BatchList({ farmerId, userId }: BatchListProps) {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [batchScores, setBatchScores] = useState<Record<string, { score: number; level: string }>>({});
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
    const [showLogModal, setShowLogModal] = useState(false);

    const fetchBatches = async () => {
        try {
            const data = await getBatchesByFarmer(farmerId);
            setBatches(data);
            
            // Calculate traceability scores for each batch
            const scores: Record<string, { score: number; level: string }> = {};
            for (const batch of data) {
                if (batch.id) {
                    try {
                        const events = await getBatchTraceability(batch.id);
                        scores[batch.id] = calculateTraceabilityScore(events);
                    } catch {
                        scores[batch.id] = { score: 0, level: 'basic' };
                    }
                }
            }
            setBatchScores(scores);
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
                    {batches.map((batch) => {
                        let metadata: any = {};
                        try {
                            if (batch.ipfs_metadata) {
                                metadata = JSON.parse(batch.ipfs_metadata);
                            }
                        } catch (e) {
                            console.error("Error parsing metadata", e);
                        }

                        const isIndependent = !batch.contract_id;
                        const traceScore = batch.id ? batchScores[batch.id] : { score: 0, level: 'basic' };
                        const scoreColor = traceScore?.level === 'premium' ? 'text-yellow-500' : 
                                          traceScore?.level === 'excellent' ? 'text-green-500' : 
                                          traceScore?.level === 'good' ? 'text-blue-500' : 'text-gray-400';

                        return (
                            <div key={batch.id} className={`bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow ${isIndependent ? 'border-blue-200' : 'border-gray-100'}`}>
                                {/* Independent Batch Label */}
                                {isIndependent && (
                                    <div className="flex items-center gap-2 mb-3 -mt-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                            <Leaf className="w-3 h-3" />
                                            Farmer Independent Batch
                                        </span>
                                    </div>
                                )}

                                {metadata.batch_image && (
                                    <div className="mb-4 h-48 -mx-6 -mt-6 rounded-t-2xl overflow-hidden relative group">
                                        <img
                                            src={metadata.batch_image}
                                            alt={batch.crop_type}
                                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                                        {/* Status Badge */}
                                        <span className={`absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${batch.current_status === 'growing' ? 'bg-green-100/90 text-green-800' :
                                            batch.current_status === 'harvested' ? 'bg-yellow-100/90 text-yellow-800' :
                                            batch.current_status === 'stored' ? 'bg-purple-100/90 text-purple-800' :
                                                'bg-gray-100/90 text-gray-800'
                                            }`}>
                                            {batch.current_status}
                                        </span>
                                        {/* Premium Badge for high traceability */}
                                        {traceScore?.level === 'premium' && (
                                            <span className="absolute top-3 left-3 px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-current" /> Premium
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{batch.crop_type}</h3>
                                        <p className="text-sm text-gray-500">{batch.variety}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {!metadata.batch_image && (
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${batch.current_status === 'growing' ? 'bg-green-100 text-green-700' :
                                                batch.current_status === 'harvested' ? 'bg-yellow-100 text-yellow-700' :
                                                batch.current_status === 'stored' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {batch.current_status}
                                            </span>
                                        )}
                                        {!metadata.batch_image && traceScore?.level === 'premium' && (
                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-current" /> Premium
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Traceability Score Bar */}
                                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Traceability Score
                                        </span>
                                        <span className={`text-sm font-bold ${scoreColor}`}>{traceScore?.score || 0}/100</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all ${
                                                traceScore?.level === 'premium' ? 'bg-yellow-400' :
                                                traceScore?.level === 'excellent' ? 'bg-green-500' :
                                                traceScore?.level === 'good' ? 'bg-blue-500' : 'bg-gray-400'
                                            }`}
                                            style={{ width: `${traceScore?.score || 0}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        {traceScore?.level === 'premium' ? '⭐ Premium marketplace placement eligible' :
                                         traceScore?.level === 'excellent' ? 'Great! Keep logging activities' :
                                         traceScore?.level === 'good' ? 'Good start. Add more activities & AI scans' :
                                         'Log activities to build traceability'}
                                    </p>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Batch Code:</span>
                                        <span className="font-mono font-medium">{batch.batch_code}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Est. Yield:</span>
                                        <span className="font-medium">{batch.total_quantity} {batch.unit}</span>
                                    </div>
                                    {metadata.seeding_count && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Seeding/Plants:</span>
                                            <span className="font-medium">{metadata.seeding_count}</span>
                                        </div>
                                    )}
                                    {metadata.field_size && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Field Size:</span>
                                            <span className="font-medium">{metadata.field_size}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Started:</span>
                                        <span className="font-medium">
                                            {batch.created_at ? new Date(batch.created_at).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Journey Progress for Independent Batches */}
                                {isIndependent && (
                                    <div className="mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                        <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">Journey Progress</p>
                                        <div className="flex items-center gap-1">
                                            {['growing', 'harvested', 'stored'].map((stage, idx) => {
                                                const stages = ['growing', 'harvested', 'stored'];
                                                const currentIdx = stages.indexOf(batch.current_status || 'growing');
                                                const isComplete = idx <= currentIdx;
                                                const isCurrent = idx === currentIdx;
                                                return (
                                                    <div key={stage} className="flex items-center flex-1">
                                                        <div className={`flex-1 h-1.5 rounded-full ${isComplete ? 'bg-blue-500' : 'bg-gray-200'}`} />
                                                        <div className={`w-3 h-3 rounded-full border-2 ${isCurrent ? 'border-blue-500 bg-blue-500' : isComplete ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}`} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                                            <span>Growing</span>
                                            <span>Harvested</span>
                                            <span>Stored</span>
                                        </div>
                                    </div>
                                )}

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
                        );
                    })}
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
                    onCloseAction={() => setShowLogModal(false)}
                    batchId={selectedBatchId}
                    farmerId={farmerId}
                    userId={userId}
                    isContract={!!batches.find(b => b.id === selectedBatchId)?.contract_id}
                    onSuccessAction={() => {
                        fetchBatches();
                        // Optional: refresh specific batch data
                    }}
                />
            )}
        </div>
    );
}
