"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useEvmAddress, useIsInitialized } from "@coinbase/cdp-hooks";
import Header from "./Header";
import LandingPage from "./LandingPage";
import ErrorBoundary from "./ErrorBoundary";
import SignInScreen from "./SignInScreen";
import FarmerDashboard from "./FarmerDashboard";
import BuyerDashboard from "./BuyerDashboard";
import OfficerDashboard from "./OfficerDashboard";
import AdminDashboard from "./AdminDashboard";
import PublicPageLoader from "./PublicPageLoader";
import Logo from "./Logo";
import { getOrCreateUser, getUserByWallet } from "@/lib/supabaseService";
import VerifierOnboarding, { VerifierData } from "./VerifierOnboarding";
import toast from "react-hot-toast";
import { AuthButton } from "@coinbase/cdp-react";
import { Sprout, ShoppingBag, Search, ChevronRight, AlertTriangle, Check } from "lucide-react";
import { dc, D, syne, manrope } from "@/lib/dashboardTheme";

// Role handling is now managed securely via Supabase DB. Admin/Officer assignments are managed in the database directly.

export default function Dashboard() {
  const { evmAddress } = useEvmAddress();
  const { isInitialized } = useIsInitialized();
  const searchParams = useSearchParams();
  const [userRole, setUserRole] = useState<"farmer" | "buyer" | "officer" | "admin" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showVerifierOnboarding, setShowVerifierOnboarding] = useState(false);
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  // Admin verification purely based on DB role, so we set it from there
  // (checkIsAdmin helper is removed to prevent spoofing)

  // Load role from URL parameter or database
  useEffect(() => {
    const loadUserRole = async () => {
      if (!evmAddress) {
        // CDP may still be restoring the wallet session (e.g. right after
        // navigating back from the marketplace or on a fresh load). Keep the
        // loader up until CDP reports it is initialized so we never flash the
        // public landing page at an already signed-in user.
        if (isInitialized) {
          setIsLoading(false);
          setIsInitialCheck(false);
        }
        return;
      }

      console.log("🔐 Authenticator checking wallet:", evmAddress);

      const cachedRole = localStorage.getItem(`cherrypick_role_${evmAddress}`);
      if (cachedRole && ['farmer', 'buyer', 'officer', 'admin'].includes(cachedRole)) {
        setUserRole(cachedRole as "farmer" | "buyer" | "officer" | "admin");
        if (cachedRole === 'admin') setIsAdmin(true);
        setIsInitialCheck(false);
        setIsLoading(false);
      }

      // Check if user exists in database
      try {
        const existingUser = await getUserByWallet(evmAddress);
        if (existingUser) {
          setUserRole(existingUser.role);
          if (existingUser.role === 'admin') setIsAdmin(true);
          localStorage.setItem(`cherrypick_role_${evmAddress}`, existingUser.role);
          setIsLoading(false);
          setIsInitialCheck(false);
          return;
        }
      } catch (error: any) {
        console.error("Error checking user in database:", error?.message || error?.code || JSON.stringify(error));
        // If DB fails but we have cached role, use it
        if (cachedRole) {
          setIsLoading(false);
          setIsInitialCheck(false);
          return;
        }
      }

      // If not in database, check URL parameter for new registrations (only farmer or buyer allowed)
      const roleParam = searchParams.get('role');

      if (roleParam && (roleParam === "farmer" || roleParam === "buyer")) {
        setUserRole(roleParam);
        localStorage.setItem(`cherrypick_role_${evmAddress}`, roleParam);
        try {
          await getOrCreateUser(evmAddress, roleParam);
        } catch (error: any) {
          console.error("Error saving user to database:", error?.message || JSON.stringify(error));
        }
      } else if (!cachedRole) {
        // Clear old incorrect local state if user doesn't exist in DB and no cache
        localStorage.removeItem(`cherrypick_role_${evmAddress}`);
      }
      setIsLoading(false);
      setIsInitialCheck(false);
    };

    loadUserRole();
  }, [evmAddress, isInitialized, searchParams]);

  // Safety net: if CDP initialization stalls, don't leave the user stuck on the
  // loader forever. After a generous window, fall through to whatever state we
  // have (landing page if still no wallet).
  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(false);
      setIsInitialCheck(false);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  // Save role to localStorage and database when it changes - PERMANENT, no role change allowed
  // Users can only choose farmer, buyer, or verifier (officer)
  const handleRoleSelection = async (role: "farmer" | "buyer") => {
    if (evmAddress && !isAdmin) {
      localStorage.setItem(`cherrypick_role_${evmAddress}`, role);
      setUserRole(role);

      // Try to save to database, but don't block on failure
      try {
        await getOrCreateUser(evmAddress, role);
      } catch (error) {
        console.warn("Database not available, using localStorage only");
      }
      toast.success(`Account created as ${role === 'farmer' ? 'Farmer' : 'Buyer'}!`);
    }
  };

  // Handle verifier onboarding completion
  const handleVerifierOnboardingComplete = async (data: VerifierData) => {
    if (!evmAddress) return;

    // Save as officer role to localStorage (works without database)
    localStorage.setItem(`cherrypick_role_${evmAddress}`, 'officer');

    // Store verifier type and details in localStorage
    localStorage.setItem(`cherrypick_verifier_${evmAddress}`, JSON.stringify(data));
    localStorage.setItem(`cherrypick_name_${evmAddress}`, data.name);

    // Try to save to database, but don't block on failure
    try {
      await getOrCreateUser(evmAddress, 'officer', data.name);
    } catch (error: any) {
      console.warn("Database not available, using localStorage only:", error?.message || 'Unknown error');
    }

    setUserRole('officer');
    setShowVerifierOnboarding(false);
    toast.success(`Registered as ${data.verifierType === 'professional' ? 'Professional' : 'Freelance'} Verifier!`);
  };

  if (isLoading || isInitialCheck) {
    return <PublicPageLoader label="Loading dashboard..." />;
  }

  if (!evmAddress) {
    return <LandingPage />;
  }

  // Final catch: If we have an address but still checking DB/Local, stay loading
  // (This handles the gap between evmAddress being available and loadUserRole finishing)
  // Actually, isLoading already covers this in the useEffect. 
  // But let's be extra safe and check if evmAddress exists but userRole is still null 
  // AND we haven't timed out or definitively found no user.

  // Show verifier onboarding if selected
  if (showVerifierOnboarding) {
    return (
      <VerifierOnboarding
        walletAddress={evmAddress}
        onCompleteAction={handleVerifierOnboardingComplete}
        onBackAction={() => setShowVerifierOnboarding(false)}
      />
    );
  }

  const roleCards = [
    {
      key: "farmer" as const,
      title: "Farmer",
      description: "Create contracts, track milestones, and receive secure payments for your produce.",
      features: ["Create smart contracts", "List produce on marketplace", "Receive crypto payments"],
      cta: "Get Started as Farmer",
      icon: Sprout,
      onClick: () => handleRoleSelection("farmer"),
    },
    {
      key: "buyer" as const,
      title: "Buyer",
      description: "Browse the marketplace and purchase fresh produce directly from verified farmers.",
      features: ["Browse verified listings", "Place bulk orders", "Track deliveries"],
      cta: "Start Shopping",
      icon: ShoppingBag,
      onClick: () => handleRoleSelection("buyer"),
    },
    {
      key: "verifier" as const,
      title: "Verifier",
      description: "Verify farmer milestones, conduct field inspections, and earn rewards.",
      features: ["Professional or freelance", "Verify crop milestones", "Earn verification fees"],
      cta: "Become a Verifier",
      icon: Search,
      onClick: () => setShowVerifierOnboarding(true),
    },
  ];

  // ONLY show role selection if we are DEFINITELY not loading AND have no role
  if (!userRole) {
    return (
      <div className="min-h-screen dashboard-shell" style={{ background: D.surface }}>
        <header
          className="sticky top-0 z-40 border-b px-4 sm:px-6 py-3 flex items-center justify-between"
          style={{ background: D.white, borderColor: "rgba(12,45,58,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <p className="text-sm font-bold" style={{ ...syne, color: D.deep }}>Cherry Pick</p>
              <p className="text-xs" style={{ ...manrope, color: D.muted }}>AgroChain 360 platform</p>
            </div>
          </div>
          <AuthButton />
        </header>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-12 fade-in">
            <span className={dc.badgeLime}>Welcome to Cherry Pick</span>
            <h1
              className="text-4xl sm:text-5xl font-bold mt-6 mb-3"
              style={{ ...syne, color: D.deep }}
            >
              Choose Your Role
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ ...manrope, color: D.muted }}>
              Select how you will use Cherry Pick on the platform
            </p>
            <div className={`${dc.alertBox} inline-flex items-center gap-2 mt-6 text-left max-w-xl mx-auto`}>
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: D.deep }} />
              <span className="text-sm font-medium" style={{ ...manrope, color: D.deep }}>
                This is a one-time choice and cannot be changed later
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {roleCards.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={role.onClick}
                  className={`${dc.statCard} group text-left p-6 border border-transparent hover:border-[#BFFF00]/40 hover:shadow-md transition-all`}
                  style={{ background: D.white }}
                >
                  <div className={`${dc.iconBoxLime} w-14 h-14 mb-5 group-hover:scale-105 transition-transform`}>
                    <Icon className={dc.iconLime} style={{ width: 24, height: 24 }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ ...syne, color: D.deep }}>
                    {role.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ ...manrope, color: D.muted }}>
                    {role.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {role.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                        style={{ ...manrope, color: D.secondary }}
                      >
                        <Check className="h-4 w-4 shrink-0" style={{ color: D.deep }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className={`${dc.link} flex items-center group-hover:translate-x-1 transition-transform`}>
                    <span>{role.cta}</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-shell" style={{ background: D.surface }}>
      {userRole !== "admin" && <Header userRole={userRole} />}
      <div className="fade-in">
        <ErrorBoundary fallbackMessage="An error occurred loading this dashboard. Please refresh.">
          {userRole === "farmer" && <FarmerDashboard />}
          {userRole === "buyer" && <BuyerDashboard />}
          {userRole === "officer" && <OfficerDashboard />}
          {userRole === "admin" && <AdminDashboard />}
        </ErrorBoundary>
      </div>
    </div>
  );
}
