import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Store, UtensilsCrossed, ShoppingBag, Users } from 'lucide-react';


const AdminDashboard = () => {
  const { user, isSuperAdmin } = useAuth();

  return (
    <div className="max-w-7xl mx-auto space-y-16">
      {/* Welcome Greeting */}
      <header className="flex flex-col space-y-1">
        <h1 className="text-3xl font-['Gilroy_Bold'] text-orange-600 tracking-tight">
          Welcome back, {user?.name || 'Admin'} 👋
        </h1>
        <p className="text-lg text-gray-400 font-['Gilroy_Medium']">
          {isSuperAdmin()
            ? 'Platform overview and system-wide management.'
            : 'Manage your canteen operations and orders.'}
        </p>
      </header>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center shadow-sm">
        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300">
          <ShoppingBag size={32} />
        </div>
        <h3 className="text-xl font-['Gilroy_Bold'] text-gray-900 mb-2">Recent Order Activity</h3>
        <p className="text-gray-400 font-['Gilroy_Medium'] max-w-sm mx-auto">
          Detailed logs and live order management will appear here as your canteens process transactions.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
