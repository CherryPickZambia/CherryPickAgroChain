"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { QrCode, Home, ArrowLeft } from "lucide-react";
import { useEffect } from "react";

const injectStyles = () => {
  if (typeof window === "undefined") return;
  if (document.getElementById("cp-404-styles")) return;
  const style = document.createElement("style");
  style.id = "cp-404-styles";
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
    
    .cp-404 * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    .cp-404 h1, .cp-404 h2, .cp-404 h3 { font-family: 'Space Grotesk', 'Inter', sans-serif; }
    
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

    .cp-btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
      transition: all 0.3s ease;
    }
    .cp-btn-primary:hover {
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
      transform: translateY(-2px);
    }
    
    .cp-btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }
    .cp-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }
  `;
  document.head.appendChild(style);
};

export default function NotFound() {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className="cp-404 flex flex-col min-h-screen bg-[#0d1910] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden cp-aurora-bg cp-grain pointer-events-none" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-emerald-500/20 blur-[120px] -top-20 -left-20" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-teal-500/20 blur-[100px] bottom-0 right-0" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-emerald-400/10 blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl mx-auto text-center"
        >
          {/* 404 Visual */}
          <div className="relative inline-flex items-center justify-center mb-8">
             <div className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full" />
             <h1 className="text-[120px] md:text-[180px] font-black leading-none bg-clip-text text-transparent bg-gradient-to-br from-emerald-400 via-teal-300 to-emerald-600 drop-shadow-lg">
                404
             </h1>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            <span className="text-white">Page Not Found</span>
          </h2>
          <p className="text-lg text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
            The crop you're looking for might have been harvested, or the address doesn't exist on our traceability network.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/"
              className="w-full sm:w-auto px-8 py-4 cp-btn-primary rounded-2xl font-bold text-white tracking-wide uppercase text-sm flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <Link 
              href="/lookup"
              className="w-full sm:w-auto px-8 py-4 cp-btn-secondary rounded-2xl font-bold text-white tracking-wide uppercase text-sm flex items-center justify-center gap-2"
            >
              <QrCode className="h-5 w-5" />
              <span>Trace a Product</span>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5 bg-black/20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <img src="/logo-new.png" alt="Cherry Pick" className="h-6 w-auto opacity-50" />
          <p className="text-white/20 text-xs">&copy; {new Date().getFullYear()} Cherry Pick. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
