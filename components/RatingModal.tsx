"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, X, User, MessageSquare, Clock, Award, 
  ThumbsUp, Send, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

interface RatingModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSubmitAction: (rating: RatingData) => Promise<void>;
  ratingType: 'farmer' | 'verifier';
  targetName: string;
  targetId: string;
  contextId?: string; // contract_id or verification_id
}

export interface RatingData {
  rating: number;
  review: string;
  qualityRating?: number;
  communicationRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
}

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function RatingModal({
  isOpen,
  onCloseAction,
  onSubmitAction,
  ratingType,
  targetName,
  targetId,
  contextId,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [qualityRating, setQualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [showDetailedRatings, setShowDetailedRatings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitAction({
        rating,
        review,
        qualityRating: qualityRating || undefined,
        communicationRating: communicationRating || undefined,
        timelinessRating: timelinessRating || undefined,
        professionalismRating: professionalismRating || undefined,
      });
      
      // Reset form
      setRating(0);
      setReview('');
      setQualityRating(0);
      setCommunicationRating(0);
      setTimelinessRating(0);
      setProfessionalismRating(0);
      onCloseAction();
      toast.success('Rating submitted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ 
    value, 
    onChange, 
    size = 'lg' 
  }: { 
    value: number; 
    onChange: (v: number) => void;
    size?: 'sm' | 'lg';
  }) => {
    const [hover, setHover] = useState(0);
    const starSize = size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`${starSize} ${
                star <= (hover || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onCloseAction}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white relative">
            <button
              onClick={onCloseAction}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Rate {ratingType === 'farmer' ? 'Farmer' : 'Verifier'}</h2>
                <p className="text-yellow-100 text-sm">{targetName}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Main Rating */}
            <div className="text-center">
              <p className="text-gray-600 mb-3">How was your experience?</p>
              <div className="flex justify-center">
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>
              {rating > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-semibold text-yellow-600 mt-2"
                >
                  {RATING_LABELS[rating - 1]}
                </motion.p>
              )}
            </div>

            {/* Detailed Ratings Toggle */}
            <button
              type="button"
              onClick={() => setShowDetailedRatings(!showDetailedRatings)}
              className="w-full py-2 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              {showDetailedRatings ? '− Hide detailed ratings' : '+ Add detailed ratings'}
            </button>

            {/* Detailed Ratings */}
            <AnimatePresence>
              {showDetailedRatings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Award className="w-4 h-4" />
                      <span className="text-sm">Quality</span>
                    </div>
                    <StarRating value={qualityRating} onChange={setQualityRating} size="sm" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">Communication</span>
                    </div>
                    <StarRating value={communicationRating} onChange={setCommunicationRating} size="sm" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Timeliness</span>
                    </div>
                    <StarRating value={timelinessRating} onChange={setTimelinessRating} size="sm" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">Professionalism</span>
                    </div>
                    <StarRating value={professionalismRating} onChange={setProfessionalismRating} size="sm" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Review */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Write a Review (Optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder={`Share your experience with this ${ratingType}...`}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yellow-400 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Rating
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
