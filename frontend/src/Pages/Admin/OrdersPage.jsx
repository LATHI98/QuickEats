import React from 'react';
import { ShoppingBag } from 'lucide-react';

const AdminOrdersPage = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
    <div className="w-16 h-16 bg-primaryBlue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <ShoppingBag size={30} className="text-primaryBlue" />
    </div>
    <h2 className="text-xl font-gilroyBold text-gray-700 mb-2">Orders</h2>
    <p className="text-sm text-gray-400 font-gilroyRegular max-w-sm mx-auto">
      View and manage all incoming orders, track their status and history.
    </p>
    <div className="mt-6 inline-block bg-primaryBlue/10 text-primaryBlue text-xs font-gilroyMedium px-4 py-1.5 rounded-full">
      Coming soon
    </div>
  </div>
);

export default AdminOrdersPage;
