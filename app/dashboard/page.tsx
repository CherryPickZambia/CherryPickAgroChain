"use client";

import Providers from "@/components/Providers";
import Dashboard from "@/components/Dashboard";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <Providers>
      <Dashboard />
    </Providers>
  );
}
