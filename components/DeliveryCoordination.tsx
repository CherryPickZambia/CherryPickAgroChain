"use client";

import { useState } from "react";
import { Truck, MapPin, Clock, Package, CheckCircle, AlertCircle, Phone, Navigation } from "lucide-react";
import toast from "react-hot-toast";

interface Delivery {
  id: string;
  orderId: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  cropType: string;
  quantity: number;
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  deliveryDate: string;
  status: "scheduled" | "in_transit" | "delivered" | "cancelled";
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  trackingUpdates: TrackingUpdate[];
}

interface TrackingUpdate {
  timestamp: string;
  status: string;
  location: string;
  notes: string;
}

export default function DeliveryCoordination() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([
    {
      id: "del1",
      orderId: "order123",
      farmerId: "farmer1",
      farmerName: "John Mwale",
      buyerId: "buyer1",
      buyerName: "Cherry-Pick Ltd",
      cropType: "Mangoes",
      quantity: 500,
      pickupLocation: "Lusaka Farm, Plot 123",
      deliveryLocation: "Cherry-Pick Warehouse, Industrial Area",
      pickupDate: "2024-11-15",
      deliveryDate: "2024-11-15",
      status: "in_transit",
      driverId: "driver1",
      driverName: "Peter Phiri",
      driverPhone: "+260 977 123 456",
      vehicleNumber: "BAZ 1234",
      trackingUpdates: [
        {
          timestamp: "2024-11-15T08:00:00",
          status: "Picked Up",
          location: "Lusaka Farm",
          notes: "Cargo loaded and secured"
        },
        {
          timestamp: "2024-11-15T10:30:00",
          status: "In Transit",
          location: "Great East Road",
          notes: "On schedule"
        }
      ]
    },
    {
      id: "del2",
      orderId: "order124",
      farmerId: "farmer2",
      farmerName: "Mary Banda",
      buyerId: "buyer2",
      buyerName: "Fresh Foods Ltd",
      cropType: "Tomatoes",
      quantity: 1000,
      pickupLocation: "Kabwe Farm, Mulungushi",
      deliveryLocation: "Fresh Foods Depot, Ndola",
      pickupDate: "2024-11-16",
      deliveryDate: "2024-11-16",
      status: "scheduled",
      trackingUpdates: []
    }
  ]);

  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "badge-warning";
      case "in_transit":
        return "badge-info";
      case "delivered":
        return "badge-success";
      case "cancelled":
        return "badge-error";
      default:
        return "badge-default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-5 w-5" />;
      case "in_transit":
        return <Truck className="h-5 w-5" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5" />;
      case "cancelled":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const handleScheduleDelivery = () => {
    toast.success("Delivery scheduled successfully!");
  };

  const handleTrackDelivery = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Delivery Coordination</h1>
        <p className="text-gray-600">Track and manage deliveries in real-time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card-premium">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Scheduled</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">
                {deliveries.filter(d => d.status === "scheduled").length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-xl">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card-premium">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">In Transit</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">
                {deliveries.filter(d => d.status === "in_transit").length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card-premium">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Delivered</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">
                {deliveries.filter(d => d.status === "delivered").length}
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-xl">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="card-premium">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Distance</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">245 km</p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-xl">
              <Navigation className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1a1a1a]">Active Deliveries</h2>
          <button onClick={handleScheduleDelivery} className="btn-primary">
            Schedule New Delivery
          </button>
        </div>

        {deliveries.map((delivery) => (
          <div key={delivery.id} className="card-premium hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-[#1a1a1a]">
                    {delivery.cropType} - {delivery.quantity} kg
                  </h3>
                  <span className={`badge ${getStatusColor(delivery.status)}`}>
                    {delivery.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Order ID: {delivery.orderId}</p>
              </div>
              <div className="text-right">
                {getStatusIcon(delivery.status)}
              </div>
            </div>

            {/* Route Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                <MapPin className="h-5 w-5 text-emerald-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Pickup</p>
                  <p className="text-sm text-gray-900 font-semibold">{delivery.pickupLocation}</p>
                  <p className="text-xs text-gray-600">{delivery.farmerName}</p>
                  <p className="text-xs text-gray-600">{new Date(delivery.pickupDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Delivery</p>
                  <p className="text-sm text-gray-900 font-semibold">{delivery.deliveryLocation}</p>
                  <p className="text-xs text-gray-600">{delivery.buyerName}</p>
                  <p className="text-xs text-gray-600">{new Date(delivery.deliveryDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Driver Info */}
            {delivery.driverId && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Truck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{delivery.driverName}</p>
                    <p className="text-xs text-gray-600">{delivery.vehicleNumber}</p>
                  </div>
                </div>
                <a
                  href={`tel:${delivery.driverPhone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-medium">Call Driver</span>
                </a>
              </div>
            )}

            {/* Tracking Updates */}
            {delivery.trackingUpdates.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Tracking Updates</h4>
                <div className="space-y-3">
                  {delivery.trackingUpdates.map((update, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{update.status}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(update.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600">{update.location}</p>
                        <p className="text-xs text-gray-500">{update.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleTrackDelivery(delivery)}
                className="flex-1 btn-primary"
              >
                Track on Map
              </button>
              {delivery.status === "scheduled" && (
                <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold">
                  Reschedule
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Map Modal (Placeholder) */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1a1a1a]">Live Tracking</h3>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Navigation className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Map integration coming soon</p>
                <p className="text-sm text-gray-500 mt-2">
                  Integrate with Google Maps or Mapbox for live tracking
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
