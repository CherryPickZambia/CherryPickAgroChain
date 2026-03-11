"use client";

import { useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { Shield, Wallet, Sparkles, Leaf } from "lucide-react";

interface HeaderProps {
  userRole?: "farmer" | "buyer" | "officer" | "admin" | null;
}

export default function Header({ userRole }: HeaderProps) {
  const { evmAddress } = useEvmAddress();

  // Get role display info with enhanced styling
  const getRoleDisplay = () => {
    switch (userRole) {
      case "admin":
        return {
          label: "Admin",
          color: "text-purple-700",
          bg: "bg-gradient-to-r from-purple-50 to-violet-50",
          border: "border-purple-200",
          icon: Shield,
          gradient: "from-purple-500 to-violet-600"
        };
      case "farmer":
        return {
          label: "Farmer",
          color: "text-emerald-700",
          bg: "bg-gradient-to-r from-emerald-50 to-teal-50",
          border: "border-emerald-200",
          icon: Leaf,
          gradient: "from-emerald-500 to-teal-600"
        };
      case "buyer":
        return {
          label: "Buyer",
          color: "text-blue-700",
          bg: "bg-gradient-to-r from-blue-50 to-cyan-50",
          border: "border-blue-200",
          icon: Wallet,
          gradient: "from-blue-500 to-cyan-600"
        };
      case "officer":
        return {
          label: "Officer",
          color: "text-amber-700",
          bg: "bg-gradient-to-r from-amber-50 to-orange-50",
          border: "border-amber-200",
          icon: Shield,
          gradient: "from-amber-500 to-orange-600"
        };
      default:
        return null;
    }
  };

  const roleDisplay = getRoleDisplay();

  return (
    <header className="sticky top-0 z-50">
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              <span className="text-xl" role="img" aria-label="cherry">🍒</span>
              <div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#0C2D3A" }}>Cherry Pick</span>
                {roleDisplay && (
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "0.65rem", color: "#5A7684", letterSpacing: "0.05em", textTransform: "uppercase" }} className="flex items-center gap-1">
                    <roleDisplay.icon className="h-3 w-3" style={{ color: "#BFFF00" }} />
                    {roleDisplay.label} Dashboard
                  </p>
                )}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {evmAddress && roleDisplay && (
                <div className="hidden sm:flex px-4 py-2 rounded-2xl border border-gray-200" style={{ background: "#F7F9FB" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#0C2D3A" }}>
                      <roleDisplay.icon className="h-3.5 w-3.5" style={{ color: "#BFFF00" }} />
                    </div>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "#0C2D3A" }}>
                      {roleDisplay.label}
                    </span>
                  </div>
                </div>
              )}

              <div className="[&>button]:!rounded-xl [&>button]:!font-semibold [&>button]:!shadow-sm [&>button]:!border-[#0C2D3A] [&>button]:!bg-[#0C2D3A] [&>button]:!text-white hover:[&>button]:!bg-[#1a4050] [&>button]:!transition-all [&>button]:!px-5 [&>button]:!py-2 [&>button]:!text-sm">
                <AuthButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
