import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Ticket, ArrowLeft, History, Clock, CheckCircle, Trash2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import purchasedPassService from '../../services/purchasedPassService';
import { toast } from 'react-toastify';


const MyMealPassesPage = () => {
  const navigate = useNavigate();
  const [activePasses, setActivePasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyPasses = async () => {
    try {
      setLoading(true);
      const data = await purchasedPassService.getMyPasses();
      setActivePasses(data);
    } catch (error) {
      toast.error('Failed to load your passes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPasses();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to clear this pass from your records?')) {
      try {
        await purchasedPassService.deletePass(id);
        toast.info('Meal pass record cleared');
        fetchMyPasses();
      } catch (error) {
        toast.error('Failed to delete pass');
      }
    }
  };



  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-8 font-sans">
      
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/dashboard/meal-pass')}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 shadow-sm border border-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-orange-600 tracking-tight flex items-center gap-3">
            <History className="text-orange-500" size={32} />
            Meal Pass History
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
          {[1, 2].map(i => (
            <div key={i} className="h-[160px] bg-white rounded-[24px] animate-pulse border border-gray-100 shadow-sm" />
          ))}
        </div>
      ) : activePasses.length === 0 ? (

        <div className="bg-white p-10 py-20 rounded-[40px] shadow-sm border border-gray-100 text-center max-w-lg w-full mx-auto flex flex-col items-center mt-12">
          <div className="w-24 h-24 bg-orange-50 rounded-[28px] flex items-center justify-center mb-6 text-orange-500">
            <Ticket size={48} strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-3">No Purchase History</h3>
          <p className="text-gray-500 font-medium leading-relaxed px-4 mb-8">
            You haven't purchased any meal passes yet. Head back to the menu to grab your first digital ticket!
          </p>
          <button 
            onClick={() => navigate('/dashboard/meal-pass')} 
            className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-2xl font-['Gilroy_Bold'] tracking-tight transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-95"
          >
            Browse Food Menu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
          <AnimatePresence>
            {activePasses.map((pass, index) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                key={pass.ticketId} 
                className="w-full flex-col sm:flex-row flex bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 min-h-[160px]"
              >
                {/* Left Ticket Stub */}
                <div className="sm:w-[28%] bg-gradient-to-br from-orange-500 to-orange-600 p-5 flex flex-col justify-between text-white relative border-b-2 sm:border-b-0 sm:border-r-2 border-dashed border-orange-300">
                  <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-gray-50 rounded-full z-10" />
                  
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-wide leading-none mb-1">
                      {pass.duration === 'week' ? 'Weekly' : 'Monthly'}
                    </h2>
                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-80 mt-1">Meal Pass</p>
                  </div>
                                   <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Valid Until</p>
                    <p className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg inline-block backdrop-blur-sm">
                      {new Date(pass.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Right Ticket Body */}
                <div className="sm:w-[72%] p-5 px-8 flex flex-col justify-between bg-zinc-50 relative flex-1">
                  <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 bg-gray-50 rounded-full z-10" />

                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pass Holder</p>
                      <h3 className="text-lg font-black text-gray-900 leading-tight">{pass.name}</h3>
                      <p className="text-xs font-bold text-gray-400 mt-0.5">{pass.studentId}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                       {pass.status === 'pending' ? (
                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full border border-amber-100 animate-pulse">
                          <Clock size={14} className="font-black" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Review Pending</span>
                        </div>
                       ) : pass.status === 'rejected' ? (
                        <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-4 py-1.5 rounded-full border border-red-100 shadow-md shadow-red-500/10">
                          <XCircle size={14} className="fill-white/20" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Rejected</span>
                        </div>
                       ) : (
                        <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border shadow-md ${
                          pass.paymentMethod === 'cash' 
                          ? 'bg-green-600 text-white border-green-700 shadow-green-600/20' 
                          : 'bg-green-500 text-white border-green-600 shadow-green-500/20'
                        }`}>
                          <CheckCircle size={14} className="fill-white/20" />
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {pass.paymentMethod === 'cash' ? 'Approved' : 'Verified'}
                          </span>
                        </div>
                       )}
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{pass.paymentMethod === 'cash' ? 'Cash Payment' : 'Online Payment'}</p>
                    </div>

                  </div>


                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-0.5">Assigned Meal</p>
                      <p className="text-sm font-black text-gray-900">{pass.mealName || 'Any Meal'}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center gap-4">
                       <p className="text-[9px] text-gray-300 font-mono font-bold tracking-[0.2em]">{pass.ticketId}</p>
                    </div>
                    
                    {pass.paymentMethod === 'cash' && (pass.status === 'pending' || pass.status === 'rejected') && (
                      <button 
                        onClick={() => handleDelete(pass._id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all font-bold text-[10px] uppercase tracking-wider"
                      >
                        <Trash2 size={12} />
                        Clear Request
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MyMealPassesPage;
