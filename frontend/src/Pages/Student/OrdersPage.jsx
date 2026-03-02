import React from 'react';
import { ShoppingBag } from 'lucide-react';

const OrdersPage = () => {
  return (
    <div className="max-w-7xl mx-auto py-20 px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-orange-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-orange-600">
          <ShoppingBag size={48} />
        </div>
        <h1 className="text-4xl font-['Gilroy_Heavy'] text-gray-900 mb-4">My Orders</h1>
        <p className="text-gray-400 font-['Gilroy_Medium'] max-w-md mx-auto">
          Your order history and active tracking will appear here. Start ordering to fill this space with delicious memories.
        </p>
      </div>
    </div>
  );
};

export default OrdersPage;
