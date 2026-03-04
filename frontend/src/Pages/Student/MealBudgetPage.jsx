import React from 'react';
import { CreditCard } from 'lucide-react';

const MealBudgetPage = () => {
    return (
        <div className="max-w-7xl mx-auto py-20 px-4">
            <div className="text-center">
                <div className="w-24 h-24 bg-orange-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-orange-600">
                    <CreditCard size={48} />
                </div>
                <h1 className="text-4xl font-['Gilroy_Heavy'] text-gray-900 mb-4">Meal Budget</h1>
                <p className="text-gray-400 font-['Gilroy_Medium'] max-w-md mx-auto">
                    Track your spending, top up your wallet, and manage your daily limits. Your financial overview is being calculated.
                </p>
            </div>
        </div>
    );
};

export default MealBudgetPage;
