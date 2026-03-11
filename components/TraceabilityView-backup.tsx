"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  QrCode, MapPin, Truck, Warehouse, Package, Store,
  Leaf, CheckCircle, Clock, User, Camera, ThermometerSun,
  Droplets, Award, ExternalLink, ChevronDown, ChevronUp,
  Sprout, Factory, ShoppingBag, X, Info
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { TraceabilityEvent, Batch } from "@/lib/traceabilityService";

interface TraceabilityViewProps {
  batch: Batch;
  events: TraceabilityEvent[];
  farmer?: {
    name: string;
    location_address?: string;
    farm_size?: number;
    verified?: boolean;
  };
  contract?: {
    contract_code: string;
    crop_type: string;
    variety?: string;
    status: string;
  };
  isPublic?: boolean;
}

const EVENT_ICONS: Record<string, any> = {
  planting: Sprout,
  growth_update: Leaf,
  input_application: Droplets,
  irrigation: Droplets,
  pest_control: Leaf,
  harvest: CheckCircle,
  post_harvest_handling: Package,
  quality_check: Award,
  storage: Warehouse,
  aggregation: Package,
  transport_start: Truck,
  transport_checkpoint: MapPin,
  warehouse_arrival: Warehouse,
  processing: Factory,
  packaging: Package,
  distribution: Truck,
  retail_arrival: Store,
  verification: CheckCircle,
  ai_diagnostic: ThermometerSun,
};

const EVENT_COLORS: Record<string, string> = {
  planting: 'bg-green-500',
  growth_update: 'bg-emerald-500',
  input_application: 'bg-blue-500',
  irrigation: 'bg-cyan-500',
  pest_control: 'bg-orange-500',
  harvest: 'bg-yellow-500',
  post_harvest_handling: 'bg-amber-500',
  quality_check: 'bg-purple-500',
  storage: 'bg-indigo-500',
  aggregation: 'bg-violet-500',
  transport_start: 'bg-blue-600',
  transport_checkpoint: 'bg-blue-400',
  warehouse_arrival: 'bg-indigo-600',
  processing: 'bg-gray-600',
  packaging: 'bg-pink-500',
  distribution: 'bg-teal-500',
  retail_arrival: 'bg-rose-500',
  verification: 'bg-green-600',
  ai_diagnostic: 'bg-purple-600',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  growing: { label: 'Growing', color: 'bg-green-100 text-green-800' },
  harvested: { label: 'Harvested', color: 'bg-yellow-100 text-yellow-800' },
  stored: { label: 'In Storage', color: 'bg-blue-100 text-blue-800' },
  in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-800' },
  at_warehouse: { label: 'At Warehouse', color: 'bg-indigo-100 text-indigo-800' },
  processing: { label: 'Processing', color: 'bg-orange-100 text-orange-800' },
  packaged: { label: 'Packaged', color: 'bg-pink-100 text-pink-800' },
  distributed: { label: 'Distributed', color: 'bg-teal-100 text-teal-800' },
  at_retail: { label: 'At Retail', color: 'bg-rose-100 text-rose-800' },
  sold: { label: 'Sold', color: 'bg-gray-100 text-gray-800' },
};

