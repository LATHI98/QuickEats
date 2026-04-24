import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Utensils, 
  Search, 
  ShoppingBag, 
  Ticket, 
  Star, 
  Clock, 
  ChevronRight, 
  Zap,
  TrendingUp,
  Heart,
  Calendar,
  Wallet
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ orders: 0, budget: 0, passes: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [canteensRes, ordersRes] = await Promise.all([
          api.get('/api/canteens'),
          api.get('/api/orders/student/recent').catch(() => ({ data: [] }))
        ]);
        
        setCanteens(canteensRes.data.slice(0, 4));
        // Mock stats for now, replace with real API if available
        setStats({
          orders: ordersRes.data.length || 0,
          budget: 1250,
          passes: 2
        });
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[48px] bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 p-10 md:p-16 text-white shadow-2xl shadow-orange-900/20">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <Utensils size={400} className="absolute -top-20 -right-20 rotate-12" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              Platform Status: Live
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              {getGreeting()}, <span className="text-orange-500">{user?.name?.split(' ')[0] || 'Foodie'}</span>!
            </h1>
            <p className="text-gray-400 text-lg mb-10 leading-relaxed font-medium">
              Ready to explore SLIIT's finest cuisines? Your favorite meal is just a few taps away.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/dashboard/canteens')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-2xl font-black text-sm tracking-wide transition-all hover:translate-y-[-2px] flex items-center gap-2"
              >
                Order Now <ChevronRight size={18} />
              </button>
              <button 
                onClick={() => navigate('/dashboard/orders')}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black text-sm tracking-wide transition-all border border-white/10"
              >
                Track Orders
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Quick Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.orders} color="orange" />
        <StatCard icon={Wallet} label="Meal Budget" value={`LKR ${stats.budget}`} color="emerald" />
        <StatCard icon={Ticket} label="Active Passes" value={stats.passes} color="indigo" />
        <StatCard icon={Zap} label="Fast Track" value="Enabled" color="amber" />
      </section>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-10">
        {/* Left Column: Top Canteens */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Recommended for You</h2>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Based on ratings & popularity</p>
            </div>
            <button onClick={() => navigate('/dashboard/canteens')} className="text-orange-600 font-black text-xs uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {loading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-64 rounded-3xl bg-gray-100 animate-pulse" />)
            ) : canteens.map((canteen) => (
              <motion.div
                key={canteen._id}
                whileHover={{ y: -5 }}
                onClick={() => navigate(`/dashboard/canteens/${canteen._id}/menu`)}
                className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="relative h-44 bg-gray-100">
                  {canteen.photo ? (
                    <img src={canteen.photo} alt={canteen.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-orange-200">
                      <Utensils size={40} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-xl flex items-center gap-1 shadow-sm border border-white/50">
                    <Star size={12} className="text-orange-500 fill-orange-500" />
                    <span className="text-xs font-black text-gray-900">{Number(canteen.ratings || 0).toFixed(1)}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-orange-600 transition-colors">{canteen.name}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
                    <Clock size={12} className="text-orange-500" />
                    <span>{canteen.openHours || 'Available Now'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Mini Analytics / Activity */}
        <div className="space-y-8">
          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <TrendingUp className="text-orange-600" size={24} />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <ActionItem icon={Heart} label="Favorite Meals" onClick={() => {}} />
              <ActionItem icon={Calendar} label="Reservations" onClick={() => navigate('/dashboard/reservations')} />
              <ActionItem icon={Ticket} label="Buy Meal Pass" onClick={() => navigate('/dashboard/meal-pass')} />
              <ActionItem icon={Wallet} label="Budget Master" onClick={() => navigate('/dashboard/budget')} />
            </div>
          </div>

          <div className="bg-orange-600 rounded-[40px] p-8 text-white shadow-xl shadow-orange-200 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <h3 className="text-xl font-black mb-2 relative z-10">Healthy Living</h3>
            <p className="text-orange-100 text-sm mb-6 relative z-10 font-medium">Get a personalized meal plan based on your diet.</p>
            <button onClick={() => navigate('/dashboard/meal-plan')} className="w-full bg-white text-orange-600 py-3 rounded-2xl font-black text-xs uppercase tracking-widest relative z-10 hover:shadow-lg transition-all">
              Go Healthy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };
  
  return (
    <div className={`p-6 rounded-[32px] border ${colors[color]} bg-white shadow-sm hover:shadow-md transition-all`}>
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}>
        <Icon size={20} />
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-black text-gray-900">{value}</p>
    </div>
  );
};

const ActionItem = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-lg border border-transparent hover:border-orange-100 transition-all group"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-orange-600 transition-colors">
        <Icon size={16} />
      </div>
      <span className="text-sm font-black text-gray-700">{label}</span>
    </div>
    <ChevronRight size={14} className="text-gray-300 group-hover:text-orange-600 transition-all group-hover:translate-x-1" />
  </button>
);

export default DashboardPage;
