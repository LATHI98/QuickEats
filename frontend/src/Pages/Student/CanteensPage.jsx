import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Store,
  Search,
  MapPin,
  ArrowUpRight,
  UtensilsCrossed
} from 'lucide-react';
import { canteenAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CanteenCard = ({ canteen, onClick }) => (
  <motion.div
    whileHover={{ y: -8 }}
    onClick={onClick}
    className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-100/50 transition-all group cursor-pointer"
  >
    {/* Placeholder image / icon banner */}
    <div className="relative h-40 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
      <UtensilsCrossed size={56} className="text-orange-200" />
      <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-2xl text-[10px] font-['Gilroy_Bold'] uppercase tracking-widest shadow ${
        canteen.isOpen ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-white'
      }`}>
        {canteen.isOpen ? 'Open' : 'Closed'}
      </div>
    </div>

    <div className="p-6">
      <h3 className="text-xl font-['Gilroy_Heavy'] text-gray-900 mb-1 line-clamp-1">{canteen.name}</h3>
      {canteen.location && (
        <div className="flex items-center text-gray-400 text-sm font-['Gilroy_Medium'] mb-5">
          <MapPin size={13} className="mr-1 shrink-0" /> {canteen.location}
        </div>
      )}
      <button className="w-full bg-gray-900 group-hover:bg-orange-600 text-white py-3 rounded-[18px] font-['Gilroy_Bold'] transition-all flex items-center justify-center gap-2">
        View Menu <ArrowUpRight size={16} />
      </button>
    </div>
  </motion.div>
);

const CanteensPage = () => {
  const navigate = useNavigate();
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await canteenAPI.getAll();
        setCanteens(res.data.data || []);
      } catch {
        toast.error('Failed to load canteens');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = canteens.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.location || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-['Gilroy_Heavy'] text-gray-900 mb-1">Canteens</h1>
        <p className="text-gray-400 text-sm">Choose a canteen to browse its menu</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search canteens..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Store size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-['Gilroy_Medium']">
            {canteens.length === 0 ? 'No canteens available' : 'No results found'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(canteen => (
            <CanteenCard
              key={canteen._id}
              canteen={canteen}
              onClick={() => navigate(`/dashboard/canteens/${canteen._id}/menu`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CanteensPage;
