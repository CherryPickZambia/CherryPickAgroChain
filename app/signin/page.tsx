"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthButton } from "@coinbase/cdp-react";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import Providers from "@/components/Providers";

export default function SignInPage() {
  return (
    <Providers>
      <SignInPageContent />
    </Providers>
  );
}

function SignInPageContent() {
  const router = useRouter();
  const { evmAddress } = useEvmAddress();
  const authButtonRef = useRef<HTMLDivElement>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (evmAddress) {
      router.push('/dashboard');
    } else {
      setCheckingSession(false);
    }
  }, [evmAddress, router]);

  // Auto-open the authentication modal when page loads AND we confirmed no address
  useEffect(() => {
    if (checkingSession || evmAddress) return;

    const timer = setTimeout(() => {
      const authButton = authButtonRef.current?.querySelector('button');
      if (authButton) {
        authButton.click();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [checkingSession, evmAddress]);

  if (checkingSession || evmAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* Hidden AuthButton - will auto-click to open modal */}
      <div ref={authButtonRef} className="hidden">
        <AuthButton />
      </div>
      <div className="text-center fade-in">
        <p className="text-gray-500">Opening login...</p>
      </div>
    </div>
  );
}
