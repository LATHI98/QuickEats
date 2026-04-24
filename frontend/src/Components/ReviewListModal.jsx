import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, User, Calendar, Quote } from 'lucide-react';
import api from '../services/api';

const ReviewListModal = ({ isOpen, onClose, targetId, targetName, type = 'canteen', initialViewMode = 'ratings' }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(initialViewMode);

  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode, isOpen]);

  const filteredReviews = React.useMemo(() => {
    if (viewMode === 'reviews') {
      return reviews.filter(r => r.comment && r.comment.trim() !== '');
    }
    return reviews;
  }, [reviews, viewMode]);

  useEffect(() => {
    if (isOpen && targetId) {
      const fetchReviews = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/api/reviews/${type}/${targetId}`);
          setReviews(response.data.data || response.data);
        } catch (err) {
          console.error('Failed to fetch reviews', err);
        } finally {
          setLoading(false);
        }
      };
      fetchReviews();
    }
  }, [isOpen, targetId, type]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            className="relative w-full max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-orange-900/10 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-orange-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-orange-500">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">{targetName}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">User Reviews & Ratings</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('openReviewSubmit', { 
                      detail: { 
                        targetId, 
                        targetName, 
                        type, 
                        mode: viewMode === 'ratings' ? 'rating' : 'review' 
                      } 
                    }));
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-200"
                >
                  Add {viewMode === 'ratings' ? 'Rating' : 'Review'}
                </button>
                <button
                  onClick={onClose}
                  className="rounded-full bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-bold text-gray-400 animate-pulse">Fetching feedback...</p>
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-[28px] bg-gray-50 flex items-center justify-center text-gray-200">
                    <Quote size={40} />
                  </div>
                  <h4 className="text-lg font-black text-gray-300 uppercase tracking-widest italic">No {viewMode} yet</h4>
                  <p className="text-sm text-gray-400 font-medium">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredReviews.map((review, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={review._id || idx}
                      className="group relative p-6 rounded-[24px] border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-orange-500/5 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-orange-400 border border-orange-50 group-hover:border-orange-200 transition-colors">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                              @{review.user?.username || review.user?.name?.toLowerCase().replace(/\s/g, '') || 'anonymous'}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {review.user?.name || 'Anonymous User'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 bg-white px-2.5 py-1.5 rounded-xl shadow-sm border border-gray-50">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star 
                              key={s} 
                              size={12} 
                              fill={s <= review.rating ? '#f97316' : 'transparent'} 
                              className={s <= review.rating ? 'text-orange-500' : 'text-gray-100'} 
                            />
                          ))}
                        </div>
                      </div>
                      
                      {review.comment && viewMode === 'reviews' && (
                        <div className="relative mt-2">
                          <Quote size={16} className="text-orange-100 absolute -left-2 -top-2" />
                          <p className="text-sm font-medium text-gray-600 leading-relaxed pl-4 italic">
                            {review.comment}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                         <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                           <Calendar size={10} /> {new Date(review.createdAt).toLocaleDateString()}
                         </span>
                         {review.rating >= 4 && (
                           <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Verified High Rating</span>
                         )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Summary */}
            {!loading && reviews.length > 0 && (
              <div className="px-8 py-4 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total {reviews.length} Feedbacks</span>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {reviews.slice(0, 3).map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-[10px] font-bold text-orange-500 shadow-sm">
                        <User size={12} />
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">Join the conversation</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReviewListModal;
