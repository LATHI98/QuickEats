import React from 'react';
import { ShoppingBag } from 'lucide-react';

const StockPage = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-16">
            <header className="flex flex-col space-y-1">
                <h1 className="text-3xl font-['Gilroy_Bold'] text-orange-600 tracking-tight">Stock Management</h1>
                <p className="text-lg text-gray-400 font-['Gilroy_Medium']">Monitor and update your canteen inventory.</p>
            </header>
            <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <ShoppingBag size={32} />
                </div>
                <h3 className="text-xl font-['Gilroy_Bold'] text-gray-900 mb-2">Inventory Management</h3>
                <p className="text-gray-400 font-['Gilroy_Medium'] max-w-sm mx-auto">
                    Stock level tracking and automated alerts will appear here as you manage your canteen's supplies.
                </p>
            </div>
        </div>
    );
};

export default StockPage;
