"use client";

import { useEffect, useState } from "react";
import { MapPin, Leaf, User, Phone, TrendingUp } from "lucide-react";

// Default empty — pass real farms from AdminDashboard
export type Farm = {
  id: string;
  name: string;
  farmer: string;
  phone: string;
  location: string;
  lat: number;
  lng: number;
  crops: string[];
  hectares: number;
  status: "active" | "pending";
  color: string;
};

interface FarmMapProps {
  farms?: Farm[];
  onFarmClick?: (farm: Farm) => void;
  selectedFarmId?: string;
}

export default function FarmMap({ farms = [], onFarmClick, selectedFarmId }: FarmMapProps) {
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
      <div className="w-full h-full flex items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, #0C2D3A 0%, #1a4050 100%)' }}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: 'rgba(191,255,0,0.3)', borderTopColor: 'transparent' }}></div>
          <p className="font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: 'rgba(255,255,255,0.6)' }}>Loading Map...</p>
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
      <div className="absolute bottom-4 left-4 backdrop-blur rounded-2xl shadow-lg p-3 z-[400]" style={{ background: 'rgba(12,45,58,0.92)', border: '1px solid rgba(191,255,0,0.15)', minWidth: 160 }}>
        <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ fontFamily: "'Syne', sans-serif", color: '#BFFF00', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.6rem' }}>
          <MapPin className="h-3 w-3" style={{ color: '#BFFF00' }} />
          Farm Locations
        </h4>
        <div className="space-y-1">
          {farms.map((farm) => (
            <button
              key={farm.id}
              onClick={() => handleFarmSelect(farm)}
              className="flex items-center gap-2 text-xs w-full text-left px-2 py-1.5 rounded-xl transition-all"
              style={{
                fontFamily: "'Manrope', sans-serif",
                background: selectedFarmId === farm.id || selectedFarm?.id === farm.id ? 'rgba(191,255,0,0.15)' : 'transparent',
                color: selectedFarmId === farm.id || selectedFarm?.id === farm.id ? '#BFFF00' : 'rgba(255,255,255,0.7)'
              }}
            >
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: farm.status === 'active' ? '#BFFF00' : '#f59e0b', boxShadow: farm.status === 'active' ? '0 0 4px rgba(191,255,0,0.6)' : 'none' }}
              />
              <span className="truncate">{farm.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Badge */}
      <div className="absolute top-4 right-4 backdrop-blur rounded-2xl shadow-lg p-3 z-[400]" style={{ background: 'rgba(12,45,58,0.92)', border: '1px solid rgba(191,255,0,0.15)' }}>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: '#BFFF00' }}>{farms.length}</div>
          <div className="text-xs" style={{ fontFamily: "'Manrope', sans-serif", color: 'rgba(255,255,255,0.5)' }}>Active Farms</div>
        </div>
        <div className="mt-2 pt-2 text-center" style={{ borderTop: '1px solid rgba(191,255,0,0.15)' }}>
          <div className="text-lg font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: '#fff' }}>
            {farms.reduce((sum, f) => sum + f.hectares, 0).toLocaleString()}
          </div>
          <div className="text-xs" style={{ fontFamily: "'Manrope', sans-serif", color: 'rgba(255,255,255,0.5)' }}>Total Hectares</div>
        </div>
      </div>
    </div>
  );
}
