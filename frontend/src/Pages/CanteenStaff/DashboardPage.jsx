import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingBag, Ticket, Box, UtensilsCrossed } from 'lucide-react';
import { motion } from 'framer-motion';

const CanteenStaffDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="max-w-7xl mx-auto space-y-16">
            {/* Welcome Greeting */}
            <header className="flex flex-col space-y-1">
                <h1 className="text-3xl font-['Gilroy_Bold'] text-orange-600 tracking-tight">
                    Welcome back, {user?.name || 'Staff'} <span className="text-gray-400 font-['Gilroy_Medium'] text-xl ml-2">(Canteen Staff)</span> 👋
                </h1>
                <p className="text-lg text-gray-400 font-['Gilroy_Medium']">
                    Manage your daily operations, orders, and stock efficiently.
                </p>
            </header>

            {/* Recent Activity Placeholder */}
            <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <ShoppingBag size={32} />
                </div>
                <h3 className="text-xl font-['Gilroy_Bold'] text-gray-900 mb-2">Live Operations</h3>
                <p className="text-gray-400 font-['Gilroy_Medium'] max-w-sm mx-auto">
                    Real-time order updates and status changes will appear here as you process student meal requests.
                </p>
            </div>
        </div>
    );
};

export default CanteenStaffDashboard;
