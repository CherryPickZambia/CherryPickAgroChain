"use client";

import { useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { Cherry, Shield, Wallet, Sparkles, Leaf } from "lucide-react";

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
      {/* Gradient line accent at top */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              <div className="relative h-6 w-auto">
                <img
                  src="/cherrypick-logo.png"
                  alt="Cherry Pick Logo"
                  className="h-6 w-auto object-contain"
                />
              </div>
              <div>
                {roleDisplay && (
                  <p className={`text-xs font-medium ${roleDisplay.color} flex items-center gap-1`}>
                    <roleDisplay.icon className="h-3 w-3" />
                    {roleDisplay.label} Dashboard
                  </p>
                )}
              </div>
            </div>

            {/* Right Section - Only Role Badge and Auth Button */}
            <div className="flex items-center space-x-3">
              {/* Role Badge - Only show when logged in */}
              {evmAddress && roleDisplay && (
                <div className={`hidden sm:flex px-4 py-2 rounded-xl ${roleDisplay.bg} border ${roleDisplay.border} shadow-sm`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${roleDisplay.gradient} flex items-center justify-center shadow-sm`}>
                      <roleDisplay.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className={`text-sm font-semibold ${roleDisplay.color}`}>
                      {roleDisplay.label}
                    </span>
                  </div>
                </div>
              )}

              {/* Auth Button */}
              <div className="[&>button]:!rounded-xl [&>button]:!font-semibold [&>button]:!shadow-sm [&>button]:!border-gray-200 hover:[&>button]:!border-emerald-300 [&>button]:!transition-all [&>button]:!px-5">
                <AuthButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
