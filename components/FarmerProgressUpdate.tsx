"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Camera, Upload, X, MapPin, Cloud, Droplets, 
  Leaf, Bug, Beaker, Send, Plus, CheckCircle
} from "lucide-react";
import toast from "react-hot-toast";

interface FarmerProgressUpdateProps {
  farmerId: string;
  contractId?: string;
  batchId?: string;
  onSubmitAction: (update: ProgressUpdate) => Promise<void>;
}

export interface ProgressUpdate {
  updateType: 'progress' | 'issue' | 'harvest' | 'input_application' | 'general';
  title: string;
  description: string;
  photos: string[];
  inputType?: 'fertilizer' | 'pesticide' | 'herbicide' | 'seed' | 'water' | 'other';
  inputName?: string;
  inputQuantity?: number;
  inputUnit?: string;
  applicationMethod?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  weatherConditions?: {
    temperature?: number;
    humidity?: number;
    conditions?: string;
  };
}

const UPDATE_TYPES = [
  { value: 'progress', label: 'Progress Update', icon: Leaf, color: 'bg-green-500' },
  { value: 'input_application', label: 'Input Application', icon: Beaker, color: 'bg-blue-500' },
  { value: 'issue', label: 'Report Issue', icon: Bug, color: 'bg-red-500' },
  { value: 'harvest', label: 'Harvest Update', icon: CheckCircle, color: 'bg-yellow-500' },
  { value: 'general', label: 'General Update', icon: Cloud, color: 'bg-gray-500' },
];

const INPUT_TYPES = [
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'pesticide', label: 'Pesticide' },
  { value: 'herbicide', label: 'Herbicide' },
  { value: 'seed', label: 'Seeds' },
  { value: 'water', label: 'Irrigation' },
  { value: 'other', label: 'Other' },
];

const INPUT_UNITS = ['kg', 'g', 'L', 'mL', 'bags', 'units'];

export default function FarmerProgressUpdate({ 
  farmerId, 
  contractId, 
  batchId,
  onSubmitAction 
}: FarmerProgressUpdateProps) {
  const [updateType, setUpdateType] = useState<ProgressUpdate['updateType']>('progress');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [inputType, setInputType] = useState<ProgressUpdate['inputType']>();
  const [inputName, setInputName] = useState('');
  const [inputQuantity, setInputQuantity] = useState<number>();
  const [inputUnit, setInputUnit] = useState('kg');
  const [applicationMethod, setApplicationMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<ProgressUpdate['location']>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    for (let i = 0; i < files.length && photos.length + newPhotos.length < 5; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        newPhotos.push(base64);
      }
    }
    setPhotos([...photos, ...newPhotos]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
        });
        setIsGettingLocation(false);
        toast.success('Location captured');
      },
      (error) => {
        console.error('Location error:', error);
        toast.error('Failed to get location');
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (updateType === 'input_application' && !inputType) {
      toast.error('Please select input type');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitAction({
        updateType,
        title,
        description,
        photos,
        inputType: updateType === 'input_application' ? inputType : undefined,
        inputName: updateType === 'input_application' ? inputName : undefined,
        inputQuantity: updateType === 'input_application' ? inputQuantity : undefined,
        inputUnit: updateType === 'input_application' ? inputUnit : undefined,
        applicationMethod: updateType === 'input_application' ? applicationMethod : undefined,
        location,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPhotos([]);
      setInputType(undefined);
      setInputName('');
      setInputQuantity(undefined);
      setApplicationMethod('');
      setLocation(undefined);
      toast.success('Update submitted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit update');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
        <h2 className="text-xl font-bold">Submit Progress Update</h2>
        <p className="text-green-100 text-sm">Keep your buyers informed about your crop progress</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Update Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Update Type
          </label>
          <div className="flex flex-wrap gap-2">
            {UPDATE_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setUpdateType(type.value as ProgressUpdate['updateType'])}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    updateType === type.value
                      ? `${type.color} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Week 4 Growth Update, Applied NPK Fertilizer"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Input Application Fields */}
        {updateType === 'input_application' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 p-4 bg-blue-50 rounded-xl"
          >
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <Beaker className="w-5 h-5" />
              Input Details
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Input Type *
                </label>
                <select
                  value={inputType || ''}
                  onChange={(e) => setInputType(e.target.value as ProgressUpdate['inputType'])}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select type</option>
                  {INPUT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g., Compound D, Cypermethrin"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={inputQuantity || ''}
                    onChange={(e) => setInputQuantity(parseFloat(e.target.value))}
                    placeholder="Amount"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none"
                  />
                  <select
                    value={inputUnit}
                    onChange={(e) => setInputUnit(e.target.value)}
                    className="w-24 px-2 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none"
                  >
                    {INPUT_UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Method
                </label>
                <input
                  type="text"
                  value={applicationMethod}
                  onChange={(e) => setApplicationMethod(e.target.value)}
                  placeholder="e.g., Foliar spray, Soil application"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the current state of your crops, any observations, or details about the update..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Photos (up to 5)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />

          <div className="flex flex-wrap gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden">
                <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {photos.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-green-400 hover:bg-green-50 transition-all"
              >
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500">Add Photo</span>
              </button>
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location
          </label>
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
              location
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-green-400 text-gray-700'
            }`}
          >
            <MapPin className={`w-5 h-5 ${isGettingLocation ? 'animate-pulse' : ''}`} />
            {isGettingLocation
              ? 'Getting location...'
              : location
              ? `Location captured (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
              : 'Capture Current Location'}
          </button>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim()}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Update
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
