"use client";

import { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Package, MapPin, CheckCircle2, Clock, AlertCircle, QrCode, ArrowRight, ChevronDown, ChevronUp, Sprout, Factory, Image as ImageIcon, Activity, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface Milestone {
    id: string;
    name: string;
    description: string;
    status: string;
    payment_amount: number;
    expected_date: string;
    completed_date?: string;
    payment_status?: string;
    metadata?: Record<string, any> | null;
}

interface BatchRecord {
    id: string;
    batch_code: string;
    crop_type: string;
    variety?: string;
    current_status?: string;
    total_quantity?: number;
    unit?: string;
    harvest_date?: string;
    ipfs_metadata?: string | null;
    updated_at?: string;
}

interface GrowthActivityRecord {
    id: string;
    activity_type: string;
    title: string;
    description?: string;
    date: string;
    quantity?: number;
    unit?: string;
    photos?: string[];
    fertilizer_brand?: string;
    fertilizer_type?: string;
    npk_ratio?: string;
    transport_type?: string;
    vehicle_registration?: string;
    driver_name?: string;
    driver_phone?: string;
    origin?: string;
    destination?: string;
    location_address?: string;
    metadata?: Record<string, any> | null;
}

interface Contract {
    id: string;
    contract_code: string;
    farmer: {
        name: string;
        wallet_address: string;
        location_address: string;
    };
    crop_type: string;
    variety: string;
    required_quantity: number;
    price_per_kg: number;
    total_value: number;
    status: string;
    created_at: string;
    harvest_date?: string;
}

interface AdminContractDetailModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
    contractId: string;
}

