"use client";

import { useEffect, useState } from "react";
import { MapPin, X, Check, Crosshair, Search, Map as MapIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface LocationPickerModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
    onSelectAction: (data: { lat: number; lng: number; address: string }) => void;
    initialLat?: number;
    initialLng?: number;
    initialAddress?: string;
}

export default function LocationPickerModal({
    isOpen,
    onCloseAction,
    onSelectAction,
    initialLat,
    initialLng,
    initialAddress
}: LocationPickerModalProps) {
    const [isClient, setIsClient] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [position, setPosition] = useState<[number, number]>(
        initialLat && initialLng ? [initialLat, initialLng] : [-15.3875, 28.3228] // Default to Lusaka
    );
    const [address, setAddress] = useState(initialAddress || "");
    const [isLocating, setIsLocating] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [MapComponents, setMapComponents] = useState<any>(null);

    useEffect(() => {
        setIsClient(true);
        if (isOpen) {
            loadMapDependencies();
        }
    }, [isOpen]);

    const loadMapDependencies = async () => {
        if (typeof window === 'undefined') return;

        try {
            const L = await import('leaflet');
            const { MapContainer, TileLayer, Marker, useMapEvents } = await import('react-leaflet');

            // Fix marker icon issue
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            // Events component to update marker and get address
            const MapEvents = () => {
                useMapEvents({
                    click(e) {
                        handleMoveMarker(e.latlng.lat, e.latlng.lng);
                    },
                });
                return null;
            };

            setMapComponents({ MapContainer, TileLayer, Marker, MapEvents });
            setMapLoaded(true);
        } catch (error) {
            console.error("Failed to load map dependencies:", error);
            toast.error("Failed to load map library");
        }
    };

    const handleMoveMarker = async (lat: number, lng: number) => {
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
    };

    const reverseGeocode = async (lat: number, lng: number) => {
        setIsGeocoding(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await response.json();
            if (data && data.display_name) {
                setAddress(data.display_name);
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsGeocoding(false);
        }
    };

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                handleMoveMarker(latitude, longitude);
                setIsLocating(false);
                toast.success("Location found!");
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast.error("Could not get your precise location. Please check permissions.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleConfirm = () => {
        onSelectAction({
            lat: position[0],
            lng: position[1],
            address: address
        });
        onCloseAction();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-xl text-green-600">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Set Farm Location</h3>
                                <p className="text-sm text-gray-500">Drag the marker or click to pinpoint your farm</p>
                            </div>
                        </div>
                        <button
                            onClick={onCloseAction}
                            className="p-2 hover:bg-white/50 rounded-full transition-colors"
                        >
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Map Area */}
                    <div className="relative flex-1 min-h-[400px] bg-gray-100">
                        {!mapLoaded ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium">Loading Map...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full">
                                <link
                                    rel="stylesheet"
                                    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                                    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                                    crossOrigin=""
                                />
                                <MapComponents.MapContainer
                                    center={position}
                                    zoom={13}
                                    style={{ height: "100%", width: "100%" }}
                                >
                                    <MapComponents.TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <MapComponents.Marker
                                        position={position}
                                        draggable={true}
                                        eventHandlers={{
                                            dragend: (e: any) => {
                                                const marker = e.target;
                                                const pos = marker.getLatLng();
                                                handleMoveMarker(pos.lat, pos.lng);
                                            },
                                        }}
                                    />
                                    <MapComponents.MapEvents />
                                </MapComponents.MapContainer>

                                {/* Map Overlays */}
                                <div className="absolute top-4 right-4 z-[1001] flex flex-col gap-2">
                                    <button
                                        onClick={useMyLocation}
                                        disabled={isLocating}
                                        className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition-all font-semibold text-gray-700 disabled:opacity-50"
                                    >
                                        {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                                        {isLocating ? "Finding you..." : "My Current Location"}
                                    </button>
                                </div>

                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001] w-full max-w-lg px-4">
                                    <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-4 border border-white">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                                                <MapIcon className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Selected Location</p>
                                                <p className="text-sm text-gray-900 font-medium truncate">
                                                    {isGeocoding ? "Finding address..." : address || "Click on map to pick location"}
                                                </p>
                                                <p className="text-[10px] text-gray-500 mt-1 font-mono">
                                                    {position[0].toFixed(6)}, {position[1].toFixed(6)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Accuracy: <span className="text-green-600 font-bold">High Precision enabled</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onCloseAction}
                                className="px-6 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-all border border-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!address || isGeocoding}
                                className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:shadow-xl hover:from-emerald-700 hover:to-green-700 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <Check className="h-5 w-5" />
                                Confirm Location
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
