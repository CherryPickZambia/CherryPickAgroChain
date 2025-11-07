"use client";

import { useState, useEffect } from "react";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import Header from "./Header";
import LandingPage from "./LandingPage";
import SignInScreen from "./SignInScreen";
import FarmerDashboard from "./FarmerDashboard";
import BuyerDashboard from "./BuyerDashboard";
import OfficerDashboard from "./OfficerDashboard";
import AdminDashboard from "./AdminDashboard";

export default function Dashboard() {
  const { evmAddress } = useEvmAddress();
  const [userRole, setUserRole] = useState<"farmer" | "buyer" | "officer" | "admin" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved role from localStorage on mount
  useEffect(() => {
    if (evmAddress) {
      const savedRole = localStorage.getItem(`agrochain_role_${evmAddress}`);
      if (savedRole && (savedRole === "farmer" || savedRole === "buyer" || savedRole === "officer" || savedRole === "admin")) {
        setUserRole(savedRole);
      }
    }
    setIsLoading(false);
  }, [evmAddress]);

  // Save role to localStorage when it changes
  const handleRoleSelection = (role: "farmer" | "buyer" | "officer" | "admin") => {
    if (evmAddress) {
      localStorage.setItem(`agrochain_role_${evmAddress}`, role);
      setUserRole(role);
    }
  };

  // Clear role (for role change)
  const handleRoleChange = () => {
    if (evmAddress) {
      localStorage.removeItem(`agrochain_role_${evmAddress}`);
      setUserRole(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AgroChain360...</p>
        </div>
      </div>
    );
  }

  if (!evmAddress) {
    return <LandingPage />;
  }

  // Role selection if not set
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f7f4] via-white to-[#f0f7f4]">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-16 fade-in">
            <div className="inline-flex items-center space-x-2 bg-[#f0f7f4] px-4 py-2 rounded-full mb-6">
              <span className="text-sm font-semibold text-[#2d5f3f]">Welcome Back!</span>
            </div>
            <h1 className="text-5xl font-bold text-[#1a1a1a] mb-4">Choose Your Role</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Select how you'd like to use AgroChain360 today</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <button
              onClick={() => handleRoleSelection("farmer")}
              className="card-premium group text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7fb069]/10 to-transparent rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-4xl">🌾</span>
                </div>
                <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">Farmer</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Create contracts, track milestones, and receive secure payments
                </p>
                <div className="flex items-center text-[#2d5f3f] font-semibold group-hover:translate-x-2 transition-transform">
                  <span>Get Started</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelection("buyer")}
              className="card-premium group text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7fb069]/10 to-transparent rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-4xl">🛒</span>
                </div>
                <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">Buyer</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Browse marketplace, purchase produce, and track orders
                </p>
                <div className="flex items-center text-[#2d5f3f] font-semibold group-hover:translate-x-2 transition-transform">
                  <span>Start Shopping</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelection("officer")}
              className="card-premium group text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7fb069]/10 to-transparent rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">Extension Officer</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Verify milestones, earn fees, and support farmers
                </p>
                <div className="flex items-center text-[#2d5f3f] font-semibold group-hover:translate-x-2 transition-transform">
                  <span>Start Verifying</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelection("admin")}
              className="card-premium group text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7fb069]/10 to-transparent rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-4xl">⚙️</span>
                </div>
                <h3 className="text-2xl font-bold text-[#1a1a1a] mb-3">Cherry-Pick Admin</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Monitor platform, manage users, and view analytics
                </p>
                <div className="flex items-center text-[#2d5f3f] font-semibold group-hover:translate-x-2 transition-transform">
                  <span>Access Dashboard</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header userRole={userRole} onRoleChange={handleRoleChange} />
      <div className="fade-in">
        {userRole === "farmer" && <FarmerDashboard />}
        {userRole === "buyer" && <BuyerDashboard />}
        {userRole === "officer" && <OfficerDashboard />}
        {userRole === "admin" && <AdminDashboard />}
      </div>
    </div>
  );
}
