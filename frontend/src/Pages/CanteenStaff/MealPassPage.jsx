import React from 'react';
import { Ticket } from 'lucide-react';

const MealPassPage = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-16">
            <header className="flex flex-col space-y-1">
                <h1 className="text-3xl font-bold text-orange-600 tracking-tight">Meal Pass Management</h1>
                <p className="text-lg text-gray-400 font-medium">Validate and track student meal passes.</p>
            </header>
            <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <Ticket size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Meal Pass Validation</h3>
                <p className="text-gray-400 font-medium max-w-sm mx-auto">
                    Pass scanning and usage history will appear here once students start redeeming their meal passes.
                </p>
            </div>
        </div>
    );
};

export default MealPassPage;
