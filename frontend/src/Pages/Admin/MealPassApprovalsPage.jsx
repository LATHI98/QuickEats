import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Clock, Search,
  Ticket, User, CreditCard,
  Check, Trash2, Activity, XCircle,
  Phone, Filter, ArrowUpRight
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
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans px-4">
      {/* --- NEW COMPACT HEADER --- */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100/50">
            <Ticket size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">Pass Records</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stats.all} Total Entries</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Metrics / Tabs Segment */}
          <div className="flex bg-gray-50/80 p-1 rounded-2xl border border-gray-100">
            <TabButton 
              label="Pending" 
              count={stats.pending} 
              active={activeTab === 'pending'} 
              onClick={() => setActiveTab('pending')}
              color="amber"
            />
            <TabButton 
              label="Verified" 
              count={stats.verified} 
              active={activeTab === 'verified'} 
              onClick={() => setActiveTab('verified')}
              color="green"
            />
            <TabButton 
              label="All" 
              count={stats.all} 
              active={activeTab === 'all'} 
              onClick={() => setActiveTab('all')}
              color="gray"
            />
          </div>

          <div className="h-8 w-px bg-gray-200 hidden md:block mx-2" />

          {/* Compact Search Bar */}
          <div className="relative group w-full md:w-64 xl:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search IDs or names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-[18px] py-3 pl-11 pr-4 outline-none focus:bg-white focus:border-orange-100 transition-all text-xs font-bold text-gray-700"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-[32px] animate-pulse border border-gray-50" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPasses.length > 0 ? (
              filteredPasses.map(pass => (
                <motion.div
                  key={pass._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-100/20 hover:border-orange-100 transition-all flex flex-col justify-between group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-3xl flex items-center justify-center relative shadow-sm ${
                        pass.status === 'pending' ? 'bg-orange-50 text-orange-500' : 
                        pass.status === 'rejected' ? 'bg-orange-100 text-orange-400' : 'bg-orange-600 text-white'
                      }`}>
                        <User size={24} />
                        {pass.paymentMethod === 'online' && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 p-1.5 rounded-full border-4 border-white text-white shadow-sm">
                            <Activity size={10} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900 mb-1 leading-none">{pass.name}</h3>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{pass.studentId}</span>
                           <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border ${
                              pass.userRole && pass.userRole !== 'student'
                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                : 'bg-orange-50 text-orange-600 border-orange-200'
                            }`}>
                             {pass.userRole && pass.userRole !== 'student' ? 'Staff' : 'Student'}
                           </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                       <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 ${
                         pass.paymentMethod === 'online' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                       }`}>
                         {pass.paymentMethod === 'online' ? <Activity size={12} /> : <CreditCard size={12} />}
                         {pass.paymentMethod === 'online' ? 'Online' : 'Cash'}
                       </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50/50 p-4 rounded-3xl border border-gray-50">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Ticket size={10} className="text-orange-500" /> Meal Type
                      </p>
                      <p className="text-xs font-bold text-gray-700 truncate">{pass.mealName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Phone size={10} className="text-orange-400" /> WhatsApp
                      </p>
                      <p className="text-xs font-bold text-gray-700">{pass.phoneNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleDelete(pass._id)} className="p-3 rounded-2xl bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100" title="Delete Permanent">
                        <Trash2 size={16} />
                      </button>
                      <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase leading-none mb-1">{pass.duration}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{pass.ticketId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <AnimatePresence mode="wait">
                         {pass.status === 'pending' ? (
                           <div className="flex gap-2">
                              {pass.paymentMethod === 'cash' ? (
                                <>
                                  <button
                                    onClick={() => handleReject(pass._id)}
                                    className="bg-orange-50 text-orange-600 hover:bg-orange-100 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-orange-100 flex items-center gap-2"
                                  >
                                    <XCircle size={14} /> Reject
                                  </button>
                                  <button
                                    onClick={() => handleApprove(pass._id)}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-600/20 transition-all active:scale-95 flex items-center gap-2"
                                  >
                                    <Check size={14} strokeWidth={3} /> Accept
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleApprove(pass._id)}
                                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2"
                                >
                                  <Activity size={14} strokeWidth={4} /> Verify Online
                                </button>
                              )}
                           </div>
                         ) : pass.status === 'rejected' ? (
                            <div className="flex items-center gap-2 bg-gray-50 text-gray-400 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-gray-100 opacity-50">
                              <XCircle size={14} /> Rejected
                            </div>
                         ) : (
                            <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border ${
                              pass.paymentMethod === 'cash' ? 'bg-orange-600 text-white border-orange-700 shadow-lg shadow-orange-600/20' : 'bg-orange-50 text-orange-600 border-orange-100'
                            }`}>
                              <CheckCircle size={14} /> {pass.paymentMethod === 'cash' ? 'Approved' : 'Verified'}
                            </div>
                         )}
                       </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="md:col-span-2 py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
                    <Filter size={32} />
                 </div>
                 <h3 className="text-xl font-black text-gray-900">No Records Found</h3>
                 <p className="text-gray-400 text-sm font-bold">Try adjusting your filters or search query.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// --- SUB COMPONENTS ---

const TabButton = ({ label, count, active, onClick, color }) => {
  const themes = {
    amber: active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-orange-600 hover:bg-orange-50',
    green: active ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-orange-700 hover:bg-orange-50',
    gray: active ? 'bg-orange-700 text-white shadow-lg shadow-orange-700/20' : 'text-orange-800 hover:bg-orange-50',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest whitespace-nowrap ${themes[color] || themes.gray}`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-lg text-[9px] ${active ? 'bg-white/20' : 'bg-orange-100 text-orange-600'}`}>
        {count}
      </span>
    </button>
  );
};

export default MealPassRecordsPage;
