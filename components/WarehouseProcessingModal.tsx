"use client";
// Updated stepper icons to be consistently rounded
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Package, CheckCircle2, Calendar, Scale, Tag,
    Thermometer, Box, Truck, ClipboardCheck, Save, AlertCircle, Coins, Loader2, ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import { uploadImageToIPFS } from "@/lib/ipfsService";
import { mintTraceabilityNFT } from "@/lib/nftMintingService";
import { Upload } from "lucide-react";
import CropDiagnostics from "./CropDiagnostics";

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

export interface ProcessingResult {
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
        notes?: string;
        /**
         * Multiple package size variants in the same batch.
         * e.g. [{ sizeLabel: '500g', sizeKg: 0.5, count: 100 }, { sizeLabel: '1kg', sizeKg: 1, count: 40 }]
         */
        sizes?: Array<{ sizeLabel: string; sizeKg: number; count: number }>;
    };
    productionDate: string;
    expiryDate: string;
    storageConditions: string;
    readyForDistribution: boolean;
    productName?: string;
    productImage?: string;
    nftMinted?: boolean;
    nftTxHash?: string;
    aiDefectScan?: {
        disease: string;
        confidence: number;
        healthScore: number;
    };
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
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);

            // Upload to IPFS using existing service (includes compression)
            const result = await uploadImageToIPFS(file);

            setProcessing(prev => ({ ...prev, productImage: result.url }));
            toast.success("Product image uploaded to IPFS");
        } catch (error: unknown) {
            console.error("Upload error:", error);
            const message = error instanceof Error ? error.message : "Failed to upload image";
            toast.error(message);
        } finally {
            setIsUploading(false);
        }
    };

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
            labelsPrinted: false,
            notes: "",
            sizes: []
        },
        productionDate: savedData?.productionDate || new Date().toISOString().split('T')[0],
        expiryDate: savedData?.expiryDate || "",
        storageConditions: savedData?.storageConditions || "",
        productName: savedData?.productName || batch?.cropType || "",
        productImage: savedData?.productImage || "",
        readyForDistribution: false,
        aiDefectScan: savedData?.aiDefectScan
    });

    const [showAiScanner, setShowAiScanner] = useState(false);

    const steps = [
        { id: 0, label: "Quality Check", icon: ClipboardCheck },
        { id: 1, label: "Sorting & Grading", icon: Scale },
        { id: 2, label: "Processing", icon: Thermometer },
        { id: 3, label: "Packaging", icon: Box },
        { id: 4, label: "Final Confirmation", icon: CheckCircle2 }
    ];

    const grades = ["Premium", "Grade A", "Grade B", "Standard"];
    const packageTypes = ["Crate", "Box", "Bag", "Pallet", "Bulk Container", "Pack"];
    const packSizes = ["200g", "100g", "50g", "25g"];
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
                productName: processing.productName,
                productImage: processing.productImage,
                aiDefectScan: processing.aiDefectScan
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
        } catch (error: unknown) {
            toast.dismiss("nft-minting");
            console.error('NFT minting error:', error);
            const message = error instanceof Error ? error.message : 'Please try again';
            toast.error(
                <div>
                    <p className="font-bold">Failed to mint NFT</p>
                    <p className="text-xs mt-1">{message}</p>
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
                    className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0" style={{ background: '#F7F9FB' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl" style={{ background: '#0C2D3A' }}>
                                <Package className="h-5 w-5" style={{ color: '#BFFF00' }} />
                            </div>
                            <div>
                                <h2 className="text-xl" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#0C2D3A' }}>Warehouse Processing</h2>
                                <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#5A7684' }}>Batch: {batch?.batchCode}</p>
                            </div>
                        </div>
                        <button onClick={onCloseAction} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-5 w-5" style={{ color: '#5A7684' }} />
                        </button>
                    </div>

                    {/* Batch Info Bar */}
                    <div className="bg-gray-50 border-b px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                            <span><strong>Crop:</strong> {batch?.cropType}</span>
                            <span><strong>Farmer:</strong> {batch?.farmerName}</span>
                            <span><strong>Quantity:</strong> {batch?.quantity}</span>
                        </div>
                    </div>

                    {/* Step Progress */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-white flex-shrink-0 overflow-x-auto">
                        <div className="flex items-center justify-between min-w-[600px] sm:min-w-0">
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
                                        <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${isCompleted ? 'bg-green-500 text-white' :
                                            isActive ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            <StepIcon className="h-5 w-5" />
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
                    <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto">
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
                                        <div className="flex items-center gap-4">
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
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setProcessing(prev => ({
                                                        ...prev,
                                                        qualityCheck: { ...prev.qualityCheck, passed: false, notes: prev.qualityCheck.notes ? prev.qualityCheck.notes + '\n[FAILED] Quality check failed - batch rejected.' : '[FAILED] Quality check failed - batch rejected.' }
                                                    }));
                                                    toast.error('Quality check marked as FAILED');
                                                }}
                                                className="px-3 py-1.5 bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors"
                                            >
                                                ✕ Mark as Failed
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Intake Defect Scanning */}
                                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" /> AI Defect Scanner
                                            </h4>
                                            <p className="text-xs text-indigo-600 mt-1">Scan intake crates for rot, disease, and overall quality.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowAiScanner(!showAiScanner)}
                                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                                        >
                                            {showAiScanner ? "Close Scanner" : "Scan Batch"}
                                        </button>
                                    </div>

                                    {showAiScanner && (
                                        <div className="bg-white rounded-xl overflow-hidden border border-indigo-100 shadow-sm mt-4" style={{ minHeight: 320 }}>
                                            <CropDiagnostics
                                                cropType={batch?.cropType}
                                                onResult={(result) => {
                                                    setProcessing(prev => ({
                                                        ...prev,
                                                        aiDefectScan: {
                                                            disease: result.disease,
                                                            confidence: result.confidence,
                                                            healthScore: result.healthScore
                                                        },
                                                        qualityCheck: {
                                                            ...prev.qualityCheck,
                                                            notes: `${prev.qualityCheck.notes}\n[AI Scan] Health: ${result.healthScore}/100, Defect/Disease: ${result.disease} (${(result.confidence * 100).toFixed(0)}%)`.trim(),
                                                            grade: result.healthScore >= 80 ? "Premium" : result.healthScore >= 60 ? "Grade A" : "Grade B"
                                                        }
                                                    }));
                                                    toast.success("Batch successfully scanned!");
                                                    setShowAiScanner(false);
                                                }}
                                            />
                                        </div>
                                    )}

                                    {processing.aiDefectScan && (
                                        <div className="mt-3 bg-white p-3 rounded-xl border border-indigo-200 flex justify-between items-center">
                                            <div>
                                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Last Scan Result</span>
                                                <p className="text-sm font-semibold text-gray-900">{processing.aiDefectScan.disease}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Score: {processing.aiDefectScan.healthScore}/100</span>
                                                <p className="text-[10px] text-gray-400 mt-1">Conf: {(processing.aiDefectScan.confidence * 100).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4">
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
                                    <div className="space-y-4 pt-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Processing Type</label>
                                            <select
                                                value={processing.processing.methods[0] || ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setProcessing(prev => ({
                                                        ...prev,
                                                        processing: { ...prev.processing, methods: val ? [val] : [] }
                                                    }));
                                                }}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                                            >
                                                <option value="">Select Processing Type</option>
                                                <option value="Dehydration">Dehydration</option>
                                                <option value="Freezing">Freezing</option>
                                                <option value="Juicing">Juicing</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">All Applied Methods (select additional if any)</label>
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
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Packaging */}
                        {activeStep === 3 && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">Final Packaging</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Number of Packages (auto)</label>
                                        <input
                                            type="number"
                                            value={(processing.packaging.sizes || []).reduce((s, x) => s + (x.count || 0), 0) || processing.packaging.packageCount}
                                            onChange={(e) => setProcessing(prev => ({
                                                ...prev,
                                                packaging: { ...prev.packaging, packageCount: parseInt(e.target.value) || 0 }
                                            }))}
                                            disabled={(processing.packaging.sizes || []).length > 0}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-700"
                                        />
                                    </div>
                                </div>

                                {/* Multi-size packaging repeater */}
                                <div className="p-4 bg-teal-50/40 rounded-xl border border-teal-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <label className="block text-sm font-bold text-teal-900">Packaging Sizes in this Batch</label>
                                            <p className="text-xs text-teal-700 mt-0.5">Add every variant you packed (e.g. 200g x 100, 1kg x 40). Total weight is auto-calculated.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setProcessing(prev => ({
                                                ...prev,
                                                packaging: {
                                                    ...prev.packaging,
                                                    sizes: [...(prev.packaging.sizes || []), { sizeLabel: "", sizeKg: 0, count: 0 }]
                                                }
                                            }))}
                                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                                        >
                                            + Add Size
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {(processing.packaging.sizes || []).length === 0 && (
                                            <p className="text-xs text-gray-500 italic px-1">No package sizes added yet. Click <span className="font-semibold text-teal-700">+ Add Size</span> to record at least one variant.</p>
                                        )}

                                        {(processing.packaging.sizes || []).map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white rounded-lg p-2 border border-teal-100">
                                                <div className="col-span-4">
                                                    <select
                                                        value={packSizes.includes(row.sizeLabel) ? row.sizeLabel : (row.sizeLabel ? "__custom" : "")}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setProcessing(prev => {
                                                                const sizes = [...(prev.packaging.sizes || [])];
                                                                if (v === "__custom") {
                                                                    sizes[idx] = { ...sizes[idx], sizeLabel: "" };
                                                                } else {
                                                                    const kg = v.endsWith('kg') ? parseFloat(v) : v.endsWith('g') ? parseFloat(v) / 1000 : 0;
                                                                    sizes[idx] = { ...sizes[idx], sizeLabel: v, sizeKg: isFinite(kg) ? kg : sizes[idx].sizeKg };
                                                                }
                                                                return { ...prev, packaging: { ...prev.packaging, sizes } };
                                                            });
                                                        }}
                                                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                    >
                                                        <option value="">Preset size</option>
                                                        {packSizes.map(s => <option key={s} value={s}>{s}</option>)}
                                                        <option value="__custom">Custom...</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Label (e.g. 1kg)"
                                                        value={row.sizeLabel}
                                                        onChange={(e) => setProcessing(prev => {
                                                            const sizes = [...(prev.packaging.sizes || [])];
                                                            sizes[idx] = { ...sizes[idx], sizeLabel: e.target.value };
                                                            return { ...prev, packaging: { ...prev.packaging, sizes } };
                                                        })}
                                                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="kg"
                                                        value={row.sizeKg || ""}
                                                        onChange={(e) => setProcessing(prev => {
                                                            const sizes = [...(prev.packaging.sizes || [])];
                                                            sizes[idx] = { ...sizes[idx], sizeKg: parseFloat(e.target.value) || 0 };
                                                            return { ...prev, packaging: { ...prev.packaging, sizes } };
                                                        })}
                                                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Qty"
                                                        value={row.count || ""}
                                                        onChange={(e) => setProcessing(prev => {
                                                            const sizes = [...(prev.packaging.sizes || [])];
                                                            sizes[idx] = { ...sizes[idx], count: parseInt(e.target.value) || 0 };
                                                            const totalCount = sizes.reduce((s, x) => s + (x.count || 0), 0);
                                                            return { ...prev, packaging: { ...prev.packaging, sizes, packageCount: totalCount } };
                                                        })}
                                                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                    />
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => setProcessing(prev => {
                                                            const sizes = (prev.packaging.sizes || []).filter((_, i) => i !== idx);
                                                            const totalCount = sizes.reduce((s, x) => s + (x.count || 0), 0);
                                                            return { ...prev, packaging: { ...prev.packaging, sizes, packageCount: totalCount } };
                                                        })}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                                                        title="Remove size"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {(processing.packaging.sizes || []).length > 0 && (
                                        <div className="mt-3 flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-teal-100">
                                            <span className="text-gray-600">Total batch weight</span>
                                            <span className="font-bold text-teal-800">
                                                {(processing.packaging.sizes || []).reduce((s, x) => s + (x.sizeKg || 0) * (x.count || 0), 0).toFixed(2)} kg
                                                {" "}· {(processing.packaging.sizes || []).reduce((s, x) => s + (x.count || 0), 0)} packs
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-6">
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

                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold text-gray-900">Final Product Identity</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Final Product Name</label>
                                            <input
                                                type="text"
                                                value={processing.productName}
                                                onChange={(e) => setProcessing(prev => ({ ...prev, productName: e.target.value }))}
                                                placeholder="e.g. Cherry-Pick Dried Mango"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                                            <div className="flex flex-col gap-3">
                                                <div className="relative group">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                        id="product-image-upload"
                                                        disabled={isUploading}
                                                    />
                                                    <label
                                                        htmlFor="product-image-upload"
                                                        className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isUploading
                                                            ? 'bg-gray-50 border-gray-300'
                                                            : 'bg-teal-50/30 border-teal-200 hover:border-teal-400 hover:bg-teal-50'
                                                            }`}
                                                    >
                                                        {isUploading ? (
                                                            <>
                                                                <Loader2 className="h-5 w-5 text-teal-600 animate-spin" />
                                                                <span className="text-sm font-medium text-teal-600">Uploading...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="h-5 w-5 text-teal-600" />
                                                                <span className="text-sm font-medium text-teal-600">Choose File or Take Photo</span>
                                                            </>
                                                        )}
                                                    </label>
                                                </div>

                                                {processing.productImage && (
                                                    <div className="relative h-24 w-full rounded-xl overflow-hidden border bg-gray-50 group">
                                                        <img
                                                            src={processing.productImage}
                                                            alt="Product Preview"
                                                            className="h-full w-full object-contain"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">Image Set</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
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
                                                Clicking &quot;Ready for Distribution&quot; will mint an NFT with full traceability data on the blockchain.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between flex-shrink-0" style={{ background: '#F7F9FB' }}>
                        <button
                            onClick={() => activeStep > 0 && setActiveStep(activeStep - 1)}
                            disabled={activeStep === 0}
                            className="px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40"
                            style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, border: '1px solid rgba(12,45,58,0.15)', color: '#0C2D3A' }}
                        >
                            Previous
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                className="px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                                style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, border: '1px solid rgba(12,45,58,0.15)', color: '#0C2D3A' }}
                            >
                                <Save className="h-4 w-4" />
                                Save & Close
                            </button>
                            {activeStep < 4 ? (
                                <button
                                    onClick={() => setActiveStep(activeStep + 1)}
                                    className="px-6 py-2.5 text-white rounded-xl transition-colors flex items-center gap-2"
                                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, background: '#0C2D3A' }}
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button
                                    onClick={handleComplete}
                                    disabled={!processing.qualityCheck.passed || !processing.sorting.completed || !processing.packaging.completed || isMintingNFT}
                                    className="px-6 py-2.5 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-40"
                                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, background: '#0C2D3A' }}
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
