import React from 'react';
import { CalendarCheck } from 'lucide-react';

const ReservationsPage = () => {
    return (
        <div className="max-w-7xl mx-auto py-20 px-4">
            <div className="text-center">
                <div className="w-24 h-24 bg-orange-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-orange-600">
                    <CalendarCheck size={48} />
                </div>
                <h1 className="text-4xl font-['Gilroy_Heavy'] text-gray-900 mb-4">Table Reservations</h1>
                <p className="text-gray-400 font-['Gilroy_Medium'] max-w-md mx-auto">
                    Book your favorite spot in the canteen in advance. This feature is currently in the works to make your dining experience even smoother.
                </p>
            </div>
        </div>
    );
};

export default ReservationsPage;
