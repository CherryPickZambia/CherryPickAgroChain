"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import {
  Sprout, Shield, TrendingUp, Users, CheckCircle, ArrowRight,
  Leaf, DollarSign, BarChart3, Globe, Smartphone, Lock,
  Award, Target, Zap, Heart
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { evmAddress } = useEvmAddress();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.2], [0, 100]);

  // Redirect to dashboard if user is signed in
  useEffect(() => {
    if (evmAddress) {
      router.push('/dashboard');
    }
  }, [evmAddress, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Parallax */}
      <section className="relative h-screen overflow-hidden">
        {/* Background with Advanced Parallax */}
        <motion.div
          style={{ y }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=80')",
              filter: "brightness(0.7) contrast(1.1)",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/95 via-emerald-800/90 to-green-700/95"></div>
          {/* Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-green-600/20 to-emerald-500/20"
            animate={{
              background: [
                "linear-gradient(to top right, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))",
                "linear-gradient(to top right, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))",
                "linear-gradient(to top right, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))",
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-0 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-lg px-7 py-3.5 rounded-full mb-8 border border-white/30 shadow-2xl"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sprout className="h-5 w-5 text-green-300" />
                </motion.div>
                <span className="text-white font-semibold tracking-wide">Blockchain-Powered Agriculture</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.4,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight"
              >
                <span className="inline-block">Grow Your Farm,</span>
                <br />
                <motion.span
                  className="inline-block bg-gradient-to-r from-green-300 via-emerald-300 to-green-400 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  Harvest Success
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl md:text-2xl text-green-50 mb-12 max-w-3xl mx-auto leading-relaxed"
              >
                Cherry Pick connects farmers with buyers through secure, transparent smart contracts.
                Get paid fairly, track your crops, and grow your business with blockchain technology.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              >
                <Link href="/signin">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold text-lg shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Sign In
                      <ArrowRight className="h-5 w-5" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-10 py-5 bg-white/5 text-white rounded-full font-bold text-lg border-2 border-white/80 hover:border-white transition-all backdrop-blur-md shadow-2xl relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Watch Demo
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              </motion.div>

              {/* Stats with Advanced Animations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="grid grid-cols-3 gap-12 mt-24 max-w-4xl mx-auto"
              >
                {[
                  { value: "500+", label: "Active Farmers", icon: Users },
                  { value: "K2.5M", label: "Paid Out", icon: DollarSign },
                  { value: "98%", label: "Success Rate", icon: Award },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      className="relative group"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 1.2 + index * 0.1,
                        type: "spring",
                        stiffness: 150,
                        damping: 15
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/5 backdrop-blur-md rounded-2xl"
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        transition={{ duration: 0.3 }}
                      />
                      <div className="relative text-center p-8">
                        <motion.div
                          className="inline-flex items-center justify-center w-14 h-14 bg-green-400/20 rounded-2xl mb-4"
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Icon className="h-7 w-7 text-green-300" />
                        </motion.div>
                        <motion.p
                          className="text-5xl md:text-6xl font-extrabold text-white mb-3"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          {stat.value}
                        </motion.p>
                        <p className="text-green-100 text-base font-medium tracking-wide">{stat.label}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Premium Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30 cursor-pointer group"
        >
          <motion.div
            className="w-7 h-12 border-2 border-white/40 rounded-full flex items-start justify-center p-2 backdrop-blur-sm bg-white/5"
            whileHover={{ borderColor: "rgba(255, 255, 255, 0.8)", scale: 1.1 }}
          >
            <motion.div
              className="w-1.5 h-4 bg-white/80 rounded-full"
              animate={{ y: [0, 12, 0], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </motion.div>
          <p className="text-white/60 text-xs mt-3 text-center font-medium tracking-wider">SCROLL</p>
        </motion.div>
      </section>

      {/* Features Section with Scroll Animations */}
      <ScrollSection
        title="Why Farmers Choose Cherry Pick"
        subtitle="Everything you need to succeed in modern agriculture"
      >
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: "Secure Payments",
              description: "Get paid automatically when milestones are verified. No delays, no disputes.",
              color: "from-blue-500 to-blue-600",
            },
            {
              icon: TrendingUp,
              title: "Fair Pricing",
              description: "AI-powered market analysis ensures you always get the best price for your crops.",
              color: "from-green-500 to-emerald-600",
            },
            {
              icon: Smartphone,
              title: "Easy to Use",
              description: "Manage everything from your phone. No technical knowledge required.",
              color: "from-purple-500 to-purple-600",
            },
          ].map((feature, index) => (
            <FeatureCard key={index} {...feature} delay={index * 0.2} />
          ))}
        </div>
      </ScrollSection>

      {/* How It Works - Premium Scroll Telling */}
      <section className="py-40 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <motion.div
            className="absolute top-20 left-20 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-30"
            animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-200 rounded-full blur-3xl opacity-30"
            animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-block px-6 py-2 bg-green-500/10 border-2 border-green-500/30 rounded-full text-green-700 font-semibold mb-6">
                  Simple Process
                </span>
              </motion.div>
              <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 tracking-tight leading-[1.1]">
                How It <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                From seed to sale, we're with you every step of the way
              </p>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="w-32 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mt-10"
              />
            </div>
          </ScrollReveal>

          <div className="space-y-32">
            {[
              {
                step: "01",
                title: "Create Your Contract",
                description: "Set your terms, crop type, and expected yield. Our smart contracts handle the rest.",
                image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=80",
                features: ["Flexible terms", "Automated verification", "Instant approval"],
              },
              {
                step: "02",
                title: "Track Your Progress",
                description: "Upload photos and updates as your crops grow. Extension officers verify each milestone.",
                image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80",
                features: ["Real-time tracking", "Photo verification", "Expert support"],
              },
              {
                step: "03",
                title: "Get Paid Automatically",
                description: "Once verified, payments are released instantly to your wallet. No waiting, no hassle.",
                image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80",
                features: ["Instant payments", "Secure blockchain", "Full transparency"],
              },
            ].map((step, index) => (
              <HowItWorksStep key={index} {...step} reverse={index % 2 !== 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <ScrollSection
        title="Built for Modern Farmers"
        subtitle="Technology that works as hard as you do"
        className="bg-white"
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Lock, title: "Blockchain Security", description: "Your data is encrypted and immutable" },
            { icon: DollarSign, title: "Fair Pricing", description: "AI-powered market analysis" },
            { icon: BarChart3, title: "Analytics", description: "Track performance and optimize" },
            { icon: Globe, title: "Global Market", description: "Connect with buyers worldwide" },
            { icon: Award, title: "Quality Verified", description: "Professional verification system" },
            { icon: Target, title: "Goal Tracking", description: "Set and achieve milestones" },
            { icon: Zap, title: "Fast Payments", description: "Get paid in minutes, not months" },
            { icon: Heart, title: "Community", description: "Join 500+ successful farmers" },
          ].map((benefit, index) => (
            <BenefitCard key={index} {...benefit} delay={index * 0.1} />
          ))}
        </div>
      </ScrollSection>

      {/* Testimonials */}
      <section className="py-32 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Trusted by Farmers Across Zambia
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                See how Cherry Pick is transforming lives
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "John Mwale",
                role: "Mango Farmer, Lusaka",
                quote: "Cherry Pick changed my life. I now get paid on time and can plan for my family's future.",
                avatar: "JM",
              },
              {
                name: "Mary Banda",
                role: "Pineapple Farmer, Ndola",
                quote: "The transparency is amazing. I can see exactly when my payments will arrive.",
                avatar: "MB",
              },
              {
                name: "Peter Phiri",
                role: "Tomato Farmer, Kitwe",
                quote: "Best decision I ever made. My income has doubled since joining Cherry Pick.",
                avatar: "PP",
              },
            ].map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} delay={index * 0.2} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-700"></div>
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1920&q=80')",
            }}
          ></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Ready to Transform Your Farm?
            </h2>
            <p className="text-xl text-green-50 mb-12 max-w-2xl mx-auto">
              Join hundreds of successful farmers already using Cherry Pick
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signin">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold text-lg shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
                >
                  Sign In Now
                </motion.button>
              </Link>
              <button className="px-10 py-5 bg-transparent text-white rounded-full font-bold text-lg border-2 border-white hover:bg-white/10 transition-all">
                Contact Sales
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src="/cherrypick-logo.png"
                  alt="Cherry Pick"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <p className="text-gray-400">
                Empowering farmers with blockchain technology
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-green-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-green-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-green-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Cherry Pick. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Reusable Components
function ScrollSection({ title, subtitle, children, className = "bg-gray-50" }: any) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section ref={ref} className={`py-32 ${className} relative overflow-hidden`}>
      {/* Decorative background elements */}
      <motion.div
        className="absolute top-20 right-10 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-20"
        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-20"
        animate={{ scale: [1, 1.1, 1], x: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-24"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
              {title}
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            {subtitle}
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="w-24 h-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mt-8"
          />
        </motion.div>
        {children}
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description, color, delay }: any) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ y: -12, scale: 1.02 }}
      className="group bg-white rounded-3xl p-10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all relative overflow-hidden"
    >
      {/* Animated gradient background on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />

      <div className="relative z-10">
        <motion.div
          className={`w-20 h-20 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-7 shadow-xl`}
          whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="h-9 w-9 text-white" />
        </motion.div>

        <h3 className="text-2xl font-extrabold text-gray-900 mb-4 tracking-tight">{title}</h3>
        <p className="text-gray-600 leading-relaxed text-lg">{description}</p>

        {/* Decorative element */}
        <motion.div
          className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"
        />
      </div>
    </motion.div>
  );
}

