"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Users, Award, MapPin, Phone, Mail, FileText, 
  CheckCircle, ArrowRight, ArrowLeft, Building2, User,
  Briefcase, GraduationCap, Clock, DollarSign
} from "lucide-react";

interface VerifierOnboardingProps {
  walletAddress: string;
  onCompleteAction: (data: VerifierData) => void;
  onBackAction: () => void;
}

export interface VerifierData {
  verifierType: 'professional' | 'freelance';
  name: string;
  email: string;
  phone: string;
  location: string;
  // Professional fields
  ministryId?: string;
  certificationNumber?: string;
  department?: string;
  yearsOfExperience?: number;
  // Freelance fields
  nationalId?: string;
  localReferences?: string;
  availability?: string;
  // Common fields
  specializations: string[];
  serviceRadiusKm: number;
  hourlyRate?: number;
  bio?: string;
}

const SPECIALIZATIONS = [
  "Mangoes",
  "Pineapples", 
  "Cashews",
  "Tomatoes",
  "Onions",
  "Potatoes",
  "Maize",
  "Soybeans",
  "Groundnuts",
  "Cotton",
  "Tobacco",
  "Vegetables",
  "Fruits",
  "Cereals",
  "Legumes",
];

export default function VerifierOnboarding({ walletAddress, onCompleteAction, onBackAction }: VerifierOnboardingProps) {
  const [step, setStep] = useState(1);
  const [verifierType, setVerifierType] = useState<'professional' | 'freelance' | null>(null);
  const [formData, setFormData] = useState<Partial<VerifierData>>({
    specializations: [],
    serviceRadiusKm: 50,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleSpecialization = (spec: string) => {
    const current = formData.specializations || [];
    if (current.includes(spec)) {
      updateField('specializations', current.filter(s => s !== spec));
    } else {
      updateField('specializations', [...current, spec]);
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1 && !verifierType) {
      newErrors.verifierType = 'Please select a verifier type';
    }

    if (step === 2) {
      if (!formData.name?.trim()) newErrors.name = 'Name is required';
      if (!formData.email?.trim()) newErrors.email = 'Email is required';
      if (!formData.phone?.trim()) newErrors.phone = 'Phone is required';
      if (!formData.location?.trim()) newErrors.location = 'Location is required';
    }

    if (step === 3) {
      if (verifierType === 'professional') {
        if (!formData.ministryId?.trim()) newErrors.ministryId = 'Ministry ID is required';
        if (!formData.certificationNumber?.trim()) newErrors.certificationNumber = 'Certification number is required';
      } else {
        if (!formData.nationalId?.trim()) newErrors.nationalId = 'National ID is required';
      }
    }

    if (step === 4) {
      if (!formData.specializations?.length) {
        newErrors.specializations = 'Select at least one specialization';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step === 1 && verifierType) {
        setFormData(prev => ({ ...prev, verifierType }));
      }
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      onBackAction();
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (validateStep()) {
      onCompleteAction({
        ...formData,
        verifierType: verifierType!,
      } as VerifierData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${
                  s === step
                    ? 'bg-green-600 text-white scale-110'
                    : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
              initial={{ width: '0%' }}
              animate={{ width: `${((step - 1) / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form Card */}
        <motion.div
          className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Choose Verifier Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Become a Verifier</h2>
                  <p className="text-gray-600">Choose your verifier type to get started</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Professional Verifier */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setVerifierType('professional')}
                    className={`p-6 rounded-2xl border-2 text-left transition-all ${
                      verifierType === 'professional'
                        ? 'border-green-500 bg-green-50 shadow-lg'
                        : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-xl ${
                        verifierType === 'professional' ? 'bg-green-500' : 'bg-gray-100'
                      }`}>
                        <Building2 className={`w-6 h-6 ${
                          verifierType === 'professional' ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">Professional</h3>
                        <p className="text-sm text-gray-500">Ministry of Agriculture</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Registered Extension Officer
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Verify high-value milestones
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Higher earning potential
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Official certification required
                      </li>
                    </ul>
                  </motion.button>

                  {/* Freelance Verifier */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setVerifierType('freelance')}
                    className={`p-6 rounded-2xl border-2 text-left transition-all ${
                      verifierType === 'freelance'
                        ? 'border-green-500 bg-green-50 shadow-lg'
                        : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-xl ${
                        verifierType === 'freelance' ? 'bg-green-500' : 'bg-gray-100'
                      }`}>
                        <User className={`w-6 h-6 ${
                          verifierType === 'freelance' ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">Freelance</h3>
                        <p className="text-sm text-gray-500">Community Verifier</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Local community member
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Verify smaller milestones
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Flexible schedule
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        National ID required
                      </li>
                    </ul>
                  </motion.button>
                </div>

                {errors.verifierType && (
                  <p className="text-red-500 text-sm mt-4 text-center">{errors.verifierType}</p>
                )}
              </motion.div>
            )}

            {/* Step 2: Basic Information */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
                  <p className="text-gray-600">Tell us about yourself</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => updateField('name', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                          errors.name ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => updateField('email', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                          errors.email ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="your@email.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                          errors.phone ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="+260 XXX XXX XXX"
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location / District *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => updateField('location', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                          errors.location ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="e.g., Lusaka, Chipata, Ndola"
                      />
                    </div>
                    {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Verification Details */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {verifierType === 'professional' ? 'Professional Credentials' : 'Identity Verification'}
                  </h2>
                  <p className="text-gray-600">
                    {verifierType === 'professional' 
                      ? 'Provide your Ministry of Agriculture details'
                      : 'Verify your identity to become a community verifier'}
                  </p>
                </div>

                <div className="space-y-5">
                  {verifierType === 'professional' ? (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Ministry Employee ID *
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={formData.ministryId || ''}
                            onChange={(e) => updateField('ministryId', e.target.value)}
                            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                              errors.ministryId ? 'border-red-300' : 'border-gray-200'
                            }`}
                            placeholder="Enter your Ministry ID"
                          />
                        </div>
                        {errors.ministryId && <p className="text-red-500 text-sm mt-1">{errors.ministryId}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Certification Number *
                        </label>
                        <div className="relative">
                          <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={formData.certificationNumber || ''}
                            onChange={(e) => updateField('certificationNumber', e.target.value)}
                            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                              errors.certificationNumber ? 'border-red-300' : 'border-gray-200'
                            }`}
                            placeholder="Extension Officer Certificate Number"
                          />
                        </div>
                        {errors.certificationNumber && <p className="text-red-500 text-sm mt-1">{errors.certificationNumber}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Department
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={formData.department || ''}
                            onChange={(e) => updateField('department', e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            placeholder="e.g., Crop Extension Services"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Years of Experience
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            value={formData.yearsOfExperience || ''}
                            onChange={(e) => updateField('yearsOfExperience', parseInt(e.target.value))}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            placeholder="Years in agricultural extension"
                            min="0"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          National Registration Card (NRC) Number *
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={formData.nationalId || ''}
                            onChange={(e) => updateField('nationalId', e.target.value)}
                            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                              errors.nationalId ? 'border-red-300' : 'border-gray-200'
                            }`}
                            placeholder="XXX/XXX/XXX/XXX"
                          />
                        </div>
                        {errors.nationalId && <p className="text-red-500 text-sm mt-1">{errors.nationalId}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Local References
                        </label>
                        <div className="relative">
                          <Users className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                          <textarea
                            value={formData.localReferences || ''}
                            onChange={(e) => updateField('localReferences', e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            placeholder="Names and contacts of local references (village headman, community leader, etc.)"
                            rows={3}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Availability
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <select
                            value={formData.availability || ''}
                            onChange={(e) => updateField('availability', e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all appearance-none"
                          >
                            <option value="">Select availability</option>
                            <option value="full_time">Full Time (Available anytime)</option>
                            <option value="part_time">Part Time (Weekends only)</option>
                            <option value="flexible">Flexible (On request)</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 4: Specializations */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Specializations</h2>
                  <p className="text-gray-600">Select the crops you can verify</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Crop Specializations * (Select all that apply)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SPECIALIZATIONS.map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => toggleSpecialization(spec)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            formData.specializations?.includes(spec)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                    {errors.specializations && (
                      <p className="text-red-500 text-sm mt-2">{errors.specializations}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Service Radius (km)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="5"
                        max="100"
                        value={formData.serviceRadiusKm || 50}
                        onChange={(e) => updateField('serviceRadiusKm', parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                      <span className="text-lg font-bold text-green-600 w-16 text-right">
                        {formData.serviceRadiusKm} km
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum distance you're willing to travel for verifications
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hourly Rate (ZMW) - Optional
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.hourlyRate || ''}
                        onChange={(e) => updateField('hourlyRate', parseFloat(e.target.value))}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="Your expected hourly rate"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Bio & Review */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Almost Done!</h2>
                  <p className="text-gray-600">Add a bio and review your information</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bio / About You
                    </label>
                    <textarea
                      value={formData.bio || ''}
                      onChange={(e) => updateField('bio', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      placeholder="Tell farmers about your experience and why they should choose you as their verifier..."
                      rows={4}
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Registration Summary</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Verifier Type:</span>
                        <span className="font-semibold capitalize">{verifierType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-semibold">{formData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-semibold">{formData.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Radius:</span>
                        <span className="font-semibold">{formData.serviceRadiusKm} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Specializations:</span>
                        <span className="font-semibold">{formData.specializations?.length} crops</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-green-800">
                      <strong>Note:</strong> {verifierType === 'professional' 
                        ? 'Your Ministry credentials will be verified before you can start accepting high-value verification tasks.'
                        : 'Your identity will be verified before you can start accepting verification tasks in your community.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            {step < 5 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                Complete Registration
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
