import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import {
  Store,
  Star,
} from 'lucide-react';


const CanteenCard = ({ canteen, onOpenMenu }) => (
  <motion.div
    whileHover={{ y: -8 }}
    onClick={onOpenMenu}
    className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-100/50 transition-all group cursor-pointer"
  >
    <div className="relative h-64 overflow-hidden">
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
      <div className="absolute top-6 right-6">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
          <Star size={14} className="text-orange-500 fill-orange-500" />
          <span className="text-sm font-['Gilroy_Bold'] text-gray-900">{(canteen.ratings ?? 0).toFixed(1)}</span>
        </div>
      </div>
    </div>

    <div className="p-8">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-2xl font-['Gilroy_Heavy'] text-gray-900 mb-1 line-clamp-1">{canteen.name || 'Untitled Canteen'}</h3>
          <div className="text-gray-400 text-sm font-['Gilroy_Medium']">{canteen.owner ? `Owner: ${canteen.owner}` : 'Owner: Not set'}</div>
        </div>
        <span className="text-sm font-['Gilroy_Bold'] text-yellow-500">{(canteen.ratings ?? 0).toFixed(1)}</span>
      </div>

      <p className="text-sm text-gray-500 mb-3">Open: {canteen.openHours || 'Not set'}</p>
      <p className="text-sm text-gray-600 line-clamp-3 mb-2">{canteen.description || 'No description available.'}</p>
      <p className="text-sm text-gray-400 mb-5">Contact: {canteen.email || 'No email set'}</p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenMenu();
        }}
        className="w-full bg-gray-900 hover:bg-orange-600 text-white py-3 rounded-[24px] font-['Gilroy_Bold'] transition-all"
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

  return (
    <div className="max-w-7xl mx-auto py-20 px-4 space-y-12">
      <div className="text-center">
        <div className="w-24 h-24 bg-orange-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-orange-600">
          <Store size={48} />
        </div>
        <h1 className="text-4xl font-['Gilroy_Heavy'] text-gray-900 mb-4">Canteen Network</h1>
        <p className="text-gray-400 font-['Gilroy_Medium'] max-w-md mx-auto">
          Explore the university canteens and discover your next favorite meal. Our network is currently being mapped out for your convenience.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading canteens...</div>
      ) : canteens.length === 0 ? (
        <div className="text-center text-gray-500">No canteens found.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {canteens.map((canteen) => (
            <CanteenCard
              key={canteen._id}
              canteen={canteen}
              onOpenMenu={() => navigate(`/dashboard/canteens/${canteen._id}/menu`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CanteensPage;
