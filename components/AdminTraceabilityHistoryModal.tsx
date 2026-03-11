"use client";

import { useState, useEffect } from "react";
import {
  X, Clock, CheckCircle2, AlertCircle, Package, MapPin, Truck, Leaf,
  ShieldCheck, Camera, Bug, Droplets, ThermometerSun, User, Eye,
  ChevronDown, ChevronUp, Loader2, FileText, Sprout, Factory,
  AlertTriangle, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  getBatchesByContract, getBatchTraceability, getBatchesByFarmer,
  type Batch, type TraceabilityEvent
} from "@/lib/traceabilityService";
import toast from "react-hot-toast";

interface AdminTraceabilityHistoryModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  contractId?: string;
  batchId?: string;
  batchCode?: string;
}

interface ContractInfo {
  id: string;
  contract_code: string;
  crop_type: string;
  variety?: string;
  status: string;
  total_value: number;
  required_quantity: number;
  farmer: { name: string; wallet_address: string; location_address?: string };
}

interface MilestoneInfo {
  id: string;
  name: string;
  status: string;
  payment_amount: number;
  completed_date?: string;
  metadata?: Record<string, unknown>;
}

const EVENT_ICONS: Record<string, typeof Leaf> = {
  planting: Sprout,
  germination: Sprout,
  growth_update: Leaf,
  input_application: Droplets,
  fertilization: Droplets,
  irrigation: Droplets,
  flowering: Leaf,
  pest_control: Bug,
  harvest: Package,
  post_harvest_handling: Package,
  quality_check: ShieldCheck,
  storage: Factory,
  aggregation: Factory,
  transport_start: Truck,
  transport_checkpoint: MapPin,
  warehouse_arrival: Factory,
  processing: Factory,
  packaging: Package,
  distribution: Truck,
  retail_arrival: MapPin,
  verification: CheckCircle2,
  ai_diagnostic: ThermometerSun,
};

const ACTOR_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  farmer: { bg: 'rgba(34,197,94,0.08)', text: '#166534', border: 'rgba(34,197,94,0.2)' },
  verifier: { bg: 'rgba(59,130,246,0.08)', text: '#1e40af', border: 'rgba(59,130,246,0.2)' },
  transporter: { bg: 'rgba(245,158,11,0.08)', text: '#92400e', border: 'rgba(245,158,11,0.2)' },
  warehouse: { bg: 'rgba(139,92,246,0.08)', text: '#5b21b6', border: 'rgba(139,92,246,0.2)' },
  processor: { bg: 'rgba(236,72,153,0.08)', text: '#9d174d', border: 'rgba(236,72,153,0.2)' },
  admin: { bg: 'rgba(12,45,58,0.08)', text: '#0C2D3A', border: 'rgba(12,45,58,0.15)' },
};

type FilterType = 'all' | 'farmer' | 'verifier' | 'warehouse' | 'compliance' | 'transport';

