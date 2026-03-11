"use client";

import { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Package, MapPin, CheckCircle2, Clock, AlertCircle, QrCode, ArrowRight, User } from "lucide-react";
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

                                        <div className="space-y-8 relative">
                                            {milestones.map((milestone, index) => (
                                                <div key={milestone.id} className="flex gap-6">
                                                    <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm" style={{
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
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h4 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>{milestone.name}</h4>
                                                                <p className="text-sm mt-1" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>{milestone.description}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>K{milestone.payment_amount.toLocaleString()}</p>
                                                                <p className="text-xs font-medium uppercase mt-1" style={{
                                                                    fontFamily: "'Manrope', sans-serif",
                                                                    color: milestone.status === 'verified' ? '#0C2D3A' : milestone.status === 'submitted' ? '#5A7684' : '#5A7684'
                                                                }}>
                                                                    {milestone.status}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
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
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
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
