"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthButton } from "@coinbase/cdp-react";
import { useEvmAddress, useIsInitialized, useIsSignedIn } from "@coinbase/cdp-hooks";
import Providers from "@/components/Providers";
import PublicPageLoader from "@/components/PublicPageLoader";
import { getWalletSessionCookie, syncWalletSessionCookie } from "@/lib/authSession";

export default function SignInPage() {
  return (
    <Providers>
      <Suspense fallback={<PublicPageLoader label="Checking session..." />}>
        <SignInPageContent />
      </Suspense>
    </Providers>
  );
}

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { evmAddress } = useEvmAddress();
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const authButtonRef = useRef<HTMLDivElement>(null);
  const [showAuth, setShowAuth] = useState(false);
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  // Fast redirect when session already exists (cookie or wallet hook)
  useEffect(() => {
    const cookie = getWalletSessionCookie();
    const address = evmAddress || cookie;

    if (address) {
      syncWalletSessionCookie(address);
      router.replace(redirectTo);
    }
  }, [evmAddress, redirectTo, router]);

  // Stop waiting once CDP is ready or after a short timeout
  useEffect(() => {
    if (isInitialized) {
      if (isSignedIn && evmAddress) return;
      if (!isSignedIn) setShowAuth(true);
      return;
    }
    const timer = setTimeout(() => setShowAuth(true), 1200);
    return () => clearTimeout(timer);
  }, [isInitialized, isSignedIn, evmAddress]);

  // Auto-open auth modal when we know user is not signed in
  useEffect(() => {
    if (!showAuth || evmAddress) return;
    const timer = setTimeout(() => {
      authButtonRef.current?.querySelector("button")?.click();
    }, 150);
    return () => clearTimeout(timer);
  }, [showAuth, evmAddress]);

  if (!showAuth && !evmAddress) {
    return <PublicPageLoader label="Checking session..." />;
  }

  if (evmAddress) {
    return <PublicPageLoader label="Opening dashboard..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#020503" }}>
      <div ref={authButtonRef} className="hidden">
        <AuthButton />
      </div>
      <p style={{ color: "#9aa89d", fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Opening login...</p>
    </div>
  );
}