export default function AdminTraceabilityHistoryModal({
  isOpen, onCloseAction, contractId, batchId, batchCode
}: AdminTraceabilityHistoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<ContractInfo | null>(null);
  const [milestones, setMilestones] = useState<MilestoneInfo[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [events, setEvents] = useState<TraceabilityEvent[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(batchId || null);

  useEffect(() => {
    if (isOpen && (contractId || batchId)) {
      loadData();
    }
  }, [isOpen, contractId, batchId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!supabase) return;

      // Load contract info if contractId provided
      if (contractId) {
        const { data: contractData } = await supabase
          .from('contracts')
          .select('*, farmer:farmers(name, wallet_address, location_address)')
          .eq('id', contractId)
          .single();
        if (contractData) setContract(contractData);

        // Load milestones
        const { data: milestoneData } = await supabase
          .from('milestones')
          .select('*')
          .eq('contract_id', contractId)
          .order('sequence_order', { ascending: true });
        setMilestones(milestoneData || []);

        // Load batches for this contract
        const batchData = await getBatchesByContract(contractId);
        setBatches(batchData);

        // Load events for all batches
        const allEvents: TraceabilityEvent[] = [];
        for (const batch of batchData) {
          if (batch.id) {
            const batchEvents = await getBatchTraceability(batch.id);
            allEvents.push(...batchEvents);
          }
        }
        setEvents(allEvents.sort((a, b) =>
          new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
        ));

        if (batchData.length > 0 && !selectedBatchId) {
          setSelectedBatchId(batchData[0].id || null);
        }
      } else if (batchId) {
        // Direct batch view
        const batchEvents = await getBatchTraceability(batchId);
        setEvents(batchEvents.sort((a, b) =>
          new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
        ));
        setSelectedBatchId(batchId);
      }
    } catch (error) {
      console.error('Error loading traceability history:', error);
      toast.error('Failed to load traceability history');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(e => {
    if (selectedBatchId && e.batch_id !== selectedBatchId) return false;
    if (filter === 'all') return true;
    if (filter === 'farmer') return e.actor_type === 'farmer' || !e.actor_type;
    if (filter === 'verifier') return e.actor_type === 'verifier';
    if (filter === 'warehouse') return e.actor_type === 'warehouse' || e.actor_type === 'processor';
    if (filter === 'compliance') return e.event_type === 'quality_check' || e.event_type === 'verification' || e.event_type === 'ai_diagnostic';
    if (filter === 'transport') return e.actor_type === 'transporter' || e.event_type === 'transport_start' || e.event_type === 'transport_checkpoint' || e.event_type === 'warehouse_arrival';
    return true;
  });

  const getActorColor = (actorType?: string) => ACTOR_COLORS[actorType || 'farmer'] || ACTOR_COLORS.farmer;
  const getEventIcon = (eventType: string) => EVENT_ICONS[eventType] || FileText;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between" style={{ background: '#F7F9FB' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ background: '#0C2D3A' }}>
                <Clock className="h-6 w-6" style={{ color: '#BFFF00' }} />
              </div>
              <div>
                <h2 className="text-xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>
                  Traceability History
                </h2>
                <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>
                  {contract ? `${contract.contract_code} • ${contract.crop_type}` : batchCode || 'Batch Details'}
                  {' '}• {events.length} events logged
                </p>
              </div>
            </div>
            <button onClick={onCloseAction} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-6 w-6" style={{ color: '#5A7684' }} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin mb-4" style={{ color: '#0C2D3A' }} />
                <p style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>Loading traceability history...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Contract Summary (if available) */}
                {contract && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.06)' }}>
                      <p className="text-xs font-semibold uppercase mb-1" style={{ color: '#5A7684' }}>Farmer</p>
                      <p className="font-bold" style={{ color: '#0C2D3A' }}>{contract.farmer?.name || 'Unknown'}</p>
                      <p className="text-xs mt-1" style={{ color: '#5A7684' }}>{contract.farmer?.location_address || 'N/A'}</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.06)' }}>
                      <p className="text-xs font-semibold uppercase mb-1" style={{ color: '#5A7684' }}>Crop</p>
                      <p className="font-bold" style={{ color: '#0C2D3A' }}>{contract.crop_type} {contract.variety ? `(${contract.variety})` : ''}</p>
                      <p className="text-xs mt-1" style={{ color: '#5A7684' }}>{contract.required_quantity?.toLocaleString()} kg target</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.06)' }}>
                      <p className="text-xs font-semibold uppercase mb-1" style={{ color: '#5A7684' }}>Value</p>
                      <p className="font-bold" style={{ color: '#0C2D3A' }}>K{contract.total_value?.toLocaleString()}</p>
                      <p className="text-xs mt-1" style={{ color: '#5A7684' }}>{contract.status}</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.06)' }}>
                      <p className="text-xs font-semibold uppercase mb-1" style={{ color: '#5A7684' }}>Milestones</p>
                      <p className="font-bold" style={{ color: '#0C2D3A' }}>
                        {milestones.filter(m => m.status === 'verified').length}/{milestones.length} completed
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#5A7684' }}>
                        {milestones.filter(m => m.status === 'submitted').length} pending verification
                      </p>
                    </div>
                  </div>
                )}

                {/* Batch Selector (if multiple batches) */}
                {batches.length > 1 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: '#5A7684' }}>Batch:</span>
                    <button
                      onClick={() => setSelectedBatchId(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!selectedBatchId ? 'text-white' : ''}`}
                      style={{
                        background: !selectedBatchId ? '#0C2D3A' : 'rgba(12,45,58,0.06)',
                        color: !selectedBatchId ? '#BFFF00' : '#0C2D3A'
                      }}
                    >
                      All Batches
                    </button>
                    {batches.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBatchId(b.id || null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${selectedBatchId === b.id ? 'text-white' : ''}`}
                        style={{
                          background: selectedBatchId === b.id ? '#0C2D3A' : 'rgba(12,45,58,0.06)',
                          color: selectedBatchId === b.id ? '#BFFF00' : '#0C2D3A'
                        }}
                      >
                        {b.batch_code}
                      </button>
                    ))}
                  </div>
                )}

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 flex-wrap">
                  {([
                    { id: 'all' as FilterType, label: 'All Events', icon: FileText },
                    { id: 'farmer' as FilterType, label: 'Farmer', icon: Sprout },
                    { id: 'verifier' as FilterType, label: 'Verifier', icon: ShieldCheck },
                    { id: 'warehouse' as FilterType, label: 'Warehouse', icon: Factory },
                    { id: 'transport' as FilterType, label: 'Transport', icon: Truck },
                    { id: 'compliance' as FilterType, label: 'Compliance & QC', icon: AlertTriangle },
                  ]).map(tab => {
                    const Icon = tab.icon;
                    const count = tab.id === 'all' ? filteredEvents.length :
                      events.filter(e => {
                        if (!selectedBatchId || e.batch_id === selectedBatchId) {
                          if (tab.id === 'farmer') return e.actor_type === 'farmer' || !e.actor_type;
                          if (tab.id === 'verifier') return e.actor_type === 'verifier';
                          if (tab.id === 'warehouse') return e.actor_type === 'warehouse' || e.actor_type === 'processor';
                          if (tab.id === 'compliance') return e.event_type === 'quality_check' || e.event_type === 'verification' || e.event_type === 'ai_diagnostic';
                          if (tab.id === 'transport') return e.actor_type === 'transporter' || e.event_type?.includes('transport') || e.event_type === 'warehouse_arrival';
                        }
                        return false;
                      }).length;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: filter === tab.id ? '#0C2D3A' : 'transparent',
                          color: filter === tab.id ? '#BFFF00' : '#5A7684',
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tab.label}
                        <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px]" style={{
                          background: filter === tab.id ? 'rgba(191,255,0,0.2)' : 'rgba(12,45,58,0.06)',
                          color: filter === tab.id ? '#BFFF00' : '#5A7684'
                        }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Timeline */}
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-16">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No events found for this filter</p>
                    <p className="text-sm text-gray-400 mt-1">Try selecting a different filter or batch</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-0.5" style={{ background: 'rgba(12,45,58,0.08)' }} />

                    <div className="space-y-4">
                      {filteredEvents.map((event, index) => {
                        const Icon = getEventIcon(event.event_type);
                        const actorColor = getActorColor(event.actor_type);
                        const isExpanded = expandedEvent === event.id;
                        const hasPhotos = event.photos && event.photos.length > 0;
                        const hasAI = event.ai_disease || event.ai_health_score;
                        const hasStorage = event.storage_conditions;
                        const hasTransport = event.transport_mode || event.vehicle_registration;

                        return (
                          <motion.div
                            key={event.id || index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex gap-4"
                          >
                            {/* Timeline dot */}
                            <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm flex-shrink-0" style={{ background: actorColor.bg, borderColor: actorColor.border }}>
                              <Icon className="h-4 w-4" style={{ color: actorColor.text }} />
                            </div>

                            {/* Event Card */}
                            <div
                              className="flex-1 rounded-xl border transition-all cursor-pointer hover:shadow-md"
                              style={{ borderColor: actorColor.border, background: 'white' }}
                              onClick={() => setExpandedEvent(isExpanded ? null : (event.id || null))}
                            >
                              <div className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-bold text-sm" style={{ color: '#0C2D3A' }}>{event.event_title}</h4>
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{
                                        background: actorColor.bg, color: actorColor.text, border: `1px solid ${actorColor.border}`
                                      }}>
                                        {event.actor_type || 'farmer'}
                                      </span>
                                      {event.event_type === 'quality_check' && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                          COMPLIANCE
                                        </span>
                                      )}
                                      {hasAI && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                          AI ANALYSIS
                                        </span>
                                      )}
                                      {hasPhotos && (
                                        <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                                          <Camera className="h-3 w-3" /> {event.photos!.length}
                                        </span>
                                      )}
                                    </div>
                                    {event.event_description && (
                                      <p className="text-sm mt-1" style={{ color: '#5A7684' }}>
                                        {event.event_description.length > 120 && !isExpanded
                                          ? event.event_description.slice(0, 120) + '...'
                                          : event.event_description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: '#5A7684' }}>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {event.created_at ? new Date(event.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                      </span>
                                      {event.actor_name && (
                                        <span className="flex items-center gap-1">
                                          <User className="h-3 w-3" /> {event.actor_name}
                                        </span>
                                      )}
                                      {event.location_address && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" /> {event.location_address}
                                        </span>
                                      )}
                                      {event.quantity && (
                                        <span className="font-semibold">{event.quantity} {event.unit || 'kg'}</span>
                                      )}
                                    </div>
                                  </div>
                                  <button className="p-1 flex-shrink-0">
                                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                  </button>
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="mt-4 pt-4 border-t border-gray-100 space-y-3"
                                    >
                                      {/* Photos */}
                                      {hasPhotos && (
                                        <div>
                                          <p className="text-xs font-semibold mb-2" style={{ color: '#5A7684' }}>Evidence Photos</p>
                                          <div className="flex gap-2 flex-wrap">
                                            {event.photos!.map((photo, i) => (
                                              <a key={i} href={photo} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors">
                                                <img src={photo} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* AI Diagnostic */}
                                      {hasAI && (
                                        <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                                          <p className="text-xs font-bold text-purple-800 mb-1">AI Diagnostic Results</p>
                                          <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                              <p className="text-purple-600">Disease</p>
                                              <p className="font-semibold text-purple-900">{event.ai_disease || 'None detected'}</p>
                                            </div>
                                            <div>
                                              <p className="text-purple-600">Health Score</p>
                                              <p className="font-semibold text-purple-900">{event.ai_health_score ?? 'N/A'}%</p>
                                            </div>
                                            <div>
                                              <p className="text-purple-600">Confidence</p>
                                              <p className="font-semibold text-purple-900">{event.ai_confidence ?? 'N/A'}%</p>
                                            </div>
                                          </div>
                                          {event.ai_treatment_rec && (
                                            <p className="text-xs mt-2 text-purple-700"><strong>Treatment:</strong> {event.ai_treatment_rec}</p>
                                          )}
                                        </div>
                                      )}

                                      {/* Storage Conditions */}
                                      {hasStorage && (
                                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                                          <p className="text-xs font-bold text-blue-800 mb-1">Storage Conditions</p>
                                          <div className="grid grid-cols-3 gap-2 text-xs">
                                            {event.storage_conditions?.temperature !== undefined && (
                                              <div>
                                                <p className="text-blue-600">Temperature</p>
                                                <p className="font-semibold text-blue-900">{event.storage_conditions.temperature}°C</p>
                                              </div>
                                            )}
                                            {event.storage_conditions?.humidity !== undefined && (
                                              <div>
                                                <p className="text-blue-600">Humidity</p>
                                                <p className="font-semibold text-blue-900">{event.storage_conditions.humidity}%</p>
                                              </div>
                                            )}
                                            {event.storage_conditions?.ventilation && (
                                              <div>
                                                <p className="text-blue-600">Ventilation</p>
                                                <p className="font-semibold text-blue-900">{event.storage_conditions.ventilation}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Transport Details */}
                                      {hasTransport && (
                                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                                          <p className="text-xs font-bold text-amber-800 mb-1">Transport Details</p>
                                          <div className="grid grid-cols-2 gap-2 text-xs">
                                            {event.transport_mode && <div><p className="text-amber-600">Mode</p><p className="font-semibold text-amber-900 capitalize">{event.transport_mode}</p></div>}
                                            {event.vehicle_registration && <div><p className="text-amber-600">Vehicle</p><p className="font-semibold text-amber-900">{event.vehicle_registration}</p></div>}
                                            {event.driver_name && <div><p className="text-amber-600">Driver</p><p className="font-semibold text-amber-900">{event.driver_name}</p></div>}
                                            {event.origin_location && <div><p className="text-amber-600">Origin</p><p className="font-semibold text-amber-900">{event.origin_location}</p></div>}
                                            {event.destination_location && <div><p className="text-amber-600">Destination</p><p className="font-semibold text-amber-900">{event.destination_location}</p></div>}
                                          </div>
                                        </div>
                                      )}

                                      {/* Quality / Compliance */}
                                      {event.quality_grade && (
                                        <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                                          <p className="text-xs font-bold text-green-800 mb-1">Quality Assessment</p>
                                          <p className="text-sm font-semibold text-green-900">Grade: {event.quality_grade}</p>
                                        </div>
                                      )}

                                      {/* Blockchain TX */}
                                      {event.blockchain_tx && (
                                        <a
                                          href={`https://basescan.org/tx/${event.blockchain_tx}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-xs font-mono text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg w-fit"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          On-chain: {event.blockchain_tx.slice(0, 14)}...
                                        </a>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Milestone Payment Summary */}
                {milestones.length > 0 && (
                  <div className="mt-6 p-5 rounded-xl" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.06)' }}>
                    <h3 className="text-sm font-bold mb-3" style={{ color: '#0C2D3A' }}>Milestone Payment Summary</h3>
                    <div className="space-y-2">
                      {milestones.map(m => (
                        <div key={m.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{
                              background: m.status === 'verified' ? '#0C2D3A' : m.status === 'submitted' ? '#BFFF00' : '#E6E2D6'
                            }} />
                            <span style={{ color: '#0C2D3A' }}>{m.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold" style={{ color: '#0C2D3A' }}>K{m.payment_amount?.toLocaleString()}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase" style={{
                              background: m.status === 'verified' ? 'rgba(191,255,0,0.15)' : 'rgba(12,45,58,0.06)',
                              color: '#0C2D3A'
                            }}>
                              {m.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 flex justify-end" style={{ background: '#F7F9FB' }}>
            <button
              onClick={onCloseAction}
              className="px-6 py-2 rounded-xl transition-colors" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, background: '#0C2D3A', color: '#BFFF00' }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