function HowItWorksStep({ step, title, description, image, features, reverse }: any) {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: reverse ? 60 : -60 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{
        duration: 0.9,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"} gap-16 items-center`}
    >
      <div className="flex-1 space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-block"
        >
          <div className="text-8xl font-black bg-gradient-to-br from-green-200 to-emerald-300 bg-clip-text text-transparent mb-6">
            {step}
          </div>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight"
        >
          {title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="text-xl text-gray-600 leading-relaxed"
        >
          {description}
        </motion.p>

        <motion.ul
          className="space-y-5"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.5
              }
            }
          }}
        >
          {features.map((feature: string, index: number) => (
            <motion.li
              key={index}
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 }
              }}
              className="flex items-center space-x-4 group"
            >
              <motion.div
                whileHover={{ scale: 1.2, rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="flex-shrink-0"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-500 transition-colors">
                  <CheckCircle className="h-5 w-5 text-green-600 group-hover:text-white transition-colors" />
                </div>
              </motion.div>
              <span className="text-lg text-gray-700 font-medium">{feature}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      <div className="flex-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.6 }}
          whileHover={{ scale: 1.03, rotate: reverse ? 2 : -2 }}
          className="relative rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
          <img src={image} alt={title} className="w-full h-[28rem] object-cover" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function BenefitCard({ icon: Icon, title, description, delay }: any) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8, y: 30 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ y: -8, scale: 1.03 }}
      className="group bg-gradient-to-br from-white via-gray-50 to-white p-8 rounded-2xl border-2 border-gray-100 hover:border-green-400 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all relative overflow-hidden"
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <motion.div
          whileHover={{ rotate: 360, scale: 1.2 }}
          transition={{ duration: 0.7 }}
          className="inline-block"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:shadow-xl transition-shadow">
            <Icon className="h-7 w-7 text-white" />
          </div>
        </motion.div>
        <h4 className="text-xl font-extrabold text-gray-900 mb-3 tracking-tight">{title}</h4>
        <p className="text-base text-gray-600 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

function TestimonialCard({ name, role, quote, avatar, delay }: any) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, rotateX: -15 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="bg-white/15 backdrop-blur-lg rounded-3xl p-10 border border-white/30 shadow-[0_20px_60px_rgba(0,0,0,0.3)] group relative overflow-hidden"
    >
      {/* Decorative gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-center space-x-5 mb-8">
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="text-white font-extrabold text-2xl">{avatar}</span>
          </motion.div>
          <div>
            <h4 className="text-2xl font-extrabold text-white mb-1 tracking-tight">{name}</h4>
            <p className="text-green-300 text-base font-medium">{role}</p>
          </div>
        </div>

        {/* Quote marks */}
        <div className="text-6xl text-green-300/20 font-serif mb-4 leading-none">"</div>
        <p className="text-gray-100 text-lg leading-relaxed italic font-light -mt-6 mb-4">
          {quote}
        </p>

        {/* Star rating */}
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: delay + 0.5 + i * 0.1 }}
            >
              <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            </motion.div>
          ))}
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
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
}
