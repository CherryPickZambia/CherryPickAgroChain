"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import Header from "./Header";
import LandingPage from "./LandingPage";
import SignInScreen from "./SignInScreen";
import FarmerDashboard from "./FarmerDashboard";
import BuyerDashboard from "./BuyerDashboard";
import OfficerDashboard from "./OfficerDashboard";
import AdminDashboard from "./AdminDashboard";

// Admin wallet addresses - these users automatically get admin access
const ADMIN_WALLETS = [
  "0x919134626100399ed78D386beA6b27C8E0507b9D", // Main deployer/admin
  "0x978535960Bfa1BE18f7D78E82c262AB0F9A022E1", // basezambia@gmail.com
].map(addr => addr.toLowerCase());

// Officer wallet addresses - promoted by admin
const getOfficerWallets = (): string[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('cherrypick_officers');
  return stored ? JSON.parse(stored) : [];
};

// Export function for admin to promote/demote officers
export const promoteToOfficer = (walletAddress: string) => {
  const officers = getOfficerWallets();
  if (!officers.includes(walletAddress.toLowerCase())) {
    officers.push(walletAddress.toLowerCase());
    localStorage.setItem('cherrypick_officers', JSON.stringify(officers));
  }
};

export const demoteOfficer = (walletAddress: string) => {
  const officers = getOfficerWallets();
  const updated = officers.filter(o => o !== walletAddress.toLowerCase());
  localStorage.setItem('cherrypick_officers', JSON.stringify(updated));
};

export const isOfficer = (walletAddress: string): boolean => {
  return getOfficerWallets().includes(walletAddress.toLowerCase());
};

export default function Dashboard() {
  const { evmAddress } = useEvmAddress();
  const searchParams = useSearchParams();
  const [userRole, setUserRole] = useState<"farmer" | "buyer" | "officer" | "admin" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is an admin
  const checkIsAdmin = (address: string) => {
    return ADMIN_WALLETS.includes(address.toLowerCase());
  };

  // Load role from URL parameter or localStorage
  useEffect(() => {
    if (evmAddress) {
      // Log wallet address for admin setup
      console.log("🔐 Your wallet address:", evmAddress);
      
      // First check if user is an admin
      if (checkIsAdmin(evmAddress)) {
        setIsAdmin(true);
        setUserRole("admin");
        localStorage.setItem(`cherrypick_role_${evmAddress}`, "admin");
        setIsLoading(false);
        return;
      }

      // Check if user has been promoted to officer by admin
      if (isOfficer(evmAddress)) {
        setUserRole("officer");
        localStorage.setItem(`cherrypick_role_${evmAddress}`, "officer");
        setIsLoading(false);
        return;
      }

      // Check URL parameter first (for non-admin users) - only farmer or buyer allowed
      const roleParam = searchParams.get('role');
      
      if (roleParam && (roleParam === "farmer" || roleParam === "buyer")) {
        setUserRole(roleParam);
        // Save to localStorage permanently
        localStorage.setItem(`cherrypick_role_${evmAddress}`, roleParam);
      } else {
        // Fallback to localStorage - role is permanent once chosen
        const savedRole = localStorage.getItem(`cherrypick_role_${evmAddress}`);
        if (savedRole && (savedRole === "farmer" || savedRole === "buyer" || savedRole === "officer" || savedRole === "admin")) {
          setUserRole(savedRole as "farmer" | "buyer" | "officer" | "admin");
        }
      }
    }
    setIsLoading(false);
  }, [evmAddress, searchParams]);

  // Save role to localStorage when it changes - PERMANENT, no role change allowed
  // Users can only choose farmer or buyer - officers are promoted by admin
  const handleRoleSelection = (role: "farmer" | "buyer") => {
    if (evmAddress && !isAdmin) {
      localStorage.setItem(`cherrypick_role_${evmAddress}`, role);
      setUserRole(role);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Cherry Pick...</p>
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
              <span className="text-sm font-semibold text-[#2d5f3f]">Welcome to Cherry Pick!</span>
            </div>
            <h1 className="text-5xl font-bold text-[#1a1a1a] mb-4">Choose Your Role</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">Select how you'll use Cherry Pick</p>
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium">This is a one-time choice and cannot be changed later</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
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
                  Create contracts, track milestones, and receive secure payments for your produce
                </p>
                <ul className="text-sm text-gray-500 space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Create smart contracts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> List produce on marketplace
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Receive crypto payments
                  </li>
                </ul>
                <div className="flex items-center text-[#2d5f3f] font-semibold group-hover:translate-x-2 transition-transform">
                  <span>Get Started as Farmer</span>
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
                  Browse marketplace, purchase fresh produce directly from verified farmers
                </p>
                <ul className="text-sm text-gray-500 space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Browse verified listings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Place bulk orders
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Track deliveries
                  </li>
                </ul>
                <div className="flex items-center text-[#2d5f3f] font-semibold group-hover:translate-x-2 transition-transform">
                  <span>Start Shopping</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
          
          {/* Officer info note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Want to become an Extension Officer? Contact the platform admin to apply.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header userRole={userRole} />
      <div className="fade-in">
        {userRole === "farmer" && <FarmerDashboard />}
        {userRole === "buyer" && <BuyerDashboard />}
        {userRole === "officer" && <OfficerDashboard />}
        {userRole === "admin" && <AdminDashboard />}
      </div>
    </div>
  );
}
