import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Clock, Search, 
  Ticket, User, CreditCard, 
  Check, Trash2, Activity, XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import purchasedPassService from '../../services/purchasedPassService';

const MealPassRecordsPage = () => {
  const [allPasses, setAllPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 

  useEffect(() => { fetchPasses(); }, []);

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const data = await purchasedPassService.getAllPurchasedPasses();
      setAllPasses(data);
    } catch (error) { toast.error('Failed to fetch pass records'); } 
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    try {
      await purchasedPassService.approvePass(id);
      toast.success('Pass verified successfully!');
      fetchPasses();
    } catch (error) { toast.error('Failed to verify pass'); }
  };

  const handleReject = async (id) => {
    if (window.confirm('Reject this cash payment request?')) {
      try {
        await purchasedPassService.rejectPass(id);
        toast.warning('Meal pass request rejected.');
        fetchPasses();
      } catch (error) { toast.error('Failed to reject'); }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this record permanently?')) {
      try {
        await purchasedPassService.deletePass(id);
        toast.info('Record removed');
        fetchPasses();
      } catch (error) { toast.error('Failed to delete'); }
    }
  };

  const stats = {
    all: allPasses.length,
    pending: allPasses.filter(p => p.status === 'pending').length,
    verified: allPasses.filter(p => p.status === 'approved').length
  };

  const filteredPasses = allPasses.filter(p => {
    const matches = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    p.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'pending') return matches && p.status === 'pending';
    if (activeTab === 'verified') return matches && p.status === 'approved';
    return matches;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4 md:px-0 font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Ticket className="text-orange-500" size={32} />
            Meal Pass Records
          </h1>
          <p className="text-gray-500 font-medium">Verify or Reject issued dining tickets.</p>
        </div>

        <div className="flex gap-3 bg-white p-2 rounded-[24px] shadow-sm border border-gray-100">
           <CompactMetric 
            label="Pending" 
            value={stats.pending} 
            color="amber" 
            active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
            hasAlert={stats.pending > 0}
           />
           <CompactMetric 
            label="Verified" 
            value={stats.verified} 
            color="green" 
            active={activeTab === 'verified'}
            onClick={() => setActiveTab('verified')}
           />
           <CompactMetric 
            label="Total" 
            value={stats.all} 
            color="orange" 
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
           />
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-[20px] py-4 pl-14 pr-6 outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-200 transition-all text-gray-700 font-medium shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-[24px] animate-pulse border border-gray-50" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredPasses.map(pass => (
              <motion.div
                key={pass._id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative transition-colors ${pass.status === 'pending' ? 'bg-amber-50 text-amber-500' : pass.status === 'rejected' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                    <User size={24} />
                    {pass.paymentMethod === 'online' && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 p-1 rounded-full border-2 border-white text-white">
                        <Activity size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-black text-gray-900 leading-none">{pass.name}</h3>
                      <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border flex items-center gap-1 ${
                        pass.paymentMethod === 'online' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {pass.paymentMethod === 'online' ? <Activity size={10} /> : <CreditCard size={10} />}
                        {pass.paymentMethod === 'online' ? 'Online/Card' : 'Cash Payment'}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                       <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                        <User size={14} className="text-gray-400" />
                        {pass.studentId}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                        <Ticket size={14} className="text-orange-500" />
                        {pass.mealName}
                      </div>
                      <div className="px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-black uppercase text-gray-400 border border-gray-100">
                        {pass.duration}
                      </div>
                      <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">{pass.ticketId}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                   <button onClick={() => handleDelete(pass._id)} className="p-3.5 rounded-xl bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all" title="Delete Permanent">
                    <Trash2 size={18} />
                   </button>
                   
                   {pass.status === 'pending' ? (
                     <div className="flex items-center gap-2">
                        {pass.paymentMethod === 'cash' ? (
                          <>
                            <button
                              onClick={() => handleReject(pass._id)}
                              className="bg-red-50 text-red-500 hover:bg-red-100 px-6 py-3.5 rounded-[18px] font-black text-sm transition-all border border-red-100 flex items-center gap-2"
                            >
                              <XCircle size={18} />
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(pass._id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3.5 rounded-[18px] font-black text-sm shadow-lg shadow-green-500/25 transition-all active:scale-95 flex items-center gap-2"
                            >
                              <Check size={18} strokeWidth={3} />
                              Accept
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleApprove(pass._id)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-[18px] font-black text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-95 flex items-center gap-2"
                          >
                            <Activity size={18} strokeWidth={3} />
                            Verify Online
                          </button>
                        )}
                     </div>
                   ) : pass.status === 'rejected' ? (
                      <div className="flex items-center gap-2 bg-red-50 text-red-500 px-6 py-3.5 rounded-[18px] font-black text-sm border border-red-100">
                        <XCircle size={18} />
                        Rejected
                      </div>
                   ) : (
                     <div className={`flex items-center gap-2 px-6 py-3.5 rounded-[18px] font-black text-sm border ${
                       pass.paymentMethod === 'cash' ? 'bg-green-600 text-white border-green-700' : 'bg-green-50 text-green-600 border-green-100'
                     }`}>
                       <CheckCircle size={18} />
                       {pass.paymentMethod === 'cash' ? 'Approved' : 'Verified'}
                     </div>
                   )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

const CompactMetric = ({ label, value, color, active, onClick, hasAlert }) => {
  const themes = {
    amber: active ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-white text-amber-500 hover:bg-amber-50',
    green: active ? 'bg-green-500 text-white shadow-green-200' : 'bg-white text-green-500 hover:bg-green-50',
    orange: active ? 'bg-orange-500 text-white shadow-orange-200' : 'bg-white text-orange-500 hover:bg-orange-50',
  };

  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 rounded-[18px] flex items-center gap-4 transition-all relative ${themes[color]} ${active ? 'shadow-lg scale-105 z-10' : 'border border-transparent'}`}
    >
      <div className="flex flex-col items-start leading-none">
        <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 opacity-60`}>{label}</p>
        <div className="flex items-center gap-2">
           <h2 className="text-xl font-black">{value}</h2>
           {hasAlert && !active && (
             <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
           )}
        </div>
      </div>
    </button>
  );
};

export default MealPassRecordsPage;
