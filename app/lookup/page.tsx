"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Shield, ArrowRight, Package, MapPin, Scan, Leaf, FlaskConical, Link2, Truck, QrCode, CheckCircle2, TrendingUp, Users, Globe2, Sparkles } from "lucide-react";
import Link from "next/link";

/* palette + fonts (matches Landing Page) */
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
    green: "#2d5a41",
};
const FD = "'Playfair Display', serif";
const FS = "'Inter', sans-serif";
const FM = "'Space Mono', monospace";

const DEFAULT_FARM_IMG = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80";

/** Pull the province/region label from a free-text address ("Chongwe, Lusaka Province" -> "Lusaka Province"). */
function provinceOf(address?: string | null): string {
    if (!address) return "";
    const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "";
}

const meta: React.CSSProperties = { fontFamily: FM, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted };
const serif: React.CSSProperties = { fontFamily: FD, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.02em", color: C.white };
const body: React.CSSProperties = { fontFamily: FS, fontSize: "1rem", lineHeight: 1.65, color: C.secondary, fontWeight: 300 };

const injectStyles = () => {
    if (typeof window === "undefined") return;
    if (document.getElementById("cp-lookup-v2")) return;
    const s = document.createElement("style");
    s.id = "cp-lookup-v2";
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
    .cp-lookup *{box-sizing:border-box}
    @keyframes pulseDot{0%,100%{opacity:.3}50%{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .cp-lookup .cp-dot{width:6px;height:6px;background:#4ade80;border-radius:50%;display:inline-block;animation:pulseDot 2s infinite}
    .cp-lookup .cp-nav-link{position:relative;text-decoration:none;color:#9aa89d;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;font-family:'Inter',sans-serif;font-weight:500;transition:color .3s}
    .cp-lookup .cp-nav-link:hover{color:#fff}
    .cp-lookup .cp-btn{display:inline-flex;align-items:center;justify-content:center;padding:1rem 2.5rem;background:transparent;color:#fff;font-family:'Inter',sans-serif;font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;text-decoration:none;border:1px solid #fff;cursor:pointer;position:relative;overflow:hidden;transition:color .4s cubic-bezier(.19,1,.22,1);font-weight:600}
    .cp-lookup .cp-btn::before{content:'';position:absolute;inset:0;background:#fff;transform:scaleY(0);transform-origin:bottom;transition:transform .4s cubic-bezier(.19,1,.22,1);z-index:0}
    .cp-lookup .cp-btn:hover{color:#020503}
    .cp-lookup .cp-btn:hover::before{transform:scaleY(1)}
    .cp-lookup .cp-btn span{position:relative;z-index:1;display:inline-flex;align-items:center;gap:8px}
    .cp-lookup .cp-btn-accent{border-color:#4ade80;color:#4ade80}
    .cp-lookup .cp-btn-accent::before{background:#4ade80}
    .cp-lookup .cp-btn-accent:hover{color:#020503}
    .cp-lookup input::placeholder{color:#5b6b5e}
    .cp-lookup input:focus{outline:none}
    @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    .cp-lookup .cp-marquee{display:flex;gap:24px;width:max-content;animation:marquee 45s linear infinite}
    .cp-lookup .cp-marquee:hover{animation-play-state:paused}
    .cp-lookup .cp-farmer-card{position:relative;flex-shrink:0;width:260px;height:340px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);border-radius:12px;transition:all .5s cubic-bezier(.19,1,.22,1)}
    .cp-lookup .cp-farmer-card:hover{border-color:rgba(74,222,128,0.3);transform:translateY(-4px)}
    .cp-lookup .cp-farmer-card img{width:100%;height:100%;object-fit:cover;filter:grayscale(10%) brightness(0.9);transition:all .6s ease}
    .cp-lookup .cp-farmer-card:hover img{filter:grayscale(0%) brightness(1);transform:scale(1.05)}
    .cp-lookup .cp-farmer-overlay{position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(2,5,3,0.95) 100%);display:flex;flex-direction:column;justify-content:flex-end;padding:24px}
    .cp-lookup .cp-stat-num{font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3.5rem);font-weight:500;line-height:1;color:#4ade80;letter-spacing:-0.02em}
    .cp-lookup .cp-step{position:relative;padding:32px 28px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);border-radius:12px;transition:all .4s ease}
    .cp-lookup .cp-step:hover{border-color:rgba(74,222,128,0.2);background:rgba(255,255,255,0.04)}
    .cp-lookup .cp-step-num{position:absolute;top:16px;right:20px;font-family:'Playfair Display',serif;font-size:40px;font-weight:500;color:rgba(255,255,255,0.06)}
    .cp-lookup .cp-search-row{display:flex;gap:0}
    .cp-lookup .cp-search-btn{border-left:1px solid rgba(255,255,255,0.08)}
    @media(max-width:1024px){
      .cp-lookup .cp-impact-grid{grid-template-columns:repeat(2,1fr) !important}
      .cp-lookup .cp-steps-grid{grid-template-columns:1fr !important}
    }
    @media(max-width:768px){
      .cp-lookup .cp-features-grid{grid-template-columns:1fr !important}
      .cp-lookup .cp-impact-grid{grid-template-columns:1fr !important}
      .cp-lookup .cp-farmer-card{width:220px;height:300px}
      .cp-lookup .cp-hero{padding:48px 24px 32px !important}
      .cp-lookup .cp-section{padding-left:24px !important;padding-right:24px !important}
      .cp-lookup .cp-search-row{flex-direction:column !important}
      .cp-lookup .cp-search-btn{width:100% !important;min-width:unset !important;border-left:none !important;border-top:1px solid rgba(255,255,255,0.08) !important;padding:18px 32px !important}
    }
    `;
    document.head.appendChild(s);
};

export default function LookupPage() {
    const [batchCode, setBatchCode] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState("");
    const [liveFarmers, setLiveFarmers] = useState<{ name: string; crop: string; region: string; img: string }[] | null>(null);
    const [stats, setStats] = useState<{ farmers: number; batches: number; provinces: number; verifiedPct: number } | null>(null);
    const router = useRouter();

    useEffect(() => {
        injectStyles();
        return () => { const el = document.getElementById("cp-lookup-v2"); if (el) el.remove(); };
    }, []);

    // Pull live platform data so the portal reflects real farmers and actual counts.
    useEffect(() => {
        (async () => {
            try {
                const { supabase } = await import("@/lib/supabase");
                if (!supabase) return;
                const [farmersRes, batchCountRes] = await Promise.all([
                    supabase.from("farmers").select("name, crops, location_address, profile_photo, verified, status").order("created_at", { ascending: false }).limit(80),
                    supabase.from("batches").select("id", { count: "exact", head: true }),
                ]);
                const all = farmersRes.data || [];
                const provinces = new Set(all.map((f: any) => provinceOf(f.location_address)).filter(Boolean));
                const verifiedCount = all.filter((f: any) => f.verified).length;
                const verifiedPct = all.length ? Math.round((verifiedCount / all.length) * 1000) / 10 : 0;
                setStats({
                    farmers: all.length,
                    batches: batchCountRes.count || 0,
                    provinces: provinces.size,
                    verifiedPct,
                });

                // Prefer approved/verified farmers for the public carousel.
                const visible = all.filter((f: any) => f.verified || f.status === "approved");
                const source = (visible.length ? visible : all).filter((f: any) => f.name);
                if (source.length > 0) {
                    setLiveFarmers(source.map((f: any) => ({
                        name: f.name,
                        crop: (Array.isArray(f.crops) && f.crops[0]) ? f.crops[0] : "Produce",
                        region: provinceOf(f.location_address) || "Zambia",
                        img: f.profile_photo || DEFAULT_FARM_IMG,
                    })));
                }
            } catch {
                /* keep editorial fallbacks if live data is unavailable */
            }
        })();
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

    const features = [
        { Icon: Leaf, label: "Farm Origin", desc: "See exactly where your food was grown" },
        { Icon: FlaskConical, label: "Quality Data", desc: "AI-verified crop health diagnostics" },
        { Icon: Link2, label: "Blockchain", desc: "Immutable records on Base L2" },
        { Icon: Truck, label: "Full Journey", desc: "Track every step to your table" },
    ];

    const farmers = [
        { name: "John Mwale", crop: "Mangoes", region: "Eastern Province", img: "https://images.unsplash.com/photo-1595397551630-8a3d9eb9cf8c?auto=format&fit=crop&w=600&q=80" },
        { name: "Mary Banda", crop: "Tomatoes", region: "Lusaka Province", img: "https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b1b?auto=format&fit=crop&w=600&q=80" },
        { name: "Peter Phiri", crop: "Pineapples", region: "Northern Province", img: "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&w=600&q=80" },
        { name: "Grace Tembo", crop: "Maize", region: "Central Province", img: "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=600&q=80" },
        { name: "Joseph Zulu", crop: "Groundnuts", region: "Southern Province", img: "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=600&q=80" },
        { name: "Esther Ngoma", crop: "Cassava", region: "Luapula Province", img: "https://images.unsplash.com/photo-1621264448270-9ef00e88a987?auto=format&fit=crop&w=600&q=80" },
        { name: "Samuel Chanda", crop: "Soya Beans", region: "Muchinga Province", img: "https://images.unsplash.com/photo-1621460248083-6271cc4437a8?auto=format&fit=crop&w=600&q=80" },
        { name: "Ruth Mulenga", crop: "Sweet Potato", region: "Copperbelt", img: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80" },
    ];

    // Live where available; fall back to a neutral placeholder while loading.
    const impact = [
        { Icon: Users, num: stats ? stats.farmers.toLocaleString() : "—", label: "Farmers Empowered" },
        { Icon: Package, num: stats ? stats.batches.toLocaleString() : "—", label: "Batches Traced" },
        { Icon: Globe2, num: stats ? String(stats.provinces) : "—", label: "Provinces Covered" },
        { Icon: CheckCircle2, num: stats && stats.farmers > 0 ? `${stats.verifiedPct}%` : "—", label: "Verification Rate" },
    ];

    // Show real registered farmers when we have them, otherwise editorial samples.
    const displayFarmers = liveFarmers && liveFarmers.length > 0 ? liveFarmers : farmers;

    const steps = [
        { Icon: QrCode, title: "Scan or Enter Code", desc: "Find the batch code printed on your product's packaging or scan the QR label." },
        { Icon: Sparkles, title: "Reveal the Story", desc: "Watch the complete farm-to-shelf journey unfold, from planting to your plate." },
        { Icon: Shield, title: "Verified on Chain", desc: "Every milestone is cryptographically signed and stored immutably on Base L2." },
    ];

    return (
        <div className="cp-lookup" style={{ background: C.deep, minHeight: "100vh", color: C.white, fontFamily: FS, position: "relative", overflowX: "hidden" }}>
            <div style={{ position: "fixed", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=40')", backgroundSize: "cover", backgroundPosition: "center top", opacity: 0.14, pointerEvents: "none" }} />
            <div style={{ position: "fixed", inset: 0, background: `linear-gradient(180deg, rgba(2,5,3,0.5) 0%, rgba(2,5,3,0.28) 28%, rgba(2,5,3,0.42) 55%, ${C.deep} 100%)`, pointerEvents: "none" }} />

            {/* Navigation */}
            <nav style={{ position: "relative", zIndex: 50, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Link href="/" style={{ textDecoration: "none" }}>
                        <img src="/logo-new.png" alt="AgroChain 360" style={{ height: 36, width: "auto", objectFit: "contain" }} />
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                        <Link href="/" className="cp-nav-link">Home</Link>
                        <Link href="/signin" className="cp-nav-link" style={{ border: "1px solid rgba(255,255,255,0.3)", padding: "8px 20px", fontSize: "0.7rem", color: C.white }}>Join Network</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="cp-hero" style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 40px" }}>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                    <span style={{ ...meta, color: C.accent, display: "block", marginBottom: 24 }}>Thank you for choosing Cherry-Pick</span>

                    <h1 style={{ ...serif, fontSize: "clamp(2.5rem, 6vw, 4.5rem)", margin: "0 0 24px", maxWidth: 720 }}>
                        Every Pack Has<br />
                        <em style={{ fontStyle: "italic", color: C.accent }}>A Story.</em>
                    </h1>

                    <p style={{ ...body, maxWidth: 560, margin: "0 0 20px", fontSize: "1.05rem", color: C.primary }}>
                        Every better choice creates healthier lifestyles, supports local farmers and contributes to a more resilient food system. This pack has travelled an incredible journey before reaching your hands — let&apos;s discover it together.
                    </p>

                    <p style={{ ...body, maxWidth: 520, margin: "0 0 48px" }}>
                        Enter the batch code from your product packaging to reveal its complete farm-to-shelf story, verified on blockchain.
                    </p>
                </motion.div>

                {/* Search Form */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}>
                    <form onSubmit={handleSearch} style={{ maxWidth: 640, marginBottom: 16 }}>
                        <div className="cp-search-row" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, overflow: "hidden" }}>
                            <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", minWidth: 0 }}>
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
                                className="cp-btn cp-btn-accent cp-search-btn"
                                style={{ borderRadius: 0, border: "none", padding: "22px 32px", minWidth: 160 }}
                            >
                                <span>
                                    {isSearching ? (
                                        <>
                                            <div style={{ width: 14, height: 14, border: "2px solid rgba(2,5,3,0.3)", borderTop: "2px solid #020503", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
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

                {/* Features Grid */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} style={{ marginTop: 80, maxWidth: 640 }}>
                    <span style={{ ...meta, display: "block", marginBottom: 24 }}>What You&apos;ll Discover</span>
                    <div className="cp-features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: C.border }}>
                        {features.map((f, i) => {
                            const Icon = f.Icon;
                            return (
                                <div key={i} style={{ background: C.deep, padding: "28px 24px", transition: "background 0.3s" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(74,222,128,0.04)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = C.deep; }}>
                                    <Icon style={{ width: 22, height: 22, color: C.accent, marginBottom: 14, strokeWidth: 1.5 }} />
                                    <p style={{ fontFamily: FS, fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 6, letterSpacing: "0.02em" }}>{f.label}</p>
                                    <p style={{ fontFamily: FS, fontSize: 12, color: C.muted, lineHeight: 1.5, fontWeight: 300 }}>{f.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Farmer Carousel */}
            <div style={{ position: "relative", zIndex: 10, marginTop: 80, paddingBottom: 20, background: C.surface, borderTop: `1px solid ${C.border}` }}>
                <div className="cp-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px 40px" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
                        <div>
                            <span style={{ ...meta, color: C.accent, display: "block", marginBottom: 16 }}>Meet the Growers</span>
                            <h2 style={{ ...serif, fontSize: "clamp(2rem, 4vw, 3rem)", margin: 0, maxWidth: 560 }}>
                                The Hands Behind<br /><em style={{ fontStyle: "italic", color: C.accent }}>Every Harvest</em>
                            </h2>
                        </div>
                        <p style={{ ...body, fontSize: 14, maxWidth: 320, margin: 0 }}>
                            Real smallholder farmers across Zambia, verified on-chain and directly connected to your table.
                        </p>
                    </div>
                </div>

                <div style={{ position: "relative", overflow: "hidden", maskImage: "linear-gradient(90deg, transparent, #020503 8%, #020503 92%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #020503 8%, #020503 92%, transparent)" }}>
                    <div className="cp-marquee">
                        {[...displayFarmers, ...displayFarmers].map((f, i) => (
                            <div key={i} className="cp-farmer-card">
                                <img src={f.img} alt={f.name} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80"; }} />
                                <div className="cp-farmer-overlay">
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(74,222,128,0.1)", border: `1px solid ${C.borderG}`, borderRadius: 20, padding: "4px 10px", marginBottom: 12, alignSelf: "flex-start" }}>
                                        <span className="cp-dot" style={{ width: 5, height: 5 }} />
                                        <span style={{ fontFamily: FM, fontSize: 9, letterSpacing: 1.5, color: C.accent }}>VERIFIED</span>
                                    </div>
                                    <p style={{ fontFamily: FD, fontSize: 22, color: C.white, fontWeight: 500, margin: "0 0 4px" }}>{f.name}</p>
                                    <p style={{ fontFamily: FS, fontSize: 12, color: C.accent, margin: "0 0 8px", letterSpacing: "0.05em" }}>{f.crop.toUpperCase()}</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <MapPin style={{ width: 11, height: 11, color: C.muted }} />
                                        <span style={{ fontFamily: FS, fontSize: 11, color: C.secondary }}>{f.region}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Our Impact */}
            <div className="cp-section" style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 40px" }}>
                <span style={{ ...meta, color: C.accent, display: "block", marginBottom: 16 }}>Our Impact</span>
                <h2 style={{ ...serif, fontSize: "clamp(2rem, 4vw, 3rem)", margin: "0 0 48px", maxWidth: 640 }}>
                    Building trust,<br /><em style={{ fontStyle: "italic", color: C.accent }}>one batch at a time.</em>
                </h2>
                <div className="cp-impact-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: C.border, border: `1px solid ${C.border}` }}>
                    {impact.map((s, i) => {
                        const Icon = s.Icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.6 }}
                                style={{ background: C.deep, padding: "32px 24px", display: "flex", flexDirection: "column", gap: 12 }}
                            >
                                <Icon style={{ width: 20, height: 20, color: C.accentDim, strokeWidth: 1.5 }} />
                                <p className="cp-stat-num">{s.num}</p>
                                <p style={{ fontFamily: FS, fontSize: 12, color: C.secondary, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, margin: 0 }}>{s.label}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* How It Works */}
            <div className="cp-section" style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 40px", background: C.surface, borderTop: `1px solid ${C.border}` }}>
                <span style={{ ...meta, color: C.accent, display: "block", marginBottom: 16 }}>How It Works</span>
                <h2 style={{ ...serif, fontSize: "clamp(2rem, 4vw, 3rem)", margin: "0 0 48px", maxWidth: 640 }}>
                    Three steps to full<br /><em style={{ fontStyle: "italic", color: C.accent }}>transparency.</em>
                </h2>
                <div className="cp-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                    {steps.map((s, i) => {
                        const Icon = s.Icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, duration: 0.6 }}
                                className="cp-step"
                            >
                                <span className="cp-step-num">0{i + 1}</span>
                                <Icon style={{ width: 24, height: 24, color: C.accent, strokeWidth: 1.5, marginBottom: 20 }} />
                                <p style={{ fontFamily: FD, fontSize: 22, color: C.white, fontWeight: 500, margin: "0 0 10px" }}>{s.title}</p>
                                <p style={{ ...body, fontSize: 13, margin: 0 }}>{s.desc}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Continue The Journey */}
            <div className="cp-section" style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 40px" }}>
                <span style={{ ...meta, color: C.accent, display: "block", marginBottom: 16 }}>Continue The Journey</span>
                <h2 style={{ ...serif, fontSize: "clamp(2rem, 4vw, 3rem)", margin: "0 0 48px", maxWidth: 640 }}>
                    Keep supporting<br /><em style={{ fontStyle: "italic", color: C.accent }}>local farmers.</em>
                </h2>
                <div className="cp-features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ background: "rgba(74,222,128,0.05)", border: `1px solid ${C.borderG}`, borderRadius: 12, padding: "36px 32px" }}>
                        <p style={{ fontFamily: FD, fontSize: 24, color: C.white, fontWeight: 500, margin: "0 0 8px" }}>Buy More Cherry-Pick</p>
                        <p style={{ ...body, fontSize: 14, margin: "0 0 24px" }}>Fresh, traceable snacks delivered from verified Zambian farms.</p>
                        <a href="https://cherrypickfoods.com/shop" target="_blank" rel="noopener noreferrer" className="cp-btn cp-btn-accent"><span>Shop Now <ArrowRight style={{ width: 14, height: 14 }} /></span></a>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "36px 32px" }}>
                        <p style={{ fontFamily: FD, fontSize: 24, color: C.white, fontWeight: 500, margin: "0 0 8px" }}>Buy Direct From Farmers</p>
                        <p style={{ ...body, fontSize: 14, margin: "0 0 24px" }}>Explore fresh produce available through the AgroChain 360 Marketplace.</p>
                        <Link href="/marketplace" className="cp-btn"><span>Visit Marketplace <ArrowRight style={{ width: 14, height: 14 }} /></span></Link>
                    </div>
                </div>
            </div>

            {/* Join The Cherry-Pick Lifestyle */}
            <div className="cp-section" style={{ position: "relative", zIndex: 10, background: C.surface, borderTop: `1px solid ${C.border}` }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px 40px", textAlign: "center" }}>
                    <span style={{ ...meta, color: C.accent, display: "block", marginBottom: 16 }}>The Cherry-Pick Lifestyle</span>
                    <h2 style={{ ...serif, fontSize: "clamp(2.2rem, 5vw, 3.4rem)", margin: "0 auto 20px", maxWidth: 640 }}>
                        Choose Better. <em style={{ fontStyle: "italic", color: C.accent }}>Live Better.</em>
                    </h2>
                    <p style={{ ...body, fontSize: 15, margin: "0 auto 36px", maxWidth: 560 }}>
                        Small choices shape healthier lives. Follow us for recipes, healthy-living inspiration and stories from the farmers growing your food.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        {[
                            { label: "Instagram", href: "https://instagram.com/cherrypickfoods" },
                            { label: "Facebook", href: "https://facebook.com/cherrypickfoods" },
                            { label: "TikTok", href: "https://tiktok.com/@cherrypickfoods" },
                            { label: "WhatsApp", href: "https://wa.me/260000000000" },
                            { label: "Newsletter", href: "https://cherrypickfoods.com" },
                        ].map((s) => (
                            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                                style={{ textDecoration: "none", fontFamily: FS, fontSize: 13, fontWeight: 500, color: C.primary, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 999, padding: "12px 22px", transition: "all .3s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderG; e.currentTarget.style.color = C.accent; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.primary; }}>
                                {s.label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Strip */}
            <div className="cp-section" style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "80px 32px 40px" }}>
                <div style={{ border: `1px solid ${C.borderG}`, background: "rgba(74,222,128,0.04)", padding: "48px 40px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
                    <div style={{ maxWidth: 560 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <TrendingUp style={{ width: 14, height: 14, color: C.accent }} />
                            <span style={{ ...meta, color: C.accent, fontSize: 10 }}>For Brands &amp; Retailers</span>
                        </div>
                        <h3 style={{ ...serif, fontSize: "clamp(1.5rem, 3vw, 2rem)", margin: "0 0 12px" }}>
                            Source with <em style={{ fontStyle: "italic", color: C.accent }}>confidence.</em>
                        </h3>
                        <p style={{ ...body, fontSize: 14, margin: 0 }}>
                            Bring verified provenance to your shelves. Join the cooperatives, aggregators and retailers already using Cherry Pick.
                        </p>
                    </div>
                    <Link href="/" className="cp-btn cp-btn-accent"><span>Partner with us <ArrowRight style={{ width: 14, height: 14 }} /></span></Link>
                </div>
            </div>

            {/* Footer */}
            <footer style={{ position: "relative", zIndex: 10, borderTop: `1px solid ${C.border}`, marginTop: 40 }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px" }}>
                    <Link href="/" style={{ textDecoration: "none" }}>
                        <img src="/logo-new.png" alt="AgroChain 360" style={{ height: 28, width: "auto", objectFit: "contain" }} />
                    </Link>
                </div>
            </footer>
        </div>
    );
}
