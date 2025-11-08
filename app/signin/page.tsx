"use client";

import { useEffect, useRef } from "react";
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

  // After sign in, just go to dashboard - it will handle role selection
  useEffect(() => {
    if (evmAddress) {
      router.push('/dashboard');
    }
  }, [evmAddress, router]);

  // Auto-open the authentication modal when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      const authButton = authButtonRef.current?.querySelector('button');
      if (authButton) {
        authButton.click();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* Hidden AuthButton - will auto-click to open modal */}
      <div ref={authButtonRef} className="hidden">
        <AuthButton />
      </div>
    </div>
  );
}
