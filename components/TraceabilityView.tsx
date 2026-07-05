"use client";

import { useState, useEffect, useRef } from "react";
import { TraceabilityEvent, Batch } from "@/lib/traceabilityService";
import { recordScan } from "@/lib/qrAnalytics";
import ComplaintModal from "@/components/ComplaintModal";

interface TraceabilityViewProps {
  batch: Batch;
  events: TraceabilityEvent[];
  farmer?: {
    name: string;
    location_address?: string;
    farm_size?: number;
    verified?: boolean;
    profile_photo?: string | null;
    bio?: string | null;
    years_farming?: number | null;
  };
  contract?: {
    contract_code: string;
    crop_type: string;
    variety?: string;
    status: string;
  };
  isPublic?: boolean;
}

const MANGO_ORANGE = "#020503";
const LEAF_GREEN = "#4ade80";
const CREAM = "rgba(255,255,255,0.04)";
const SOIL = "#5b6b5e";
const DARK = "#020503";
const LIME = "#4ade80";
const SURFACE = "#07120a";
const SECONDARY = "#9aa89d";

const DEFAULT_IMG_HERO = "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
const LOGO_SRC = "/logo-new.png";

function FarmerAvatar({ src, name }: { src?: string | null; name: string }) {
  const [errored, setErrored] = useState(false);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join("") || "?";

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setErrored(true)}
        style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${CREAM}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      aria-label={name}
      style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${MANGO_ORANGE}, #2d5a41)`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Playfair Display', serif",
        fontSize: 28,
        fontWeight: 800,
        border: `3px solid ${CREAM}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

const EVENT_EMOJIS: Record<string, string> = {
  planting: "🌱",
  growth_update: "🌿",
  input_application: "💧",
  irrigation: "💦",
  pest_control: "🛡️",
  harvest: "🧺",
  post_harvest_handling: "📦",
  quality_check: "🏅",
  storage: "🏭",
  aggregation: "🏢",
  transport_start: "🚛",
  transport_checkpoint: "📍",
  warehouse_arrival: "🏭",
  processing: "🔆",
  packaging: "📦",
  distribution: "🚚",
  retail_arrival: "🏪",
  verification: "✅",
  ai_diagnostic: "🤖",
};

const formatDateDayMonth = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

function Counter({ target, suffix = "", prefix = "", duration = 1400 }: { target: number; suffix?: string; prefix?: string; duration?: number }) {
  const [ref, inView] = useInView(0.4);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);
  return <span ref={ref as any}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

function MapZambia() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => { setTimeout(() => setPulse(true), 800); }, []);
  return (
    <div style={{ position: "relative", width: 80, height: 70, flexShrink: 0 }}>
      <svg viewBox="0 0 200 180" style={{ width: "100%", height: "100%", opacity: 0.9 }}>
        <path d="M60,20 L140,15 L165,45 L170,90 L155,130 L130,160 L90,165 L55,150 L30,110 L25,70 L40,35 Z" fill="#10B981" stroke="#059669" strokeWidth="2" />
        <path d="M80,60 L110,55 L125,75 L120,100 L100,115 L75,110 L62,90 L65,70 Z" fill="#34D399" />
      </svg>
      <div style={{
        position: "absolute", top: "38%", left: "60%",
        width: 8, height: 8, borderRadius: "50%",
        background: "#059669",
        animation: "pulse 2s infinite",
      }} />
      <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(5,150,105,0.4)} 50%{box-shadow:0 0 0 8px rgba(5,150,105,0)} } @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

export default function TraceabilityView({
  batch,
  events,
  farmer,
  contract,
  isPublic = false
}: TraceabilityViewProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [scanRef, setScanRef] = useState<string>("");
  const [stats, setStats] = useState<{ farmers: number; batches: number; scans: number; kgTraced: number; incomeSupported: number }>({ farmers: 0, batches: 0, scans: 0, kgTraced: 0, incomeSupported: 0 });

  let metadata: any = {};
  try {
    if (batch.ipfs_metadata) {
      metadata = JSON.parse(batch.ipfs_metadata);
    }
  } catch (e) {
    console.error("Error parsing metadata", e);
  }

  const heroImage = metadata.batch_image || metadata.productImage || DEFAULT_IMG_HERO;
  const farmerImage = farmer?.profile_photo || metadata.farmer_image || null;
  const cropType = metadata.productName || batch.crop_type || "Premium Produce";
  const variety = batch.variety || "Premium Quality";
  const location = farmer?.location_address || "Eastern Province, Zambia";
  const farmerName = farmer?.name || "Verified Smallholder";
  const farmSize = farmer?.farm_size || 0;
  const farmerExp = farmer?.years_farming ?? metadata.farmer_experience ?? "";

  // Compute accurate batch weight: prefer post-processing total weight from packaging info
  const computedWeight = (() => {
    if (typeof metadata.totalWeightKg === 'number' && metadata.totalWeightKg > 0) {
      return `${metadata.totalWeightKg} kg`;
    }
    if (Array.isArray(metadata.packagingSizes) && metadata.packagingSizes.length > 0) {
      const totalKg = metadata.packagingSizes.reduce((sum: number, p: any) => {
        const sizeKg = parseFloat(String(p.sizeKg ?? p.size ?? 0));
        const count = parseFloat(String(p.count ?? 0));
        if (!isFinite(sizeKg) || !isFinite(count)) return sum;
        return sum + sizeKg * count;
      }, 0);
      if (totalKg > 0) return `${totalKg.toFixed(2).replace(/\.0+$/, '')} kg`;
    }
    if (batch.total_quantity) return `${batch.total_quantity} ${batch.unit || 'kg'}`;
    return 'Not set';
  })();

  const specs = [
    { icon: "\uD83C\uDD94", label: "Batch ID", value: batch.batch_code },
    { icon: "\uD83D\uDCC5", label: "Production Date", value: metadata.productionDate ? formatDateDayMonth(metadata.productionDate) : (batch.harvest_date ? formatDateDayMonth(batch.harvest_date) : "Not set") },
    { icon: "\u231B", label: "Expiry Date", value: metadata.expiryDate ? formatDateDayMonth(metadata.expiryDate) : "Not set" },
    { icon: "\u2696\uFE0F", label: "Total Batch Weight", value: computedWeight },
  ];

  // Sort events chronologically (oldest first) so the journey flows in order
  const sortedEvents = [...events].sort((a, b) => {
    const ta = new Date(a.created_at || 0).getTime();
    const tb = new Date(b.created_at || 0).getTime();
    return ta - tb;
  });

  // Growth updates: farmer-logged events showing crop growth journey.
  const GROWTH_TYPES = new Set(['planting', 'growth_update', 'input_application', 'irrigation', 'pest_control', 'harvest']);
  const growthUpdates = sortedEvents.filter(e => e.actor_type === 'farmer' || GROWTH_TYPES.has(e.event_type as string));

  // Behind-the-scenes gallery: every photo captured along the journey plus any
  // curated batch/farmer imagery from metadata.
  const galleryPhotos = (() => {
    const set: string[] = [];
    const push = (u?: string | null) => { if (u && typeof u === "string" && !set.includes(u)) set.push(u); };
    sortedEvents.forEach(e => (e.photos || []).forEach(push));
    push(metadata.batch_image);
    push(metadata.productImage);
    push(metadata.farmer_image);
    if (Array.isArray(metadata.gallery)) metadata.gallery.forEach(push);
    return set;
  })();
  const galleryVideos: string[] = Array.isArray(metadata.videos) ? metadata.videos.filter((v: any) => typeof v === "string") : [];

  const currentStatus = (metadata.status || (batch as any).status || (contract?.status) || "Verified").toString();
  const productName = cropType;
  const processingDate = metadata.productionDate ? formatDateDayMonth(metadata.productionDate) : (batch.harvest_date ? formatDateDayMonth(batch.harvest_date) : "");
  const mapsQuery = encodeURIComponent(location);
  const farmerBio = farmer?.bio || `${farmerName.split(" ")[0]} grows ${cropType.toLowerCase()} in ${location} using careful, sustainable practices. By choosing this product you are helping create a reliable market for farmers like ${farmerName.split(" ")[0]}.`;

  // Capture the scan for analytics and keep the reference for the feedback loop.
  useEffect(() => {
    let active = true;
    recordScan({ batchCode: batch.batch_code, batchId: (batch as any).id })
      .then(ref => { if (active) setScanRef(ref); })
      .catch(() => {});
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch.batch_code]);

  // Live platform impact counters (best-effort; falls back to sensible values).
  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        if (!supabase) return;
        const [farmersRes, batchesRes, scansRes, paymentsRes] = await Promise.all([
          supabase.from("farmers").select("id", { count: "exact", head: true }),
          supabase.from("batches").select("total_quantity"),
          supabase.from("qr_scans").select("id", { count: "exact", head: true }),
          supabase.from("payments").select("amount, status"),
        ]);
        const kgTraced = (batchesRes.data || []).reduce((s: number, b: any) => s + Number(b.total_quantity || 0), 0);
        const incomeSupported = (paymentsRes.data || [])
          .filter((p: any) => ["completed", "confirmed"].includes((p.status || "").toLowerCase()))
          .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
        setStats({
          farmers: farmersRes.count || 0,
          batches: (batchesRes.data || []).length,
          scans: scansRes.count || 0,
          kgTraced: Math.round(kgTraced),
          incomeSupported: Math.round(incomeSupported),
        });
      } catch { /* keep zero fallbacks */ }
    })();
  }, []);

  return (
    <div style={{ background: isPublic ? DARK : "transparent", minHeight: isPublic ? "100vh" : "auto", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <style>{`
        @media (min-width: 900px) {
          .cp-trace-container { max-width: 1100px !important; }
          .cp-trace-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
          .cp-trace-grid > div { margin: 0 !important; }
          .cp-trace-hero h1 { font-size: 56px !important; }
        }
        @media (min-width: 1280px) {
          .cp-trace-container { max-width: 1240px !important; }
        }
      `}</style>
      <div className="cp-trace-container" style={{ maxWidth: 680, margin: "0 auto", background: DARK, minHeight: "100vh", boxShadow: isPublic ? "0 0 40px rgba(0,0,0,0.3)" : "none", paddingBottom: 40, borderRadius: isPublic ? 0 : 32, overflow: "hidden" }}>

        {/* HERO SECTION */}
        <div className="cp-trace-hero" style={{ position: "relative", overflow: "hidden", borderRadius: isPublic ? "0 0 32px 32px" : "32px", paddingBottom: 40, backgroundColor: SURFACE, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.15 }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(2,5,3,0.3) 0%, rgba(2,5,3,0.9) 80%, ${DARK} 100%)` }} />
          <div style={{ position: "relative", padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a href="/" style={{ textDecoration: "none" }}>
              <img src={LOGO_SRC} alt="AgroChain 360" style={{ height: 36, width: "auto", objectFit: "contain" }} />
            </a>
            <div style={{ display: "flex", gap: 8 }}>
              <a href="/" style={{ textDecoration: "none", color: "#fff", fontSize: 12, fontFamily: "'Space Mono', monospace", padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>Home</a>
              <a href="/lookup" style={{ textDecoration: "none", color: "#020503", fontSize: 12, fontFamily: "'Space Mono', monospace", padding: "6px 12px", borderRadius: 8, background: LIME, fontWeight: 700 }}>Lookup</a>
            </div>
          </div>
          <div style={{ height: "120px" }} />
          <div style={{ position: "relative", padding: "0 24px" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {(() => {
                const isMarketSourced = !!contract?.contract_code && contract.contract_code.toUpperCase().startsWith("BID-");
                if (contract && isMarketSourced) {
                  return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.35)", color: "#7dd3fc", fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: 1, padding: "5px 10px", borderRadius: 999, textTransform: "uppercase", fontWeight: 700 }}>
                      ✓ Market-Sourced · Verified from Delivery
                    </span>
                  );
                }
                if (contract) {
                  return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", color: LIME, fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: 1, padding: "5px 10px", borderRadius: 999, textTransform: "uppercase", fontWeight: 700 }}>
                      ✓ Cherry Pick Contract · Farm-Grown
                    </span>
                  );
                }
                return (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: 1, padding: "5px 10px", borderRadius: 999, textTransform: "uppercase", fontWeight: 700 }}>
                    Independent Farmer Batch
                  </span>
                );
              })()}
              {contract?.contract_code && (
                <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#9aa89d", fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: 1, padding: "5px 10px", borderRadius: 999 }}>
                  {contract.contract_code} · {contract.status}
                </span>
              )}
            </div>
            <p style={{ color: "#4ade80", fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 3, marginBottom: 12, textTransform: "uppercase", fontWeight: 700 }}>
              Thank you for choosing Cherry-Pick
            </p>
            <h1 style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 800, margin: "0 0 16px", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
              Every Pack Has<br />A Story.
            </h1>
            <p style={{ color: "#cdd8cf", fontSize: 15, lineHeight: 1.65, maxWidth: 460, margin: "0 0 28px", fontFamily: "'Inter', sans-serif" }}>
              Every better choice creates healthier lifestyles, supports local farmers and contributes to a more resilient food system. This pack has travelled an incredible journey before reaching your hands. Let&apos;s discover it together.
            </p>
            <button
              onClick={() => { const el = document.getElementById("cp-product"); if (el) el.scrollIntoView({ behavior: "smooth" }); }}
              style={{ background: LIME, color: "#020503", border: "none", borderRadius: 14, padding: "15px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Inter', sans-serif", boxShadow: "0 6px 20px rgba(74,222,128,0.25)", display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              Begin the Journey ↓
            </button>
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* SECTION 2 — YOUR PRODUCT */}
        <div id="cp-product" style={{ position: "relative", top: -80 }} />
        <FadeIn delay={0.05}>
          <div style={{ margin: "8px 16px 24px", background: "rgba(255,255,255,0.04)", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ position: "relative", height: 210 }}>
              <img src={heroImage} alt={productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(2,5,3,0.1) 30%, rgba(2,5,3,0.9) 100%)" }} />
              <span style={{ position: "absolute", top: 14, right: 14, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(74,222,128,0.16)", border: "1px solid rgba(74,222,128,0.4)", color: LIME, fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: 1, padding: "6px 10px", borderRadius: 999, textTransform: "uppercase", fontWeight: 700, backdropFilter: "blur(4px)" }}>
                ✓ Verified by Cherry-Pick
              </span>
              <div style={{ position: "absolute", left: 20, bottom: 16, right: 20 }}>
                <p style={{ color: LIME, fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: 3, margin: "0 0 4px", textTransform: "uppercase", fontWeight: 700 }}>Your Product</p>
                <h2 style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 800, margin: 0, lineHeight: 1.05 }}>{productName}</h2>
                <p style={{ color: "#cdd8cf", fontSize: 12, margin: "4px 0 0", fontFamily: "'Space Mono', monospace" }}>{variety}</p>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {specs.map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginBottom: 8, border: "1px solid rgba(255,255,255,0.06)" }}>{s.icon}</div>
                    <div style={{ fontSize: 10, color: "#9aa89d", fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: 14, padding: "12px 16px" }}>
                <span style={{ fontSize: 10, color: "#9aa89d", fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: 1 }}>Current Status</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: LIME, textTransform: "capitalize" }}>{currentStatus}</span>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* SECTION 3 — MEET YOUR FARMER */}
        <FadeIn delay={0.1}>
          <div style={{ margin: "0 16px 24px", background: "rgba(255,255,255,0.04)", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 20px" }}>
              <span style={{ color: "#4ade80", fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>Meet Your Farmer</span>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap" }}>
                <FarmerAvatar src={farmerImage} name={farmerName} />
                <div style={{ flex: 1, paddingTop: 4, minWidth: 180 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>{farmerName}</h2>
                  <p style={{ color: "#9aa89d", fontSize: 12, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5, marginBottom: 12, fontWeight: 600 }}>📍 {location}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {farmSize > 0 && (
                      <div style={{ textAlign: "center", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "8px 16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{farmSize} ha</div>
                        <div style={{ fontSize: 10, color: "#9aa89d", textTransform: "uppercase", letterSpacing: 1, marginTop: 2, fontFamily: "'Space Mono', monospace" }}>Farm Size</div>
                      </div>
                    )}
                    {farmerExp !== "" && (
                      <div style={{ textAlign: "center", background: "rgba(191,255,0,0.08)", borderRadius: 12, padding: "8px 16px", border: "1px solid rgba(191,255,0,0.2)" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{farmerExp} yrs</div>
                        <div style={{ fontSize: 10, color: "#9aa89d", textTransform: "uppercase", letterSpacing: 1, marginTop: 2, fontFamily: "'Space Mono', monospace" }}>Experience</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: `3px solid #4ade80`, paddingLeft: 16, marginBottom: 20 }}>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "#cdd8cf", fontFamily: "'Inter', sans-serif", margin: 0 }}>
                  {farmerBio}
                </p>
              </div>
              {/* GPS map */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 14, marginBottom: 16 }}>
                <MapZambia />
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#9aa89d", fontSize: 10, fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 2px" }}>Farm Location</p>
                  <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, margin: 0 }}>{location}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 140, textAlign: "center", textDecoration: "none", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: LIME, fontSize: 13, fontWeight: 700, padding: "12px 16px", borderRadius: 12 }}>
                  View Farm on Map
                </a>
                <a href="/marketplace" style={{ flex: 1, minWidth: 140, textAlign: "center", textDecoration: "none", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "12px 16px", borderRadius: 12 }}>
                  Meet More Farmers
                </a>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* VERIFICATION SEAL */}
        <FadeIn delay={0.1}>
          <div style={{ margin: "0 16px 24px", background: "rgba(255,255,255,0.04)", borderRadius: 24, padding: 24, position: "relative", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
            <div style={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.04)" }} />
            <div style={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.03)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: "1px solid rgba(191,255,0,0.25)" }}>🏅</div>
              <div>
                <p style={{ color: "#9aa89d", fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: 2, margin: "0 0 2px", textTransform: "uppercase" }}>Verification Seal</p>
                <p style={{ color: "#fff", fontSize: 16, fontWeight: 800, margin: 0, fontFamily: "'Playfair Display', serif" }}>Independent Audit</p>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: "#9aa89d", fontSize: 12, fontFamily: "'Inter', sans-serif" }}>Verified By</span>
                <span style={{ color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{events.find(e => e.event_type === 'verification')?.actor_name || "AgroChain 360 Guardian"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9aa89d", fontSize: 12, fontFamily: "'Inter', sans-serif" }}>Last Updated</span>
                <span style={{ color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{batch.updated_at ? formatDateDayMonth(batch.updated_at) : "Recent"}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["✓ Origin Valid", "✓ Quality Specs", "✓ Supply Chain"].map((badge, i) => (
                <span key={i} style={{ background: "rgba(191,255,0,0.08)", border: "1px solid rgba(191,255,0,0.2)", color: "#fff", fontSize: 11, padding: "6px 12px", borderRadius: 20, fontWeight: 600 }}>{badge}</span>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* GROWTH UPDATES SECTION (farmer-logged crop journey) */}
        {growthUpdates.length > 0 && (
          <FadeIn delay={0.1}>
            <div style={{ margin: "0 16px 24px", background: "rgba(255,255,255,0.04)", borderRadius: 24, padding: "24px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 3, color: "#4ade80", textTransform: "uppercase", fontWeight: 700 }}>🌱 Farmer's Growth Updates</span>
                <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
                <span style={{ fontSize: 11, color: "#9aa89d", fontFamily: "'Inter', sans-serif" }}>{growthUpdates.length} log{growthUpdates.length === 1 ? "" : "s"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {growthUpdates.map((g, i) => (
                  <div key={`growth-${g.id || i}`} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{EVENT_EMOJIS[g.event_type] || "🌿"}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Inter', sans-serif" }}>{g.event_title}</span>
                        </div>
                        {g.event_description && (
                          <p style={{ fontSize: 12, color: "#9aa89d", margin: "4px 0 0", lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>{g.event_description}</p>
                        )}
                        {g.location_address && (
                          <p style={{ fontSize: 11, color: "#9aa89d", margin: "6px 0 0", fontFamily: "'Inter', sans-serif" }}>📍 {g.location_address}</p>
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: "#fff", fontFamily: "'Space Mono', monospace", fontWeight: 600, whiteSpace: "nowrap", paddingTop: 2 }}>
                        {g.created_at ? formatDateDayMonth(g.created_at) : ""}
                      </span>
                    </div>
                    {g.photos && g.photos.length > 0 && (
                      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                        {g.photos.slice(0, 4).map((photo, idx) => (
                          <img key={idx} src={photo} alt="Growth update" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(255,255,255,0.08)" }} />
                        ))}
                        {g.photos.length > 4 && (
                          <div style={{ width: 56, height: 56, borderRadius: 10, background: "rgba(191,255,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                            +{g.photos.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {/* TIMELINE SECTION */}
        <FadeIn delay={0.1}>
          <div style={{ margin: "0 16px 24px", background: "rgba(255,255,255,0.04)", borderRadius: 24, padding: "24px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 3, color: "#4ade80", textTransform: "uppercase", fontWeight: 700 }}>Follow Your Food</span>
              <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>
            {sortedEvents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "#9aa89d" }}>Tracking has just begun...</p>
              </div>
            ) : (
              <div style={{ position: "relative", paddingLeft: 28 }}>
                <div style={{ position: "absolute", left: 11, top: 12, bottom: 12, width: 2, background: "rgba(255,255,255,0.08)", borderRadius: 2 }} />
                {sortedEvents.map((m, i) => (
                  <div key={m.id || i} style={{ position: "relative", marginBottom: i < sortedEvents.length - 1 ? 24 : 0 }} onClick={() => setExpanded(expanded === i ? null : i)}>
                    <div style={{ position: "absolute", left: -25, top: 2, width: 16, height: 16, borderRadius: "50%", background: expanded === i ? "#fff" : "transparent", border: `2px solid ${expanded === i ? "#fff" : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", cursor: "pointer", zIndex: 2 }}>
                      {expanded === i && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#020503" }} />}
                    </div>
                    <div style={{ background: expanded === i ? "rgba(255,255,255,0.04)" : "transparent", border: `1px solid ${expanded === i ? "rgba(255,255,255,0.08)" : "transparent"}`, borderRadius: 16, padding: expanded === i ? "14px" : "0 0 0 10px", cursor: "pointer", transition: "all 0.3s ease" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 16 }}>{EVENT_EMOJIS[m.event_type] || "🌿"}</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.event_title}</span>
                          </div>
                          <p style={{ fontSize: 12, color: "#9aa89d", margin: 0, fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.location_address || "Verified Location"}</p>
                        </div>
                        <span style={{ fontSize: 11, color: expanded === i ? "#fff" : "#9aa89d", fontFamily: "'Space Mono', monospace", fontWeight: 600, whiteSpace: "nowrap", paddingTop: 4 }}>
                          {m.created_at ? formatDateDayMonth(m.created_at) : ""}
                        </span>
                      </div>
                      <div style={{ maxHeight: expanded === i ? 500 : 0, overflow: "hidden", transition: "max-height 0.3s ease", opacity: expanded === i ? 1 : 0 }}>
                        <p style={{ fontSize: 13, color: "#9aa89d", margin: "12px 0 0", lineHeight: 1.5, fontFamily: "'Inter', sans-serif", borderTop: `1px solid rgba(255,255,255,0.08)`, paddingTop: 12 }}>{m.event_description || "Verified action."}</p>
                        {m.photos && m.photos.length > 0 && (
                          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                            {m.photos.map((photo, idx) => (
                              <img key={idx} src={photo} alt="Event proof" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "1px solid rgba(255,255,255,0.08)" }} />
                            ))}
                          </div>
                        )}
                        {m.actor_name && (
                          <div style={{ marginTop: 12, fontSize: 11, color: "#9aa89d", background: "rgba(255,255,255,0.04)", display: "inline-block", padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)" }}>
                            Performed by: {m.actor_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {/* You — the final step of the journey */}
                <div style={{ position: "relative", marginTop: 24 }}>
                  <div style={{ position: "absolute", left: -25, top: 2, width: 16, height: 16, borderRadius: "50%", background: LIME, border: `2px solid ${LIME}`, zIndex: 2 }} />
                  <div style={{ paddingLeft: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🍒</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: LIME, fontFamily: "'Inter', sans-serif" }}>You</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#9aa89d", margin: "2px 0 0", fontFamily: "'Inter', sans-serif" }}>This pack reached your hands. Thank you for being part of the journey.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </FadeIn>

        {/* SECTION 5 — BEHIND THE SCENES */}
        {(galleryPhotos.length > 0 || galleryVideos.length > 0) && (
          <FadeIn delay={0.1}>
            <div style={{ margin: "0 16px 24px", background: "rgba(255,255,255,0.04)", borderRadius: 24, padding: "24px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 3, color: "#4ade80", textTransform: "uppercase", fontWeight: 700 }}>Behind The Scenes</span>
                <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
              </div>
              <p style={{ color: "#9aa89d", fontSize: 13, lineHeight: 1.6, margin: "0 0 18px", fontFamily: "'Inter', sans-serif" }}>
                Authentic moments from the farm, drying, processing and packaging — captured along the way.
              </p>
              {galleryVideos.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
                  {galleryVideos.slice(0, 3).map((v, i) => (
                    <video key={i} src={v} controls playsInline style={{ width: "100%", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "#000" }} />
                  ))}
                </div>
              )}
              {galleryPhotos.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {galleryPhotos.slice(0, 9).map((p, i) => (
                    <img key={i} src={p} alt="Behind the scenes" style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }} />
                  ))}
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* SECTION 6 — YOUR IMPACT (live counters) */}
        <FadeIn delay={0.1}>
          <div style={{ margin: "0 16px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 3, color: "#4ade80", textTransform: "uppercase", fontWeight: 700 }}>Your Impact</span>
              <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>
            <p style={{ color: "#9aa89d", fontSize: 13, lineHeight: 1.6, margin: "0 0 18px", fontFamily: "'Inter', sans-serif" }}>
              Every Cherry-Pick purchase helps transform seasonal abundance into opportunity.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { icon: "👩🏾‍🌾", label: "Farmers Supported", node: <Counter target={Math.max(1, stats.farmers)} suffix="+" /> },
                { icon: "📦", label: "Kg Traced & Rescued", node: <Counter target={Math.max(0, stats.kgTraced)} suffix=" kg" /> },
                { icon: "💚", label: "Farmer Income Supported", node: <Counter target={Math.max(0, stats.incomeSupported)} prefix="K" /> },
                { icon: "🔗", label: "Batches Traced", node: <Counter target={Math.max(1, stats.batches)} /> },
                { icon: "📱", label: "QR Scans Completed", node: <Counter target={Math.max(1, stats.scans)} /> },
                { icon: "🌳", label: "Local Jobs Supported", node: <Counter target={Math.max(1, Math.round(stats.farmers * 1.5))} /> },
              ].map((it, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: "16px" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{it.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{it.node}</div>
                  <div style={{ fontSize: 10, color: "#9aa89d", fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: 1, marginTop: 6 }}>{it.label}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* BLOCKCHAIN SECTION */}
        {batch.blockchain_tx && (
          <FadeIn delay={0.1}>
            <div style={{ margin: "0 16px 24px", background: "rgba(255,255,255,0.04)", borderRadius: 24, padding: 24, border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", backdropFilter: "blur(8px)" }}>
              <div style={{ position: "absolute", width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(191,255,0,0.08) 0%, rgba(0,0,0,0) 70%)", right: -20, top: -20, pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⛓️</div>
                <div>
                  <p style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: 2, color: "#9aa89d", textTransform: "uppercase", margin: "0 0 2px" }}>AgroChain 360</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "'Playfair Display', serif" }}>Immutable Trust</p>
                </div>
              </div>
              <p style={{ color: "#9aa89d", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                While the story is human, the data is permanent. Every milestone is cryptographically signed on <span style={{ color: "#4ade80", fontWeight: 600 }}>Base L2</span>.
              </p>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }} onClick={() => { setCopied(true); navigator.clipboard.writeText(batch.blockchain_tx!); setTimeout(() => setCopied(false), 2000); }}>
                <div style={{ display: "flex", justifyItems: "space-between", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#9aa89d", letterSpacing: 1 }}>TX HASH</span>
                  {copied && <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 600 }}>Copied!</span>}
                </div>
                <p style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: "#4ade80", margin: 0, wordBreak: "break-all" }}>{batch.blockchain_tx}</p>
              </div>
              <a href={`https://basescan.org/tx/${batch.blockchain_tx}`} target="_blank" rel="noopener noreferrer" style={{ width: "100%", background: "#4ade80", color: "#020503", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}>
                View Blockchain Receipt ↗
              </a>
            </div>
          </FadeIn>
        )}

        {/* SECTION 7 — CONTINUE THE JOURNEY */}
        <FadeIn delay={0.1}>
          <div style={{ margin: "0 16px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 3, color: "#4ade80", textTransform: "uppercase", fontWeight: 700 }}>Continue The Journey</span>
              <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.12), rgba(74,222,128,0.02))", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 20, padding: 20 }}>
                <p style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>Buy More Cherry-Pick</p>
                <p style={{ color: "#9aa89d", fontSize: 13, margin: "0 0 16px", fontFamily: "'Inter', sans-serif" }}>Fresh, traceable snacks delivered from verified Zambian farms.</p>
                <a href="https://cherrypickfoods.com/shop" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: LIME, color: "#020503", textDecoration: "none", fontSize: 14, fontWeight: 800, padding: "12px 24px", borderRadius: 12 }}>Shop Now →</a>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
                <p style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>Buy Direct From Farmers</p>
                <p style={{ color: "#9aa89d", fontSize: 13, margin: "0 0 16px", fontFamily: "'Inter', sans-serif" }}>Explore fresh produce available through the AgroChain 360 Marketplace.</p>
                <a href="/marketplace" style={{ display: "inline-block", background: "rgba(255,255,255,0.08)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 800, padding: "12px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}>Visit Marketplace →</a>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* SECTION 8 — JOIN THE CHERRY-PICK LIFESTYLE */}
        <FadeIn delay={0.1}>
          <div style={{ margin: "0 16px 24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: 24, textAlign: "center" }}>
            <p style={{ color: "#4ade80", fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 3, textTransform: "uppercase", fontWeight: 700, margin: "0 0 10px" }}>The Cherry-Pick Lifestyle</p>
            <h2 style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, margin: "0 0 12px" }}>Choose Better. Live Better.</h2>
            <p style={{ color: "#cdd8cf", fontSize: 14, lineHeight: 1.7, margin: "0 auto 22px", maxWidth: 460, fontFamily: "'Inter', sans-serif" }}>
              Small choices shape healthier lives. Follow us for recipes, healthy-living inspiration and stories from the farmers growing your food.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {[
                { label: "Instagram", icon: "📸", href: "https://instagram.com/cherrypickfoods" },
                { label: "Facebook", icon: "👍", href: "https://facebook.com/cherrypickfoods" },
                { label: "TikTok", icon: "🎵", href: "https://tiktok.com/@cherrypickfoods" },
                { label: "WhatsApp", icon: "💬", href: "https://wa.me/260000000000" },
                { label: "Newsletter", icon: "✉️", href: "https://cherrypickfoods.com" },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "10px 14px", borderRadius: 999 }}>
                  <span>{s.icon}</span> {s.label}
                </a>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* SECTION 9 — HELP US IMPROVE */}
        <FadeIn delay={0.1}>
          <div style={{ margin: "0 16px 32px", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 20, padding: 22, textAlign: "center" }}>
            <p style={{ color: "#9aa89d", fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 6px" }}>Help Us Improve</p>
            <p style={{ color: "#cdd8cf", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px", fontFamily: "'Inter', sans-serif" }}>
              Something not right with this pack? Let us know — your report is linked directly to this batch for a fast investigation.
            </p>
            <button
              onClick={() => setComplaintOpen(true)}
              style={{ background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "14px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              ⚠️ Report an Issue
            </button>
          </div>
        </FadeIn>

        <ComplaintModal
          open={complaintOpen}
          onClose={() => setComplaintOpen(false)}
          context={{
            batchCode: batch.batch_code,
            batchId: (batch as any).id,
            productName,
            processingDate,
            scanReference: scanRef,
            farmerBatch: contract?.contract_code,
          }}
        />

        {/* FOOTER */}
        <div style={{ background: "rgba(255,255,255,0.02)", padding: "32px 24px 48px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <img src={LOGO_SRC} alt="AgroChain 360" style={{ height: 28, width: "auto", objectFit: "contain", marginBottom: 12 }} />
          <p style={{ color: "#9aa89d", fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 1, margin: "0 0 4px" }}>2025 Cherry Pick</p>
          <p style={{ color: "#5b6b5e", fontSize: 10, fontFamily: "'Inter', sans-serif" }}>Traced with AgroChain 360</p>
        </div>

      </div>
    </div>
  );
}
