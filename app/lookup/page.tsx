"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Shield, ArrowRight, Package, MapPin, Scan, Leaf, ChevronRight } from "lucide-react";
import Link from "next/link";

/* ── palette + fonts (matches LandingPage) ── */
const C = {
    deep: "#020503",
    surface: "#07120a",
    white: "#ffffff",
    primary: "#e0e7e3",
    secondary: "#9aa89d",
    muted: "#5b6b5e",
    accent: "#4ade80",
    accentDim: "#7a9c7b",
    border: "rgba(255,255,255,0.08)",
    borderG: "rgba(74,222,128,0.15)",
};
const FD = "'Playfair Display', serif";
const FS = "'Inter', sans-serif";
const FM = "'Space Mono', monospace";

const injectStyles = () => {
    if (typeof window === "undefined") return;
    if (document.getElementById("cp-lookup-v2")) return;
    const s = document.createElement("style");
    s.id = "cp-lookup-v2";
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
    .cp-lookup *{box-sizing:border-box}
    @keyframes pulseDot{0%,100%{opacity:.3}50%{opacity:1}}
    @keyframes slowPan{0%{transform:scale(1.05) translate(0,0)}100%{transform:scale(1.12) translate(-1%,2%)}}
    .cp-lookup .cp-dot{width:6px;height:6px;background:#4ade80;border-radius:50%;display:inline-block;animation:pulseDot 2s infinite}
    .cp-lookup .cp-btn{display:inline-flex;align-items:center;justify-content:center;padding:1rem 2.5rem;background:transparent;color:#fff;font-family:'Inter',sans-serif;font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;text-decoration:none;border:1px solid #fff;cursor:pointer;position:relative;overflow:hidden;transition:color .4s cubic-bezier(.19,1,.22,1)}
    .cp-lookup .cp-btn::before{content:'';position:absolute;inset:0;background:#fff;transform:scaleY(0);transform-origin:bottom;transition:transform .4s cubic-bezier(.19,1,.22,1);z-index:0}
    .cp-lookup .cp-btn:hover{color:#020503}
    .cp-lookup .cp-btn:hover::before{transform:scaleY(1)}
    .cp-lookup .cp-btn span{position:relative;z-index:1;display:inline-flex;align-items:center;gap:8px}
    .cp-lookup .cp-btn-accent{border-color:#4ade80;color:#4ade80}
    .cp-lookup .cp-btn-accent::before{background:#4ade80}
    .cp-lookup .cp-btn-accent:hover{color:#020503}
    .cp-lookup input::placeholder{color:#5b6b5e}
    .cp-lookup input:focus{outline:none}
    @media(max-width:768px){
      .cp-lookup .cp-demo-grid{grid-template-columns:1fr !important}
    }
    `;
    document.head.appendChild(s);
};

export default function LookupPage() {
    const [batchCode, setBatchCode] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        injectStyles();
        return () => { const el = document.getElementById("cp-lookup-v2"); if (el) el.remove(); };
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batchCode.trim()) {
            setError("Please enter a batch code");
            return;
        }
        setIsSearching(true);
        setError("");
        setTimeout(() => {
            router.push(`/trace/${batchCode.trim().toUpperCase()}`);
        }, 500);
    };

    const demoBatches = [
        { code: "CP-A3K9M2", crop: "Mangoes", farmer: "John Mwale", region: "Eastern Province" },
        { code: "B-M4R9P7Q3", crop: "Tomatoes", farmer: "Mary Banda", region: "Lusaka Province" },
        { code: "CP-P7Q3N8", crop: "Pineapples", farmer: "Peter Phiri", region: "Northern Province" },
    ];

    const features = [
        { icon: "🌿", label: "Farm Origin", desc: "See exactly where your food was grown" },
        { icon: "🔬", label: "Quality Data", desc: "AI-verified crop health diagnostics" },
        { icon: "⛓️", label: "Blockchain", desc: "Immutable records on Base L2" },
        { icon: "🚛", label: "Full Journey", desc: "Track every step to your table" },
    ];

    return (
        <div className="cp-lookup" style={{ background: C.deep, minHeight: "100vh", color: C.white, fontFamily: FS, position: "relative", overflow: "hidden" }}>
            {/* Subtle background image */}
            <div style={{ position: "fixed", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=40')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.04, pointerEvents: "none" }} />
            <div style={{ position: "fixed", inset: 0, background: `linear-gradient(180deg, ${C.deep} 0%, transparent 40%, transparent 60%, ${C.deep} 100%)`, pointerEvents: "none" }} />

            {/* Navigation */}
            <nav style={{ position: "relative", zIndex: 50, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🍒</div>
                        <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 14, letterSpacing: 2, color: C.white }}>CHERRY PICK</span>
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                        <Link href="/" style={{ fontFamily: FS, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: C.secondary, textDecoration: "none", fontWeight: 500 }}>Home</Link>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(74,222,128,0.08)", border: `1px solid ${C.borderG}`, borderRadius: 20, padding: "6px 14px" }}>
                            <div className="cp-dot" />
                            <span style={{ fontFamily: FM, fontSize: 10, letterSpacing: 2, color: C.accent }}>VERIFIED</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 40px" }}>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                    {/* Label */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                        <div style={{ width: 40, height: 1, background: C.accent }} />
                        <span style={{ fontFamily: FM, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent }}>Traceability Portal</span>
                    </div>

                    {/* Title */}
                    <h1 style={{ fontFamily: FD, fontSize: "clamp(42px, 6vw, 72px)", fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.02em", color: C.white, margin: "0 0 24px", maxWidth: 700 }}>
                        Trace Your<br />
                        <span style={{ fontStyle: "italic", color: C.accent }}>Product Journey</span>
                    </h1>

                    <p style={{ fontFamily: FS, fontSize: 17, lineHeight: 1.7, color: C.secondary, fontWeight: 300, maxWidth: 520, margin: "0 0 48px" }}>
                        Enter the batch code from your product packaging to reveal its complete farm-to-shelf story, verified on blockchain.
                    </p>
                </motion.div>

                {/* Search Form */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}>
                    <form onSubmit={handleSearch} style={{ maxWidth: 640, marginBottom: 16 }}>
                        <div style={{ display: "flex", gap: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 0, overflow: "hidden" }}>
                            <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                                <Scan style={{ position: "absolute", left: 20, width: 18, height: 18, color: C.muted }} />
                                <input
                                    type="text"
                                    value={batchCode}
                                    onChange={(e) => { setBatchCode(e.target.value.toUpperCase()); setError(""); }}
                                    placeholder="ENTER BATCH CODE"
                                    style={{
                                        width: "100%", padding: "22px 20px 22px 52px",
                                        background: "transparent", border: "none", color: C.white,
                                        fontFamily: FM, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase",
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="cp-btn cp-btn-accent"
                                style={{ borderRadius: 0, border: "none", borderLeft: `1px solid ${C.border}`, padding: "22px 32px", minWidth: 160 }}
                            >
                                <span>
                                    {isSearching ? (
                                        <>
                                            <div style={{ width: 14, height: 14, border: "2px solid rgba(74,222,128,0.3)", borderTop: "2px solid #4ade80", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                            Tracing
                                        </>
                                    ) : (
                                        <>
                                            <Search style={{ width: 14, height: 14 }} />
                                            Track
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </form>
                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontFamily: FS, fontSize: 13, color: "#f87171", marginTop: 12 }}>
                            {error}
                        </motion.p>
                    )}
                </motion.div>

                {/* Divider */}
                <div style={{ maxWidth: 640, display: "flex", alignItems: "center", gap: 16, margin: "48px 0 40px" }}>
                    <div style={{ height: 1, flex: 1, background: C.border }} />
                    <span style={{ fontFamily: FM, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted }}>Or Try a Demo</span>
                    <div style={{ height: 1, flex: 1, background: C.border }} />
                </div>

                {/* Demo Batches */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}>
                    <div className="cp-demo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, maxWidth: 640 }}>
                        {demoBatches.map((batch, i) => (
                            <motion.button
                                key={batch.code}
                                whileHover={{ y: -2 }}
                                onClick={() => setBatchCode(batch.code)}
                                style={{
                                    background: "transparent",
                                    border: `1px solid ${C.border}`,
                                    padding: "20px",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "all 0.4s cubic-bezier(0.19, 1, 0.22, 1)",
                                    position: "relative",
                                    overflow: "hidden",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderG; e.currentTarget.style.background = "rgba(74,222,128,0.03)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "transparent"; }}
                            >
                                <p style={{ fontFamily: FM, fontSize: 12, color: C.accent, letterSpacing: "0.05em", marginBottom: 10, fontWeight: 700 }}>{batch.code}</p>
                                <p style={{ fontFamily: FD, fontSize: 18, color: C.white, fontWeight: 500, marginBottom: 8 }}>{batch.crop}</p>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <MapPin style={{ width: 10, height: 10, color: C.muted }} />
                                    <span style={{ fontFamily: FS, fontSize: 11, color: C.muted }}>{batch.farmer}</span>
                                </div>
                                <ChevronRight style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: C.muted, opacity: 0.3 }} />
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Features Grid */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} style={{ marginTop: 80, maxWidth: 640 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                        <span style={{ fontFamily: FM, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.muted }}>What You'll Discover</span>
                        <div style={{ height: 1, flex: 1, background: C.border }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: C.border }}>
                        {features.map((f, i) => (
                            <div key={i} style={{ background: C.deep, padding: "28px 24px" }}>
                                <span style={{ fontSize: 24, display: "block", marginBottom: 14 }}>{f.icon}</span>
                                <p style={{ fontFamily: FS, fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 6, letterSpacing: "0.02em" }}>{f.label}</p>
                                <p style={{ fontFamily: FS, fontSize: 12, color: C.muted, lineHeight: 1.5, fontWeight: 300 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <footer style={{ position: "relative", zIndex: 10, borderTop: `1px solid ${C.border}`, marginTop: 80 }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>🍒</div>
                        <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, color: C.muted }}>CHERRY PICK</span>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        {["BASE L2", "IPFS", "AGROCHAIN 360"].map((t) => (
                            <span key={t} style={{ fontFamily: FM, fontSize: 9, letterSpacing: "0.1em", color: C.muted, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, padding: "4px 10px" }}>{t}</span>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}
