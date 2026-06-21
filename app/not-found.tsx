"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";
import { P, FD, FS, FM } from "@/lib/publicPageTheme";

export default function NotFound() {
  return (
    <div style={{ background: P.deep, minHeight: "100vh", color: P.white, fontFamily: FS, position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{ position: "fixed", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=40')", backgroundSize: "cover", backgroundPosition: "center top", opacity: 0.12, pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, background: `linear-gradient(180deg, rgba(2,5,3,0.55) 0%, rgba(2,5,3,0.35) 40%, ${P.deep} 100%)`, pointerEvents: "none" }} />

      <main style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ textAlign: "center", maxWidth: 560 }}>
          <span style={{ fontFamily: FM, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: P.accent, display: "block", marginBottom: 20 }}>404</span>
          <h1 style={{ fontFamily: FD, fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 500, lineHeight: 1.1, margin: "0 0 16px" }}>
            Page <em style={{ fontStyle: "italic", color: P.accent }}>not found</em>
          </h1>
          <p style={{ color: P.secondary, fontSize: 16, lineHeight: 1.7, margin: "0 0 40px" }}>
            This address is not on AgroChain 360. Head home or trace a product batch instead.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", border: `1px solid ${P.accent}`, color: P.accent, textDecoration: "none", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <Home style={{ width: 16, height: 16 }} />
              Back to Home
            </Link>
            <Link href="/lookup" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", border: "1px solid rgba(255,255,255,0.25)", color: P.white, textDecoration: "none", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <Search style={{ width: 16, height: 16 }} />
              Trace a Product
            </Link>
          </div>
        </motion.div>
      </main>

      <footer style={{ position: "relative", zIndex: 10, borderTop: `1px solid ${P.border}`, padding: "24px 32px", display: "flex", justifyContent: "center" }}>
        <Link href="/">
          <img src="/logo-new.png" alt="AgroChain 360" style={{ height: 28, width: "auto", objectFit: "contain", opacity: 0.8 }} />
        </Link>
      </footer>
    </div>
  );
}
