import React from 'react';
import { Store, Search, MapPin } from 'lucide-react';

const CanteensPage = () => (
  <div className="space-y-4">
    {/* Search bar */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input
        type="text"
        placeholder="Search canteens..."
        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-gilroyRegular text-gray-800 placeholder-gray-400 focus:outline-none focus:border-defaultRed focus:ring-2 focus:ring-defaultRed/10 transition-all"
      />
    </div>

    {/* Empty state */}
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
      <div className="w-16 h-16 bg-defaultRed/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Store size={30} className="text-defaultRed" />
      </div>
      <h2 className="text-lg font-gilroyBold text-gray-700 mb-2">Canteens</h2>
      <p className="text-sm text-gray-400 font-gilroyRegular max-w-xs mx-auto">
        Browse all available canteens, view their menus and place orders.
      </p>
      <div className="mt-5 inline-flex items-center gap-1.5 bg-defaultRed/10 text-defaultRed text-xs font-gilroyMedium px-4 py-1.5 rounded-full">
        <MapPin size={12} /> Coming soon
      </div>
    </div>
  </div>
);

export default CanteensPage;
