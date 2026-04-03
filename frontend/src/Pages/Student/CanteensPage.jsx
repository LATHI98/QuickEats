import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import {
  Store,
  Star,
  Search,
  Clock3,
} from 'lucide-react';
import ReviewModal from '../../Components/ReviewModal';


const CanteenCard = ({ canteen, onOpenMenu, onRate }) => (
  <motion.div
    whileHover={{ y: -8 }}
    onClick={onOpenMenu}
    className="bg-white rounded-[34px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-100/50 transition-all group cursor-pointer"
  >
    <div className="relative h-56 overflow-hidden">
      {canteen.photo ? (
        <img
          src={canteen.photo}
          alt={canteen.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
          <Store size={48} />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />

      <div className="absolute top-5 right-5">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
          <Star size={14} className="text-orange-500 fill-orange-500" />
          <span className="text-sm font-bold text-gray-900">{(canteen.ratings ?? 0).toFixed(1)}</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <h3 className="text-xl font-extrabold text-white line-clamp-1 drop-shadow">{canteen.name || 'Untitled Canteen'}</h3>
      </div>
    </div>

    <div className="p-6">
      <div className="flex justify-between items-start mb-3">
        <p className="text-gray-500 text-sm font-medium">{canteen.owner ? `Owner: ${canteen.owner}` : 'Owner: Not set'}</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <Clock3 size={14} className="text-orange-500" />
        <span>{canteen.openHours || 'Opening hours not set'}</span>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-3 min-h-[2.5rem]">{canteen.description || 'No description available.'}</p>
      <p className="text-xs text-gray-400 mb-4">Contact: {canteen.email || 'No email set'}</p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRate();
        }}
        className="flex items-center gap-2 text-sm font-['Gilroy_Bold'] text-amber-600 hover:text-amber-700 mb-5 transition-colors"
      >
        <Star size={14} strokeWidth={2.5} /> Rate & Review
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenMenu();
        }}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-2xl font-['Gilroy_Heavy'] text-sm tracking-wide shadow-lg shadow-orange-600/20 transition-all hover:translate-y-[-2px] active:scale-95"
      >
        View Menu
      </button>
    </div>
  </motion.div>
);

const CanteensPage = () => {
  const navigate = useNavigate();
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [reviewModal, setReviewModal] = useState({ isOpen: false, targetId: null, targetName: '' });

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

  const filteredCanteens = canteens.filter((canteen) => {
    const keyword = search.toLowerCase().trim();
    if (!keyword) return true;

    return [canteen.name, canteen.owner, canteen.description]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

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
        onReviewSubmitted={() => {
          // Re-fetch canteens
          api.get('/api/canteens').then(res => setCanteens(res.data));
        }}
      />
    </div>
  );
};

export default CanteensPage;
