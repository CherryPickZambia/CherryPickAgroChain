"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Package, CheckCircle2, Calendar, Scale, Tag,
    Thermometer, Box, Truck, ClipboardCheck, Save, AlertCircle, Coins, Loader2, ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import { mintTraceabilityNFT } from "@/lib/nftMintingService";

interface ProcessingData {
    batchCode: string;
    cropType: string;
    farmerName: string;
    quantity: string;
}

interface ProcessingModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
    batch: ProcessingData;
    onCompleteAction: (processingData: ProcessingResult) => void;
    onSaveAction?: (processingData: ProcessingResult) => void;
}

interface ProcessingResult {
    batchCode: string;
    qualityCheck: {
        passed: boolean;
        grade: string;
        notes: string;
    };
    sorting: {
        completed: boolean;
        gradeA: number;
        gradeB: number;
        rejected: number;
    };
    processing: {
        applicable: boolean;
        completed: boolean;
        methods: string[];
        duration: string;
        notes: string;
    };
    packaging: {
        completed: boolean;
        packageType: string;
        packageCount: number;
        labelsPrinted: boolean;
    };
    productionDate: string;
    expiryDate: string;
    storageConditions: string;
    readyForDistribution: boolean;
    nftMinted?: boolean;
    nftTxHash?: string;
}

