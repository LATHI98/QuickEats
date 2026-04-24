import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const ReviewModal = ({ isOpen, onClose, targetId, targetName, type = 'canteen', onReviewSubmitted, mode = 'ratings' }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'ratings' && rating === 0) {
      return toast.error('Please provide a rating');
    }
    if (mode === 'reviews' && !comment.trim()) {
      return toast.error('Please provide a review comment');
    }
    if (rating === 0 && !comment.trim()) {
      return toast.error('Please provide at least a rating or a comment');
    }

    setLoading(true);
    try {
      const payload = {
        rating,
        comment,
        userId: user.id || user._id,
        [type === 'canteen' ? 'canteenId' : 'foodId']: targetId
      };
      
      await api.post('/api/reviews', payload);
      setSuccess(true);
      if (onReviewSubmitted) onReviewSubmitted();
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setRating(0);
        setComment('');
      }, 2000);
    } catch (err) {
      toast.error('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl shadow-orange-900/10"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 rounded-full bg-gray-50 p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
            >
              <X size={20} />
            </button>

            {success ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-['Gilroy_Heavy'] text-gray-900">
                  {mode === 'ratings' ? 'Rating' : 'Review'} Submitted!
                </h3>
                <p className="mt-2 text-gray-500">Thank you for sharing your feedback on {targetName}.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-['Gilroy_Heavy'] text-gray-900">
                    {mode === 'ratings' ? 'Rate' : 'Review'} {targetName}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {mode === 'ratings' 
                      ? 'Select your star rating for this canteen.' 
                      : 'Share your detailed experience with us.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {mode === 'ratings' && (
                    <div className="space-y-3">
                      <label className="text-xs font-['Gilroy_Bold'] uppercase tracking-widest text-gray-400 text-center block">Rating</label>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onMouseEnter={() => setHoveredRating(s)}
                            onMouseLeave={() => setHoveredRating(0)}
                            onClick={() => setRating(s)}
                            className="p-1 transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              size={36}
                              fill={(hoveredRating || rating) >= s ? '#f97316' : 'transparent'}
                              className={(hoveredRating || rating) >= s ? 'text-orange-500 drop-shadow-md' : 'text-gray-200'}
                              strokeWidth={1.5}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {mode !== 'ratings' && (
                    <div className="space-y-3">
                      <label className="text-xs font-['Gilroy_Bold'] uppercase tracking-widest text-gray-400 block">Your Comments</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your thoughts about the service and taste..."
                        className="h-32 w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-medium outline-none transition-all focus:border-orange-200 focus:bg-white focus:ring-4 focus:ring-orange-500/5"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 font-['Gilroy_Heavy'] text-white shadow-xl shadow-orange-500/20 transition-all hover:bg-orange-700 hover:translate-y-[-2px] disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : (mode === 'ratings' ? 'Post Rating' : 'Post Review')}
                    {!loading && <Send size={18} />}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReviewModal;
