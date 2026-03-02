import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Store,
  Search,
  MapPin,
  Clock,
  Users,
  Star,
  ChevronRight,
  Filter,
  ArrowUpRight,
  UtensilsCrossed
} from 'lucide-react';

const CANTEENS = [
  {
    id: 1,
    name: 'Main Canteen (A-Block)',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800',
    location: 'A-Block, Ground Floor',
    rating: 4.8,
    reviews: 124,
    crowdLevel: 'High',
    crowdColor: 'bg-orange-500',
    waitTime: '15-20 min',
    special: 'Chicken Biryani',
    categories: ['North Indian', 'Chinese']
  },
  {
    id: 2,
    name: 'University Cafe',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800',
    location: 'Central Library Building',
    rating: 4.5,
    reviews: 89,
    crowdLevel: 'Low',
    crowdColor: 'bg-emerald-500',
    waitTime: '5 min',
    special: 'Cold Coffee & Sandwich',
    categories: ['Cafe', 'Snacks']
  },
  {
    id: 3,
    name: 'B-Block Refreshments',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800',
    location: 'B-Block, Plaza Level',
    rating: 4.2,
    reviews: 56,
    crowdLevel: 'Moderate',
    crowdColor: 'bg-amber-500',
    waitTime: '10-12 min',
    special: 'Masala Dosa',
    categories: ['South Indian', 'Juices']
  },
  {
    id: 4,
    name: 'Admin Sports Cafe',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800',
    location: 'Near Sports Complex',
    rating: 4.6,
    reviews: 210,
    crowdLevel: 'Moderate',
    crowdColor: 'bg-amber-500',
    waitTime: '8-10 min',
    special: 'Protein Bowls',
    categories: ['Healthy', 'Grill']
  }
];

const CanteenCard = ({ canteen }) => (
  <motion.div
    whileHover={{ y: -8 }}
    className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-100/50 transition-all group"
  >
    <div className="relative h-64 overflow-hidden">
      <img
        src={canteen.image}
        alt={canteen.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute top-6 right-6">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
          <Star size={14} className="text-orange-500 fill-orange-500" />
          <span className="text-sm font-['Gilroy_Bold'] text-gray-900">{canteen.rating}</span>
        </div>
      </div>
      <div className="absolute bottom-6 left-6 flex gap-2">
        <div className={`flex items-center gap-2 ${canteen.crowdColor} text-white px-4 py-2 rounded-2xl text-[10px] font-['Gilroy_Bold'] uppercase tracking-widest shadow-lg animate-in fade-in zoom-in duration-500`}>
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          {canteen.crowdLevel} Crowd
        </div>
      </div>
    </div>

    <div className="p-8">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-['Gilroy_Heavy'] text-gray-900 mb-1 line-clamp-1">{canteen.name}</h3>
          <div className="flex items-center text-gray-400 text-sm font-['Gilroy_Medium']">
            <MapPin size={14} className="mr-1" /> {canteen.location}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {canteen.categories.map(cat => (
          <span key={cat} className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[11px] font-['Gilroy_Bold'] uppercase tracking-wider border border-gray-100">
            {cat}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-orange-50/50 p-4 rounded-3xl border border-orange-100/50">
          <p className="text-[10px] font-['Gilroy_Bold'] text-orange-400 uppercase tracking-widest mb-1 leading-none">Wait Time</p>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-orange-600" />
            <span className="text-sm font-['Gilroy_Bold'] text-gray-900">{canteen.waitTime}</span>
          </div>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100/50">
          <p className="text-[10px] font-['Gilroy_Bold'] text-emerald-400 uppercase tracking-widest mb-1 leading-none">Speciality</p>
          <div className="flex items-center gap-1.5">
            <UtensilsCrossed size={14} className="text-emerald-600" />
            <span className="text-sm font-['Gilroy_Bold'] text-gray-900 truncate">{canteen.special}</span>
          </div>
        </div>
      </div>

      <button className="w-full bg-gray-900 hover:bg-orange-600 text-white py-5 rounded-[24px] font-['Gilroy_Bold'] transition-all flex items-center justify-center gap-2 group/btn shadow-xl shadow-gray-200">
        View Full Menu <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
      </button>
    </div>
  </motion.div>
);

const CanteensPage = () => {
  return (
    <div className="max-w-7xl mx-auto py-20 px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-orange-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-orange-600">
          <Store size={48} />
        </div>
        <h1 className="text-4xl font-['Gilroy_Heavy'] text-gray-900 mb-4">Canteen Network</h1>
        <p className="text-gray-400 font-['Gilroy_Medium'] max-w-md mx-auto">
          Explore the university canteens and discover your next favorite meal. Our network is currently being mapped out for your convenience.
        </p>
      </div>
    </div>
  );
};

export default CanteensPage;
