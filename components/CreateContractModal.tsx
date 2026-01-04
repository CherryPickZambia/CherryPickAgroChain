"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { SUPPORTED_CROPS, CROP_MILESTONES } from "@/lib/config";
import { generateContractId, generateQRCode, calculateMilestonePayment } from "@/lib/utils";
import { type SmartContract, type Milestone } from "@/lib/types";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { createContract, createMilestone } from "@/lib/supabaseService";

interface CreateContractModalProps {
  farmerId: string;
  onCloseAction: () => void;
  onContractCreatedAction: (contract: SmartContract) => void;
}

export default function CreateContractModal({ farmerId, onCloseAction, onContractCreatedAction }: CreateContractModalProps) {
  const { evmAddress } = useEvmAddress();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cropType: "",
    variety: "",
    requiredQuantity: "",
    discountedPrice: "",
    standardPrice: "",
    farmSize: "",
    expectedHarvestDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const contractId = generateContractId();
      const qrCode = generateQRCode(contractId);
      const totalAmount = parseFloat(formData.requiredQuantity) * parseFloat(formData.discountedPrice);
      
      const milestoneNames = CROP_MILESTONES[formData.cropType] || [];
      
      // Save contract to Supabase
      const savedContract = await createContract({
        contract_code: contractId,
        farmer_id: farmerId,
        crop_type: formData.cropType,
        variety: formData.variety,
        required_quantity: parseFloat(formData.requiredQuantity),
        price_per_kg: parseFloat(formData.discountedPrice),
        total_value: totalAmount,
        status: "active",
        harvest_date: null,
      });

      // Create milestones in Supabase
      const milestonePromises = milestoneNames.map(async (name, index) => {
        const paymentAmount = calculateMilestonePayment(totalAmount, index, milestoneNames.length);
        const expectedDate = new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000);
        
        return await createMilestone({
          contract_id: savedContract.id,
          milestone_number: index + 1,
          name,
          description: name,
          payment_percentage: Math.round(100 / milestoneNames.length),
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
        variety: savedContract.variety || '',
        requiredQuantity: savedContract.required_quantity,
        discountedPrice: savedContract.price_per_kg,
        standardPrice: savedContract.price_per_kg,
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
        status: savedContract.status as "active" | "completed" | "cancelled",
        qrCode: savedContract.contract_code,
        createdAt: new Date(savedContract.created_at),
      };

      onContractCreatedAction(contract);
    } catch (err: any) {
      console.error("Error creating contract:", err);
      setError(err.message || "Failed to create contract. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Create Smart Contract</h2>
          <button
            onClick={onCloseAction}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1: Crop Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Step 1: Select Crop</h3>
              
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Farm Size (hectares) *
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  value={formData.farmSize}
                  onChange={(e) => setFormData({ ...formData, farmSize: e.target.value })}
                  placeholder="e.g., 2.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.cropType || !formData.variety || !formData.farmSize}
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Harvest Quantity (kg) *
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
                  Discounted Price per kg (ZMW) *
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
                <p className="text-sm text-gray-500 mt-1">
                  Price you'll receive from Cherry-Pick (includes financing discount)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standard Market Price per kg (ZMW) *
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
                <p className="text-sm text-gray-500 mt-1">
                  Market price for over-delivery sales
                </p>
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
                  type="submit"
                  disabled={!formData.requiredQuantity || !formData.discountedPrice || !formData.standardPrice || loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
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
