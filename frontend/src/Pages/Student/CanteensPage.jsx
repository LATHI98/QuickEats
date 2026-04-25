import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import {
  Store,
  Star,
  Search,
  Clock3,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import ReviewModal from '../../Components/ReviewModal';
import ReviewListModal from '../../Components/ReviewListModal';
import { MessageCircle } from 'lucide-react';


const CanteenCard = ({ canteen, onOpenMenu, onRate, onViewReviews }) => {
  const isTopRated = canteen.ratings >= 4.5;
  
  return (
    <motion.div
      whileHover={{ y: -8 }}
      onClick={onOpenMenu}
      className={`bg-white rounded-[32px] overflow-hidden border transition-all group cursor-pointer flex flex-col relative ${
        isTopRated 
          ? 'border-orange-200 shadow-[0_0_40px_rgba(249,115,22,0.1)] ring-1 ring-orange-100' 
          : 'border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-100/30'
      }`}
    >
      {isTopRated && (
        <div className="absolute -inset-[1px] rounded-[32px] bg-gradient-to-br from-orange-400/20 via-transparent to-amber-400/20 z-0 pointer-events-none" />
      )}
      
      {/* Image Section */}
      <div className="relative h-52 overflow-hidden shrink-0 z-10">
        {canteen.photo ? (
          <img
            src={canteen.photo}
            alt={canteen.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-orange-50/50 flex items-center justify-center text-orange-200">
            <Store size={40} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          {isTopRated && (
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-orange-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 backdrop-blur-md border border-orange-500/30"
            >
              <Sparkles size={12} /> Top Rated
            </motion.div>
          )}
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xl border border-white/50 ml-auto">
            <Star size={12} className="text-orange-500 fill-orange-500" />
            <span className="text-xs font-black text-gray-900">{(canteen.ratings ?? 0).toFixed(1)}</span>
          </div>
        </div>

        <div className="absolute bottom-4 left-5 right-5">
          <h3 className="text-xl font-black text-white line-clamp-1 drop-shadow-md">{canteen.name || 'Untitled Canteen'}</h3>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-1 z-10">
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
           <Clock3 size={12} className="text-orange-500" />
           <span>{canteen.openHours || 'Hours not set'}</span>
        </div>

        <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-6 min-h-[2.5rem] leading-relaxed">
          {canteen.description || 'Discover a variety of delicious meals and refreshing drinks at this location.'}
        </p>

        <div className="mt-auto space-y-3">
          <div className="flex gap-2">
             <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewReviews('ratings');
              }}
              className="flex-1 bg-orange-50 text-orange-600 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-100 transition-all flex items-center justify-center gap-2 border border-orange-100"
            >
              <Star size={12} fill="currentColor" /> Rate
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewReviews('reviews');
              }}
              className="flex-1 bg-gray-50 text-gray-500 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2 border border-gray-100"
            >
              <MessageCircle size={12} /> Reviews
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMenu();
            }}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] shadow-lg shadow-orange-600/20 transition-all hover:translate-y-[-2px] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Explore Menu <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const CanteensPage = () => {
  const navigate = useNavigate();
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [reviewModal, setReviewModal] = useState({ isOpen: false, targetId: null, targetName: '', mode: 'ratings' });
  const [viewReviewsModal, setViewReviewsModal] = useState({ isOpen: false, targetId: null, targetName: '', mode: 'ratings' });

  useEffect(() => {
    const handleViewReviews = (e) => {
      setViewReviewsModal({
        isOpen: true,
        targetId: e.detail.id,
        targetName: e.detail.name,
        mode: e.detail.mode || 'ratings'
      });
    };

    const handleOpenSubmit = (e) => {
      setReviewModal({
        isOpen: true,
        targetId: e.detail.targetId,
        targetName: e.detail.targetName,
        mode: e.detail.mode || 'ratings'
      });
    };

    window.addEventListener('viewReviews', handleViewReviews);
    window.addEventListener('openReviewSubmit', handleOpenSubmit);
    return () => {
      window.removeEventListener('viewReviews', handleViewReviews);
      window.removeEventListener('openReviewSubmit', handleOpenSubmit);
    };
  }, []);

  useEffect(() => {
    const loadCanteens = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/canteens');
        setCanteens(response.data);
      } catch (err) {
        console.error('Could not fetch canteens', err);
      } finally {
        setLoading(false);
      }
    };

    loadCanteens();
  }, []);

  const filteredCanteens = canteens
    .filter((canteen) => {
      const keyword = search.toLowerCase().trim();
      if (!keyword) return true;

      return [canteen.name, canteen.owner, canteen.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    })
    .sort((a, b) => (b.ratings || 0) - (a.ratings || 0));

  return (
    <div className="max-w-7xl mx-auto py-14 px-4 md:px-6 space-y-8">
      <div className="relative overflow-hidden rounded-[36px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-8 md:p-10">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-orange-100/70 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-100/70 blur-3xl" />

        <div className="relative text-center">
          <div className="w-24 h-24 bg-orange-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-orange-600">
          <Store size={48} />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Canteen Network</h1>
          <p className="text-gray-500 font-medium max-w-xl mx-auto">
            Pick your favorite canteen, explore live menus, and order with fewer clicks.
          </p>

          <div className="max-w-xl mx-auto mt-6">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search canteens, owners, or specialties..."
                className="w-full rounded-2xl border border-orange-100 bg-white/90 py-3 pl-10 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Showing {filteredCanteens.length} of {canteens.length} canteen{canteens.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading canteens...</div>
      ) : filteredCanteens.length === 0 ? (
        <div className="text-center text-gray-500">No canteens found.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCanteens.map((canteen) => (
            <CanteenCard
              key={canteen._id}
              canteen={canteen}
              onOpenMenu={() => navigate(`/dashboard/canteens/${canteen._id}/menu`)}
              onRate={() => setReviewModal({ isOpen: true, targetId: canteen._id, targetName: canteen.name })}
              onViewReviews={(mode) => setViewReviewsModal({ isOpen: true, targetId: canteen._id, targetName: canteen.name, mode })}
            />
          ))}
        </div>
      )}

      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
        targetId={reviewModal.targetId}
        targetName={reviewModal.targetName}
        type="canteen"
        mode={reviewModal.mode}
        onReviewSubmitted={() => {
          // Re-fetch canteens
          api.get('/api/canteens').then(res => setCanteens(res.data));
          setViewReviewsModal({ ...viewReviewsModal, isOpen: false });
        }}
      />
      <ReviewListModal
        isOpen={viewReviewsModal.isOpen}
        onClose={() => setViewReviewsModal({ ...viewReviewsModal, isOpen: false })}
        targetId={viewReviewsModal.targetId}
        targetName={viewReviewsModal.targetName}
        type="canteen"
        initialMode={viewReviewsModal.mode}
      />
    </div>
  );
};

export default CanteensPage;
