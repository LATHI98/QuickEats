import React from 'react';
import { Ticket } from 'lucide-react';

const MealPassPage = () => {
    return (
        <div className="max-w-7xl mx-auto py-20 px-4">
            <div className="text-center">
                <div className="w-24 h-24 bg-orange-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-orange-600">
                    <Ticket size={48} />
                </div>
                <h1 className="text-4xl font-['Gilroy_Heavy'] text-gray-900 mb-4">Meal Pass</h1>
                <p className="text-gray-400 font-['Gilroy_Medium'] max-w-md mx-auto">
                    Manage your subscription plans and digital passes here. Your easy access to daily meals is just being prepared.
                </p>
            </div>
        </div>
    );
};

export default MealPassPage;
