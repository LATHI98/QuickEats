import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Store,
  Clock,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  Search,
  ArrowUpRight,
  Calendar,
  Utensils,
  MessageSquare,
  User,
  Wallet,
  Ticket
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const StatCard = ({ label, value, icon: Icon, color, trend }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
  >
    <div className="flex justify-between items-start mb-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className="flex items-center text-xs font-['Gilroy_Bold'] text-green-500 bg-green-50 px-3 py-1 rounded-full">
          <TrendingUp size={12} className="mr-1" /> {trend}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-3xl font-['Gilroy_Heavy'] text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-400 font-['Gilroy_Medium'] tracking-wide uppercase">{label}</p>
    </div>
  </motion.div>
);

const QuickAction = ({ label, to, icon: Icon, color, bg }) => (
  <Link
    to={to}
    className="group flex flex-col items-center text-center space-y-4 p-6 rounded-[35px] bg-white border border-gray-100 hover:border-orange-100 hover:shadow-2xl hover:shadow-orange-100/30 transition-all active:scale-95"
  >
    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center ${bg} group-hover:scale-110 transition-transform`}>
      <Icon size={28} className={color} />
    </div>
    <span className="text-sm font-['Gilroy_Bold'] text-gray-700">{label}</span>
  </Link>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-7xl mx-auto space-y-16">
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
        <h2 className="text-4xl font-['Gilroy_Heavy'] text-gray-900 mb-6 tracking-tight">Overview Portfolio</h2>
        <p className="text-gray-400 font-['Gilroy_Medium'] max-w-lg mx-auto text-lg leading-relaxed">
          Your dining activity, personalized stats, and live recommendations will appear here. Start exploring to populate your board.
        </p>
      </div>
    </div>
  );
};

// Icons needed for placeholder
import { LayoutDashboard } from 'lucide-react';

export default StudentDashboard;
