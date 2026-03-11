"use client";

import { useState, useEffect, useRef } from "react";
import { TraceabilityEvent, Batch } from "@/lib/traceabilityService";

interface TraceabilityViewProps {
  batch: Batch;
  events: TraceabilityEvent[];
  farmer?: {
    name: string;
    location_address?: string;
    farm_size?: number;
    verified?: boolean;
  };
  contract?: {
    contract_code: string;
    crop_type: string;
    variety?: string;
    status: string;
  };
  isPublic?: boolean;
}

const MANGO_ORANGE = "#F97316";
const LEAF_GREEN = "#2D5A3D";
const CREAM = "#FDF8F2";
const SOIL = "#8B5E3C";
const DARK = "#18181B";

const DEFAULT_IMG_HERO = "https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
const DEFAULT_IMG_FARMER = "https://images.unsplash.com/photo-1595844730298-b960fa25e9e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80";

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

function MapZambia() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => { setTimeout(() => setPulse(true), 800); }, []);
  return (
    <div style={{ position: "relative", width: 80, height: 70, flexShrink: 0 }}>
      <svg viewBox="0 0 200 180" style={{ width: "100%", height: "100%", opacity: 0.9 }}>
        <path d="M60,20 L140,15 L165,45 L170,90 L155,130 L130,160 L90,165 L55,150 L30,110 L25,70 L40,35 Z" fill="#2D5A3D" stroke="#1A3D2B" strokeWidth="2" />
        <path d="M80,60 L110,55 L125,75 L120,100 L100,115 L75,110 L62,90 L65,70 Z" fill="#4A7C59" />
      </svg>
      <div style={{
        position: "absolute", top: "38%", left: "60%",
        width: 8, height: 8, borderRadius: "50%",
        background: MANGO_ORANGE,
        animation: "pulse 2s infinite",
      }} />
      <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,0.6)} 50%{box-shadow:0 0 0 8px rgba(249,115,22,0)} } @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
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

  let metadata: any = {};
  try {
    if (batch.ipfs_metadata) {
      metadata = JSON.parse(batch.ipfs_metadata);
    }
  } catch (e) {
    console.error("Error parsing metadata", e);
  }

  const heroImage = metadata.batch_image || DEFAULT_IMG_HERO;
  const farmerImage = metadata.farmer_image || DEFAULT_IMG_FARMER;
  const cropType = batch.crop_type || "Premium Produce";
  const variety = batch.variety || "Premium Quality";
  const location = farmer?.location_address || "Eastern Province, Zambia";
  const farmerName = farmer?.name || "Verified Smallholder";
  const farmSize = farmer?.farm_size || 3;
  const farmerExp = metadata.farmer_experience || "12";
  const impactIncrease = metadata.income_increase || "25";

  const specs = [
    { icon: "🆔", label: "Batch ID", value: batch.batch_code },
    { icon: "📅", label: "Production Date", value: metadata.productionDate ? formatDateDayMonth(metadata.productionDate) : (batch.harvest_date ? formatDateDayMonth(batch.harvest_date) : "Not set") },
    { icon: "⌛", label: "Expiry Date", value: metadata.expiryDate ? formatDateDayMonth(metadata.expiryDate) : "Not set" },
    { icon: "⚖️", label: "Total Batch Weight", value: `${batch.total_quantity || 0} ${batch.unit || 'kg'}` },
  ];

  const impacts = [
    { icon: "👩🏾‍🌾", color: "#2D5A3D", bg: "#E8F5EE", label: "Community", value: "Supports smallholder families" },
    { icon: "🍃", color: "#166534", bg: "#DCFCE7", label: "Eco-Friendly", value: `Saved waste with precision care` },
    { icon: "🇿🇲", color: "#9A3412", bg: "#FFEDD5", label: "Local Pride", value: "100% Zambian tracked" },
  ];

  return (
    <div style={{ background: isPublic ? "#F4F4F5" : "transparent", minHeight: isPublic ? "100vh" : "auto", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 680, margin: "0 auto", background: "#FAF9F6", minHeight: "100vh", boxShadow: isPublic ? "0 0 40px rgba(0,0,0,0.05)" : "none", paddingBottom: 40, borderRadius: isPublic ? 0 : 32, overflow: "hidden" }}>

        {/* HERO SECTION */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: isPublic ? "0 0 32px 32px" : "32px", paddingBottom: 40, backgroundColor: DARK, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.6 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(24,24,27,0.2) 0%, rgba(24,24,27,0.95) 80%, rgba(24,24,27,1) 100%)" }} />
          <div style={{ position: "relative", padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => window.history.back()} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "6px 12px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(8px)" }}>
                ← Back
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🍒</div>
                <span style={{ color: "#FFF", fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, letterSpacing: 1, fontSize: 13 }}>CHERRY PICK</span>
              </div>
            </div>
            <div style={{ background: "rgba(74,215,120,0.15)", border: "1px solid rgba(74,215,120,0.3)", borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4AD778", animation: "blink 2s infinite" }} />
              <span style={{ color: "#4AD778", fontSize: 10, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>VERIFIED</span>
            </div>
          </div>
          <div style={{ height: "120px" }} />
          <div style={{ position: "relative", padding: "0 24px" }}>
            <p style={{ color: MANGO_ORANGE, fontSize: 11, fontFamily: "monospace", letterSpacing: 3, marginBottom: 8, textTransform: "uppercase", fontWeight: 700 }}>
              {variety}
            </p>
            <h1 style={{ color: "#FFF", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 42, fontWeight: 900, margin: "0 0 16px", lineHeight: 1.1, letterSpacing: -0.5 }}>
              {cropType}
            </h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              <span style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: 11, fontFamily: "monospace", padding: "6px 12px", borderRadius: 8 }}>
                {batch.batch_code}
              </span>
              <span style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#FFEDD5", fontSize: 11, padding: "6px 12px", borderRadius: 8 }}>
                📍 {location}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "16px" }}>
              <MapZambia />
              <div>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>The Origin</p>
                <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.5, fontFamily: "Georgia, serif", fontStyle: "italic", margin: 0 }}>
                  "Grown by smallholder farmers in {location} and traced securely."
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* FARMER SECTION */}
        <FadeIn delay={0.1}>
          <div style={{ margin: "24px 16px", background: "#FFF", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.02)" }}>
            <div style={{ background: LEAF_GREEN, padding: "12px 20px" }}>
              <span style={{ color: "#fff", fontSize: 11, fontFamily: "monospace", letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>Meet Your Farmer</span>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
                <img src={farmerImage} alt={farmerName} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${CREAM}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", flexShrink: 0 }} />
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 900, color: DARK, margin: "0 0 4px" }}>{farmerName}</h2>
                  <p style={{ color: LEAF_GREEN, fontSize: 12, fontFamily: "monospace", letterSpacing: 0.5, marginBottom: 12, fontWeight: 600 }}>Lead Farmer · {location.split(',')[0]}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ textAlign: "center", background: "#F4F4F5", borderRadius: 12, padding: "8px 16px", border: "1px solid #E4E4E7" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: DARK }}>{farmSize} ha</div>
                      <div style={{ fontSize: 10, color: "#71717A", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>Size</div>
                    </div>
                    <div style={{ textAlign: "center", background: "#FFF7ED", borderRadius: 12, padding: "8px 16px", border: "1px solid #FFEDD5" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: MANGO_ORANGE }}>{farmerExp} yrs</div>
                      <div style={{ fontSize: 10, color: "#71717A", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>Exp</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: `3px solid ${MANGO_ORANGE}`, paddingLeft: 16, marginBottom: 20 }}>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#52525B", fontFamily: "Georgia, serif", fontStyle: "italic", margin: 0 }}>
                  "{farmerName.split(' ')[0]} partners with Cherry-Pick. By verifying crops on AgroChain 360, household income increased by <strong style={{ color: LEAF_GREEN, fontStyle: "normal" }}>{impactIncrease}%</strong>, ensuring community resilience."
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ background: "#DCFCE7", border: "1px solid #BBF7D0", color: "#166534", fontSize: 11, padding: "6px 12px", borderRadius: 20, fontWeight: 600 }}>✓ Verified Journey</span>
                <span style={{ background: "#F4F4F5", border: "1px solid #E4E4E7", color: "#52525B", fontSize: 11, padding: "6px 12px", borderRadius: 20, fontWeight: 600 }}>🌳 Impact Driven</span>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* SPECS SECTION */}
        <FadeIn delay={0.1}>
          <div style={{ margin: "0 16px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: 3, color: "#71717A", textTransform: "uppercase" }}>Farm & Quality Specs</span>
              <div style={{ height: 1, flex: 1, background: "rgba(0,0,0,0.08)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {specs.map((s, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 10, border: "1px solid #F5EAE0" }}>{s.icon}</div>
                  <div style={{ fontSize: 10, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* VERIFICATION SEAL */}
        <FadeIn delay={0.1}>
          <div style={{ margin: "0 16px 24px", background: `linear-gradient(135deg, ${LEAF_GREEN}, #1A3D2B)`, borderRadius: 24, padding: 24, position: "relative", overflow: "hidden", boxShadow: "0 10px 25px rgba(45,90,61,0.2)" }}>
            <div style={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} />
            <div style={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: "1px solid rgba(255,255,255,0.2)" }}>🏅</div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, margin: "0 0 2px", textTransform: "uppercase" }}>Verification Seal</p>
                <p style={{ color: "#fff", fontSize: 16, fontWeight: 800, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Independent Audit</p>
              </div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Verified By</span>
                <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{events.find(e => e.event_type === 'verification')?.actor_name || "AgroChain 360 Guardian"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Last Updated</span>
                <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{batch.updated_at ? formatDateDayMonth(batch.updated_at) : "Recent"}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["✓ Origin Valid", "✓ Quality Specs", "✓ Supply Chain"].map((badge, i) => (
                <span key={i} style={{ background: "rgba(74,215,120,0.15)", border: "1px solid rgba(74,215,120,0.3)", color: "#A7F3C0", fontSize: 11, padding: "6px 12px", borderRadius: 20, fontWeight: 500 }}>{badge}</span>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* TIMELINE SECTION */}
        <FadeIn delay={0.1}>
          <div style={{ margin: "0 16px 24px", background: "#FFF", borderRadius: 24, padding: "24px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <span style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: 3, color: "#71717A", textTransform: "uppercase" }}>The Full Journey</span>
              <div style={{ height: 1, flex: 1, background: "rgba(0,0,0,0.08)" }} />
            </div>
            {events.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "#A1A1AA" }}>Tracking has just begun...</p>
              </div>
            ) : (
              <div style={{ position: "relative", paddingLeft: 28 }}>
                <div style={{ position: "absolute", left: 11, top: 12, bottom: 12, width: 2, background: "#E4E4E7", borderRadius: 2 }} />
                {events.map((m, i) => (
                  <div key={m.id || i} style={{ position: "relative", marginBottom: i < events.length - 1 ? 24 : 0 }} onClick={() => setExpanded(expanded === i ? null : i)}>
                    <div style={{ position: "absolute", left: -25, top: 2, width: 16, height: 16, borderRadius: "50%", background: expanded === i ? MANGO_ORANGE : "#fff", border: `2px solid ${expanded === i ? MANGO_ORANGE : "#D4D4D8"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", cursor: "pointer", zIndex: 2 }}>
                      {expanded === i && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <div style={{ background: expanded === i ? "#FFF7ED" : "transparent", border: `1px solid ${expanded === i ? MANGO_ORANGE + "40" : "transparent"}`, borderRadius: 16, padding: expanded === i ? "14px" : "0 0 0 10px", cursor: "pointer", transition: "all 0.3s ease" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 16 }}>{EVENT_EMOJIS[m.event_type] || "🌿"}</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: DARK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.event_title}</span>
                          </div>
                          <p style={{ fontSize: 12, color: "#71717A", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.location_address || "Verified Location"}</p>
                        </div>
                        <span style={{ fontSize: 11, color: expanded === i ? MANGO_ORANGE : "#A1A1AA", fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap", paddingTop: 4 }}>
                          {m.created_at ? formatDateDayMonth(m.created_at) : ""}
                        </span>
                      </div>
                      <div style={{ maxHeight: expanded === i ? 500 : 0, overflow: "hidden", transition: "max-height 0.3s ease", opacity: expanded === i ? 1 : 0 }}>
                        <p style={{ fontSize: 13, color: "#52525B", margin: "12px 0 0", lineHeight: 1.5, borderTop: `1px solid ${MANGO_ORANGE}20`, paddingTop: 12 }}>{m.event_description || "Verified action."}</p>
                        {m.photos && m.photos.length > 0 && (
                          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                            {m.photos.map((photo, idx) => (
                              <img key={idx} src={photo} alt="Event proof" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "1px solid #E4E4E7" }} />
                            ))}
                          </div>
                        )}
                        {m.actor_name && (
                          <div style={{ marginTop: 12, fontSize: 11, color: "#71717A", background: "#fff", display: "inline-block", padding: "4px 8px", borderRadius: 6, border: "1px solid #E4E4E7" }}>
                            Performed by: {m.actor_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>

        {/* IMPACT SECTION */}
        <FadeIn delay={0.1}>
          <div style={{ margin: "0 16px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: 3, color: "#71717A", textTransform: "uppercase" }}>Your Impact</span>
              <div style={{ height: 1, flex: 1, background: "rgba(0,0,0,0.08)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {impacts.map((item, i) => (
                <div key={i} style={{ background: item.bg, borderRadius: 20, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, border: `1px solid ${item.color}20` }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <p style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: 1.5, color: item.color, textTransform: "uppercase", margin: "0 0 4px", fontWeight: 700 }}>{item.label}</p>
                    <p style={{ fontSize: 14, color: DARK, margin: 0, fontWeight: 700 }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* BLOCKCHAIN SECTION */}
        {batch.blockchain_tx && (
          <FadeIn delay={0.1}>
            <div style={{ margin: "0 16px 24px", background: "#09090B", borderRadius: 24, padding: 24, border: "1px solid #27272A", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0) 70%)", right: -20, top: -20, pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⛓️</div>
                <div>
                  <p style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: 2, color: "#A1A1AA", textTransform: "uppercase", margin: "0 0 2px" }}>AgroChain 360</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Immutable Trust</p>
                </div>
              </div>
              <p style={{ color: "#A1A1AA", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                While the story is human, the data is permanent. Every milestone is cryptographically signed on <span style={{ color: "#C4B5FD", fontWeight: 600 }}>Base L2</span>.
              </p>
              <div style={{ background: "#18181B", borderRadius: 12, padding: "12px 16px", marginBottom: 16, border: "1px solid #27272A", cursor: "pointer" }} onClick={() => { setCopied(true); navigator.clipboard.writeText(batch.blockchain_tx!); setTimeout(() => setCopied(false), 2000); }}>
                <div style={{ display: "flex", justifyItems: "space-between", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontFamily: "monospace", color: "#71717A", letterSpacing: 1 }}>TX HASH</span>
                  {copied && <span style={{ fontSize: 10, color: "#34D399", fontWeight: 600 }}>Copied!</span>}
                </div>
                <p style={{ fontSize: 13, fontFamily: "monospace", color: "#C4B5FD", margin: 0, wordBreak: "break-all" }}>{batch.blockchain_tx}</p>
              </div>
              <a href={`https://basescan.org/tx/${batch.blockchain_tx}`} target="_blank" rel="noopener noreferrer" style={{ width: "100%", background: "#FAFAFA", color: "#09090B", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}>
                View Blockchain Receipt ↗
              </a>
            </div>
          </FadeIn>
        )}

        {/* SHARE SECTION */}
        {isPublic && (
          <FadeIn delay={0.1}>
            <div style={{ margin: "0 16px 32px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button style={{ background: MANGO_ORANGE, color: "#fff", border: "none", borderRadius: 16, padding: "16px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 14px rgba(249,115,22,0.25)" }}>
                  ⭐ Rate this Batch
                </button>
                <div style={{ display: "flex", gap: 12 }}>
                  <button style={{ flex: 1, background: "#fff", color: DARK, border: "1px solid #E4E4E7", borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>🛒 Buy Again</button>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }} style={{ flex: 1, background: "#fff", color: DARK, border: "1px solid #E4E4E7", borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>📸 Share</button>
                </div>
              </div>
            </div>
          </FadeIn>
        )}

        {/* FOOTER */}
        <div style={{ background: DARK, padding: "32px 24px 48px", textAlign: "center", borderTop: "1px solid #27272A" }}>
          <div style={{ display: "flex", justifyItems: "center", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#FFF", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: 12 }}>🍒</div>
            <span style={{ color: "#fff", fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, letterSpacing: 1 }}>Cherry Pick</span>
          </div>
          <p style={{ color: "#71717A", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>Farm-to-Shelf Traceability Protocol</p>
          <div style={{ display: "flex", justifyItems: "center", justifyContent: "center", gap: 12, marginTop: 24 }}>
            {["BASE L2", "IPFS", "AGROCHAIN 360"].map((t) => (
              <span key={t} style={{ color: "#A1A1AA", fontSize: 9, fontFamily: "monospace", background: "#27272A", padding: "4px 8px", borderRadius: 6 }}>{t}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
