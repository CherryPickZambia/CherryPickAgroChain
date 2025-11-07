"use client";

import Providers from "@/components/Providers";
import Dashboard from "@/components/Dashboard";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <Providers>
      <Dashboard />
    </Providers>
  );
}
