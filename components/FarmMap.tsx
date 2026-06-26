"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

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

const FarmMapLeaflet = dynamic(() => import("./FarmMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex items-center justify-center rounded-2xl"
      style={{ background: "linear-gradient(135deg, #0C2D3A 0%, #1a4050 100%)" }}
    >
      <div className="text-center">
        <div
          className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4"
          style={{ borderColor: "rgba(191,255,0,0.3)", borderTopColor: "transparent" }}
        />
        <p
          className="font-medium"
          style={{ fontFamily: "'Manrope', sans-serif", color: "rgba(255,255,255,0.6)" }}
        >
          Loading Map...
        </p>
      </div>
    </div>
  ),
});

interface FarmMapProps {
  farms?: Farm[];
  onFarmClick?: (farm: Farm) => void;
  selectedFarmId?: string;
}

export default function FarmMap({ farms = [], onFarmClick, selectedFarmId }: FarmMapProps) {
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

  const handleFarmSelect = (farm: Farm) => {
    setSelectedFarm(farm);
    onFarmClick?.(farm);
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0">
        <FarmMapLeaflet farms={farms} onFarmSelect={handleFarmSelect} />
      </div>

      <div
        className="absolute bottom-4 left-4 backdrop-blur rounded-2xl shadow-lg p-3 z-[400]"
        style={{
          background: "rgba(12,45,58,0.92)",
          border: "1px solid rgba(191,255,0,0.15)",
          minWidth: 160,
        }}
      >
        <h4
          className="text-xs font-semibold mb-2 flex items-center gap-1.5"
          style={{
            fontFamily: "'Syne', sans-serif",
            color: "#BFFF00",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            fontSize: "0.6rem",
          }}
        >
          <MapPin className="h-3 w-3" style={{ color: "#BFFF00" }} />
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
                background:
                  selectedFarmId === farm.id || selectedFarm?.id === farm.id
                    ? "rgba(191,255,0,0.15)"
                    : "transparent",
                color:
                  selectedFarmId === farm.id || selectedFarm?.id === farm.id
                    ? "#BFFF00"
                    : "rgba(255,255,255,0.7)",
              }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: farm.status === "active" ? "#BFFF00" : "#f59e0b",
                  boxShadow:
                    farm.status === "active" ? "0 0 4px rgba(191,255,0,0.6)" : "none",
                }}
              />
              <span className="truncate">{farm.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="absolute top-4 right-4 backdrop-blur rounded-2xl shadow-lg p-3 z-[400]"
        style={{ background: "rgba(12,45,58,0.92)", border: "1px solid rgba(191,255,0,0.15)" }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "#BFFF00" }}>
            {farms.length}
          </div>
          <div
            className="text-xs"
            style={{ fontFamily: "'Manrope', sans-serif", color: "rgba(255,255,255,0.5)" }}
          >
            On Map
          </div>
        </div>
        <div className="mt-2 pt-2 text-center" style={{ borderTop: "1px solid rgba(191,255,0,0.15)" }}>
          <div className="text-lg font-semibold" style={{ fontFamily: "'Syne', sans-serif", color: "#fff" }}>
            {farms.reduce((sum, farm) => sum + farm.hectares, 0).toLocaleString()}
          </div>
          <div
            className="text-xs"
            style={{ fontFamily: "'Manrope', sans-serif", color: "rgba(255,255,255,0.5)" }}
          >
            Total Hectares
          </div>
        </div>
      </div>
    </div>
  );
}
