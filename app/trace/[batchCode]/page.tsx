"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TraceabilityView from "@/components/TraceabilityView";
import { getTraceabilityByBatchCode } from "@/lib/traceabilityService";

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
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
    @keyframes pulseDot{0%,100%{opacity:.3}50%{opacity:1}}
    @keyframes traceSpinner{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
    @keyframes tracePulse{0%,100%{opacity:0.4}50%{opacity:1}}
    .cp-trace-dot{width:6px;height:6px;background:#4ade80;border-radius:50%;display:inline-block;animation:pulseDot 2s infinite}
    .cp-trace-spinner{width:40px;height:40px;border:2px solid rgba(74,222,128,0.15);border-top:2px solid #4ade80;border-radius:50%;animation:traceSpinner 1s linear infinite}
    .cp-trace-pulse{animation:tracePulse 2s ease-in-out infinite}
    .cp-trace-btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 32px;background:transparent;color:#fff;font-family:'Inter',sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;text-decoration:none;border:1px solid #fff;cursor:pointer;position:relative;overflow:hidden;transition:color .4s cubic-bezier(.19,1,.22,1)}
    .cp-trace-btn::before{content:'';position:absolute;inset:0;background:#fff;transform:scaleY(0);transform-origin:bottom;transition:transform .4s cubic-bezier(.19,1,.22,1);z-index:0}
    .cp-trace-btn:hover{color:#020503}
    .cp-trace-btn:hover::before{transform:scaleY(1)}
    .cp-trace-btn span{position:relative;z-index:1;display:inline-flex;align-items:center;gap:8px}
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
      <div style={{ position: "fixed", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=40')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.03, pointerEvents: "none" }} />

      {/* Nav */}
      <nav style={{ position: "relative", zIndex: 50, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🍒</div>
            <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 14, letterSpacing: 2, color: C.white }}>CHERRY PICK</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Link href="/lookup" style={{ fontFamily: FS, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: C.secondary, textDecoration: "none", fontWeight: 500 }}>Lookup</Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(74,222,128,0.08)", border: `1px solid ${C.borderG}`, borderRadius: 20, padding: "6px 14px" }}>
              <div className="cp-trace-dot" />
              <span style={{ fontFamily: FM, fontSize: 10, letterSpacing: 2, color: C.accent }}>VERIFIED</span>
            </div>
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
        setError(err.message || 'Failed to load traceability data');
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
          <p style={{ fontFamily: FD, fontSize: 24, fontWeight: 500, color: C.white, marginBottom: 8 }}>
            Tracing <span style={{ fontStyle: "italic", color: C.accent }}>Journey</span>
          </p>
          <p style={{ fontFamily: FS, fontSize: 14, color: C.secondary, fontWeight: 300, marginBottom: 16 }}>
            Fetching blockchain-verified traceability data...
          </p>
          <span style={{ fontFamily: FM, fontSize: 12, color: C.muted, letterSpacing: "0.05em", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, padding: "8px 16px" }}>{batchCode}</span>
        </div>
      </TraceShell>
    );
  }

  if (error) {
    return (
      <TraceShell>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", fontSize: 28 }}>
            ⚠️
          </div>
          <h1 style={{ fontFamily: FD, fontSize: 32, fontWeight: 500, color: C.white, marginBottom: 12 }}>
            Batch <span style={{ fontStyle: "italic", color: "#f87171" }}>Not Found</span>
          </h1>
          <p style={{ fontFamily: FS, fontSize: 15, color: C.secondary, fontWeight: 300, lineHeight: 1.7, marginBottom: 24 }}>
            {error}
          </p>
          <div style={{ fontFamily: FM, fontSize: 12, color: C.muted, letterSpacing: "0.05em", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, padding: "10px 20px", marginBottom: 40, display: "inline-block" }}>
            {batchCode}
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <Link href="/lookup" className="cp-trace-btn" style={{ borderColor: C.accent, color: C.accent }}>
              <span>Try Another</span>
            </Link>
            <Link href="/" className="cp-trace-btn">
              <span>Homepage</span>
            </Link>
          </div>
        </div>
      </TraceShell>
    );
  }

  if (!data) {
    return (
      <TraceShell>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(74,222,128,0.08)", border: `1px solid ${C.borderG}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", fontSize: 28 }}>
            🌱
          </div>
          <h1 style={{ fontFamily: FD, fontSize: 32, fontWeight: 500, color: C.white, marginBottom: 12 }}>
            Journey <span style={{ fontStyle: "italic", color: C.accent }}>Pending</span>
          </h1>
          <p style={{ fontFamily: FS, fontSize: 15, color: C.secondary, fontWeight: 300, lineHeight: 1.7, marginBottom: 32 }}>
            This batch has no traceability data yet. The journey tracking will begin once the farmer starts logging activities.
          </p>
          <Link href="/lookup" className="cp-trace-btn" style={{ borderColor: C.accent, color: C.accent }}>
            <span>Try Another Batch</span>
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
