"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { QrCode, Search, Leaf, Shield, MapPin, ArrowRight, Package } from "lucide-react";

export default function LookupPage() {
    const [batchCode, setBatchCode] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batchCode.trim()) {
            setError("Please enter a batch code");
            return;
        }

        setIsSearching(true);
        setError("");

        // Navigate to the traceability page
        setTimeout(() => {
            router.push(`/trace/${batchCode.trim().toUpperCase()}`);
        }, 500);
    };

    const recentBatches = [
        { code: "CP-MAN-241201-J8K2", crop: "Mangoes", farmer: "John Mwale" },
        { code: "CP-TOM-241128-M4R9", crop: "Tomatoes", farmer: "Mary Banda" },
        { code: "CP-PIN-241125-P7Q3", crop: "Pineapples", farmer: "Peter Phiri" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Leaf className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Cherry Pick</h1>
                            <p className="text-xs text-gray-500">Supply Chain Traceability</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span>Blockchain Verified</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-xl mb-6">
                        <QrCode className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Trace Your Product
                    </h2>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto">
                        Enter the batch code from your product packaging to see its complete journey from farm to your table.
                    </p>
                </motion.div>

                {/* Search Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8"
                >
                    <form onSubmit={handleSearch}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Batch Code
                        </label>
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={batchCode}
                                    onChange={(e) => {
                                        setBatchCode(e.target.value.toUpperCase());
                                        setError("");
                                    }}
                                    placeholder="e.g., CP-MAN-241201-J8K2"
                                    className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono uppercase"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-emerald-700 transition-all shadow-lg shadow-teal-500/25 flex items-center gap-2 disabled:opacity-70"
                            >
                                {isSearching ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-5 w-5" />
                                        Track
                                    </>
                                )}
                            </button>
                        </div>
                        {error && (
                            <p className="mt-2 text-red-500 text-sm">{error}</p>
                        )}
                    </form>

                    {/* Where to find the code */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                        <p className="text-sm text-teal-800">
                            <strong>Where to find the batch code?</strong> Look for the QR code sticker on your product packaging. The batch code is printed below the QR code.
                        </p>
                    </div>
                </motion.div>

                {/* Recent/Demo Batches */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/50 backdrop-blur rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Try a Demo Batch</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recentBatches.map((batch) => (
                            <button
                                key={batch.code}
                                onClick={() => setBatchCode(batch.code)}
                                className="p-4 bg-white rounded-xl border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all text-left group"
                            >
                                <p className="font-mono text-sm font-semibold text-teal-600 mb-1">{batch.code}</p>
                                <p className="text-sm text-gray-600">{batch.crop}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {batch.farmer}
                                </p>
                                <div className="mt-2 flex items-center text-xs text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Use this code <ArrowRight className="h-3 w-3 ml-1" />
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-12 grid grid-cols-3 gap-6 text-center"
                >
                    <div className="p-4">
                        <Shield className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900">Blockchain Verified</p>
                        <p className="text-xs text-gray-500">Immutable records</p>
                    </div>
                    <div className="p-4">
                        <Leaf className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900">Farm to Table</p>
                        <p className="text-xs text-gray-500">Complete journey</p>
                    </div>
                    <div className="p-4">
                        <QrCode className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900">Instant Access</p>
                        <p className="text-xs text-gray-500">Scan & verify</p>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white/50 mt-12">
                <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-gray-500">
                    <p>© 2024 Cherry Pick Zambia. Powered by AgroChain360.</p>
                </div>
            </footer>
        </div>
    );
}