export default function WarehouseProcessingModal({
    isOpen,
    onCloseAction,
    batch,
    onCompleteAction,
    onSaveAction,
    savedData
}: ProcessingModalProps & { savedData?: Partial<ProcessingResult> }) {
    const [activeStep, setActiveStep] = useState(savedData ? getLastCompletedStep(savedData) : 0);
    const [isMintingNFT, setIsMintingNFT] = useState(false);

    // Helper to determine which step to resume from
    function getLastCompletedStep(data: Partial<ProcessingResult>): number {
        if (data.packaging?.completed) return 4;
        if (data.processing?.completed || (data.processing && !data.processing.applicable)) return 3;
        if (data.sorting?.completed) return 2;
        if (data.qualityCheck?.passed) return 1;
        return 0;
    }

    const [processing, setProcessing] = useState<ProcessingResult>({
        batchCode: batch?.batchCode || "",
        qualityCheck: savedData?.qualityCheck || {
            passed: false,
            grade: "",
            notes: ""
        },
        sorting: savedData?.sorting || {
            completed: false,
            gradeA: 0,
            gradeB: 0,
            rejected: 0
        },
        processing: savedData?.processing || {
            applicable: false,
            completed: false,
            methods: [],
            duration: "",
            notes: ""
        },
        packaging: savedData?.packaging || {
            completed: false,
            packageType: "",
            packageCount: 0,
            labelsPrinted: false
        },
        productionDate: savedData?.productionDate || new Date().toISOString().split('T')[0],
        expiryDate: savedData?.expiryDate || "",
        storageConditions: savedData?.storageConditions || "",
        readyForDistribution: false
    });

    const steps = [
        { id: 0, label: "Quality Check", icon: ClipboardCheck },
        { id: 1, label: "Sorting & Grading", icon: Scale },
        { id: 2, label: "Processing", icon: Thermometer },
        { id: 3, label: "Packaging", icon: Box },
        { id: 4, label: "Final Confirmation", icon: CheckCircle2 }
    ];

    const grades = ["Premium", "Grade A", "Grade B", "Standard"];
    const packageTypes = ["Crate", "Box", "Bag", "Pallet", "Bulk Container"];
    const processingMethods = [
        "Sun Drying",
        "Mechanical Drying",
        "Freeze Drying",
        "Air Drying",
        "Roasting",
        "Freezing",
        "Blanching",
        "Pasteurization",
        "Fermentation",
        "Smoking",
        "Curing",
        "Grinding/Milling",
        "Washing",
        "Waxing",
        "None (Fresh)"
    ];
    const storageOptions = ["Ambient", "Refrigerated (2-8°C)", "Frozen (-18°C)", "Controlled Atmosphere"];

    const handleMethodToggle = (method: string) => {
        setProcessing(prev => {
            const currentMethods = prev.processing.methods;
            const newMethods = currentMethods.includes(method)
                ? currentMethods.filter(m => m !== method)
                : [...currentMethods, method];
            return {
                ...prev,
                processing: { ...prev.processing, methods: newMethods }
            };
        });
    };

    const handleSave = () => {
        // Save current progress without completing
        const dataToSave = { ...processing };
        if (onSaveAction) {
            onSaveAction(dataToSave);
        }
        toast.success("Progress saved! You can continue later.");
        onCloseAction();
    };

    const handleComplete = async () => {
        if (!processing.qualityCheck.passed) {
            toast.error("Quality check must pass before distribution");
            return;
        }
        if (!processing.sorting.completed) {
            toast.error("Sorting must be completed");
            return;
        }
        if (!processing.packaging.completed) {
            toast.error("Packaging must be completed");
            return;
        }

        // Start real NFT minting process on Base mainnet
        setIsMintingNFT(true);
        toast.loading("Uploading metadata & minting NFT on Base...", { id: "nft-minting" });

        try {
            // Parse quantity from string (e.g., "500 kg" -> 500)
            const quantityNum = parseInt(processing.packaging.packageCount.toString()) ||
                parseInt(batch?.quantity?.replace(/[^0-9]/g, '') || '0');

            // Call real NFT minting service
            const result = await mintTraceabilityNFT({
                batchCode: processing.batchCode,
                cropType: batch?.cropType || 'Unknown',
                farmerName: batch?.farmerName || 'Unknown',
                quantity: quantityNum,
                qualityGrade: processing.qualityCheck.grade,
                processingMethods: processing.processing.methods || [],
                productionDate: processing.productionDate,
                expiryDate: processing.expiryDate,
                storageConditions: processing.storageConditions,
                isOrganic: false,
                certifications: [],
            });

            if (!result.success) {
                throw new Error(result.error || 'Minting failed');
            }

            const completedData: ProcessingResult = {
                ...processing,
                readyForDistribution: true,
                nftMinted: true,
                nftTxHash: result.transactionHash
            };

            toast.dismiss("nft-minting");
            toast.success(
                <div>
                    <p className="font-bold">🎉 NFT Minted on Base!</p>
                    <p className="text-xs mt-1 font-mono">{result.transactionHash.slice(0, 20)}...</p>
                    <a
                        href={result.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                    >
                        View on BaseScan <ExternalLink className="h-3 w-3" />
                    </a>
                </div>,
                { duration: 8000 }
            );

            onCompleteAction(completedData);
            onCloseAction();
        } catch (error: any) {
            toast.dismiss("nft-minting");
            console.error('NFT minting error:', error);
            toast.error(
                <div>
                    <p className="font-bold">Failed to mint NFT</p>
                    <p className="text-xs mt-1">{error.message || 'Please try again'}</p>
                </div>,
                { duration: 5000 }
            );
        } finally {
            setIsMintingNFT(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Package className="h-6 w-6" />
                            <div>
                                <h2 className="text-xl font-bold">Warehouse Processing</h2>
                                <p className="text-sm text-white/80">Batch: {batch?.batchCode}</p>
                            </div>
                        </div>
                        <button onClick={onCloseAction} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Batch Info Bar */}
                    <div className="bg-gray-50 border-b px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm">
                            <span><strong>Crop:</strong> {batch?.cropType}</span>
                            <span><strong>Farmer:</strong> {batch?.farmerName}</span>
                            <span><strong>Quantity:</strong> {batch?.quantity}</span>
                        </div>
                    </div>

                    {/* Step Progress */}
                    <div className="px-6 py-4 border-b bg-white">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => {
                                const StepIcon = step.icon;
                                const isActive = activeStep === step.id;
                                const isCompleted = activeStep > step.id;
                                return (
                                    <div
                                        key={step.id}
                                        className="flex items-center cursor-pointer"
                                        onClick={() => setActiveStep(step.id)}
                                    >
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${isCompleted ? 'bg-green-500 text-white' :
                                            isActive ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                                        </div>
                                        <span className={`ml-2 text-sm font-medium ${isActive ? 'text-teal-600' : 'text-gray-500'}`}>
                                            {step.label}
                                        </span>
                                        {index < steps.length - 1 && (
                                            <div className={`w-12 h-1 mx-3 rounded ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="p-6 overflow-y-auto max-h-[400px]">
                        {/* Step 0: Quality Check */}
                        {activeStep === 0 && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">Quality Check</h3>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Quality Grade</label>
                                        <select
                                            value={processing.qualityCheck.grade}
                                            onChange={(e) => setProcessing(prev => ({
                                                ...prev,
                                                qualityCheck: { ...prev.qualityCheck, grade: e.target.value }
                                            }))}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="">Select Grade</option>
                                            {grades.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex items-center">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={processing.qualityCheck.passed}
                                                onChange={(e) => setProcessing(prev => ({
                                                    ...prev,
                                                    qualityCheck: { ...prev.qualityCheck, passed: e.target.checked }
                                                }))}
                                                className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">Quality Check Passed</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quality Notes</label>
                                    <textarea
                                        value={processing.qualityCheck.notes}
                                        onChange={(e) => setProcessing(prev => ({
                                            ...prev,
                                            qualityCheck: { ...prev.qualityCheck, notes: e.target.value }
                                        }))}
                                        rows={3}
                                        placeholder="Add any quality observations..."
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 1: Sorting & Grading */}
                        {activeStep === 1 && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">Sorting & Grading</h3>

                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Grade A Quantity (kg)</label>
                                        <input
                                            type="number"
                                            value={processing.sorting.gradeA}
                                            onChange={(e) => setProcessing(prev => ({
                                                ...prev,
                                                sorting: { ...prev.sorting, gradeA: parseInt(e.target.value) || 0 }
                                            }))}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Grade B Quantity (kg)</label>
                                        <input
                                            type="number"
                                            value={processing.sorting.gradeB}
                                            onChange={(e) => setProcessing(prev => ({
                                                ...prev,
                                                sorting: { ...prev.sorting, gradeB: parseInt(e.target.value) || 0 }
                                            }))}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Rejected (kg)</label>
                                        <input
                                            type="number"
                                            value={processing.sorting.rejected}
                                            onChange={(e) => setProcessing(prev => ({
                                                ...prev,
                                                sorting: { ...prev.sorting, rejected: parseInt(e.target.value) || 0 }
                                            }))}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>

                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={processing.sorting.completed}
                                        onChange={(e) => setProcessing(prev => ({
                                            ...prev,
                                            sorting: { ...prev.sorting, completed: e.target.checked }
                                        }))}
                                        className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700">Sorting Completed</span>
                                </label>
                            </div>
                        )}

                        {/* Step 2: Processing (renamed from Drying) */}
                        {activeStep === 2 && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">Processing</h3>
                                <p className="text-sm text-gray-600">Select all processing methods applied to this batch</p>

                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={processing.processing.applicable}
                                        onChange={(e) => setProcessing(prev => ({
                                            ...prev,
                                            processing: { ...prev.processing, applicable: e.target.checked }
                                        }))}
                                        className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700">Processing Required for This Batch</span>
                                </label>

                                {processing.processing.applicable && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">Processing Methods (select all that apply)</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {processingMethods.map(method => (
                                                    <label
                                                        key={method}
                                                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${processing.processing.methods.includes(method)
                                                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={processing.processing.methods.includes(method)}
                                                            onChange={() => handleMethodToggle(method)}
                                                            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                                                        />
                                                        <span className="ml-2 text-sm">{method}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Total Processing Duration</label>
                                                <input
                                                    type="text"
                                                    value={processing.processing.duration}
                                                    onChange={(e) => setProcessing(prev => ({
                                                        ...prev,
                                                        processing: { ...prev.processing, duration: e.target.value }
                                                    }))}
                                                    placeholder="e.g., 48 hours"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Processing Notes</label>
                                                <input
                                                    type="text"
                                                    value={processing.processing.notes}
                                                    onChange={(e) => setProcessing(prev => ({
                                                        ...prev,
                                                        processing: { ...prev.processing, notes: e.target.value }
                                                    }))}
                                                    placeholder="Any additional notes..."
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                />
                                            </div>
                                        </div>

                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={processing.processing.completed}
                                                onChange={(e) => setProcessing(prev => ({
                                                    ...prev,
                                                    processing: { ...prev.processing, completed: e.target.checked }
                                                }))}
                                                className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">Processing Completed</span>
                                        </label>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Step 3: Packaging */}
                        {activeStep === 3 && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">Final Packaging</h3>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Package Type</label>
                                        <select
                                            value={processing.packaging.packageType}
                                            onChange={(e) => setProcessing(prev => ({
                                                ...prev,
                                                packaging: { ...prev.packaging, packageType: e.target.value }
                                            }))}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="">Select Type</option>
                                            {packageTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Packages</label>
                                        <input
                                            type="number"
                                            value={processing.packaging.packageCount}
                                            onChange={(e) => setProcessing(prev => ({
                                                ...prev,
                                                packaging: { ...prev.packaging, packageCount: parseInt(e.target.value) || 0 }
                                            }))}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={processing.packaging.labelsPrinted}
                                            onChange={(e) => setProcessing(prev => ({
                                                ...prev,
                                                packaging: { ...prev.packaging, labelsPrinted: e.target.checked }
                                            }))}
                                            className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-700">Labels Printed (with QR Code)</span>
                                    </label>

                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={processing.packaging.completed}
                                            onChange={(e) => setProcessing(prev => ({
                                                ...prev,
                                                packaging: { ...prev.packaging, completed: e.target.checked }
                                            }))}
                                            className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-700">Packaging Completed</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Final Confirmation */}
                        {activeStep === 4 && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">Final Confirmation</h3>

                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Production Date</label>
                                        <input
                                            type="date"
                                            value={processing.productionDate}
                                            onChange={(e) => setProcessing(prev => ({
                                                ...prev,
                                                productionDate: e.target.value
                                            }))}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                        <input
                                            type="date"
                                            value={processing.expiryDate}
                                            onChange={(e) => setProcessing(prev => ({
                                                ...prev,
                                                expiryDate: e.target.value
                                            }))}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Storage Conditions</label>
                                        <select
                                            value={processing.storageConditions}
                                            onChange={(e) => setProcessing(prev => ({
                                                ...prev,
                                                storageConditions: e.target.value
                                            }))}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="">Select</option>
                                            {storageOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                    <h4 className="font-semibold text-gray-900">Processing Summary</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            {processing.qualityCheck.passed ?
                                                <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                                                <AlertCircle className="h-4 w-4 text-red-500" />}
                                            Quality: {processing.qualityCheck.grade || 'Not set'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {processing.sorting.completed ?
                                                <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                                                <AlertCircle className="h-4 w-4 text-red-500" />}
                                            Sorted: {processing.sorting.gradeA + processing.sorting.gradeB} kg
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!processing.processing.applicable || processing.processing.completed ?
                                                <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                                                <AlertCircle className="h-4 w-4 text-yellow-500" />}
                                            Processing: {processing.processing.applicable ? processing.processing.methods.join(', ') || 'Methods not selected' : 'N/A'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {processing.packaging.completed ?
                                                <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                                                <AlertCircle className="h-4 w-4 text-red-500" />}
                                            Packages: {processing.packaging.packageCount} {processing.packaging.packageType}
                                        </div>
                                    </div>
                                </div>

                                {/* NFT Info */}
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                                    <div className="flex items-center gap-3">
                                        <Coins className="h-6 w-6 text-purple-600" />
                                        <div>
                                            <h4 className="font-semibold text-purple-900">Blockchain Certificate</h4>
                                            <p className="text-sm text-purple-700">
                                                Clicking "Ready for Distribution" will mint an NFT with full traceability data on the blockchain.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t px-6 py-4 flex items-center justify-between bg-gray-50">
                        <button
                            onClick={() => activeStep > 0 && setActiveStep(activeStep - 1)}
                            disabled={activeStep === 0}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                Save & Close
                            </button>
                            {activeStep < 4 ? (
                                <button
                                    onClick={() => setActiveStep(activeStep + 1)}
                                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button
                                    onClick={handleComplete}
                                    disabled={!processing.qualityCheck.passed || !processing.sorting.completed || !processing.packaging.completed || isMintingNFT}
                                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isMintingNFT ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Minting NFT...
                                        </>
                                    ) : (
                                        <>
                                            <Truck className="h-5 w-5" />
                                            Ready for Distribution & Mint NFT
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
