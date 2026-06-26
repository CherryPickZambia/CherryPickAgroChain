"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Farm } from "./FarmMap";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function FitAllMarkers({ farms }: { farms: Farm[] }) {
  const map = useMap();

  useEffect(() => {
    if (farms.length === 0) return;
    if (farms.length === 1) {
      map.setView([farms[0].lat, farms[0].lng], 9);
      return;
    }
    const bounds = L.latLngBounds(farms.map((farm) => [farm.lat, farm.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 11 });
  }, [farms, map]);

  return null;
}

export default function FarmMapLeaflet({
  farms,
  onFarmSelect,
}: {
  farms: Farm[];
  onFarmSelect: (farm: Farm) => void;
}) {
  const center: [number, number] =
    farms.length > 0 ? [farms[0].lat, farms[0].lng] : [-14.5, 28.5];

  return (
    <MapContainer
      center={center}
      zoom={farms.length > 0 ? 8 : 6}
      style={{ height: "100%", width: "100%" }}
      className="rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitAllMarkers farms={farms} />
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
                <div>
                  <span className="font-medium">Farmer:</span> {farm.farmer}
                </div>
                <div>
                  <span className="font-medium">Crops:</span>{" "}
                  {farm.crops.length ? farm.crops.join(", ") : "Not set"}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {farm.hectares} ha
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
