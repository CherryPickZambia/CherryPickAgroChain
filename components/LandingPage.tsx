"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import {
  Sprout, Shield, ArrowRight, Leaf, Globe,
  Zap, ChevronDown, Star, Eye, Search,
  Wheat, Scan, Users, DollarSign, Cpu, ShoppingBag,
  CheckCircle, BarChart3, Sparkles, TreePine, QrCode,
  type LucideIcon,
} from "lucide-react";
import {
  DEFAULT_LANDING_PAGE_CONTENT,
  loadLandingPageContent,
  type LandingPageContent,
} from "@/lib/landingPageContent";

/* ── palette + fonts ── */
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

/* ── injected styles ── */
const injectStyles = () => {
  if (typeof window === "undefined") return;
  if (document.getElementById("cp-v3")) return;
  const s = document.createElement("style");
  s.id = "cp-v3";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
    .cp-landing *{box-sizing:border-box}
    @keyframes slowPan{0%{transform:scale(1.05) translate(0,0)}100%{transform:scale(1.12) translate(-1%,2%)}}
    @keyframes pulseDot{0%,100%{opacity:.3}50%{opacity:1}}
    .cp-landing .cp-dot{width:6px;height:6px;background:#4ade80;border-radius:50%;display:inline-block;animation:pulseDot 2s infinite}
    .cp-landing .cp-nav-link{position:relative;text-decoration:none;color:#fff;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;font-family:'Inter',sans-serif;font-weight:500;transition:opacity .3s}
    .cp-landing .cp-nav-link::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:1px;background:#fff;transition:width .4s cubic-bezier(.19,1,.22,1)}
    .cp-landing .cp-nav-link:hover::after{width:100%}
    .cp-landing .cp-btn{display:inline-flex;align-items:center;justify-content:center;padding:1.1rem 2.5rem;background:transparent;color:#fff;font-family:'Inter',sans-serif;font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;text-decoration:none;border:1px solid #fff;cursor:pointer;position:relative;overflow:hidden;transition:color .4s cubic-bezier(.19,1,.22,1)}
    .cp-landing .cp-btn::before{content:'';position:absolute;inset:0;background:#fff;transform:scaleY(0);transform-origin:bottom;transition:transform .4s cubic-bezier(.19,1,.22,1);z-index:0}
    .cp-landing .cp-btn:hover{color:#020503}
    .cp-landing .cp-btn:hover::before{transform:scaleY(1)}
    .cp-landing .cp-btn span{position:relative;z-index:1;display:inline-flex;align-items:center;gap:8px}
    .cp-landing .cp-btn-accent{border-color:#4ade80;color:#4ade80}
    .cp-landing .cp-btn-accent::before{background:#4ade80}
    .cp-landing .cp-btn-accent:hover{color:#020503}
    .cp-landing .cp-feature-img{overflow:hidden;aspect-ratio:4/5;position:relative}
    .cp-landing .cp-feature-img img{width:100%;height:100%;object-fit:cover;transition:transform 1.5s cubic-bezier(.19,1,.22,1)}
    .cp-landing .cp-feature-img:hover img{transform:scale(1.05)}
    @media(max-width:1024px){
      .cp-landing .cp-12grid{grid-template-columns:1fr !important}
      .cp-landing .cp-feat-txt,.cp-landing .cp-feat-img-col{grid-column:1/-1 !important;grid-row:auto !important}
      .cp-landing .cp-metrics-grid{grid-template-columns:1fr !important}
      .cp-landing .cp-metric-item{border-left:none !important;border-top:1px solid rgba(255,255,255,0.08);padding-top:2rem;padding-left:0 !important}
      .cp-landing .cp-tech-row1{grid-template-columns:repeat(3,1fr) !important}
      .cp-landing .cp-tech-row2{grid-template-columns:repeat(3,1fr) !important}
    }
    @media(max-width:768px){
      .cp-landing .cp-nav-mid{display:none !important}
      .cp-landing .cp-footer-bottom{flex-direction:column !important;align-items:center !important;gap:1rem !important}
      .cp-landing .cp-tech-row1{grid-template-columns:repeat(2,1fr) !important}
      .cp-landing .cp-tech-row2{grid-template-columns:repeat(2,1fr) !important}
    }
    @media(max-width:480px){
      .cp-landing .cp-tech-row1{grid-template-columns:1fr !important}
      .cp-landing .cp-tech-row2{grid-template-columns:1fr !important}
    }
  `;
  document.head.appendChild(s);
};

/* ── style objects ── */
const meta: React.CSSProperties = { fontFamily: FM, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted };
const serif: React.CSSProperties = { fontFamily: FD, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.02em", color: C.white };
const body: React.CSSProperties = { fontFamily: FS, fontSize: "1.1rem", lineHeight: 1.65, color: C.secondary, fontWeight: 300 };
const label: React.CSSProperties = { fontFamily: FS, fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 600 };

const LANDING_ICONS: Record<string, LucideIcon> = {
  ShoppingBag, Shield, BarChart3, Cpu, Scan, Zap, Globe, Eye, Users, DollarSign, Sparkles,
};

function LandingIcon({ name, style }: { name: string; style?: React.CSSProperties }) {
  const Icon = LANDING_ICONS[name] ?? Sparkles;
  return <Icon style={style} />;
}

const TRACEABILITY_ICONS = [Users, TreePine, Eye, Globe];

/* ════════════════════ MAIN COMPONENT ════════════════════ */
export default function LandingPage() {
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const heroRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<LandingPageContent>(DEFAULT_LANDING_PAGE_CONTENT);

  useEffect(() => {
    injectStyles();
    (async () => {
      const loaded = await loadLandingPageContent();
      setContent(loaded);
      // Overlay live platform metrics onto the impact counters when real data exists.
      try {
        const { supabase } = await import("@/lib/supabase");
        if (!supabase) return;
        const [farmersRes, paymentsRes] = await Promise.all([
          supabase.from("farmers").select("id", { count: "exact", head: true }),
          supabase.from("payments").select("amount, status"),
        ]);
        const farmerCount = farmersRes.count || 0;
        const value = (paymentsRes.data || [])
          .filter((p: any) => ["completed", "confirmed"].includes((p.status || "").toLowerCase()))
          .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
        const fmtValue = value >= 1_000_000 ? `K${(value / 1_000_000).toFixed(1)}M` : value >= 1000 ? `K${(value / 1000).toFixed(0)}K` : `K${value.toFixed(0)}`;
        setContent(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            items: prev.metrics.items.map(it => {
              if (it.id === "m-1" && farmerCount > 0) return { ...it, value: `${farmerCount}+` };
              if (it.id === "m-2" && value > 0) return { ...it, value: fmtValue };
              return it;
            }),
          },
        }));
      } catch {
        /* keep editorial defaults if live data unavailable */
      }
    })();
    return () => {
      const el = document.getElementById("cp-v3");
      if (el) el.remove();
    };
  }, []);
  useEffect(() => { if (document.cookie.includes("cp_wallet_session")) router.push("/dashboard"); }, [router]);

  const hOp = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  return (
    <div className="cp-landing" style={{ background: C.deep, minHeight: "100vh" }}>

      {/* ══════ FIXED NAV (Sentient style — mix-blend-mode difference) ══════ */}
      <nav style={{ position: "fixed", top: 0, left: 0, width: "100%", padding: "2rem 5vw", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 100, mixBlendMode: "difference" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <img src="/logo-new.png" alt="AgroChain 360" style={{ height: 36, width: "auto", objectFit: "contain" }} />
        </Link>
        <div className="cp-nav-mid" style={{ display: "flex", gap: "2rem" }}>
          {content.nav.links.map(t => (
            <a key={t} href={`#${t.toLowerCase().replace(" ", "-")}`} className="cp-nav-link">{t}</a>
          ))}
        </div>
        <Link href="/signin" className="cp-nav-link" style={{ border: "1px solid rgba(255,255,255,0.3)", padding: "8px 20px", fontSize: "0.7rem" }}>
          {content.nav.ctaText}
        </Link>
      </nav>

      {/* ══════ HERO (Sentient immersive + Nourish accent bar) ══════ */}
      <header ref={heroRef} style={{ position: "relative", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {/* Background — image or looping hero video */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {content.hero.mediaType === "video" && content.hero.videoUrl ? (
            <video
              src={content.hero.videoUrl}
              poster={content.hero.imageUrl || undefined}
              autoPlay
              muted
              loop
              playsInline
              aria-label={content.hero.imageAlt}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img
              src={content.hero.imageUrl}
              alt={content.hero.imageAlt}
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.05)", animation: "slowPan 30s infinite alternate linear" }}
            />
          )}
        </div>
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(2,5,3,0.3) 0%, rgba(2,5,3,0.7) 50%, rgba(2,5,3,0.95) 100%)", zIndex: 1 }} />

        {/* Hero content */}
        <motion.div style={{ opacity: hOp }} className="relative z-10">
          <div style={{ position: "relative", zIndex: 2, textAlign: "center", width: "100%" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}>
              <span style={{ ...label, color: C.accent, display: "block", marginBottom: 16 }}>{content.hero.tagline}</span>
            </motion.div>

            {/* Big serif title with Nourish-style accent bar */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "relative", display: "inline-block" }}>
              {/* Green accent bar (Nourish red-accent adapted) */}
              <div style={{ position: "absolute", top: "50%", left: "-0.05em", transform: "translateY(-50%)", width: "0.25em", height: "1.1em", backgroundColor: C.accent, zIndex: 1 }} />
              <h1 style={{ ...serif, fontSize: "clamp(5rem, 14vw, 14rem)", fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em", position: "relative", zIndex: 2, textShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                {content.hero.title}<span style={{ color: C.accent, fontSize: '0.4em', verticalAlign: 'super', marginLeft: '0.1em' }}>{content.hero.titleAccent}</span>
              </h1>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }}
              style={{ marginTop: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ ...meta }}>{content.hero.meta}</span>
              <span style={{ fontFamily: FS, fontWeight: 300, fontSize: "1.1rem", color: C.secondary, letterSpacing: "0.02em" }}>
                {content.hero.description}
              </span>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.8 }}
              style={{ marginTop: "3rem", display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/signin">
                <button className="cp-btn"><span>Sign In</span></button>
              </Link>
              <Link href="/lookup">
                <button className="cp-btn"><span><Search style={{ width: 14, height: 14 }} /> Explore Traceability</span></button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </header>

      {/* ══════ MANIFESTO / THE IDEA (Sentient 12-col grid layout) ══════ */}
      <section id="the-idea" style={{ padding: "clamp(80px, 12vw, 180px) 0", background: C.deep }}>
        <div className="cp-12grid" style={{ width: "90vw", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "2rem" }}>
          <ScrollReveal>
            <div style={{ gridColumn: "1 / 4", paddingTop: "1rem", borderTop: `1px solid ${C.border}` }}>
              <span style={meta}>{content.theIdea.sectionLabel}</span>
            </div>
          </ScrollReveal>
          <div style={{ gridColumn: "5 / 12" }}>
            <ScrollReveal>
              <h2 style={{ ...serif, fontSize: "clamp(2.5rem, 5vw, 4.5rem)", marginBottom: "2.5rem" }}>
                {content.theIdea.heading}<em style={{ fontStyle: "italic", color: C.secondary }}>{content.theIdea.headingEmphasis}</em>
              </h2>
              <p style={{ ...body, maxWidth: "80%" }}>
                {content.theIdea.paragraph1}
              </p>
              <p style={{ ...body, maxWidth: "80%", marginTop: "1.5rem" }}>
                {content.theIdea.paragraph2}
              </p>
              <p style={{ ...label, color: C.accent, marginTop: "2.5rem" }}>{content.theIdea.tagline}</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══════ FOR FARMERS (Sentient feature-block with cinematic image) ══════ */}
      <section id="for-farmers" style={{ padding: "clamp(60px, 8vw, 120px) 0", background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="cp-12grid" style={{ width: "90vw", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "2rem", alignItems: "center", padding: "clamp(40px, 6vw, 100px) 0" }}>
            <div className="cp-feat-txt" style={{ gridColumn: "2 / 6" }}>
              <ScrollReveal>
                <div style={{ fontFamily: FD, fontSize: "4rem", color: C.border, lineHeight: 1, marginBottom: "2rem" }}>{content.farmers.number}</div>
                <h3 style={{ ...serif, fontSize: "2.5rem", marginBottom: "1.5rem" }}>
                  {content.farmers.title}<span style={{ color: C.accent }}>{content.farmers.titleAccent}</span>
                </h3>
                <p style={{ ...body, marginBottom: "2rem" }}>
                  {content.farmers.paragraph1}
                </p>
                <p style={{ ...body, marginBottom: "2.5rem" }}>
                  {content.farmers.paragraph2}
                </p>
                <ul style={{ listStyle: "none", padding: 0, borderTop: `1px solid ${C.border}`, paddingTop: "1.5rem" }}>
                  {content.farmers.bullets.map(t => (
                    <li key={t} style={{ fontFamily: FM, fontSize: "0.85rem", color: C.muted, marginBottom: 8, display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ width: 4, height: 4, background: C.accent, borderRadius: "50%", flexShrink: 0 }} />{t}
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            </div>
            <div className="cp-feat-img-col cp-feature-img" style={{ gridColumn: "7 / 13" }}>
              <img src={content.farmers.imageUrl} alt={content.farmers.imageAlt} style={{ filter: "brightness(0.65) saturate(0.7)" }} />
              <div style={{ position: "absolute", bottom: 24, left: 24, padding: 16, background: "rgba(2,5,3,0.9)", border: `1px solid ${C.borderG}`, backdropFilter: "blur(12px)", zIndex: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className="cp-dot" />
                  <span style={{ ...label, color: C.accent, fontSize: "0.6rem" }}>{content.farmers.overlayLabel}</span>
                </div>
                <p style={{ fontFamily: FM, fontSize: 11, color: C.secondary, lineHeight: 1.5 }}>{content.farmers.overlayText}</p>
              </div>
            </div>
          </div>
        </div>

        {/* FOR VERIFIERS (alternated) */}
        <div>
          <div className="cp-12grid" style={{ width: "90vw", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "2rem", alignItems: "center", padding: "clamp(40px, 6vw, 100px) 0" }}>
            <div className="cp-feat-img-col cp-feature-img" style={{ gridColumn: "1 / 7", gridRow: 1 }}>
              <img src={content.verifiers.imageUrl} alt={content.verifiers.imageAlt} style={{ filter: "brightness(0.6) saturate(0.5)" }} />
              <div style={{ position: "absolute", bottom: 24, right: 24, padding: 16, background: "rgba(2,5,3,0.9)", border: `1px solid ${C.borderG}`, backdropFilter: "blur(12px)", zIndex: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className="cp-dot" />
                  <span style={{ ...label, color: C.accent, fontSize: "0.6rem" }}>{content.verifiers.overlayLabel}</span>
                </div>
                <p style={{ fontFamily: FM, fontSize: 11, color: C.secondary, lineHeight: 1.5 }}>{content.verifiers.overlayText}</p>
              </div>
            </div>
            <div className="cp-feat-txt" style={{ gridColumn: "8 / 12", gridRow: 1 }}>
              <ScrollReveal>
                <div style={{ fontFamily: FD, fontSize: "4rem", color: C.border, lineHeight: 1, marginBottom: "2rem" }}>{content.verifiers.number}</div>
                <h3 style={{ ...serif, fontSize: "2.5rem", marginBottom: "1.5rem" }}>
                  {content.verifiers.title}<span style={{ color: C.accent }}>{content.verifiers.titleAccent}</span>
                </h3>
                <p style={{ ...body, marginBottom: "2rem" }}>
                  {content.verifiers.paragraph1}
                </p>
                <p style={{ ...body, marginBottom: "2.5rem" }}>
                  {content.verifiers.paragraph2}
                </p>
                <ul style={{ listStyle: "none", padding: 0, borderTop: `1px solid ${C.border}`, paddingTop: "1.5rem" }}>
                  {content.verifiers.bullets.map(t => (
                    <li key={t} style={{ fontFamily: FM, fontSize: "0.85rem", color: C.muted, marginBottom: 8, display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ width: 4, height: 4, background: C.accent, borderRadius: "50%", flexShrink: 0 }} />{t}
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ MARKETPLACE ══════ */}
      <section id="marketplace" style={{ padding: "clamp(80px, 10vw, 160px) 5vw", background: C.deep, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div className="cp-12grid" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "2rem", marginBottom: "clamp(40px, 6vw, 80px)" }}>
            <div style={{ gridColumn: "1 / 4", paddingTop: "1rem", borderTop: `1px solid ${C.border}` }}>
              <ScrollReveal><span style={meta}>{content.marketplace.sectionLabel}</span></ScrollReveal>
            </div>
            <div style={{ gridColumn: "5 / 12" }}>
              <ScrollReveal>
                <h2 style={{ ...serif, fontSize: "clamp(2.5rem, 5vw, 4.5rem)", marginBottom: "1.5rem" }}>
                  {content.marketplace.heading}<em style={{ fontStyle: "italic", color: C.secondary }}>{content.marketplace.headingEmphasis}</em>
                </h2>
                <p style={{ ...body, maxWidth: "80%" }}>
                  {content.marketplace.paragraph}
                </p>
              </ScrollReveal>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            {content.marketplace.cards.map((c, i) => (
              <ScrollReveal key={c.id}>
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }}
                  style={{ padding: "2.5rem", background: C.surface, border: `1px solid ${C.border}`, transition: "border-color .4s", cursor: "default", height: "100%" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(74,222,128,0.3)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                    <span style={{ fontFamily: FD, fontSize: "2.5rem", color: C.border, lineHeight: 1 }}>{c.idx}</span>
                    <LandingIcon name={c.icon} style={{ width: 20, height: 20, color: C.accent }} />
                  </div>
                  <h4 style={{ ...serif, fontSize: "1.5rem", marginBottom: "1rem" }}>{c.title}</h4>
                  <p style={{ fontFamily: FS, fontSize: "0.95rem", lineHeight: 1.6, color: C.secondary }}>{c.desc}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ TRACEABILITY (Sentient feature block) ══════ */}
      <section id="traceability" style={{ padding: "clamp(60px, 8vw, 120px) 0", background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="cp-12grid" style={{ width: "90vw", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "2rem", alignItems: "center" }}>
          <div className="cp-feat-txt" style={{ gridColumn: "2 / 6" }}>
            <ScrollReveal>
              <div style={{ fontFamily: FD, fontSize: "4rem", color: C.border, lineHeight: 1, marginBottom: "2rem" }}>{content.traceability.number}</div>
              <h3 style={{ ...serif, fontSize: "2.5rem", marginBottom: "1.5rem" }}>
                {content.traceability.title}<span style={{ color: C.accent }}>{content.traceability.titleAccent}</span>
              </h3>
              <p style={{ ...body, marginBottom: "2rem" }}>
                {content.traceability.paragraph}
              </p>
              <ul style={{ listStyle: "none", padding: 0, borderTop: `1px solid ${C.border}`, paddingTop: "1.5rem" }}>
                {content.traceability.bullets.map((text, i) => {
                  const BulletIcon = TRACEABILITY_ICONS[i % TRACEABILITY_ICONS.length];
                  return (
                  <li key={i} style={{ fontFamily: FM, fontSize: "0.85rem", color: C.muted, marginBottom: 10, display: "flex", alignItems: "center", gap: "1rem" }}>
                    <BulletIcon style={{ width: 14, height: 14, color: C.accent, flexShrink: 0 }} />{text}
                  </li>
                  );
                })}
              </ul>
              <div style={{ marginTop: "2rem" }}>
                <Link href="/lookup">
                  <button className="cp-btn cp-btn-accent"><span><QrCode style={{ width: 14, height: 14 }} /> Try Product Lookup</span></button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
          <div className="cp-feat-img-col cp-feature-img" style={{ gridColumn: "7 / 13" }}>
            <img src={content.traceability.imageUrl} alt={content.traceability.imageAlt} style={{ filter: "brightness(0.65) saturate(0.6)" }} />
          </div>
        </div>
      </section>

      {/* ══════ TECHNOLOGY GRID ══════ */}
      <section id="technology" style={{ padding: "clamp(80px, 10vw, 160px) 5vw", background: C.deep, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div className="cp-12grid" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "2rem", marginBottom: "clamp(40px, 6vw, 80px)" }}>
            <div style={{ gridColumn: "1 / 4", paddingTop: "1rem", borderTop: `1px solid ${C.border}` }}>
              <ScrollReveal><span style={meta}>{content.technology.sectionLabel}</span></ScrollReveal>
            </div>
            <div style={{ gridColumn: "5 / 12" }}>
              <ScrollReveal>
                <h2 style={{ ...serif, fontSize: "clamp(2.5rem, 5vw, 4.5rem)", marginBottom: "1.5rem" }}>
                  {content.technology.heading}<em style={{ fontStyle: "italic", color: C.secondary }}>{content.technology.headingEmphasis}</em>
                </h2>
                <p style={{ ...body, maxWidth: "80%" }}>
                  {content.technology.paragraph}
                </p>
              </ScrollReveal>
            </div>
          </div>

          {/* Row 1: 4 cards */}
          <div className="cp-tech-row1" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}` }}>
            {content.technology.row1.map((c, i) => (
              <div key={c.id} style={{ padding: "1.25rem", borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.surface, transition: "background .3s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(7,18,10,0.95)")}
                onMouseLeave={e => (e.currentTarget.style.background = C.surface)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ ...meta, fontSize: "0.7rem" }}>{c.idx}</span>
                  <LandingIcon name={c.icon} style={{ width: 15, height: 15, color: C.accent, opacity: 0.8 }} />
                </div>
                <h4 style={{ fontFamily: FS, fontSize: "0.85rem", fontWeight: 600, color: C.white, marginBottom: 8 }}>{c.title}</h4>
                <p style={{ fontFamily: FS, fontSize: "0.75rem", lineHeight: 1.5, color: C.muted }}>{c.desc}</p>
              </div>
            ))}
          </div>
          {/* Row 2: 4 cards (05-08) */}
          <div className="cp-tech-row2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderLeft: `1px solid ${C.border}` }}>
            {content.technology.row2.map((c, i) => (
              <div key={c.id} style={{ padding: "1.25rem", borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.surface, transition: "background .3s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(7,18,10,0.95)")}
                onMouseLeave={e => (e.currentTarget.style.background = C.surface)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ ...meta, fontSize: "0.7rem" }}>{c.idx}</span>
                  <LandingIcon name={c.icon} style={{ width: 15, height: 15, color: C.accent, opacity: 0.8 }} />
                </div>
                <h4 style={{ fontFamily: FS, fontSize: "0.85rem", fontWeight: 600, color: C.white, marginBottom: 8 }}>{c.title}</h4>
                <p style={{ fontFamily: FS, fontSize: "0.75rem", lineHeight: 1.5, color: C.muted }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ METRICS (Sentient large numbers + Nourish accent labels) ══════ */}
      <section style={{ padding: "clamp(80px, 12vw, 180px) 0", background: C.deep, position: "relative" }}>
        <div style={{ width: "90vw", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "clamp(40px, 6vw, 80px)" }}>
            <ScrollReveal><span style={meta}>{content.metrics.sectionLabel}</span></ScrollReveal>
          </div>
          <div className="cp-metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }}>
            {content.metrics.items.map((m, i) => (
              <ScrollReveal key={m.id}>
                <div className="cp-metric-item" style={{ borderLeft: i > 0 ? `1px solid ${C.border}` : "none", paddingLeft: i > 0 ? "2rem" : 0 }}>
                  <span style={{ ...serif, fontSize: "clamp(4rem, 8vw, 7rem)", color: C.accent, lineHeight: 1, display: "block", marginBottom: 8 }}>{m.value}</span>
                  <span style={{ ...label, color: C.accent, marginBottom: 8, display: "block" }}>{m.label}</span>
                  <p style={{ fontFamily: FS, fontSize: "0.85rem", color: C.muted, lineHeight: 1.5 }}>{m.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ TESTIMONIALS (Sentient centered + Nourish oversized quote mark) ══════ */}
      <section id="testimonials" style={{ padding: "clamp(80px, 12vw, 180px) 5vw", background: C.surface, display: "flex", justifyContent: "center", textAlign: "center", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 800 }}>
          <ScrollReveal>
            {/* Oversized quote mark */}
            <span style={{ fontFamily: FD, fontSize: "6rem", color: C.border, lineHeight: 0, display: "block", marginBottom: "2rem" }}>&ldquo;</span>
          </ScrollReveal>
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(40px, 5vw, 80px)" }}>
            {content.testimonials.map((t, i) => (
              <TestimonialItem key={t.id} name={t.name} role={t.role} quote={t.quote} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FINAL CTA (Nourish-style with bg image) ══════ */}
      <section style={{ position: "relative", overflow: "hidden", padding: "clamp(100px, 14vw, 220px) 5vw", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "3rem" }}>
        <img src={content.cta.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.12, filter: "grayscale(100%)", zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
          <ScrollReveal>
            <span style={{ ...label, color: C.accent }}>{content.cta.label}</span>
            <h2 style={{ ...serif, fontSize: "clamp(3rem, 6vw, 6rem)", marginTop: 16 }}>{content.cta.heading}</h2>
            <p style={{ ...body, maxWidth: "40ch", margin: "1.5rem auto 0", textAlign: "center" }}>
              {content.cta.paragraph}
            </p>
          </ScrollReveal>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/signin"><button className="cp-btn cp-btn-accent"><span>Sign Up <ArrowRight style={{ width: 14, height: 14 }} /></span></button></Link>
            <Link href="/lookup"><button className="cp-btn"><span><QrCode style={{ width: 14, height: 14 }} /> Explore Traceability</span></button></Link>
          </div>
        </div>

      </section>

      {/* ══════ FOOTER ══════ */}
      <footer style={{ background: C.deep, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(40px, 5vw, 64px) 5vw 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32, marginBottom: 48 }}>
            <div>
              <img src="/logo-new.png" alt="AgroChain 360" style={{ height: 48, width: "auto", objectFit: "contain", marginBottom: 16 }} />
              <p style={{ fontFamily: FS, fontSize: "0.85rem", lineHeight: 1.6, color: C.muted, maxWidth: "28ch" }}>{content.footer.description}</p>
            </div>
            {content.footer.columns.map((col, i) => (
              <div key={i}>
                <h4 style={{ ...label, color: C.accent, marginBottom: 14, fontSize: "0.6rem" }}>{col.title}</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" style={{ ...meta, color: "rgba(122,156,138,0.6)", textDecoration: "none", transition: "color .15s", fontSize: "0.7rem" }}
                        onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(122,156,138,0.6)")}>{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
            <div className="cp-footer-bottom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="cp-dot" />
                <span style={{ ...meta, fontSize: "0.65rem" }}>{content.footer.copyright}</span>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                {["Privacy", "Terms", "Cookies"].map(l => (
                  <a key={l} href="#" style={{ ...meta, fontSize: "0.65rem", textDecoration: "none", transition: "color .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
                    onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>{l}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

/* ═══════════════════ SUB-COMPONENTS ═══════════════════ */

function TestimonialItem({ name, role, quote, index }: { name: string; role: string; quote: string; index: number }) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}>
      <blockquote style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontStyle: "italic", color: "#fff", lineHeight: 1.3, marginBottom: "1.5rem" }}>
        {quote}
      </blockquote>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "0.9rem", letterSpacing: "0.05em", color: "#fff" }}>{name}</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#5b6b5e" }}>{role}</span>
      </div>
      <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 12 }}>
        {[...Array(5)].map((_, i) => (<Star key={i} style={{ width: 12, height: 12, fill: "#4ade80", color: "#4ade80" }} />))}
      </div>
    </motion.div>
  );
}

function ScrollReveal({ children }: { children: React.ReactNode }) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
