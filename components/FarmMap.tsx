"use client";

import { useEffect, useState } from "react";
import { MapPin, Leaf, User, Phone, TrendingUp } from "lucide-react";

// Real Zambian farm locations for testing
export const SAMPLE_FARMS = [
  {
    id: "farm-1",
    name: "Mkushi Farm Block",
    farmer: "John Mwale",
    phone: "+260 97 123 4567",
    location: "Mkushi, Central Province",
    lat: -13.6167,
    lng: 29.4000,
    crops: ["Maize", "Soybeans", "Wheat"],
    hectares: 150,
    status: "active" as const,
    color: "#22c55e",
  },
  {
    id: "farm-2", 
    name: "Chisamba Agricultural Estate",
    farmer: "Mary Banda",
    phone: "+260 96 234 5678",
    location: "Chisamba, Central Province",
    lat: -14.9833,
    lng: 28.0667,
    crops: ["Tomatoes", "Onions", "Cabbage"],
    hectares: 85,
    status: "active" as const,
    color: "#eab308",
  },
  {
    id: "farm-3",
    name: "Mazabuka Sugar Plantation",
    farmer: "Peter Phiri",
    phone: "+260 95 345 6789",
    location: "Mazabuka, Southern Province",
    lat: -15.8667,
    lng: 27.7500,
    crops: ["Sugarcane", "Mangoes"],
    hectares: 320,
    status: "active" as const,
    color: "#ef4444",
  },
  {
    id: "farm-4",
    name: "Mpongwe Wheat Farm",
    farmer: "Grace Tembo",
    phone: "+260 97 456 7890",
    location: "Mpongwe, Copperbelt Province",
    lat: -13.5167,
    lng: 28.1500,
    crops: ["Wheat", "Barley", "Sunflower"],
    hectares: 200,
    status: "pending" as const,
    color: "#f97316",
  },
  {
    id: "farm-5",
    name: "Chipata Groundnut Cooperative",
    farmer: "David Zulu",
    phone: "+260 96 567 8901",
    location: "Chipata, Eastern Province",
    lat: -13.6333,
    lng: 32.6500,
    crops: ["Groundnuts", "Cotton", "Sunflower"],
    hectares: 175,
    status: "active" as const,
    color: "#8b5cf6",
  },
];

export type Farm = typeof SAMPLE_FARMS[0];

interface FarmMapProps {
  farms?: Farm[];
  onFarmClick?: (farm: Farm) => void;
  selectedFarmId?: string;
}

export default function FarmMap({ farms = SAMPLE_FARMS, onFarmClick, selectedFarmId }: FarmMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [MapComponent, setMapComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import Leaflet components
    const loadMap = async () => {
      if (typeof window !== 'undefined') {
        const L = await import('leaflet');
        const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');
        
        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        
        // Create a wrapper component
        const MapWrapper = ({ farms, onFarmSelect }: { farms: Farm[], onFarmSelect: (farm: Farm) => void }) => (
          <MapContainer
            center={[-14.5, 28.5]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            className="rounded-xl"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {farms.map((farm) => (
              <Marker
                key={farm.id}
                position={[farm.lat, farm.lng]}
                eventHandlers={{
                  click: () => onFarmSelect(farm),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[180px]">
                    <h3 className="font-bold text-gray-900 text-sm">{farm.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">{farm.location}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Farmer:</span> {farm.farmer}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Crops:</span> {farm.crops.join(", ")}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Size:</span> {farm.hectares} ha
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        );
        
        setMapComponent(() => MapWrapper);
      }
    };
    
    loadMap();
  }, []);

  const handleFarmSelect = (farm: Farm) => {
    setSelectedFarm(farm);
    onFarmClick?.(farm);
  };

  if (!isClient || !MapComponent) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      
      {/* Map */}
      <div className="absolute inset-0">
        <MapComponent farms={farms} onFarmSelect={handleFarmSelect} />
      </div>

      {/* Farm Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 z-[1000]">
        <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Farm Locations
        </h4>
        <div className="space-y-1">
          {farms.map((farm) => (
            <button
              key={farm.id}
              onClick={() => handleFarmSelect(farm)}
              className={`flex items-center gap-2 text-xs w-full text-left px-2 py-1 rounded-lg transition-colors ${
                selectedFarmId === farm.id || selectedFarm?.id === farm.id
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: farm.color }}
              />
              <span className="truncate">{farm.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Badge */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 z-[1000]">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">{farms.length}</div>
          <div className="text-xs text-gray-500">Active Farms</div>
        </div>
        <div className="mt-2 pt-2 border-t text-center">
          <div className="text-lg font-semibold text-gray-800">
            {farms.reduce((sum, f) => sum + f.hectares, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Total Hectares</div>
        </div>
      </div>
    </div>
  );
}