export default function AdminContractDetailModal({ isOpen, onCloseAction, contractId }: AdminContractDetailModalProps) {
    const [contract, setContract] = useState<Contract | null>(null);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [batches, setBatches] = useState<BatchRecord[]>([]);
    const [growthActivities, setGrowthActivities] = useState<GrowthActivityRecord[]>([]);
    const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);
    const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
    const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && contractId) {
            loadContractDetails();
        }
    }, [isOpen, contractId]);

    const loadContractDetails = async () => {
        setLoading(true);
        try {
            if (!supabase) return;

            // Fetch contract with farmer info
            const { data: contractData, error: contractError } = await supabase
                .from('contracts')
                .select(`
          *,
          farmer:farmers(name, wallet_address, location_address)
        `)
                .eq('id', contractId)
                .single();

            if (contractError) throw contractError;
            setContract(contractData);

            // Fetch milestones
            const { data: milestoneData, error: milestoneError } = await supabase
                .from('milestones')
                .select('*')
                .eq('contract_id', contractId)
                .order('sequence_order', { ascending: true });

            if (milestoneError) throw milestoneError;
            setMilestones(milestoneData || []);

            // Fetch batches (for factory/processing details)
            const { data: batchData } = await supabase
                .from('batches')
                .select('*')
                .eq('contract_id', contractId)
                .order('created_at', { ascending: true });
            setBatches((batchData as BatchRecord[]) || []);

            // Fetch farmer growth updates linked to this contract
            const { data: growthData } = await supabase
                .from('growth_activities')
                .select('*')
                .eq('contract_id', contractId)
                .order('date', { ascending: false });
            setGrowthActivities((growthData as GrowthActivityRecord[]) || []);
        } catch (error: any) {
            console.error('Error loading contract details:', error);
            toast.error('Failed to load contract details');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between" style={{ background: '#F7F9FB' }}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl" style={{ background: '#0C2D3A' }}>
                                <Package className="h-6 w-6" style={{ color: '#BFFF00' }} />
                            </div>
                            <div>
                                <h2 className="text-2xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>
                                    {loading ? "Loading Contract..." : `Contract: ${contract?.contract_code}`}
                                </h2>
                                {!loading && (
                                    <p className="text-sm flex items-center gap-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>
                                        <Calendar className="h-3 w-3" />
                                        Created on {new Date(contract?.created_at || '').toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {!loading && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase" style={{
                                    fontFamily: "'Manrope', sans-serif",
                                    background: contract?.status === 'active' ? 'rgba(191,255,0,0.15)' : contract?.status === 'completed' ? 'rgba(12,45,58,0.1)' : 'rgba(90,118,132,0.1)',
                                    color: '#0C2D3A'
                                }}>
                                    {contract?.status}
                                </span>
                            )}
                            <button
                                onClick={onCloseAction}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6" style={{ color: '#5A7684' }} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin h-10 w-10 border-4 rounded-full mb-4" style={{ borderColor: '#0C2D3A', borderTopColor: 'transparent' }}></div>
                                <p className="font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>Fetching contract data...</p>
                            </div>
                        ) : contract ? (
                            <div className="space-y-8">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-2xl" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.08)' }}>
                                        <p className="text-sm font-medium mb-1" style={{ fontFamily: "'Manrope', sans-serif", color: '#BFFF00', background: '#0C2D3A', display: 'inline-block', padding: '2px 10px', borderRadius: 8, fontSize: 11 }}>Farmer Details</p>
                                        <h3 className="text-xl mb-2" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>{contract.farmer.name}</h3>
                                        <div className="space-y-1 text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>
                                            <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {contract.farmer.location_address}</p>
                                            <p className="flex items-center gap-2 font-mono text-xs"><DollarSign className="h-3 w-3" /> {contract.farmer.wallet_address.slice(0, 8)}...</p>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-2xl" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.08)' }}>
                                        <p className="text-sm font-medium mb-1" style={{ fontFamily: "'Manrope', sans-serif", color: '#BFFF00', background: '#0C2D3A', display: 'inline-block', padding: '2px 10px', borderRadius: 8, fontSize: 11 }}>Production Info</p>
                                        <h3 className="text-xl mb-2" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>{contract.crop_type}</h3>
                                        <div className="space-y-1 text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>
                                            <p><span className="font-semibold">Variety:</span> {contract.variety || 'N/A'}</p>
                                            <p><span className="font-semibold">Target:</span> {contract.required_quantity.toLocaleString()} kg</p>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-2xl" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.08)' }}>
                                        <p className="text-sm font-medium mb-1" style={{ fontFamily: "'Manrope', sans-serif", color: '#BFFF00', background: '#0C2D3A', display: 'inline-block', padding: '2px 10px', borderRadius: 8, fontSize: 11 }}>Total Contract Value</p>
                                        <h3 className="text-2xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>K{contract.total_value.toLocaleString()}</h3>
                                        <p className="text-sm mt-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>
                                            K{contract.price_per_kg}/kg fixed price
                                        </p>
                                    </div>
                                </div>

                                {/* Milestones Timeline */}
                                <div className="card-premium">
                                    <h3 className="text-lg mb-6 flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>
                                        <Clock className="h-5 w-5" style={{ color: '#0C2D3A' }} />
                                        Agreement Milestones
                                    </h3>

                                    <div className="relative">
                                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100"></div>

                                        <div className="space-y-4 relative">
                                            {milestones.map((milestone, index) => {
                                                const isExpanded = expandedMilestoneId === milestone.id;
                                                const meta = milestone.metadata || {};
                                                const officerImages: string[] = (meta.officer_images || meta.images || []) as string[];
                                                const officerNotes: string = (meta.officer_notes || meta.notes || '') as string;
                                                const officerIot = (meta.officer_iot_readings || meta.iot_readings || []) as any[];
                                                const aiAnalysis = (meta.officer_ai_analysis || meta.ai_analysis || null) as any;
                                                const verifiedAt = (meta.verified_at as string) || milestone.completed_date;
                                                return (
                                                    <div key={milestone.id} className="flex gap-6">
                                                        <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm flex-shrink-0" style={{
                                                            background: milestone.status === 'verified' ? '#0C2D3A' : milestone.status === 'submitted' ? '#BFFF00' : '#E6E2D6'
                                                        }}>
                                                            {milestone.status === 'verified' ? (
                                                                <CheckCircle2 className="h-4 w-4 text-white" />
                                                            ) : milestone.status === 'submitted' ? (
                                                                <ArrowRight className="h-4 w-4 text-white" />
                                                            ) : (
                                                                <span className="text-white text-xs font-bold">{index + 1}</span>
                                                            )}
                                                        </div>

                                                        <div className="flex-1">
                                                            <button
                                                                onClick={() => setExpandedMilestoneId(isExpanded ? null : milestone.id)}
                                                                className="w-full text-left rounded-xl px-4 py-3 transition-colors hover:bg-[#F7F9FB] border border-transparent hover:border-[#E6E2D6]"
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>
                                                                            {milestone.name}
                                                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                                        </h4>
                                                                        <p className="text-sm mt-1" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>{milestone.description}</p>
                                                                    </div>
                                                                    <div className="text-right flex-shrink-0">
                                                                        <p className="text-lg" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>K{milestone.payment_amount.toLocaleString()}</p>
                                                                        <p className="text-xs font-medium uppercase mt-1" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>
                                                                            {milestone.status}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 flex-wrap">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        Expected: {new Date(milestone.expected_date).toLocaleDateString()}
                                                                    </span>
                                                                    {milestone.completed_date && (
                                                                        <span className="flex items-center gap-1" style={{ color: '#0C2D3A' }}>
                                                                            <CheckCircle2 className="h-3 w-3" />
                                                                            Completed: {new Date(milestone.completed_date).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                    {milestone.payment_status && (
                                                                        <span className="flex items-center gap-1">
                                                                            <DollarSign className="h-3 w-3" />
                                                                            Payment: {milestone.payment_status}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </button>

                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="mt-3 ml-4 pl-4 border-l-2 space-y-4"
                                                                    style={{ borderColor: '#BFFF00' }}
                                                                >
                                                                    {officerNotes && (
                                                                        <div>
                                                                            <p className="text-xs uppercase tracking-wide font-bold mb-1" style={{ color: '#5A7684' }}>Verifier Notes</p>
                                                                            <p className="text-sm text-[#0C2D3A] bg-[#F7F9FB] rounded-lg p-3">{officerNotes}</p>
                                                                        </div>
                                                                    )}

                                                                    {officerImages.length > 0 && (
                                                                        <div>
                                                                            <p className="text-xs uppercase tracking-wide font-bold mb-2 flex items-center gap-1" style={{ color: '#5A7684' }}>
                                                                                <ImageIcon className="h-3 w-3" /> Evidence Photos ({officerImages.length})
                                                                            </p>
                                                                            <div className="flex gap-2 flex-wrap">
                                                                                {officerImages.map((src, i) => (
                                                                                    <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block">
                                                                                        <img src={src} alt={`Evidence ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:scale-105 transition-transform" />
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {Array.isArray(officerIot) && officerIot.length > 0 && (
                                                                        <div>
                                                                            <p className="text-xs uppercase tracking-wide font-bold mb-2 flex items-center gap-1" style={{ color: '#5A7684' }}>
                                                                                <Activity className="h-3 w-3" /> IoT / Sensor Readings
                                                                            </p>
                                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                                {officerIot.map((r: any, i: number) => (
                                                                                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-2 text-xs">
                                                                                        <p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>{r.type || 'reading'}</p>
                                                                                        <p className="font-bold text-[#0C2D3A]">{r.value} {r.unit || ''}</p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {aiAnalysis && (
                                                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                                                            <p className="text-xs uppercase tracking-wide font-bold mb-1 text-purple-700">AI Analysis</p>
                                                                            {aiAnalysis.disease && <p className="text-sm"><span className="font-bold">Diagnosis:</span> {aiAnalysis.disease}</p>}
                                                                            {aiAnalysis.healthScore !== undefined && <p className="text-sm"><span className="font-bold">Health Score:</span> {aiAnalysis.healthScore}%</p>}
                                                                            {aiAnalysis.confidence !== undefined && <p className="text-sm"><span className="font-bold">Confidence:</span> {aiAnalysis.confidence}%</p>}
                                                                            {aiAnalysis.treatmentRec && <p className="text-sm mt-1"><span className="font-bold">Recommendation:</span> {aiAnalysis.treatmentRec}</p>}
                                                                        </div>
                                                                    )}

                                                                    {meta.location_address && (
                                                                        <div className="flex items-center gap-2 text-sm text-[#5A7684]">
                                                                            <MapPin className="h-4 w-4" />
                                                                            {meta.location_address}
                                                                        </div>
                                                                    )}

                                                                    {verifiedAt && (
                                                                        <p className="text-xs" style={{ color: '#5A7684' }}>
                                                                            Verified at: {new Date(verifiedAt).toLocaleString()}
                                                                        </p>
                                                                    )}

                                                                    {!officerNotes && officerImages.length === 0 && !aiAnalysis && (
                                                                        <p className="text-sm italic" style={{ color: '#5A7684' }}>No additional verification details recorded for this milestone yet.</p>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Factory / Warehouse Processing */}
                                {batches.length > 0 && (
                                    <div className="card-premium">
                                        <h3 className="text-lg mb-6 flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>
                                            <Factory className="h-5 w-5" />
                                            Factory & Warehouse Processing
                                        </h3>
                                        <div className="space-y-3">
                                            {batches.map((b) => {
                                                const isOpen = expandedBatchId === b.id;
                                                let bm: any = {};
                                                try { if (b.ipfs_metadata) bm = JSON.parse(b.ipfs_metadata); } catch { /* ignore */ }
                                                const sizes: any[] = Array.isArray(bm.packagingSizes) ? bm.packagingSizes : [];
                                                const totalKg = typeof bm.totalWeightKg === 'number' ? bm.totalWeightKg : (b.total_quantity || 0);
                                                return (
                                                    <div key={b.id} className="border border-[#E6E2D6] rounded-xl overflow-hidden">
                                                        <button
                                                            onClick={() => setExpandedBatchId(isOpen ? null : b.id)}
                                                            className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-[#F7F9FB] transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <Package className="h-5 w-5 flex-shrink-0" style={{ color: '#0C2D3A' }} />
                                                                <div className="min-w-0">
                                                                    <p className="font-bold truncate" style={{ fontFamily: "'Syne', sans-serif", color: '#0C2D3A' }}>{b.batch_code}</p>
                                                                    <p className="text-xs" style={{ color: '#5A7684' }}>{b.crop_type}{b.variety ? ` · ${b.variety}` : ''} · {b.current_status || 'growing'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <span className="text-sm font-bold" style={{ color: '#0C2D3A' }}>{totalKg ? `${totalKg} kg` : '—'}</span>
                                                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                            </div>
                                                        </button>
                                                        {isOpen && (
                                                            <div className="px-4 pb-4 pt-2 bg-[#F7F9FB] border-t border-[#E6E2D6] space-y-3">
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                                    {bm.productionDate && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>Production</p><p className="font-bold">{new Date(bm.productionDate).toLocaleDateString()}</p></div>}
                                                                    {bm.expiryDate && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>Expiry</p><p className="font-bold">{new Date(bm.expiryDate).toLocaleDateString()}</p></div>}
                                                                    {b.harvest_date && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>Harvest</p><p className="font-bold">{new Date(b.harvest_date).toLocaleDateString()}</p></div>}
                                                                    {bm.processingFacility && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>Facility</p><p className="font-bold">{bm.processingFacility}</p></div>}
                                                                    {bm.qualityGrade && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>Grade</p><p className="font-bold">{bm.qualityGrade}</p></div>}
                                                                    {bm.storageConditions && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>Storage</p><p className="font-bold">{bm.storageConditions}</p></div>}
                                                                </div>

                                                                {sizes.length > 0 && (
                                                                    <div>
                                                                        <p className="text-xs uppercase tracking-wide font-bold mb-2" style={{ color: '#5A7684' }}>Packaging Breakdown</p>
                                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                            {sizes.map((s, i) => (
                                                                                <div key={i} className="bg-white border border-gray-200 rounded-lg p-2 text-xs">
                                                                                    <p className="font-bold">{s.sizeKg ?? s.size} kg × {s.count}</p>
                                                                                    <p style={{ color: '#5A7684' }}>{((parseFloat(s.sizeKg ?? s.size) || 0) * (parseFloat(s.count) || 0)).toFixed(2)} kg total</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {Array.isArray(bm.processingSteps) && bm.processingSteps.length > 0 && (
                                                                    <div>
                                                                        <p className="text-xs uppercase tracking-wide font-bold mb-2" style={{ color: '#5A7684' }}>Processing Steps</p>
                                                                        <ol className="list-decimal pl-5 text-sm space-y-1">
                                                                            {bm.processingSteps.map((s: any, i: number) => (
                                                                                <li key={i}>{typeof s === 'string' ? s : (s.name || s.title || JSON.stringify(s))}</li>
                                                                            ))}
                                                                        </ol>
                                                                    </div>
                                                                )}

                                                                {bm.notes && (
                                                                    <p className="text-sm bg-white rounded-lg p-3 border border-gray-200">{bm.notes}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Growth Updates from farmer logs */}
                                <div className="card-premium">
                                    <h3 className="text-lg mb-2 flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>
                                        <Sprout className="h-5 w-5" />
                                        Growth Updates
                                    </h3>
                                    <p className="text-sm mb-4" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>
                                        Self-logged updates from the farmer. These are informational only and do not affect milestone payouts.
                                    </p>
                                    {growthActivities.length === 0 ? (
                                        <div className="text-center py-8 bg-[#F7F9FB] rounded-xl">
                                            <Sprout className="h-10 w-10 mx-auto mb-2" style={{ color: '#5A7684', opacity: 0.5 }} />
                                            <p className="text-sm" style={{ color: '#5A7684' }}>No growth updates logged yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {growthActivities.map((a) => {
                                                const isOpen = expandedActivityId === a.id;
                                                return (
                                                    <div key={a.id} className="border border-[#E6E2D6] rounded-xl overflow-hidden">
                                                        <button
                                                            onClick={() => setExpandedActivityId(isOpen ? null : a.id)}
                                                            className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-[#F7F9FB] transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(191,255,0,0.15)' }}>
                                                                    <FileText className="h-4 w-4" style={{ color: '#0C2D3A' }} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-bold truncate" style={{ fontFamily: "'Syne', sans-serif", color: '#0C2D3A' }}>{a.title}</p>
                                                                    <p className="text-xs flex items-center gap-2" style={{ color: '#5A7684' }}>
                                                                        <span className="capitalize">{a.activity_type}</span>
                                                                        <span>·</span>
                                                                        <span>{new Date(a.date).toLocaleDateString()}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex-shrink-0">
                                                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                            </div>
                                                        </button>
                                                        {isOpen && (
                                                            <div className="px-4 pb-4 pt-2 bg-[#F7F9FB] border-t border-[#E6E2D6] space-y-3">
                                                                {a.description && <p className="text-sm text-[#0C2D3A]">{a.description}</p>}
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                                    {a.quantity !== undefined && a.quantity !== null && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>Quantity</p><p className="font-bold">{a.quantity} {a.unit || ''}</p></div>}
                                                                    {a.fertilizer_brand && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>Fertilizer</p><p className="font-bold">{a.fertilizer_brand}{a.fertilizer_type ? ` (${a.fertilizer_type})` : ''}</p></div>}
                                                                    {a.npk_ratio && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>NPK Ratio</p><p className="font-bold">{a.npk_ratio}</p></div>}
                                                                    {a.transport_type && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>Transport</p><p className="font-bold">{a.transport_type}</p></div>}
                                                                    {a.vehicle_registration && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>Vehicle</p><p className="font-bold">{a.vehicle_registration}</p></div>}
                                                                    {a.driver_name && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>Driver</p><p className="font-bold">{a.driver_name}{a.driver_phone ? ` (${a.driver_phone})` : ''}</p></div>}
                                                                    {a.origin && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>Origin</p><p className="font-bold">{a.origin}</p></div>}
                                                                    {a.destination && <div><p className="text-[10px] uppercase font-bold" style={{ color: '#5A7684' }}>Destination</p><p className="font-bold">{a.destination}</p></div>}
                                                                </div>
                                                                {a.location_address && (
                                                                    <div className="flex items-center gap-2 text-sm text-[#5A7684]">
                                                                        <MapPin className="h-4 w-4" />{a.location_address}
                                                                    </div>
                                                                )}
                                                                {Array.isArray(a.photos) && a.photos.length > 0 && (
                                                                    <div className="flex gap-2 flex-wrap">
                                                                        {a.photos.map((p, i) => (
                                                                            <a key={i} href={p} target="_blank" rel="noopener noreferrer">
                                                                                <img src={p} alt={`Update ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:scale-105 transition-transform" />
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* QR Code & Logistics Info */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="p-6 rounded-2xl flex items-center gap-6" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.08)' }}>
                                        <div className="p-4 rounded-xl" style={{ background: '#0C2D3A' }}>
                                            <QrCode className="h-20 w-20" style={{ color: '#BFFF00' }} />
                                        </div>
                                        <div>
                                            <h4 className="mb-1" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Contract QR Identifier</h4>
                                            <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>
                                                Scan this code to verify contract details at farm level.
                                            </p>
                                            <button className="mt-3 text-sm font-bold hover:underline" style={{ fontFamily: "'Manrope', sans-serif", color: '#0C2D3A' }}>
                                                Download Code
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-2xl flex items-center gap-4" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.08)' }}>
                                        <div className="p-3 rounded-xl" style={{ background: 'rgba(12,45,58,0.08)' }}>
                                            <AlertCircle className="h-6 w-6" style={{ color: '#0C2D3A' }} />
                                        </div>
                                        <div>
                                            <h4 className="mb-1" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Safety & Compliance</h4>
                                            <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>
                                                This contract involves key milestones that require verifier presence.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Contract data not found.</p>
                            </div>
                        )}
                    </div>

                    {!loading && contract && (
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3" style={{ background: '#F7F9FB' }}>
                            <button
                                onClick={onCloseAction}
                                className="px-6 py-2 rounded-xl transition-colors" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, border: '1px solid rgba(12,45,58,0.15)', color: '#0C2D3A' }}
                            >
                                Close
                            </button>
                            {contract.status === 'active' && (
                                <button
                                    className="px-6 py-2 text-white rounded-xl transition-colors" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, background: '#0C2D3A' }}
                                    onClick={() => toast.error('Cancellation process requires multi-sig approval')}
                                >
                                    Terminate Contract
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
