"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TraceabilityView from "@/components/TraceabilityView";
import { getTraceabilityByBatchCode } from "@/lib/traceabilityService";
import { userFacingTraceError } from "@/lib/publicPageTheme";
import { AlertCircle, Leaf, Search, ArrowRight } from "lucide-react";

const C = {
  deep: "#020503",
  surface: "#07120a",
  white: "#ffffff",
  primary: "#e0e7e3",
  secondary: "#9aa89d",
  muted: "#5b6b5e",
  accent: "#4ade80",
  border: "rgba(255,255,255,0.08)",
  borderG: "rgba(74,222,128,0.15)",
};
const FD = "'Playfair Display', serif";
const FS = "'Inter', sans-serif";
const FM = "'Space Mono', monospace";

const injectStyles = () => {
  if (typeof window === "undefined") return;
  if (document.getElementById("cp-trace-v2")) return;
  const s = document.createElement("style");
  s.id = "cp-trace-v2";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
    @keyframes pulseDot{0%,100%{opacity:.3}50%{opacity:1}}
    @keyframes traceSpinner{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
    @keyframes tracePulse{0%,100%{opacity:0.4}50%{opacity:1}}
    .cp-trace-dot{width:6px;height:6px;background:#4ade80;border-radius:50%;display:inline-block;animation:pulseDot 2s infinite}
    .cp-trace-spinner{width:40px;height:40px;border:2px solid rgba(255,255,255,0.1);border-top:2px solid #4ade80;border-radius:50%;animation:traceSpinner 1s linear infinite}
    .cp-trace-pulse{animation:tracePulse 2s ease-in-out infinite}
    .cp-trace-btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 32px;background:transparent;color:#fff;font-family:'Inter',sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;text-decoration:none;border:1px solid rgba(255,255,255,0.3);cursor:pointer;position:relative;overflow:hidden;transition:color .4s cubic-bezier(.19,1,.22,1);font-weight:600}
    .cp-trace-btn::before{content:'';position:absolute;inset:0;background:#4ade80;transform:scaleY(0);transform-origin:bottom;transition:transform .4s cubic-bezier(.19,1,.22,1);z-index:0}
    .cp-trace-btn:hover{color:#020503}
    .cp-trace-btn:hover::before{transform:scaleY(1)}
    .cp-trace-btn span{position:relative;z-index:1;display:inline-flex;align-items:center;gap:8px}
    .cp-trace-btn-accent::before{background:#4ade80}
  `;
  document.head.appendChild(s);
};

function TraceShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    injectStyles();
    return () => { const el = document.getElementById("cp-trace-v2"); if (el) el.remove(); };
  }, []);

  return (
    <div style={{ background: C.deep, minHeight: "100vh", color: C.white, fontFamily: FS, position: "relative", overflow: "hidden" }}>
      {/* Subtle bg */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=40')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.04, pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, background: `linear-gradient(180deg, ${C.deep} 0%, transparent 40%, transparent 60%, ${C.deep} 100%)`, pointerEvents: "none" }} />

      {/* Nav */}
      <nav style={{ position: "relative", zIndex: 50, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <img src="/logo-new.png" alt="AgroChain 360" style={{ height: 36, width: "auto", objectFit: "contain" }} />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Link href="/" style={{ fontFamily: FS, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: C.secondary, textDecoration: "none", fontWeight: 500 }}>Home</Link>
            <Link href="/lookup" style={{ fontFamily: FS, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: C.secondary, textDecoration: "none", fontWeight: 500 }}>Lookup</Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 80px)", padding: "48px 32px" }}>
        {children}
      </div>
    </div>
  );
}

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
        setError(userFacingTraceError(err.message || 'Failed to load traceability data'));
      } finally {
        setLoading(false);
      }
    };

    loadTraceability();
  }, [batchCode]);

  if (loading) {
    return (
      <TraceShell>
        <div style={{ textAlign: "center" }}>
          <div className="cp-trace-spinner" style={{ margin: "0 auto 32px" }} />
          <p style={{ fontFamily: FD, fontSize: 24, fontWeight: 700, color: C.white, marginBottom: 8 }}>
            Tracing <span style={{ color: C.accent }}>Journey</span>
          </p>
          <p style={{ fontFamily: FS, fontSize: 14, color: C.secondary, fontWeight: 400, marginBottom: 16 }}>
            Fetching blockchain-verified traceability data...
          </p>
          <span style={{ fontFamily: FM, fontSize: 12, color: C.muted, letterSpacing: "0.05em", background: C.surface, border: `1px solid ${C.border}`, padding: "8px 16px", borderRadius: 8 }}>{batchCode}</span>
        </div>
      </TraceShell>
    );
  }

  if (error) {
    const isNetwork = error.toLowerCase().includes("connection") || error.toLowerCase().includes("unavailable");
    return (
      <TraceShell>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <span style={{ fontFamily: FM, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, display: "block", marginBottom: 20 }}>
            {isNetwork ? "Connection Issue" : "Lookup Result"}
          </span>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <AlertCircle style={{ width: 24, height: 24, color: "#f87171" }} />
          </div>
          <h1 style={{ fontFamily: FD, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 500, color: C.white, marginBottom: 12, lineHeight: 1.15 }}>
            Couldn&apos;t load <em style={{ fontStyle: "italic", color: C.accent }}>this batch</em>
          </h1>
          <p style={{ fontFamily: FS, fontSize: 15, color: C.secondary, lineHeight: 1.7, marginBottom: 24 }}>
            {error}
          </p>
          <div style={{ fontFamily: FM, fontSize: 12, color: C.muted, letterSpacing: "0.08em", background: C.surface, border: `1px solid ${C.border}`, padding: "10px 20px", marginBottom: 32, display: "inline-block" }}>
            {batchCode}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {isNetwork && (
              <button type="button" onClick={() => window.location.reload()} className="cp-trace-btn cp-trace-btn-accent" style={{ borderColor: C.accent, color: C.accent }}>
                <span>Retry</span>
              </button>
            )}
            <Link href="/lookup" className="cp-trace-btn" style={{ borderColor: "rgba(255,255,255,0.3)", color: C.white }}>
              <span><Search style={{ width: 14, height: 14 }} /> Try Another</span>
            </Link>
            <Link href="/" className="cp-trace-btn">
              <span>Home <ArrowRight style={{ width: 14, height: 14 }} /></span>
            </Link>
          </div>
        </div>
      </TraceShell>
    );
  }

  if (!data) {
    return (
      <TraceShell>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <span style={{ fontFamily: FM, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accent, display: "block", marginBottom: 20 }}>Journey Pending</span>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(74,222,128,0.08)", border: `1px solid ${C.borderG}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Leaf style={{ width: 24, height: 24, color: C.accent }} />
          </div>
          <h1 style={{ fontFamily: FD, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 500, color: C.white, marginBottom: 12, lineHeight: 1.15 }}>
            Story not <em style={{ fontStyle: "italic", color: C.accent }}>started yet</em>
          </h1>
          <p style={{ fontFamily: FS, fontSize: 15, color: C.secondary, lineHeight: 1.7, marginBottom: 32 }}>
            This batch has no traceability data yet. Tracking begins once the farmer logs the first activity.
          </p>
          <Link href="/lookup" className="cp-trace-btn" style={{ borderColor: "rgba(255,255,255,0.3)", color: C.white }}>
            <span>Search Another Batch</span>
          </Link>
        </div>
      </TraceShell>
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
