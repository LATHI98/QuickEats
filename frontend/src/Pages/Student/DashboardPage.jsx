import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { LayoutDashboard, Store, MapPin, Star } from 'lucide-react';

const CanteenCard = ({ canteen }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="relative h-48">
      {canteen.photo ? (
        <img src={canteen.photo} alt={canteen.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
          <Store size={48} />
        </div>
      )}
      <div className="absolute top-3 left-3 bg-white bg-opacity-80 px-2 py-1 rounded-lg text-xs font-['Gilroy_Bold'] text-gray-700">
        {canteen.owner}
      </div>
    </div>
    <div className="p-4 space-y-2">
      <h3 className="text-lg font-['Gilroy_Bold'] text-gray-900">{canteen.name}</h3>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <MapPin size={14} /> <span>{canteen.email}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Star size={14} className="text-yellow-500" /> <span>{canteen.ratings?.toFixed(1) || '0.0'}</span>
      </div>
      {canteen.openHours && (
        <div className="text-sm text-gray-500">Open: {canteen.openHours}</div>
      )}
      <p className="text-sm text-gray-600 line-clamp-2">{canteen.description || 'No description yet.'}</p>
      <button className="w-full mt-3 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-xl font-['Gilroy_Bold'] text-sm transition-all">
        View Menu
      </button>
    </div>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getCanteens = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/canteens');
        setCanteens(response.data);
      } catch (err) {
        console.error('Failed to load canteens', err);
      } finally {
        setLoading(false);
      }
    };

    getCanteens();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col space-y-1">
        <h1 className="text-3xl font-['Gilroy_Bold'] text-orange-600 tracking-tight">
          Welcome back, {user?.name || 'User'}
        </h1>
        <p className="text-lg text-gray-400 font-['Gilroy_Medium']">Let's find you something delicious to eat.</p>
      </header>

      <div className="text-center pt-10">
        <div className="w-24 h-24 bg-orange-50 rounded-[45px] flex items-center justify-center mx-auto mb-10 text-orange-600 shadow-sm border border-orange-100/50">
          <LayoutDashboard size={48} />
        </div>
        <h2 className="text-4xl font-['Gilroy_Heavy'] text-gray-900 mb-6 tracking-tight">Canteen Dashboard</h2>
        <p className="text-gray-400 font-['Gilroy_Medium'] max-w-lg mx-auto text-lg leading-relaxed">
          Browse the latest canteens added by the admin. Expand below to view all listings.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-['Gilroy_Bold'] text-gray-900">Available Canteens</h3>
          <span className="text-sm text-gray-500">{canteens.length} canteen(s)</span>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading canteens...</div>
        ) : canteens.length === 0 ? (
          <div className="text-center text-gray-500">No canteens available yet.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {canteens.map((canteen) => (
              <CanteenCard key={canteen._id} canteen={canteen} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;

