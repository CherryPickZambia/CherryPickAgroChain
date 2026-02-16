"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import {
  Sprout, Shield, TrendingUp, Users, CheckCircle, ArrowRight,
  Leaf, DollarSign, BarChart3, Globe, Smartphone, Lock,
  Award, Target, Zap, Heart, ChevronDown, Play, Star,
  Layers, Eye, ArrowUpRight, Search, Grape, Cherry, Wheat
} from "lucide-react";

/* ─────────────────────────────── STYLES ─────────────────────────────── */
const injectStyles = () => {
  if (typeof window === "undefined") return;
  if (document.getElementById("cp-landing-styles")) return;
  const style = document.createElement("style");
  style.id = "cp-landing-styles";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

    /* Aurora gradient animation */
    @keyframes aurora {
      0%, 100% { background-position: 0% 50%; }
      25% { background-position: 50% 100%; }
      50% { background-position: 100% 50%; }
      75% { background-position: 50% 0%; }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-12px) rotate(1deg); }
      66% { transform: translateY(6px) rotate(-1deg); }
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    @keyframes grain {
      0%, 100% { transform: translate(0, 0); }
      10% { transform: translate(-2%, -2%); }
      30% { transform: translate(2%, -3%); }
      50% { transform: translate(-1%, 2%); }
      70% { transform: translate(3%, 1%); }
      90% { transform: translate(-3%, 3%); }
    }

    @keyframes pulse-ring {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.1); opacity: 0.3; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }

    @keyframes gradient-text {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .cp-landing * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    .cp-landing h1, .cp-landing h2, .cp-landing h3 { font-family: 'Space Grotesk', 'Inter', sans-serif; }

    /* Fix for white space below footer: set body bg to footer color */
    html, body {
      background-color: #0a0f0d;
      margin: 0;
      padding: 0;
      min-height: 100vh;
    }

    .cp-aurora-bg {
      background: linear-gradient(135deg, #0a0f0d 0%, #0d1a14 20%, #081510 40%, #0a1f17 60%, #050d09 80%, #0a0f0d 100%);
      background-size: 300% 300%;
      /* animation: aurora 60s ease infinite; disabled for static */
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

    .cp-glass {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px) saturate(150%);
      -webkit-backdrop-filter: blur(20px) saturate(150%);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .cp-glass-card {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(40px) saturate(180%);
      -webkit-backdrop-filter: blur(40px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .cp-glass-card:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(16, 185, 129, 0.2);
      transform: translateY(-4px);
      box-shadow: 0 20px 60px -15px rgba(16, 185, 129, 0.15), 0 0 0 1px rgba(16, 185, 129, 0.1);
    }

    .cp-light-card {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.12); /* Darker border */
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04); /* Darker shadow */
      transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .cp-light-card:hover {
      border-color: rgba(16, 185, 129, 0.4); /* Darker hover border */
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.2); /* Darker hover shadow */
      transform: translateY(-6px);
    }

    .cp-gradient-text {
      background: linear-gradient(135deg, #6ee7b7 0%, #34d399 25%, #10b981 50%, #059669 75%, #6ee7b7 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradient-text 4s linear infinite;
    }

    .cp-shimmer {
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
      background-size: 200% 100%;
      animation: shimmer 3s ease-in-out infinite;
    }

    .cp-glow-emerald {
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.15), 0 0 60px rgba(16, 185, 129, 0.05);
    }

    .cp-btn-primary {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
      transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .cp-btn-primary::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%);
      opacity: 0;
      transition: opacity 0.4s ease;
    }
    .cp-btn-primary:hover::before { opacity: 1; }
    .cp-btn-primary:hover {
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.4), 0 10px 40px rgba(16, 185, 129, 0.2);
      transform: translateY(-2px);
    }

    .cp-btn-ghost {
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .cp-btn-ghost:hover {
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.06);
      transform: translateY(-2px);
    }

    .cp-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.2), transparent);
    }

    .cp-number {
      font-family: 'Space Grotesk', monospace;
      font-variant-numeric: tabular-nums;
    }

    .cp-noise-overlay {
      mix-blend-mode: overlay;
      opacity: 0.5;
    }
  `;
  document.head.appendChild(style);
};

/* ─────────────────────────────── MAIN COMPONENT ─────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const { evmAddress } = useEvmAddress();
  const { scrollYProgress } = useScroll();
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    if (evmAddress) router.push("/dashboard");
  }, [evmAddress, router]);

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.96]);

  return (
    <div className="cp-landing flex flex-col min-h-screen bg-[#fafaf9]">
      <main className="flex-grow">
        {/* ──────────── HERO ──────────── */}
        <section ref={heroRef} className="relative overflow-hidden cp-aurora-bg cp-grain">
          {/* Ambient light orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute w-[800px] h-[800px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
                top: "-20%", left: "-10%",
              }}
            />
            <div
              className="absolute w-[600px] h-[600px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)",
                bottom: "-10%", right: "-5%",
              }}
            />
            <div
              className="absolute w-[400px] h-[400px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(6,95,70,0.15) 0%, transparent 60%)",
                top: "30%", right: "20%",
              }}
            />
          </div>

          {/* Floating Icons (White plant/fruit based) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            <div className="absolute top-[15%] left-[10%] text-white/10">
              <Leaf className="w-12 h-12" />
            </div>
            <div className="absolute top-[25%] right-[15%] text-white/5">
              <Grape className="w-16 h-16" />
            </div>
            <div className="absolute bottom-[20%] left-[20%] text-white/5">
              <Sprout className="w-14 h-14" />
            </div>
            <div className="absolute top-[40%] right-[30%] text-white/5">
              <Wheat className="w-10 h-10" />
            </div>
            <div className="absolute bottom-[30%] right-[10%] text-white/10">
              <Cherry className="w-12 h-12" />
            </div>
          </div>

          {/* Top navigation bar */}
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative z-30 flex items-center justify-between px-6 md:px-12 lg:px-20 py-6"
          >
            <div className="flex items-center gap-3">
              <img src="/logo-new.png" alt="Cherry Pick" className="h-10 w-auto object-contain" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/50 hover:text-white text-sm font-medium transition-colors duration-300">Features</a>
              <a href="#how-it-works" className="text-white/50 hover:text-white text-sm font-medium transition-colors duration-300">How It Works</a>
              <a href="#testimonials" className="text-white/50 hover:text-white text-sm font-medium transition-colors duration-300">Testimonials</a>
              <Link href="/signin">
                <button className="cp-btn-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full">
                  <span className="relative z-10">Get Started</span>
                </button>
              </Link>
            </div>
          </motion.nav>

          {/* Hero Content */}
          <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-20 translate-y-[4%]">
            <div className="max-w-5xl mx-auto px-6 md:px-12 pt-8 md:pt-12 lg:pt-16 text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="inline-flex items-center gap-2.5 cp-glass rounded-full px-5 py-2 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300/90 text-xs font-medium tracking-[0.15em] uppercase">
                    Blockchain-Powered Agriculture
                  </span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.05] tracking-[-0.03em] mb-6"
              >
                <span className="block text-white">Grow Your Farm,</span>
                <span className="block cp-gradient-text mt-1">Harvest Success</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-base md:text-lg text-white/40 max-w-2xl mx-auto leading-relaxed font-light mb-10"
              >
                Cherry Pick connects farmers with buyers through secure, transparent
                smart contracts. Get paid fairly, track your crops, and grow your
                business with blockchain technology.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-16"
              >
                <Link href="/signin">
                  <button className="group cp-btn-primary text-white font-semibold px-10 py-4 rounded-full text-base flex items-center gap-3">
                    <span className="relative z-10 flex items-center gap-3">
                      Start Growing
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </button>
                </Link>
                <Link href="/lookup">
                  <button className="group cp-btn-ghost text-white/70 hover:text-white font-medium px-8 py-4 rounded-full text-base flex items-center gap-3">
                    <Search className="h-4 w-4" />
                    Verify Product
                  </button>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto pb-16"
              >
                {[
                  { value: "500+", label: "Active Farmers" },
                  { value: "K2.5M", label: "Paid Out" },
                  { value: "98%", label: "Success Rate" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 + i * 0.1 }}
                    className="cp-glass rounded-2xl p-6 md:p-8"
                  >
                    <p className="cp-number text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1">
                      {stat.value}
                    </p>
                    <p className="text-white/30 text-xs md:text-sm font-medium tracking-wide">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ──────────── FEATURES ──────────── */}
        <section id="features" className="relative py-32 md:py-40 bg-[#F3F4F6]">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <SectionHeader
              badge="Why Cherry Pick"
              title="Everything you need to succeed in modern agriculture"
              subtitle="We built the infrastructure so you can focus on what matters most — growing."
            />

            <div className="grid md:grid-cols-3 gap-6 mt-20">
              {[
                {
                  icon: Shield,
                  title: "Secure Payments",
                  desc: "Get paid automatically when milestones are verified. No delays, no disputes, no middlemen.",
                  accent: "#10b981",
                },
                {
                  icon: TrendingUp,
                  title: "Fair Pricing",
                  desc: "AI-powered market analysis ensures you always get the best price for your crops in real-time.",
                  accent: "#10b981",
                },
                {
                  icon: Smartphone,
                  title: "Easy to Use",
                  desc: "Manage everything from your phone. No technical knowledge required — just farm and earn.",
                  accent: "#10b981",
                },
              ].map((f, i) => (
                <FeatureCard key={i} {...f} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ──────────── HOW IT WORKS ──────────── */}
        <section id="how-it-works" className="relative py-32 md:py-40 bg-white overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />

          <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
            <SectionHeader
              badge="Simple Process"
              title={<>From seed to sale, <span className="cp-gradient-text">we&apos;re with you</span></>}
              subtitle="Three simple steps to transform your farming business forever."
            />

            <div className="mt-24 space-y-24 md:space-y-32">
              {[
                {
                  step: "01",
                  title: "Create Your Contract",
                  desc: "Set your terms, crop type, and expected yield. Our smart contracts handle the rest — instantly.",
                  bullets: ["Flexible terms", "Automated verification", "Instant approval"],
                  image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=80",
                },
                {
                  step: "02",
                  title: "Track Your Progress",
                  desc: "Upload photos and updates as your crops grow. Extension officers verify each milestone in real-time.",
                  bullets: ["Real-time tracking", "Photo verification", "Expert support"],
                  image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80",
                },
                {
                  step: "03",
                  title: "Get Paid Automatically",
                  desc: "Once verified, payments are released instantly to your wallet. No waiting, no hassle, no paperwork.",
                  bullets: ["Instant payments", "Secure blockchain", "Full transparency"],
                  image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80",
                },
              ].map((s, i) => (
                <ProcessStep key={i} {...s} reverse={i % 2 !== 0} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ──────────── BENEFITS GRID ──────────── */}
        <section className="relative py-32 md:py-40 bg-[#F3F4F6]">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <SectionHeader
              badge="Platform"
              title="Built for modern farmers"
              subtitle="Technology that works as hard as you do."
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-20">
              {[
                { icon: Lock, title: "Blockchain Security", desc: "Encrypted & immutable records" },
                { icon: DollarSign, title: "Fair Pricing", desc: "AI-powered market analysis" },
                { icon: BarChart3, title: "Analytics", desc: "Track & optimize performance" },
                { icon: Globe, title: "Global Market", desc: "Connect worldwide" },
                { icon: Award, title: "Quality Verified", desc: "Professional verification" },
                { icon: Target, title: "Goal Tracking", desc: "Set & achieve milestones" },
                { icon: Zap, title: "Fast Payments", desc: "Minutes, not months" },
                { icon: Heart, title: "Community", desc: "500+ successful farmers" },
              ].map((b, i) => (
                <BenefitCard key={i} {...b} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ──────────── TESTIMONIALS ──────────── */}
        <section id="testimonials" className="relative py-32 md:py-40 cp-aurora-bg cp-grain overflow-hidden">
          {/* Ambient orb */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-[600px] h-[600px] rounded-full" style={{
              background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 60%)",
              top: "10%", left: "50%", transform: "translateX(-50%)",
            }} />
          </div>

          <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
            <SectionHeader
              badge="Testimonials"
              title="Trusted by farmers across Zambia"
              subtitle="Real stories from real farmers."
              dark
            />

            <div className="grid md:grid-cols-3 gap-6 mt-20">
              {[
                {
                  name: "John Mwale",
                  role: "Mango Farmer, Lusaka",
                  quote: "Cherry Pick changed my life. I now get paid on time and can plan for my family's future with confidence.",
                  initials: "JM",
                },
                {
                  name: "Mary Banda",
                  role: "Pineapple Farmer, Ndola",
                  quote: "The transparency is amazing. I can see exactly when my payments will arrive — no more uncertainty.",
                  initials: "MB",
                },
                {
                  name: "Peter Phiri",
                  role: "Tomato Farmer, Kitwe",
                  quote: "Best decision I ever made. My income has doubled since joining Cherry Pick. It's a game-changer.",
                  initials: "PP",
                },
              ].map((t, i) => (
                <TestimonialCard key={i} {...t} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ──────────── CTA ──────────── */}
        <section className="relative py-32 md:py-40 bg-white overflow-hidden">
          {/* Subtle Crops Background */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1625246333195-551e5d2c5e34?q=80&w=2070&auto=format&fit=crop"
              alt="Crops Field Background"
              className="w-full h-full object-cover opacity-[0.03] grayscale"
            />
          </div>

          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: "radial-gradient(circle at 30% 50%, #10b981 0%, transparent 50%), radial-gradient(circle at 70% 50%, #059669 0%, transparent 50%)",
          }} />

          <div className="max-w-3xl mx-auto px-6 md:px-12 text-center relative z-10">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 bg-emerald-50 rounded-full px-4 py-1.5 mb-8">
                <Sprout className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 text-xs font-semibold tracking-wide uppercase">
                  Get Started Today
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-[-0.03em] leading-[1.1] mb-6">
                Ready to transform{" "}
                <span className="cp-gradient-text">your farm?</span>
              </h2>

              <p className="text-lg text-gray-500 mb-12 leading-relaxed max-w-xl mx-auto">
                Join hundreds of successful farmers already using Cherry Pick to
                secure contracts, track crops, and get paid on time.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/signin">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="cp-btn-primary text-white font-semibold px-10 py-4 rounded-full text-base flex items-center gap-3"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Start Growing
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </motion.button>
                </Link>
                <button className="text-gray-500 hover:text-gray-900 font-medium px-8 py-4 rounded-full text-base transition-colors duration-300 border border-gray-200 hover:border-gray-300">
                  Contact Sales
                </button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="relative mt-auto w-full cp-aurora-bg cp-grain flex-shrink-0 overflow-hidden">
        <div className="cp-divider" />
        <div className="max-w-6xl mx-auto px-6 md:px-12 pt-16 pb-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-10 mb-14">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                {/* Fixed Logo: using new logo, removed brightness/invert filter */}
                <img
                  src="/logo-new.png"
                  alt="Cherry Pick"
                  className="h-14 w-auto object-contain hover:opacity-100 transition-opacity"
                />
              </div>
              <p className="text-white/30 text-sm leading-relaxed">
                Empowering farmers with blockchain technology for a more transparent and fair future.
              </p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Security", "Roadmap"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
              { title: "Support", links: ["Help Center", "Contact", "FAQ", "Status"] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-white text-xs font-semibold tracking-[0.15em] uppercase mb-5" style={{ color: '#ffffff' }}>{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-white/30 hover:text-white/70 text-sm transition-colors duration-300">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="cp-divider mb-8" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/20 text-xs">&copy; 2026 Cherry Pick. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-white/20 hover:text-white/50 text-xs transition-colors">Privacy</a>
              <a href="#" className="text-white/20 hover:text-white/50 text-xs transition-colors">Terms</a>
              <a href="#" className="text-white/20 hover:text-white/50 text-xs transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────── SUB COMPONENTS ─────────────────────────── */

function SectionHeader({ badge, title, subtitle, dark = false }: any) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 ${dark
        ? "bg-white/5 border border-white/10"
        : "bg-emerald-50 border border-emerald-100"
        }`}>
        <span className={`text-xs font-semibold tracking-[0.15em] uppercase ${dark ? "text-emerald-300/80" : "text-emerald-700"
          }`}>
          {badge}
        </span>
      </div>

      <h2
        style={dark ? { color: "#ffffff" } : {}}
        className={`text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.03em] leading-[1.15] mb-5 ${dark ? "text-white" : "text-gray-900"
          }`}>
        {title}
      </h2>

      <p className={`text-base md:text-lg max-w-2xl mx-auto leading-relaxed ${dark ? "text-white/35" : "text-gray-500"
        }`}>
        {subtitle}
      </p>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, desc, accent, index }: any) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="cp-light-card rounded-2xl p-8 md:p-10 group cursor-default"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
        style={{ backgroundColor: `${accent}10` }}
      >
        <Icon className="h-6 w-6" style={{ color: accent }} />
      </div>

      <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-[15px]">{desc}</p>

      {/* Bottom accent line */}
      <div className="mt-8 h-[2px] bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: accent }}
          initial={{ width: "0%" }}
          whileInView={{ width: "40%" }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 + index * 0.15, duration: 1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

function ProcessStep({ step, title, desc, bullets, image, reverse, index }: any) {
  const [ref, inView] = useInView({ threshold: 0.25, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"} gap-12 md:gap-16 items-center`}
    >
      <div className="flex-1 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
        >
          <span className="cp-number text-6xl md:text-7xl font-bold cp-gradient-text">{step}</span>
        </motion.div>

        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-[-0.02em] leading-tight">
          {title}
        </h3>

        <p className="text-gray-500 text-lg leading-relaxed">{desc}</p>

        <ul className="space-y-3 pt-2">
          {bullets.map((b: string, i: number) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -15 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span className="text-gray-700 font-medium text-[15px]">{b}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="flex-1 w-full">
        {/* Simple Fade In (User Requested) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 1.0 }}
          className="relative group"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.12)] border border-gray-100">
            <MotionImage
              src={image}
              alt={title}
              className="w-full h-[300px] md:h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Wrapper for image to support motion and hover scale
const MotionImage = motion.img;

function BenefitCard({ icon: Icon, title, desc, index }: any) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="cp-light-card rounded-xl p-6 group cursor-default"
    >
      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors duration-300">
        <Icon className="h-5 w-5 text-emerald-600" />
      </div>
      <h4 className="text-base font-bold text-gray-900 tracking-tight mb-1.5">{title}</h4>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function TestimonialCard({ name, role, quote, initials, index }: any) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="cp-glass-card rounded-2xl p-8 md:p-10 h-full flex flex-col justify-between"
    >
      <div>
        {/* Stars */}
        <div className="flex gap-1 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-emerald-400 text-emerald-400" />
          ))}
        </div>

        <p className="text-white/60 text-base leading-relaxed mb-8 font-light">
          &ldquo;{quote}&rdquo;
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">{initials}</span>
        </div>
        <div>
          <h4 style={{ color: "#ffffff" }} className="text-white font-semibold text-sm">{name}</h4>
          <p className="text-white/30 text-xs">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ScrollReveal({ children }: any) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
