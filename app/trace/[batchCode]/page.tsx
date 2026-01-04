"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle, Sprout } from "lucide-react";
import TraceabilityView from "@/components/TraceabilityView";
import { getTraceabilityByBatchCode } from "@/lib/traceabilityService";

export default function PublicTraceabilityPage() {
  const params = useParams();
  const batchCode = params.batchCode as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    batch: any;
    events: any[];
    farmer?: any;
    contract?: any;
  } | null>(null);

  useEffect(() => {
    const loadTraceability = async () => {
      if (!batchCode) return;
      
      try {
        setLoading(true);
        setError(null);
        const result = await getTraceabilityByBatchCode(batchCode);
        
        if (!result) {
          setError('Batch not found. Please check the QR code and try again.');
          return;
        }
        
        setData(result);
      } catch (err: any) {
        console.error('Error loading traceability:', err);
        setError(err.message || 'Failed to load traceability data');
      } finally {
        setLoading(false);
      }
    };

    loadTraceability();
  }, [batchCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading traceability data...</p>
          <p className="text-sm text-gray-400 mt-1">Batch: {batchCode}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Batch Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-400">Batch Code: {batchCode}</p>
          <a
            href="/"
            className="inline-block mt-6 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Sprout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h1>
          <p className="text-gray-600">This batch has no traceability data yet.</p>
        </div>
      </div>
    );
  }

  return (
    <TraceabilityView
      batch={data.batch}
      events={data.events}
      farmer={data.farmer}
      contract={data.contract}
      isPublic={true}
    />
  );
}
