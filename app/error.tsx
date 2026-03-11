"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full border border-gray-100">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong!</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    We encountered an unexpected error processing your request. Please try again or return to the dashboard.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                        <RotateCcw className="h-5 w-5 mr-2" />
                        Try again
                    </button>

                    <Link
                        href="/dashboard"
                        className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                        <Home className="h-5 w-5 mr-2" />
                        Dashboard
                    </Link>
                </div>

                {process.env.NODE_ENV === "development" && (
                    <div className="mt-8 text-left bg-gray-100 p-4 rounded-xl overflow-auto text-xs font-mono text-gray-800">
                        <p className="font-bold text-red-600 mb-2">Developer info:</p>
                        <p>{error.message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
