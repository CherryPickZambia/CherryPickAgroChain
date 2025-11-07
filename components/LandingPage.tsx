"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { AuthButton } from "@coinbase/cdp-react";
import { 
  Sprout, Shield, TrendingUp, Users, CheckCircle, ArrowRight, 
  Leaf, DollarSign, BarChart3, Globe, Smartphone, Lock, 
  Award, Target, Zap, Heart
} from "lucide-react";

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Parallax */}
      <section className="relative h-screen overflow-hidden">
        {/* Background Image with Parallax */}
        <motion.div
          style={{ opacity, scale }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 to-emerald-800/90 z-10"></div>
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=80')",
            }}
          ></div>
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-20 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full mb-8 border border-white/20"
              >
                <Sprout className="h-5 w-5 text-green-300" />
                <span className="text-white font-semibold">Blockchain-Powered Agriculture</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight"
              >
                Grow Your Farm,
                <br />
                <span className="text-green-300">Harvest Success</span>
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
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <AuthButton />
                <button className="px-8 py-4 bg-transparent text-white rounded-full font-bold text-lg border-2 border-white hover:bg-white/10 transition-all backdrop-blur-sm">
                  Watch Demo
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto"
              >
                {[
                  { value: "500+", label: "Active Farmers" },
                  { value: "K2.5M", label: "Paid Out" },
                  { value: "98%", label: "Success Rate" },
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <p className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</p>
                    <p className="text-green-200 text-sm md:text-base">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/70 rounded-full"></div>
          </div>
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

      {/* How It Works - Scroll Telling */}
      <section className="py-32 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                From seed to sale, we're with you every step of the way
              </p>
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
              <AuthButton />
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
                <Sprout className="h-8 w-8 text-green-500" />
                <span className="text-2xl font-bold text-white">Cherry Pick</span>
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
    <section ref={ref} className={`py-32 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">{title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
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
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2"
    >
      <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function HowItWorksStep({ step, title, description, image, features, reverse }: any) {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: reverse ? 50 : -50 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8 }}
      className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"} gap-12 items-center`}
    >
      <div className="flex-1">
        <div className="text-6xl font-bold text-green-200 mb-4">{step}</div>
        <h3 className="text-4xl font-bold text-gray-900 mb-6">{title}</h3>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">{description}</p>
        <ul className="space-y-4">
          {features.map((feature: string, index: number) => (
            <li key={index} className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              <span className="text-lg text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="rounded-2xl overflow-hidden shadow-2xl"
        >
          <img src={image} alt={title} className="w-full h-96 object-cover" />
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay }}
      className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 hover:border-green-500 hover:shadow-lg transition-all"
    >
      <Icon className="h-10 w-10 text-green-600 mb-4" />
      <h4 className="text-lg font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </motion.div>
  );
}

function TestimonialCard({ name, role, quote, avatar, delay }: any) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
    >
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xl">{avatar}</span>
        </div>
        <div>
          <h4 className="text-xl font-bold text-white">{name}</h4>
          <p className="text-green-300 text-sm">{role}</p>
        </div>
      </div>
      <p className="text-gray-200 text-lg leading-relaxed italic">"{quote}"</p>
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
