import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingBag, Store, Clock, CheckCircle, ChevronRight } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 flex items-center gap-3 sm:gap-4">
    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-xl sm:text-2xl font-gilroyBold text-gray-800">{value}</p>
      <p className="text-xs sm:text-sm text-gray-500 font-gilroyRegular">{label}</p>
    </div>
  </div>
);

const QuickAction = ({ label, to, icon: Icon, color, bg }) => (
  <Link
    to={to}
    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-all active:scale-95`}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
      <Icon size={22} className={color} />
    </div>
    <span className="text-xs font-gilroyMedium text-gray-600 text-center leading-tight">{label}</span>
  </Link>
);

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="bg-defaultRed rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -right-2 bottom-0 w-20 h-20 bg-white/10 rounded-full" />
        <div className="relative">
          <p className="text-sm font-gilroyRegular opacity-80 mb-0.5">Good day,</p>
          <h1 className="text-xl sm:text-2xl font-gilroyBold">{user?.name || 'Student'} 👋</h1>
          <p className="text-sm opacity-70 font-gilroyRegular mt-1">
            What would you like to eat today?
          </p>
        </div>
      </div>

      {/* Stats grid — 2 cols on mobile, 4 on xl */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Orders" value="—" icon={ShoppingBag} color="bg-defaultRed" />
        <StatCard label="Canteens" value="—" icon={Store} color="bg-primaryBlue" />
        <StatCard label="Pending" value="—" icon={Clock} color="bg-amber-500" />
        <StatCard label="Completed" value="—" icon={CheckCircle} color="bg-emerald-500" />
      </div>

      {/* Quick actions — mobile-first grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-gilroyBold text-gray-700">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <QuickAction label="Browse Canteens" to="/dashboard/canteens" icon={Store} color="text-defaultRed" bg="bg-red-50" />
          <QuickAction label="My Orders" to="/dashboard/orders" icon={ShoppingBag} color="text-primaryBlue" bg="bg-blue-50" />
          <QuickAction label="Track Order" to="/dashboard/orders" icon={Clock} color="text-amber-600" bg="bg-amber-50" />
          <QuickAction label="Profile" to="/dashboard/profile" icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-50">
          <h3 className="text-sm font-gilroyBold text-gray-700">Recent Orders</h3>
          <Link to="/dashboard/orders" className="text-xs text-defaultRed font-gilroyMedium flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>
        <div className="p-8 text-center">
          <Store size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-gilroyMedium text-gray-500">No orders yet</p>
          <p className="text-xs text-gray-400 font-gilroyRegular mt-1">Browse canteens to place your first order</p>
          <Link
            to="/dashboard/canteens"
            className="inline-flex items-center gap-2 mt-4 bg-defaultRed text-white text-xs font-gilroyBold px-4 py-2.5 rounded-xl hover:bg-red-800 transition-colors"
          >
            <Store size={14} /> Browse Canteens
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
