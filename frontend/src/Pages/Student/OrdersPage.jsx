import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

const tabs = ['All', 'Pending', 'Completed', 'Cancelled'];

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState('All');
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-gilroyMedium transition-all ${
              activeTab === tab
                ? 'bg-defaultRed text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-defaultRed hover:text-defaultRed'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <div className="w-16 h-16 bg-defaultRed/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={30} className="text-defaultRed" />
        </div>
        <h2 className="text-lg font-gilroyBold text-gray-700 mb-2">No orders yet</h2>
        <p className="text-sm text-gray-400 font-gilroyRegular max-w-xs mx-auto">
          Your order history will appear here once you place an order.
        </p>
        <div className="mt-5 inline-block bg-defaultRed/10 text-defaultRed text-xs font-gilroyMedium px-4 py-1.5 rounded-full">
          Coming soon
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
