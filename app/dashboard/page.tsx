"use client";

import { Suspense } from "react";
import Providers from "@/components/Providers";
import Dashboard from "@/components/Dashboard";
import PublicPageLoader from "@/components/PublicPageLoader";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <Providers>
      <Suspense fallback={<PublicPageLoader label="Loading dashboard..." />}>
        <Dashboard />
      </Suspense>
    </Providers>
  );
}
