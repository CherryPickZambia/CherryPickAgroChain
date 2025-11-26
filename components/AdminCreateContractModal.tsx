"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Sparkles, Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { SUPPORTED_CROPS } from "@/lib/config";
import { generateContractId, generateQRCode, calculateMilestonePayment } from "@/lib/utils";
import { type SmartContract } from "@/lib/types";
import { createContract, createMilestone, getFarmers } from "@/lib/supabaseService";
import toast from "react-hot-toast";

interface Milestone {
  name: string;
  description: string;
  paymentPercentage: number;
  daysFromStart: number;
}

interface AdminCreateContractModalProps {
  onClose: () => void;
  onContractCreated: (contract: SmartContract) => void;
}

export default function AdminCreateContractModal({ onClose, onContractCreated }: AdminCreateContractModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    farmerId: "",
    cropType: "",
    variety: "",
    requiredQuantity: "",
    discountedPrice: "",
    standardPrice: "",
    expectedHarvestDate: "",
  });

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<Milestone[]>([]);

  // Load farmers on mount
  useEffect(() => {
    loadFarmers();
  }, []);

  const loadFarmers = async () => {
    try {
      const data = await getFarmers();
      setFarmers(data.filter((f: any) => f.status === 'approved'));
    } catch (error) {
      console.error("Error loading farmers:", error);
      toast.error("Failed to load farmers");
    }
  };

  // AI-powered milestone suggestions
  const generateAIMilestones = async () => {
    setLoadingAI(true);
    setError(null);

    try {
      // Simulate AI generation (in production, call your AI API)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const suggestions: Record<string, Milestone[]> = {
        "Mango": [
          { name: "Land Preparation Complete", description: "Land cleared, plowed, and prepared for planting", paymentPercentage: 10, daysFromStart: 0 },
          { name: "Planting Verified", description: "Seedlings planted and initial watering completed", paymentPercentage: 15, daysFromStart: 7 },
          { name: "First Growth Check", description: "95% seedling survival rate confirmed", paymentPercentage: 15, daysFromStart: 30 },
          { name: "Flowering Stage", description: "Trees flowering, fruit set beginning", paymentPercentage: 15, daysFromStart: 60 },
          { name: "Pre-Harvest Inspection", description: "Quality check, pest control verified", paymentPercentage: 20, daysFromStart: 85 },
          { name: "Harvest & Delivery", description: "Crop harvested and delivered to collection point", paymentPercentage: 25, daysFromStart: 90 },
        ],
        "Tomato": [
          { name: "Nursery Establishment", description: "Seedlings germinated in nursery", paymentPercentage: 15, daysFromStart: 0 },
          { name: "Transplanting Complete", description: "Seedlings transplanted to main field", paymentPercentage: 15, daysFromStart: 21 },
          { name: "First Flowering", description: "Plants flowering, fruit setting begins", paymentPercentage: 20, daysFromStart: 35 },
          { name: "First Harvest", description: "Initial harvest of ripe tomatoes", paymentPercentage: 25, daysFromStart: 60 },
          { name: "Final Harvest", description: "Complete harvest and delivery", paymentPercentage: 25, daysFromStart: 75 },
        ],
        "Pineapple": [
          { name: "Land Preparation", description: "Land prepared with proper drainage", paymentPercentage: 10, daysFromStart: 0 },
          { name: "Planting Complete", description: "Suckers/crowns planted", paymentPercentage: 15, daysFromStart: 7 },
          { name: "6-Month Growth Check", description: "Plant establishment verified", paymentPercentage: 15, daysFromStart: 180 },
          { name: "Flowering Induced", description: "Flowering treatment applied", paymentPercentage: 15, daysFromStart: 365 },
          { name: "Fruit Development", description: "Fruits developing properly", paymentPercentage: 20, daysFromStart: 450 },
          { name: "Harvest & Delivery", description: "Ripe pineapples harvested", paymentPercentage: 25, daysFromStart: 540 },
        ],
      };

      const cropSuggestions = suggestions[formData.cropType] || [
        { name: "Planting Complete", description: "Successfully planted crop", paymentPercentage: 20, daysFromStart: 0 },
        { name: "Mid-Season Check", description: "Crop health verified", paymentPercentage: 30, daysFromStart: 45 },
        { name: "Pre-Harvest Inspection", description: "Quality assessment", paymentPercentage: 25, daysFromStart: 75 },
        { name: "Harvest & Delivery", description: "Crop harvested and delivered", paymentPercentage: 25, daysFromStart: 90 },
      ];

      setAiSuggestions(cropSuggestions);
      setMilestones(cropSuggestions);
      toast.success(`Generated ${cropSuggestions.length} AI-powered milestones for ${formData.cropType}`);
    } catch (error) {
      console.error("Error generating milestones:", error);
      setError("Failed to generate milestones. Please try again.");
    } finally {
      setLoadingAI(false);
    }
  };

  const addCustomMilestone = () => {
    setMilestones([
      ...milestones,
      { name: "", description: "", paymentPercentage: 0, daysFromStart: 0 }
    ]);
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string | number) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const getTotalPercentage = () => {
    return milestones.reduce((sum, m) => sum + (m.paymentPercentage || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate milestones
    const totalPercentage = getTotalPercentage();
    if (totalPercentage !== 100) {
      setError(`Milestone percentages must sum to 100% (currently ${totalPercentage}%)`);
      return;
    }

    if (milestones.some(m => !m.name || !m.description)) {
      setError("All milestones must have a name and description");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const contractId = generateContractId();
      const qrCode = generateQRCode(contractId);
      const totalAmount = parseFloat(formData.requiredQuantity) * parseFloat(formData.discountedPrice);
      
      // Save contract to Supabase
      const savedContract = await createContract({
        farmer_id: formData.farmerId,
        crop_type: formData.cropType,
        variety: formData.variety,
        required_quantity: parseFloat(formData.requiredQuantity),
        discounted_price: parseFloat(formData.discountedPrice),
        standard_price: parseFloat(formData.standardPrice),
        status: "active",
        qr_code: qrCode,
        harvest_date: null,
      });

      // Create milestones in Supabase
      const milestonePromises = milestones.map(async (milestone, index) => {
        const paymentAmount = (totalAmount * milestone.paymentPercentage) / 100;
        const expectedDate = new Date(Date.now() + milestone.daysFromStart * 24 * 60 * 60 * 1000);
        
        return await createMilestone({
          contract_id: savedContract.id,
          name: milestone.name,
          description: milestone.description,
          expected_date: expectedDate.toISOString(),
          completed_date: null,
          status: "pending",
          payment_amount: paymentAmount,
          payment_status: "pending",
        });
      });

      const savedMilestones = await Promise.all(milestonePromises);

      // Transform to SmartContract format
      const contract: SmartContract = {
        id: savedContract.id,
        farmerId: savedContract.farmer_id,
        cropType: savedContract.crop_type,
        variety: savedContract.variety,
        requiredQuantity: savedContract.required_quantity,
        discountedPrice: savedContract.discounted_price,
        standardPrice: savedContract.standard_price,
        milestones: savedMilestones.map((m: any) => ({
          id: m.id,
          contractId: m.contract_id,
          name: m.name,
          description: m.description,
          expectedDate: new Date(m.expected_date),
          status: m.status,
          paymentAmount: m.payment_amount,
          paymentStatus: m.payment_status,
        })),
        status: savedContract.status,
        qrCode: savedContract.qr_code,
        createdAt: new Date(savedContract.created_at),
      };

      toast.success("Contract created successfully!");
      onContractCreated(contract);
    } catch (err: any) {
      console.error("Error creating contract:", err);
      setError(err.message || "Failed to create contract. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Farming Contract</h2>
            <p className="text-sm text-gray-600 mt-1">Admin-managed contract creation with AI-powered milestones</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1: Farmer & Crop Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 1: Select Farmer & Crop</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Farmer *
                </label>
                <select
                  required
                  value={formData.farmerId}
                  onChange={(e) => setFormData({ ...formData, farmerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Choose a farmer</option>
                  {farmers.map((farmer) => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.name} - {farmer.location || 'Location not set'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Only approved farmers are shown</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Type *
                </label>
                <select
                  required
                  value={formData.cropType}
                  onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a crop</option>
                  {SUPPORTED_CROPS.map((crop) => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variety *
                </label>
                <input
                  type="text"
                  required
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  placeholder="e.g., Kent, Tommy Atkins"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.farmerId || !formData.cropType || !formData.variety}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Next: Contract Terms
              </button>
            </div>
          )}

          {/* Step 2: Contract Terms */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 2: Contract Terms</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.requiredQuantity}
                    onChange={(e) => setFormData({ ...formData, requiredQuantity: e.target.value })}
                    placeholder="e.g., 1000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Harvest Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expectedHarvestDate}
                    onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contract Price per kg (ZMW) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.discountedPrice}
                    onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                    placeholder="e.g., 15.50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Market Price per kg (ZMW) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.standardPrice}
                    onChange={(e) => setFormData({ ...formData, standardPrice: e.target.value })}
                    placeholder="e.g., 18.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {formData.requiredQuantity && formData.discountedPrice && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Total Contract Value</p>
                  <p className="text-2xl font-bold text-green-600">
                    K{(parseFloat(formData.requiredQuantity) * parseFloat(formData.discountedPrice)).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!formData.requiredQuantity || !formData.discountedPrice || !formData.standardPrice}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Next: Setup Milestones
                </button>
              </div>
            </div>
          )}

          {/* Step 3: AI-Powered Milestones */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Step 3: Setup Milestones</h3>
                <button
                  type="button"
                  onClick={generateAIMilestones}
                  disabled={loadingAI || milestones.length > 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loadingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      AI Generate
                    </>
                  )}
                </button>
              </div>

              <p className="text-sm text-gray-600">
                Use AI to generate optimized milestones for {formData.cropType}, or create custom milestones manually.
              </p>

              {/* Milestones List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {milestones.map((milestone, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-semibold text-gray-700">Milestone {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={milestone.name}
                          onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                          placeholder="Milestone name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <textarea
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          placeholder="Description"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Payment %</label>
                        <input
                          type="number"
                          value={milestone.paymentPercentage}
                          onChange={(e) => updateMilestone(index, 'paymentPercentage', parseFloat(e.target.value) || 0)}
                          placeholder="20"
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Days from start</label>
                        <input
                          type="number"
                          value={milestone.daysFromStart}
                          onChange={(e) => updateMilestone(index, 'daysFromStart', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addCustomMilestone}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Custom Milestone
              </button>

              {/* Total Percentage Indicator */}
              <div className={`p-4 rounded-lg ${getTotalPercentage() === 100 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Payment Percentage:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getTotalPercentage() === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {getTotalPercentage()}%
                    </span>
                    {getTotalPercentage() === 100 && <Check className="h-5 w-5 text-green-600" />}
                  </div>
                </div>
                {getTotalPercentage() !== 100 && (
                  <p className="text-xs text-yellow-700 mt-1">Must equal 100% to proceed</p>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || getTotalPercentage() !== 100 || milestones.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                  <span>{loading ? "Creating..." : "Create Contract"}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
