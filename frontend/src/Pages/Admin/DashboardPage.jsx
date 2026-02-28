import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Store, UtensilsCrossed, ShoppingBag, Users } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-gilroyBold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 font-gilroyRegular">{label}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user, isSuperAdmin } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-primaryBlue rounded-2xl p-6 text-white">
        <p className="text-sm font-gilroyRegular opacity-80 mb-1">Welcome back,</p>
        <h1 className="text-2xl font-gilroyBold">{user?.name || 'Admin'} 👋</h1>
        <p className="text-sm opacity-70 font-gilroyRegular mt-1">
          {isSuperAdmin()
            ? 'Manage canteens, menus, users and orders from here.'
            : 'Manage your canteen, menus and incoming orders.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Canteens" value="—" icon={Store} color="bg-primaryBlue" />
        <StatCard label="Menu Items" value="—" icon={UtensilsCrossed} color="bg-emerald-500" />
        <StatCard label="Total Orders" value="—" icon={ShoppingBag} color="bg-amber-500" />
        {isSuperAdmin() && (
          <StatCard label="Users" value="—" icon={Users} color="bg-purple-500" />
        )}
      </div>

      {/* Placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <ShoppingBag size={40} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-gilroyBold text-gray-600 mb-1">Recent Orders</h3>
        <p className="text-sm text-gray-400 font-gilroyRegular">
          Order activity will appear here once orders start coming in.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
