"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  QrCode, MapPin, Truck, Warehouse, Package, Store, 
  Leaf, CheckCircle, Clock, User, Camera, ThermometerSun,
  Droplets, Award, ExternalLink, ChevronDown, ChevronUp,
  Sprout, Factory, ShoppingBag
} from "lucide-react";
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

  return (
    <div className={`${isPublic ? 'min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50' : ''}`}>
      <div className={`${isPublic ? 'max-w-4xl mx-auto px-4 py-8' : ''}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-t-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sprout className="w-6 h-6" />
                <span className="text-green-200 text-sm font-medium">Cherry Pick Traceability</span>
              </div>
              <h1 className="text-2xl font-bold mb-1">{batch.crop_type}</h1>
              {batch.variety && (
                <p className="text-green-100">Variety: {batch.variety}</p>
              )}
              <p className="text-green-200 text-sm mt-2 font-mono">{batch.batch_code}</p>
            </div>
            <div className="text-right">
              <button
                onClick={() => setShowQR(!showQR)}
                className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
              >
                <QrCode className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Status Badge */}
          {batch.current_status && (
            <div className="mt-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                STATUS_LABELS[batch.current_status]?.color || 'bg-gray-100 text-gray-800'
              }`}>
                {STATUS_LABELS[batch.current_status]?.label || batch.current_status}
              </span>
            </div>
          )}
        </div>

        {/* QR Code Modal */}
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-x border-gray-200 p-6"
          >
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-green-100">
                <QRCodeSVG
                  value={publicUrl}
                  size={200}
                  level="H"
                  includeMargin
                  imageSettings={{
                    src: "/logo.png",
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Scan to view traceability on any device
              </p>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
              >
                {publicUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        )}

        {/* Batch Info */}
        <div className="bg-white border-x border-gray-200 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Product Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Product Details
              </h3>
              <div className="space-y-2 text-sm">
                {batch.total_quantity && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantity:</span>
                    <span className="font-semibold">{batch.total_quantity} {batch.unit || 'kg'}</span>
                  </div>
                )}
                {batch.quality_grade && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quality Grade:</span>
                    <span className="font-semibold">{batch.quality_grade}</span>
                  </div>
                )}
                {batch.harvest_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Harvest Date:</span>
                    <span className="font-semibold">{new Date(batch.harvest_date).toLocaleDateString()}</span>
                  </div>
                )}
                {batch.organic_certified && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Certification:</span>
                    <span className="font-semibold text-green-600">🌿 Organic</span>
                  </div>
                )}
              </div>
            </div>

            {/* Farmer Info */}
            {farmer && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Farmer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-semibold flex items-center gap-1">
                      {farmer.name}
                      {farmer.verified && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </span>
                  </div>
                  {farmer.location_address && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-semibold">{farmer.location_address}</span>
                    </div>
                  )}
                  {farmer.farm_size && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Farm Size:</span>
                      <span className="font-semibold">{farmer.farm_size} hectares</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current Location */}
          {batch.current_location && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-2 text-blue-800">
                <MapPin className="w-5 h-5" />
                <span className="font-semibold">Current Location:</span>
                <span>{batch.current_location}</span>
              </div>
            </div>
          )}
        </div>

        {/* Journey Timeline */}
        <div className="bg-white border-x border-b border-gray-200 rounded-b-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Journey Timeline
            <span className="text-sm font-normal text-gray-500">({events.length} events)</span>
          </h3>

          {events.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Leaf className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No events recorded yet</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Events */}
              <div className="space-y-6">
                {events.map((event, index) => {
                  const Icon = EVENT_ICONS[event.event_type] || Leaf;
                  const bgColor = EVENT_COLORS[event.event_type] || 'bg-gray-500';
                  const isExpanded = expandedEvent === event.id;

                  return (
                    <motion.div
                      key={event.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative pl-16"
                    >
                      {/* Icon */}
                      <div className={`absolute left-3 w-7 h-7 rounded-full ${bgColor} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>

                      {/* Content */}
                      <div 
                        className={`bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors ${
                          isExpanded ? 'ring-2 ring-green-500' : ''
                        }`}
                        onClick={() => setExpandedEvent(isExpanded ? null : event.id || null)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{event.event_title}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {event.created_at && formatDate(event.created_at)}
                            </p>
                          </div>
                          <button className="text-gray-400">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-4 border-t border-gray-200 space-y-3"
                          >
                            {event.event_description && (
                              <p className="text-gray-700">{event.event_description}</p>
                            )}

                            {event.actor_name && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">By: {event.actor_name}</span>
                                {event.actor_type && (
                                  <span className="px-2 py-0.5 bg-gray-200 rounded text-xs capitalize">
                                    {event.actor_type}
                                  </span>
                                )}
                              </div>
                            )}

                            {event.location_address && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{event.location_address}</span>
                              </div>
                            )}

                            {event.transport_mode && (
                              <div className="flex items-center gap-2 text-sm">
                                <Truck className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600 capitalize">
                                  {event.transport_mode}
                                  {event.vehicle_registration && ` - ${event.vehicle_registration}`}
                                </span>
                              </div>
                            )}

                            {event.storage_facility && (
                              <div className="flex items-center gap-2 text-sm">
                                <Warehouse className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{event.storage_facility}</span>
                              </div>
                            )}

                            {event.quality_grade && (
                              <div className="flex items-center gap-2 text-sm">
                                <Award className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Grade: {event.quality_grade}</span>
                              </div>
                            )}

                            {event.photos && event.photos.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {event.photos.slice(0, 4).map((photo, i) => (
                                  <img
                                    key={i}
                                    src={photo}
                                    alt={`Evidence ${i + 1}`}
                                    className="w-16 h-16 object-cover rounded-lg"
                                  />
                                ))}
                              </div>
                            )}

                            {event.blockchain_tx && (
                              <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-gray-500 truncate">
                                TX: {event.blockchain_tx}
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
        </div>

        {/* Footer for Public View */}
        {isPublic && (
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Powered by <span className="font-semibold text-green-600">Cherry Pick AgroChain360</span>
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Blockchain-verified farm-to-shelf traceability
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
