import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sprout, Loader2, Upload, ImageIcon, Calendar, ChevronRight, ChevronLeft } from "lucide-react";
import { createBatch, getContractsByFarmer, Contract } from "@/lib/traceabilityService";
import { uploadImageToIPFS } from "@/lib/ipfsService";
import toast from "react-hot-toast";

interface CreateBatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    farmerId: string;
    onSuccess: () => void;
}

const SUPPORTED_CROPS = [
    "Mango", "Pineapple", "Banana", "Cashew nuts", "Apple", "Pear",
    "Orange", "Lemon", "Lime", "Grapefruit", "Tomato", "Beetroot",
    "Pawpaw", "Maize", "Wheat", "Soybean", "Coffee", "Avocado",
    "Onion", "Potato", "Cabbage", "Carrot", "Spinach", "Other"
];

const STEPS = [
    { id: 1, title: "Classification", description: "Crop & Contract" },
    { id: 2, title: "Batch Details", description: "Inputs & Yields" }
];

export default function CreateBatchModal({ isOpen, onClose, farmerId, onSuccess }: CreateBatchModalProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loadingContracts, setLoadingContracts] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        crop_type: "",
        variety: "",
        total_quantity: "",
        unit: "kg",
        is_organic: false,
        seeding_count: "",
        field_size: "",
        field_size_unit: "ha",
        contract_id: "",
        planting_date: new Date().toISOString().split('T')[0],
        est_harvest_date: "",
    });

    useEffect(() => {
        if (isOpen) {
            loadContracts();
            setCurrentStep(1); // Reset to step 1 on open
        }
    }, [isOpen]);

    const loadContracts = async () => {
        try {
            setLoadingContracts(true);
            const data = await getContractsByFarmer(farmerId);
            setContracts(data);
        } catch (error) {
            console.error("Failed to load contracts:", error);
        } finally {
            setLoadingContracts(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const nextStep = () => {
        if (currentStep === 1 && !formData.crop_type) {
            toast.error("Please select a crop type");
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, 2));
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.total_quantity) {
            toast.error("Please enter estimated yield");
            return;
        }

        setLoading(true);
        try {
            let imageUrl = undefined;

            // Upload image if selected
            if (imageFile) {
                setUploadingImage(true);
                try {
                    const uploadResult = await uploadImageToIPFS(imageFile);
                    imageUrl = uploadResult.url;
                } catch (uploadError) {
                    console.error("Image upload failed:", uploadError);
                    toast.error("Failed to upload image, continuing without it.");
                } finally {
                    setUploadingImage(false);
                }
            }

            // Create batch with all new fields
            await createBatch({
                farmer_id: farmerId,
                contract_id: formData.contract_id || undefined,
                crop_type: formData.crop_type,
                variety: formData.variety,
                total_quantity: Number(formData.total_quantity),
                unit: formData.unit,
                organic_certified: formData.is_organic,
                harvest_date: formData.est_harvest_date || undefined,
                current_status: 'growing',
                metadata: {
                    seeding_count: formData.seeding_count ? Number(formData.seeding_count) : undefined,
                    field_size: formData.field_size ? `${formData.field_size} ${formData.field_size_unit}` : undefined,
                    batch_image: imageUrl,
                    planting_date: formData.planting_date
                }
            });

            toast.success("New batch created successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error creating batch:", error);
            toast.error(error.message || "Failed to create batch");
        } finally {
            setLoading(false);
        }
    };

    // Filter contracts based on selected crop type
    const filteredContracts = formData.crop_type
        ? contracts.filter(c => c.crop_type.toLowerCase().includes(formData.crop_type.toLowerCase()) || formData.crop_type === "Other")
        : contracts;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl flex flex-col h-[650px]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Sprout className="w-5 h-5 text-green-600" />
                                    Start New Batch
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Step {currentStep} of 2: {STEPS[currentStep - 1].title}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 w-full bg-gray-100">
                            <motion.div
                                className="h-full bg-green-500"
                                initial={{ width: "50%" }}
                                animate={{ width: `${(currentStep / 2) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">

                            {/* STEP 1: Classification & Photo */}
                            {currentStep === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6 h-full flex flex-col"
                                >
                                    {/* Image Upload - Made Taller */}
                                    <div className="flex flex-col items-center justify-center flex-1 min-h-[250px]">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative w-full h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all overflow-hidden group min-h-[250px]"
                                        >
                                            {previewUrl ? (
                                                <>
                                                    <img src={previewUrl} alt="Batch preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-white font-medium flex items-center gap-2">
                                                            <ImageIcon className="w-5 h-5" /> Change Photo
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-4">
                                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500 group-hover:bg-green-200 group-hover:text-green-600 transition-colors">
                                                        <Upload className="w-8 h-8" />
                                                    </div>
                                                    <p className="font-semibold text-gray-900 text-lg mb-1">Upload Batch Photo</p>
                                                    <p className="text-gray-500 text-sm">Click to browse or drag and drop</p>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageSelect}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Crop Type *</label>
                                                <div className="relative">
                                                    <select
                                                        required
                                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm appearance-none"
                                                        value={formData.crop_type}
                                                        onChange={(e) => setFormData({ ...formData, crop_type: e.target.value, contract_id: "" })}
                                                    >
                                                        <option value="">Select Crop</option>
                                                        {SUPPORTED_CROPS.map(crop => (
                                                            <option key={crop} value={crop}>{crop}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Variety</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Cherry"
                                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                    value={formData.variety}
                                                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 flex justify-between">
                                                Link to Contract (Optional)
                                                <span className="text-xs text-gray-500 font-normal">Fulfilling an order?</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm appearance-none"
                                                    value={formData.contract_id}
                                                    onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                                                    disabled={loadingContracts}
                                                >
                                                    <option value="">-- No Contract (Open Market) --</option>
                                                    {filteredContracts.map(contract => (
                                                        <option key={contract.id} value={contract.id}>
                                                            {contract.contract_code} - {contract.crop_type} ({contract.required_quantity}kg)
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                            {formData.crop_type && filteredContracts.length === 0 && !loadingContracts && (
                                                <p className="text-xs text-amber-600">No active contracts found for {formData.crop_type}</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: Batch Details (Merged) */}
                            {currentStep === 2 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >


                                    {/* Inputs Section */}
                                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-1 mt-2">Inputs & Planting</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Seeding or Plant</label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                value={formData.seeding_count}
                                                onChange={(e) => setFormData({ ...formData, seeding_count: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Field Size</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    placeholder="0.0"
                                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                    value={formData.field_size}
                                                    onChange={(e) => setFormData({ ...formData, field_size: e.target.value })}
                                                />
                                                <select
                                                    className="w-20 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-xs"
                                                    value={formData.field_size_unit}
                                                    onChange={(e) => setFormData({ ...formData, field_size_unit: e.target.value })}
                                                >
                                                    <option value="ha">Ha</option>
                                                    <option value="acres">Acres</option>
                                                    <option value="sqm">m²</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Planting Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                required
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm pl-9"
                                                value={formData.planting_date}
                                                onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
                                            />
                                            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                        </div>
                                    </div>

                                    {/* Outputs Section */}
                                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-1 mt-6">Yield Estimates</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Est. Yield *</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                placeholder="0.00"
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                value={formData.total_quantity}
                                                onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Unit</label>
                                            <select
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm"
                                                value={formData.unit}
                                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            >
                                                <option value="kg">kg</option>
                                                <option value="tonnes">tonnes</option>
                                                <option value="crates">crates</option>
                                                <option value="bags">bags</option>
                                                <option value="each">each</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Est. Harvest Date</label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm pl-9"
                                                    value={formData.est_harvest_date}
                                                    onChange={(e) => setFormData({ ...formData, est_harvest_date: e.target.value })}
                                                />
                                                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                            </div>
                                        </div>

                                        <div className="flex items-center pt-6">
                                            <input
                                                type="checkbox"
                                                id="organic"
                                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300 mr-2"
                                                checked={formData.is_organic}
                                                onChange={(e) => setFormData({ ...formData, is_organic: e.target.checked })}
                                            />
                                            <label htmlFor="organic" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                                This batch is Certified Organic
                                            </label>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </form>

                        {/* Footer Controls */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                            {currentStep > 1 ? (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}

                            {currentStep < 2 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-black transition-colors flex items-center gap-2"
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-70 shadow-lg shadow-green-200"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {uploadingImage ? 'Uploading...' : 'Creating...'}
                                        </>
                                    ) : (
                                        'Create Batch'
                                    )}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

