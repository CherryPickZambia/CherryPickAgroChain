"use client";

import { useEffect } from "react";
import { CDPReactProvider } from "@coinbase/cdp-react";
import { cdpConfig } from "@/lib/config";
import { theme } from "@/lib/theme";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import Cookies from "js-cookie";

interface ProvidersProps {
  children: React.ReactNode;
}

function CookieManager() {
  const { evmAddress } = useEvmAddress();

  // Sync auth state to cookies for middleware
  useEffect(() => {
    if (evmAddress) {
      Cookies.set('cp_wallet_session', evmAddress, { expires: 7 }); // 7 days
    } else {
      Cookies.remove('cp_wallet_session');
    }
  }, [evmAddress]);

  return null;
}

export default function Providers({ children }: ProvidersProps) {

  // Suppress expected errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      // Suppress expected 401 logout errors
      if (
        typeof args[0] === 'string' &&
        args[0].includes('auth/logout') &&
        args[0].includes('401')
      ) {
        return; // This is expected when logging out
      }

      // Suppress MetaMask connection errors (we use email/SMS/OAuth auth)
      // This block was syntactically incorrect and has been fixed.
      // The conditions "TransitionState" and "invalid key" were already present.
      const isSuppressed = args.some(arg => {
        const msg = arg?.toString() || "";
        return (
          msg.includes("React-Transition-State") ||
          msg.includes("TransitionState") ||
          msg.includes("invalid key") ||
          msg.includes("defaultProps") ||
          msg.includes("Coinbase")
        );
      });

      if (isSuppressed) return;

      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <CDPReactProvider config={cdpConfig} theme={theme}>
      <CookieManager />
      {children}
    </CDPReactProvider>
  );
}