export default function TraceabilityView({
  batch,
  events,
  farmer,
  contract,
  isPublic = false
}: TraceabilityViewProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showJourneyModal, setShowJourneyModal] = useState(false);

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/trace/${batch.batch_code}`
    : `/trace/${batch.batch_code}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  let metadata: any = {};
  try {
    if (batch.ipfs_metadata) {
      metadata = JSON.parse(batch.ipfs_metadata);
    }
  } catch (e) {
    console.error("Error parsing metadata", e);
  }

  return (
    <>
      <div className={`${isPublic ? 'min-h-screen bg-[#fafcfb] text-[#1a1a1a] font-sans' : ''}`}>
        <div className={`${isPublic ? 'max-w-3xl mx-auto px-4 py-12' : ''}`}>

          {/* Premium Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden shadow-2xl mb-8 group"
          >
            <div className="absolute inset-0 z-0">
              <img
                src={metadata.batch_image || `https://images.unsplash.com/photo-1615485290382-441e4d0c9cb5?auto=format&fit=crop&w=800&q=80`}
                alt={batch.crop_type}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d2a1a] via-[#0d2a1a]/60 to-transparent" />
            </div>

            <div className="relative z-10 p-8 md:p-12 flex flex-col justify-end min-h-[400px]">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg">
                  <Sprout className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-white/80 text-xs font-bold uppercase tracking-[0.2em]">Verified Journey</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight leading-none">
                {batch.crop_type}
              </h1>

              <div className="flex flex-wrap items-center gap-4">
                {batch.variety && (
                  <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl">
                    <span className="text-white/90 text-sm font-medium">{batch.variety}</span>
                  </div>
                )}
                <div className="px-4 py-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl font-mono text-xs text-white/70">
                  {batch.batch_code}
                </div>
              </div>

              {/* Floating Status Badge */}
              <div className="absolute top-8 right-8">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl border border-white/20 backdrop-blur-xl ${STATUS_LABELS[batch.current_status || 'growing']?.color || 'bg-white/20 text-white'
                    }`}
                >
                  {STATUS_LABELS[batch.current_status || 'growing']?.label || batch.current_status}
                </motion.div>
              </div>

              <button
                onClick={() => setShowQR(!showQR)}
                className="absolute top-8 left-8 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl transition-all border border-white/10 group/qr"
              >
                <QrCode className="w-6 h-6 text-white transition-transform group-hover/qr:scale-110" />
              </button>
            </div>
          </motion.div>

          {/* Farmer Profile Section - Wide Layout */}
          {farmer && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-[#0d2a1a] to-[#1a4d2e] rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl mb-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <MapPin className="w-32 h-32" />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                    <User className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-400 fill-green-400/20" />
                      <span className="text-[10px] font-black text-green-300 uppercase tracking-widest">Verified Producer</span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">{farmer.name}</h3>
                    <p className="text-xs font-medium text-white/50 flex items-center gap-1.5 mt-1">
                      {farmer.location_address || 'Zambia'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="px-5 py-2.5 bg-white/10 rounded-2xl border border-white/10 text-[10px] font-black text-white/80 uppercase tracking-widest backdrop-blur-sm">
                    Identity Verified
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

            {/* Main Content Column */}
            <div className="md:col-span-8 space-y-8">

              {/* Journey Timeline */}
              <section className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-50 rounded-2xl">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 leading-tight">Journey Timeline</h2>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{events.length} Verified Milestones</p>
                    </div>
                  </div>
                </div>

                {events.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                    <Sprout className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-medium">Tracking is just beginning...</p>
                  </div>
                ) : (
                  <div className="relative pl-4">
                    {/* Modern Timeline Line */}
                    <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-green-500 via-emerald-400 to-gray-100" />

                    <div className="space-y-10">
                      {events.map((event, index) => {
                        const Icon = EVENT_ICONS[event.event_type] || Leaf;
                        const bgColor = EVENT_COLORS[event.event_type] || 'bg-gray-500';
                        const isExpanded = expandedEvent === event.id;

                        return (
                          <motion.div
                            key={event.id || index}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative pl-12"
                          >
                            {/* Node */}
                            <div className={`absolute left-4 w-5 h-5 rounded-full ${bgColor} ring-4 ring-white shadow-md z-10`} />

                            <div
                              className={`group bg-[#fcfdfe] hover:bg-white rounded-3xl p-6 transition-all duration-300 border border-transparent hover:border-gray-100 hover:shadow-xl cursor-pointer ${isExpanded ? 'bg-white border-gray-100 shadow-xl' : ''
                                }`}
                              onClick={() => {
                                setExpandedEvent(isExpanded ? null : event.id || null);
                                setShowJourneyModal(true);
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-2xl ${bgColor.replace('bg-', 'bg-opacity-10 text-')} text-white`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="font-black text-gray-900 tracking-tight group-hover:text-green-700 transition-colors">
                                      {event.event_title}
                                    </h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                      {event.created_at && formatDate(event.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className={`p-2 rounded-full transform transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>

                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-6 pt-6 border-t border-gray-50 space-y-4"
                                >
                                  {event.event_description && (
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                      {event.event_description}
                                    </p>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {event.actor_name && (
                                      <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        <User className="w-4 h-4 text-green-500" />
                                        <span>{event.actor_name} • {event.actor_type}</span>
                                      </div>
                                    )}

                                    {event.location_address && (
                                      <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        <MapPin className="w-4 h-4 text-blue-500" />
                                        <span className="truncate">{event.location_address}</span>
                                      </div>
                                    )}
                                  </div>

                                  {event.photos && event.photos.length > 0 && (
                                    <div className="flex flex-wrap gap-3 mt-4">
                                      {event.photos.map((photo, i) => (
                                        <img
                                          key={i}
                                          src={photo}
                                          alt="Evidence"
                                          className="w-20 h-20 object-cover rounded-2xl shadow-sm border border-white ring-2 ring-gray-100"
                                        />
                                      ))}
                                    </div>
                                  )}

                                  {event.blockchain_tx && (
                                    <div className="mt-4 p-4 bg-black/[0.02] rounded-2xl border border-gray-100">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">On-Chain Proof</span>
                                        <a
                                          href={`https://basescan.org/tx/${event.blockchain_tx}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[9px] font-black text-green-600 hover:text-green-700 uppercase tracking-widest flex items-center gap-1"
                                        >
                                          VERIFY <ExternalLink className="w-2 h-2" />
                                        </a>
                                      </div>
                                      <p className="text-[10px] font-mono text-gray-400 mt-2 truncate">{event.blockchain_tx}</p>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar Column */}
            <div className="md:col-span-4 space-y-8">

              {/* Product Quick Specs */}
              <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600" />
                  Quick Specs
                </h3>

                <div className="space-y-4">
                  {[
                    { label: 'Est. Yield', value: batch.total_quantity, unit: batch.unit || 'kg', icon: Award },
                    { label: 'Grade', value: batch.quality_grade, icon: CheckCircle },
                    { label: 'Field Size', value: metadata.field_size, icon: MapPin },
                    { label: 'Organic', value: batch.organic_certified ? 'Certified' : 'No', icon: Leaf },
                  ].map((spec, i) => spec.value && (
                    <div key={i} className="flex flex-col gap-1 p-4 bg-[#f8fafc] rounded-2xl border border-white shadow-sm">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{spec.label}</span>
                      <span className="text-sm font-black text-gray-800 flex items-center gap-2">
                        {spec.value} {spec.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Blockchain Banner - Wide Layout */}
          {batch.blockchain_tx && (
            <motion.a
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              viewport={{ once: true }}
              href={`https://basescan.org/tx/${batch.blockchain_tx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-8 bg-gradient-to-r from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <ExternalLink className="w-48 h-48" />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="max-w-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                      <CheckCircle className="w-5 h-5 text-indigo-200" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-100">Immutable Network Proof</h3>
                  </div>
                  <h4 className="text-3xl font-black mb-4 tracking-tight">Verified on Base L2</h4>
                  <p className="text-indigo-100/80 font-medium leading-relaxed">
                    This product's entire journey is secured by the Base network. Every milestone is timestamped and cryptographically signed, ensuring total transparency from farm to shelf.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="py-4 px-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
                    <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">Blockchain Hash</p>
                    <p className="text-xs font-mono text-white/70 truncate max-w-[200px]">{batch.blockchain_tx}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white text-indigo-700 px-6 py-4 rounded-2xl shadow-lg border border-white hover:bg-indigo-50 transition-colors self-start md:self-end">
                    View On Explorer <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.a>
          )}

          {/* Brand Footer */}
          {isPublic && (
            <footer className="mt-20 text-center pb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <Sprout className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-black text-gray-900 tracking-tight">Cherry Pick</span>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Farm-To-Shelf Traceability Protocol</p>
              <div className="mt-8 flex justify-center gap-6 opacity-40 grayscale pointer-events-none">
                <img src="/logo.png" alt="Base" className="h-4 object-contain" />
                <img src="/logo.png" alt="CDP" className="h-4 object-contain" />
                <img src="/logo.png" alt="IPFS" className="h-4 object-contain" />
              </div>
            </footer>
          )}
        </div>
      </div>

      {/* Journey Storytelling Modal */}
      <AnimatePresence>
        {showJourneyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#0d2a1a]/95 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20"
            >
              {/* Modal Header */}
              <div className="p-8 md:p-10 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-100">
                    <Sprout className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">The Journey Story</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Growth Cycle to Warehouse</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowJourneyModal(false)}
                  className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-900 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content - Scrollable Storyline */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide">
                <div className="relative pl-8">
                  {/* Visual Connector Line */}
                  <div className="absolute left-10 top-2 bottom-2 w-1 bg-gradient-to-b from-green-600 via-emerald-400 to-indigo-600 rounded-full opacity-20" />

                  <div className="space-y-16">
                    {events.map((event, index) => {
                      const Icon = EVENT_ICONS[event.event_type] || Leaf;
                      const isLast = index === events.length - 1;
                      const isFirst = index === 0;

                      return (
                        <motion.div
                          key={event.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative pl-16 group"
                        >
                          {/* Milestone Circle */}
                          <div className={`absolute left-0 top-0 w-20 h-20 -ml-1 flex flex-col items-center justify-center`}>
                            <div className={`w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center z-10 
                            ${event.actor_type === 'farmer' ? 'bg-green-600' : 'bg-indigo-600'} 
                            border-4 border-white transform transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            {isFirst && <div className="mt-2 text-[8px] font-black text-green-600 uppercase tracking-[0.2em]">Start</div>}
                            {isLast && <div className="mt-2 text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em]">Current</div>}
                          </div>

                          {/* Story Card */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">
                                {event.created_at && new Date(event.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                              <div className="h-px flex-1 bg-gray-100" />
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none group-hover:text-green-700 transition-colors">
                              {event.event_title}
                            </h3>

                            <p className="text-gray-600 font-medium leading-relaxed max-w-xl">
                              {event.event_description || `Successful milestone completed by ${event.actor_name || 'verified partner'}.`}
                            </p>

                            {/* Detail Grid */}
                            <div className="flex flex-wrap gap-4 pt-2">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase">{event.actor_name || event.actor_type}</span>
                              </div>
                              {event.location_address && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-[10px] font-bold text-gray-500 uppercase truncate max-w-[150px]">{event.location_address}</span>
                                </div>
                              )}
                            </div>

                            {/* Event Photos */}
                            {event.photos && event.photos.length > 0 && (
                              <div className="flex gap-3 pt-3">
                                {event.photos.slice(0, 3).map((photo, i) => (
                                  <div key={i} className="relative group/photo">
                                    <img
                                      src={photo}
                                      alt="Journey Evidence"
                                      className="w-24 h-24 object-cover rounded-2xl shadow-sm border border-white ring-2 ring-gray-100 group-hover/photo:scale-105 transition-transform"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <Info className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-[11px] font-bold text-gray-500 leading-tight">
                    This story is cryptographically verified. Each milestone represents a physical verification on the ground.
                  </p>
                </div>
                <button
                  onClick={() => setShowJourneyModal(false)}
                  className="px-8 py-4 bg-[#0d2a1a] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1a4d2e] transition-all shadow-xl shadow-green-100"
                >
                  Close Story
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
