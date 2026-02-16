"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { QrCode, Search, Leaf, Shield, MapPin, ArrowRight, Package, Grid, CheckCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";

/* ─────────────────────────────── STYLES (Copied from LandingPage for consistency) ─────────────────────────────── */
const injectStyles = () => {
    if (typeof window === "undefined") return;
    if (document.getElementById("cp-lookup-styles")) return;
    const style = document.createElement("style");
    style.id = "cp-lookup-styles";
    style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

    @keyframes aurora {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    @keyframes grain {
      0%, 100% { transform: translate(0, 0); }
      10% { transform: translate(-5%, -10%); }
      30% { transform: translate(3%, -5%); }
      50% { transform: translate(-5%, 5%); }
      70% { transform: translate(5%, 5%); }
      90% { transform: translate(-3%, 3%); }
    }
    @keyframes gradient-text {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .cp-landing * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    .cp-landing h1, .cp-landing h2, .cp-landing h3 { font-family: 'Space Grotesk', 'Inter', sans-serif; }
    
    html, body {
      background-color: #0d1910;
      margin: 0; padding: 0; min-height: 100vh;
    }

    .cp-aurora-bg {
      background: linear-gradient(135deg, #0f1f15 0%, #132b1c 20%, #0e2218 40%, #153524 60%, #0d1e13 80%, #0f1f15 100%);
      background-size: 300% 300%;
      animation: aurora 60s ease infinite;
    }

    .cp-grain::after {
      content: '';
      position: absolute;
      inset: -200%;
      background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
      animation: grain 8s steps(10) infinite;
      pointer-events: none;
      z-index: 1;
    }

    .cp-glass-card {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(40px) saturate(180%);
      -webkit-backdrop-filter: blur(40px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .cp-glass-card:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(16, 185, 129, 0.2);
    }

    .cp-input {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      transition: all 0.3s ease;
    }
    .cp-input:focus {
      background: rgba(0, 0, 0, 0.3);
      border-color: rgba(16, 185, 129, 0.5);
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
    }

    .cp-gradient-text {
      background: linear-gradient(135deg, #6ee7b7 0%, #34d399 25%, #10b981 50%, #059669 75%, #6ee7b7 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradient-text 4s linear infinite;
    }

    .cp-btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
      transition: all 0.3s ease;
    }
    .cp-btn-primary:hover {
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
      transform: translateY(-2px);
    }
  `;
    document.head.appendChild(style);
};

export default function LookupPage() {
    const [batchCode, setBatchCode] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        injectStyles();
    }, []);

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
        { code: "CP-A3K9M2", crop: "Mangoes", farmer: "John Mwale" },
        { code: "B-M4R9P7Q3", crop: "Tomatoes", farmer: "Mary Banda" },
        { code: "CP-P7Q3N8", crop: "Pineapples", farmer: "Peter Phiri" },
    ];

    return (
        <div className="cp-landing flex flex-col min-h-screen bg-[#0d1910] text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden cp-aurora-bg cp-grain pointer-events-none" />
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[600px] h-[600px] rounded-full bg-emerald-500/20 blur-[120px] -top-20 -left-20" />
                <div className="absolute w-[500px] h-[500px] rounded-full bg-teal-500/20 blur-[100px] bottom-0 right-0" />
                <div className="absolute w-[400px] h-[400px] rounded-full bg-emerald-400/10 blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Header */}
            <header className="relative z-50 border-b border-white/5 bg-black/20 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-full group-hover:bg-emerald-500/30 transition-all" />
                            <img src="/logo-new.png" alt="Cherry Pick" className="h-10 w-auto relative z-10" />
                        </div>
                    </Link>
                    <div className="flex items-center space-x-2 text-sm text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        <Shield className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Blockchain Verified</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-6 md:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-3xl mx-auto text-center"
                >
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 mb-8 backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
                        <QrCode className="h-10 w-10 text-emerald-400" />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        <span className="text-white">Trace Your</span> <span className="text-white font-extrabold">Product</span>
                    </h1>
                    <p className="text-lg text-white/60 max-w-xl mx-auto mb-12 leading-relaxed">
                        Enter the batch code from your product packaging to see its complete journey from farm to your table.
                    </p>

                    {/* Search Form */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="cp-glass-card rounded-3xl p-2 md:p-3 mb-10 max-w-2xl mx-auto shadow-2xl"
                    >
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
                            <div className="flex-1 relative group">
                                <Package className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                                <input
                                    type="text"
                                    value={batchCode}
                                    onChange={(e) => {
                                        setBatchCode(e.target.value.toUpperCase());
                                        setError("");
                                    }}
                                    placeholder="e.g., CP-A3K9M2"
                                    className="w-full pl-14 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:bg-black/40 focus:border-emerald-500/50 transition-all font-mono uppercase text-lg"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="px-8 py-4 cp-btn-primary rounded-2xl font-bold text-white tracking-wide uppercase text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed min-w-[140px]"
                            >
                                {isSearching ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Tracing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-4 w-4" />
                                        <span>Track</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="mt-4 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg inline-block border border-red-500/20"
                        >
                            {error}
                        </motion.p>
                    )}

                    {/* Recent/Demo Batches */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-12"
                    >
                        <h3 className="text-sm font-semibold uppercase tracking-widest mb-6"><span className="text-white">Try a Demo Batch</span></h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {recentBatches.map((batch, i) => (
                                <button
                                    key={batch.code}
                                    onClick={() => setBatchCode(batch.code)}
                                    className="cp-glass-card p-5 rounded-2xl text-left group hover:bg-white/5 transition-all text-white/80 hover:text-white"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-mono text-sm font-bold text-emerald-400 group-hover:text-emerald-300">{batch.code}</p>
                                        <ArrowRight className="h-3 w-3 text-white/20 group-hover:text-white/60 transform group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">{batch.crop}</p>
                                        <div className="flex items-center gap-1.5 text-xs text-white/40">
                                            <MapPin className="h-3 w-3" />
                                            {batch.farmer}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-8 border-t border-white/5 bg-black/20">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <p className="text-white/20 text-xs">&copy; 2026 Cherry Pick. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
