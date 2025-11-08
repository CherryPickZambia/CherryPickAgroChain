"use client";

import { useEffect } from "react";
import { CDPReactProvider } from "@coinbase/cdp-react";
import { cdpConfig } from "@/lib/config";
import { theme } from "@/lib/theme";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // Suppress expected 401 errors from logout endpoint
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      // Suppress expected 401 logout errors
      if (
        typeof args[0] === 'string' && 
        args[0].includes('auth/logout') && 
        args[0].includes('401')
      ) {
        return; // This is expected when logging out
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <CDPReactProvider config={cdpConfig} theme={theme}>
      {children}
    </CDPReactProvider>
  );
}
