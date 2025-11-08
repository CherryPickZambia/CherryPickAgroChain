"use client";

import { Suspense } from "react";
import Providers from "@/components/Providers";
import Dashboard from "@/components/Dashboard";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <Providers>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Cherry Pick...</p>
          </div>
        </div>
      }>
        <Dashboard />
      </Suspense>
    </Providers>
  );
}
