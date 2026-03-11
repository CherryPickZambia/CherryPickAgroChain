"use client";

import { AuthButton } from "@coinbase/cdp-react";
import { Sprout, Shield, Zap, Globe, TrendingUp, Users, Award, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function SignInScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7f4] via-white to-[#f0f7f4]">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[90vh] py-12">
          {/* Left Content */}
          <div className="space-y-8 fade-in">
            <div className="inline-flex items-center space-x-2 bg-[#f0f7f4] px-4 py-2 rounded-full">
              <Sprout className="h-5 w-5 text-[#2d5f3f]" />
              <span className="text-sm font-semibold text-[#2d5f3f]">Smart Farming Platform</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-extrabold text-[#1a1a1a] leading-tight">
              Bring Growth to
              <span className="block text-[#2d5f3f] mt-2">Fresh Agriculture</span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
              Revolutionize contract farming with blockchain technology. Secure contracts, 
              milestone-based payments, and complete farm-to-retail traceability.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <AuthButton />
              <button className="btn-secondary inline-flex items-center justify-center space-x-2">
                <span>Watch Demo</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
              <div>
                <div className="text-3xl font-bold text-[#2d5f3f]">500+</div>
                <div className="text-sm text-gray-600">Active Farmers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#2d5f3f]">1,000+</div>
                <div className="text-sm text-gray-600">Contracts</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#2d5f3f]">$2M+</div>
                <div className="text-sm text-gray-600">Paid Out</div>
              </div>
            </div>
          </div>
          
          {/* Right Content - Hero Image */}
          <div className="relative hidden lg:block">
            <div className="relative w-full h-[600px] rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2d5f3f]/20 to-transparent z-10"></div>
              <div className="w-full h-full bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] flex items-center justify-center">
                <Sprout className="h-64 w-64 text-white/20" />
              </div>
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -left-8 top-20 card-premium w-48 p-4 glass">
              <div className="flex items-center space-x-3">
                <div className="bg-[#7fb069] p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-600">Yield Increase</div>
                  <div className="text-lg font-bold text-[#2d5f3f]">+17%</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-8 bottom-32 card-premium w-52 p-4 glass">
              <div className="flex items-center space-x-3">
                <div className="bg-[#2d5f3f] p-2 rounded-lg">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-600">Quality Score</div>
                  <div className="text-lg font-bold text-[#2d5f3f]">94/100</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1a1a1a] mb-4">Why Choose AgroChain 360?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Empowering farmers with blockchain technology for transparent and profitable farming
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card-premium group cursor-pointer">
              <div className="bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">
                Secure Contracts
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Blockchain-secured smart contracts ensure transparency and trust for all parties
              </p>
            </div>

            <div className="card-premium group cursor-pointer">
              <div className="bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">
                Fast Payments
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Milestone-based payments directly to your wallet upon verification
              </p>
            </div>

            <div className="card-premium group cursor-pointer">
              <div className="bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">
                Full Traceability
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Complete QR code tracking from farm to retail for consumer trust
              </p>
            </div>

            <div className="card-premium group cursor-pointer">
              <div className="bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sprout className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">
                8 Crop Types
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Support for mangoes, pineapples, cashews, tomatoes, and more
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="gradient-secondary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1a1a1a] mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to transform your farming business
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] text-white text-2xl font-bold mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-bold text-[#1a1a1a] mb-4">Create Contract</h3>
              <p className="text-gray-600 leading-relaxed">
                Sign smart contracts with pre-defined terms, milestones, and guaranteed pricing
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] text-white text-2xl font-bold mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-bold text-[#1a1a1a] mb-4">Complete Milestones</h3>
              <p className="text-gray-600 leading-relaxed">
                Extension officers verify each milestone completion through our OEVN system
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] text-white text-2xl font-bold mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold text-[#1a1a1a] mb-4">Receive Payment</h3>
              <p className="text-gray-600 leading-relaxed">
                Automatic blockchain payments released directly to your wallet upon verification
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-[#2d5f3f] to-[#1d4029] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Farming Business?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of farmers already using AgroChain 360 to secure better prices and guaranteed payments
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AuthButton />
            <button className="bg-white text-[#2d5f3f] px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
