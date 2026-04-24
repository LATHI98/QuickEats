import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, TrendingUp, Calendar, 
  CheckCircle, AlertCircle, Save,
  ArrowRight, Coins, BarChart3,
  CreditCard, Plus, History, Trash2,
  ListFilter, ArrowUpRight, ArrowDownRight,
  Info, Ticket, Activity, Zap, Sparkles,
  ShoppingBag, Settings, Layout, ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';
import budgetService from '../../services/budgetService';
import purchasedPassService from '../../services/purchasedPassService';
import expenseService from '../../services/expenseService';
import { toast } from 'react-toastify';

const MealBudgetPage = () => {
  const [budget, setBudget] = useState({ amount: 0, period: 'weekly' });
  const [myPasses, setMyPasses] = useState([]);
  const [manualExpenses, setManualExpenses] = useState([]);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [loading, setLoading] = useState(true);
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Form States
  const [tempAmount, setTempAmount] = useState('');
  const [newExpense, setNewExpense] = useState({ itemName: '', amount: '', category: '' });
  const [categoryTarget, setCategoryTarget] = useState('');

  // Per-category targets (persisted in localStorage)
  const [categoryTargets, setCategoryTargets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('qe_cat_targets') || '{}'); }
    catch { return {}; }
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetData, passesData, expenseData, historyData] = await Promise.all([
        budgetService.getBudget(),
        purchasedPassService.getMyPasses(),
        expenseService.getExpenses(),
        budgetService.getBudgetHistory()
      ]);
      setBudget(budgetData);
      setTempAmount(budgetData.amount.toString());
      setMyPasses(passesData);
      setManualExpenses(expenseData);
      setBudgetHistory(historyData);
    } catch (error) {
      toast.error('Sync Error');
    } finally {
      setLoading(false);
    }
  };

  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    return Array.from({ length: 42 }, (_, i) => {
      const day = i - firstDay + 1;
      if (day < 1 || day > totalDays) return null;
      const dateStr = new Date(year, month, day).toDateString();
      const dayExpenses = manualExpenses.filter(e => new Date(e.date).toDateString() === dateStr);
      const dayPasses = myPasses.filter(p => new Date(p.issuedAt || p.createdAt).toDateString() === dateStr);
      return { 
        day, 
        hasActivity: dayExpenses.length > 0 || dayPasses.length > 0,
        total: dayExpenses.reduce((s, e) => s + e.amount, 0) + dayPasses.reduce((s, p) => s + (p.price || 0), 0)
      };
    });
  }, [currentDate, manualExpenses, myPasses]);

  const totals = useMemo(() => {
    // Determine the start of this cycle
    const lastResetDate = budget.lastResetAt ? new Date(budget.lastResetAt) : new Date(0);

    // Filter data that belongs ONLY to the current cycle
    const currentExpenses = manualExpenses.filter(e => new Date(e.date).getTime() > lastResetDate.getTime());
    const currentPasses = myPasses.filter(p => new Date(p.issuedAt || p.createdAt).getTime() > lastResetDate.getTime());

    const totalSpent = currentPasses.reduce((sum, p) => sum + (p.price || 0), 0) + 
                       currentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const balance = Math.max(0, budget.amount - totalSpent);
    const percentage = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;

    const DEFAULT_SPLITS = {
      'Canteen Passes': 0.4, 'Breakfast': 0.1, 'Lunch': 0.2,
      'Dinner': 0.2, 'Snacks': 0.05, 'Other Expense': 0.05
    };
    const categoryMapping = [
      { name: 'Canteen Passes', id: 'Canteen Passes', icon: '🎫' },
      { name: 'Breakfast',      id: 'Breakfast',      icon: '🌅' },
      { name: 'Lunch',          id: 'Lunch',          icon: '☀️' },
      { name: 'Dinner',         id: 'Dinner',         icon: '🌙' },
      { name: 'Snacks',         id: 'Snacks',         icon: '🍕' },
      { name: 'Other',          id: 'Other Expense',  icon: '📦' }
    ].map(cat => ({
      ...cat,
      budget: categoryTargets[cat.id] != null
        ? Number(categoryTargets[cat.id])
        : budget.amount * (DEFAULT_SPLITS[cat.id] ?? 0)
    }));

    const processedCategories = categoryMapping.map(cat => {
      let spent = currentExpenses
        .filter(e => e.category === cat.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      if (cat.id === 'Canteen Passes') {
        spent += currentPasses.reduce((sum, p) => sum + (p.price || 0), 0);
      }
      return { ...cat, spent };
    });

    return { totalSpent, balance, percentage, categories: processedCategories };
  }, [myPasses, manualExpenses, budget, categoryTargets]);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const amountNum = Number(tempAmount);
    
    if (!tempAmount || isNaN(amountNum) || amountNum <= 0) {
      return toast.error('Please enter a valid positive budget amount');
    }
    
    try {
      const data = await budgetService.setBudget({ amount: amountNum, period: budget.period });
      setBudget(data);
      setIsEditingBudget(false);
      toast.success('Budget Updated');
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to update'); }
  };

  const handleResetBudget = async () => {
    if (!window.confirm('Archive current expenses and start a new cycle?')) return;
    try {
      setLoading(true);
      await budgetService.archiveBudget();
      toast.success('Current Cycle Archived');
      setCategoryTargets({});
      localStorage.removeItem('qe_cat_targets');
      await fetchData();
    } catch (error) { toast.error('Archive failed'); }
    finally { setLoading(false); }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();

    // Validations
    if (!newExpense.itemName || newExpense.itemName.trim().length <= 2) {
      return toast.error('Description must be at least 3 characters');
    }
    
    const amountNum = Number(newExpense.amount);
    if (!newExpense.amount || isNaN(amountNum) || amountNum <= 0) {
      return toast.error('Check your amount - it must be more than 0');
    }

    if (!newExpense.category) {
      return toast.error('Select a category first!');
    }

    if (categoryTarget !== '') {
      const targetNum = Number(categoryTarget);
      if (isNaN(targetNum) || targetNum < 0) {
         return toast.error('Category target should be 0 or more');
      }
      const updated = { ...categoryTargets, [newExpense.category]: targetNum };
      setCategoryTargets(updated);
      localStorage.setItem('qe_cat_targets', JSON.stringify(updated));
    }

    try {
      const data = await expenseService.createExpense(newExpense);
      setManualExpenses([data, ...manualExpenses]);
      setIsAddingExpense(false);
      setNewExpense({ itemName: '', amount: '', category: 'Breakfast' });
      setCategoryTarget('');
      toast.success('Recorded');
    } catch (error) { toast.error(error.response?.data?.message || 'Recording failed'); }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await expenseService.deleteExpense(id);
      setManualExpenses(manualExpenses.filter(e => e._id !== id));
      toast.info('Removed');
    } catch (error) { toast.error('Delete failed'); }
  };

  const handleDeleteHistory = async (id) => {
    if (!window.confirm('Delete this history record permanentyl?')) return;
    try {
      await budgetService.deleteBudgetHistory(id);
      setBudgetHistory(budgetHistory.filter(h => h._id !== id));
      toast.info('Record Removed');
    } catch (error) { toast.error('Delete failed'); }
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center space-y-4 text-[#f97316]">
       <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin" />
       <p className="font-bold text-gray-400">Syncing Portfolio...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 font-sans text-[#37352f] bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100">
      <div className="h-40 w-full relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" alt="Banner" className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
        <div className="absolute -bottom-6 left-10 w-16 h-16 bg-white rounded-xl flex items-center justify-center text-3xl border border-gray-100 z-10 shadow-sm">🍴</div>
      </div>

      <div className="px-10 pt-12 space-y-8">
        <header>
           <h1 className="text-3xl font-extrabold tracking-tight mb-6 text-[#f97316]">Meal budget</h1>
           <div className="flex gap-6 border-b border-gray-50 pb-0 overflow-x-auto scrollbar-hide">
              <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 text-[11px] font-black pb-3 shrink-0 uppercase tracking-widest transition-all border-b-2 ${activeTab === 'overview' ? 'border-[#f97316] text-[#f97316]' : 'border-transparent text-gray-300 hover:text-black'}`}>
                 <Activity size={14} /> Overview
              </button>
              <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 text-[11px] font-black pb-3 shrink-0 uppercase tracking-widest transition-all border-b-2 ${activeTab === 'history' ? 'border-[#f97316] text-[#f97316]' : 'border-transparent text-gray-300 hover:text-black'}`}>
                 <History size={14} /> Budget History
              </button>
              <button className="flex items-center gap-2 text-[11px] font-black text-gray-300 hover:text-black transition-all border-b-2 border-transparent hover:border-black pb-3 shrink-0 uppercase tracking-widest ml-auto">
                 <Settings size={14} /> Preferences
              </button>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
           <div className="lg:col-span-3 space-y-12">
              {activeTab === 'overview' ? (
                <>
                  <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                     <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black flex items-center gap-3 text-[#f97316]">Expense Categories</h2>
                        <button onClick={() => { setNewExpense({ itemName: '', amount: '', category: 'Breakfast' }); setCategoryTarget(''); setIsAddingExpense(true); }} className="px-5 py-2.5 bg-[#f97316] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-orange-600 transition-all active:scale-95 flex items-center gap-2">
                           <Plus size={14} /> Add Spend
                        </button>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12px]">
                           <thead>
                              <tr className="text-gray-400 font-black uppercase tracking-[0.1em] border-b border-gray-50">
                                 <th className="pb-4 w-[35%]">Category</th>
                                 <th className="pb-4">Target</th>
                                 <th className="pb-4">Remaining</th>
                                 <th className="pb-4">Spent</th>
                                 <th className="pb-4 text-right">Action</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {totals.categories.map((cat, i) => (
                                 <tr key={i} className="group hover:bg-gray-50/60 transition-all">
                                    <td className="py-4 font-bold flex items-center gap-3 text-sm">
                                       <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-base shadow-sm border border-gray-100 group-hover:bg-white transition-all">{cat.icon}</div> 
                                       <span>{cat.name}</span>
                                    </td>
                                    <td className="py-4 font-mono text-gray-500 font-bold">{cat.budget.toFixed(0)}</td>
                                    <td className="py-4 min-w-[150px]">
                                       <div className="flex flex-col gap-1.5">
                                          <span className="font-mono text-[10px] font-black text-green-600">{(cat.budget - cat.spent).toFixed(0)}</span>
                                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                             <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, ((cat.budget - cat.spent) / (cat.budget || 1)) * 100))}%` }} className="h-full bg-green-500 rounded-full" />
                                          </div>
                                       </div>
                                    </td>
                                    <td className="py-4 font-mono text-gray-400 font-bold">{cat.spent.toFixed(0) || 0}</td>
                                    <td className="py-4 text-right">
                                       <button onClick={() => { const existing = categoryTargets[cat.id]; setCategoryTarget(existing != null ? String(existing) : ''); setNewExpense({ itemName: '', amount: '', category: cat.id }); setIsAddingExpense(true); }} className="p-1.5 bg-white border border-gray-100 rounded-lg text-[#f97316] hover:bg-orange-50 transition-all shadow-sm"><Plus size={14} /></button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </section>

                  <section className="space-y-4">
                     <h2 className="text-xl font-black mb-6">Registry Activity</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {manualExpenses.length > 0 ? (
                          manualExpenses.map((exp) => (
                            <div key={exp._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                               <div className="flex justify-between items-start mb-4">
                                  <div className="w-10 h-10 bg-orange-50 text-[#f97316] rounded-xl flex items-center justify-center text-lg">{totals.categories.find(c => c.id === exp.category)?.icon || '📦'}</div>
                                  <button onClick={() => handleDeleteExpense(exp._id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all shadow-sm"><Trash2 size={14} /></button>
                               </div>
                               <div>
                                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">{new Date(exp.date).toLocaleDateString()}</p>
                                  <h4 className="text-sm font-bold text-[#37352f] mb-3 truncate">{exp.itemName}</h4>
                                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                     <span className="text-base font-black italic text-[#f97316]">RS {exp.amount}</span>
                                     <span className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md text-[9px] uppercase font-black">{exp.category || 'General'}</span>
                                  </div>
                               </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-12 text-center bg-gray-50/30 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center">
                             <History size={24} className="text-gray-200 mb-3" />
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">No Registry Data</p>
                          </div>
                        )}
                     </div>
                  </section>

                  <section className="bg-slate-50/20 rounded-[2.5rem] p-4 border border-orange-100/60 shadow-inner overflow-hidden">
                     <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-orange-400/30" />
                           <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter italic">Activity Calendar</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">{currentDate.toLocaleString('default', { month: 'long' })}</span>
                           <div className="flex gap-0.5">
                              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-[#f97316] transition-all"><ChevronLeft size={12} /></button>
                              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-[#f97316] transition-all"><ChevronRight size={12} /></button>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-7 gap-0.5">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                           <div key={d} className="text-center text-[10px] font-bold text-orange-500 py-2 uppercase tracking-widest">{d}</div>
                        ))}
                        {calendarDays.map((d, i) => (
                           <div key={i} className={`h-11 rounded-xl border border-orange-100 flex flex-col items-center justify-center py-1 relative group transition-all ${!d ? 'bg-transparent border-none' : 'bg-white hover:border-orange-300 hover:shadow-sm'} ${d?.hasActivity ? 'bg-orange-50/20' : ''}`}>
                              {d && (
                                 <>
                                    <span className={`text-[10px] font-black ${d.day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'text-[#f97316]' : 'text-gray-900'}`}>{d.day}</span>
                                    {d.hasActivity && (
                                       <div className="mt-auto flex flex-col items-center gap-0.5">
                                          <div className="w-[3px] h-[3px] bg-[#f97316] rounded-full" />
                                          <span className="text-[5px] font-black text-[#f97316] leading-none">RS {d.total}</span>
                                       </div>
                                    )}
                                 </>
                              )}
                           </div>
                        ))}
                     </div>
                  </section>
                </>
              ) : (
                <section className="space-y-6">
                  <div className="grid grid-cols-1 gap-3">
                      {budgetHistory.length > 0 ? (
                        budgetHistory.map(h => (
                            <div key={h._id} className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all">
                              <div className="flex items-center gap-5">
                                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
                                    <span className="text-[7px] font-black uppercase text-gray-400 tracking-tighter">{new Date(h.endDate).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-sm font-black text-gray-900 leading-none">{new Date(h.endDate).getDate()}</span>
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-gray-900 capitalize flex items-center gap-2">{h.period} Cycle <span className="text-[8px] bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-400 font-black uppercase">Archived</span></h4>
                                    <p className="text-[10px] text-gray-400 font-medium">{new Date(h.startDate).toLocaleDateString()} — {new Date(h.endDate).toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-8">
                                  <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-300 uppercase underline decoration-[#f97316]/20 decoration-2 underline-offset-4 mb-2">Budget Target</p>
                                    <p className="text-sm font-black text-gray-400">RS {h.budgetAmount}</p>
                                  </div>
                                  <div className="text-right min-w-[100px]">
                                    <p className="text-[9px] font-black text-gray-300 uppercase underline decoration-[#f97316]/20 decoration-2 underline-offset-4 mb-2">Total Spent</p>
                                    <p className="text-sm font-black text-gray-900">RS {h.totalSpent}</p>
                                    <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${h.totalSpent > h.budgetAmount ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>{h.totalSpent > h.budgetAmount ? 'Over Budget' : 'Within Budget'}</span>
                                  </div>
                                  <button onClick={() => handleDeleteHistory(h._id)} className="p-2 ml-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                              </div>
                            </div>
                        ))
                      ) : (
                        <div className="py-10 text-center bg-gray-50/20 rounded-2xl border border-dashed border-gray-100">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">No archived records yet</p>
                        </div>
                      )}
                  </div>
                </section>
              )}
           </div>

           <div className="space-y-10">
              <section className="sticky top-8">
                 <div className="space-y-10">
                    <div>
                       <div className="flex justify-between items-center mb-6 px-1">
                          <h3 className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Portfolio Analytics</h3>
                          {totals.percentage > 100 && <span className="text-[9px] font-black text-red-500 uppercase animate-bounce">! Over Budget</span>}
                       </div>
                       <div className="bg-[#fbfbfb] rounded-[35px] p-8 flex flex-col items-center border border-gray-100 group hover:bg-white transition-all">
                          <div className="relative w-40 h-40 flex items-center justify-center">
                             <svg className="w-full h-full -rotate-90">
                                <circle cx="80" cy="80" r="68" stroke="#f1f1ef" strokeWidth="16" fill="transparent" />
                                <motion.circle animate={{ strokeDashoffset: 427 - (427 * Math.min(100, totals.percentage)) / 100 }} cx="80" cy="80" r="68" stroke={totals.percentage > 100 ? "#ef4444" : "#f97316"} strokeWidth="16" fill="transparent" strokeDasharray="427" strokeLinecap="round" />
                             </svg>
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <h4 className={`text-4xl font-black tracking-tighter italic ${totals.percentage > 100 ? 'text-red-500' : 'text-[#37352f]'}`}>{budget.amount}</h4>
                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] mt-1">Target</span>
                             </div>
                          </div>
                          <div className="mt-8 w-full space-y-4">
                             <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-gray-400">Total Spent</span><span className="text-[#37352f]">RS {totals.totalSpent.toFixed(0)}</span></div>
                             <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-gray-400">Current Balance</span><span className={totals.balance <= 0 ? 'text-red-500 font-black' : 'text-[#f97316]'}>RS {totals.balance.toFixed(0)}</span></div>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <button onClick={() => setIsEditingBudget(true)} className="w-full bg-[#f97316] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-orange-600 transition-all active:scale-95 shadow-lg"><Plus size={14} /> Update Budget</button>
                       <button onClick={handleResetBudget} className="w-full bg-white text-red-400 border border-red-50 py-3 rounded-2xl font-black uppercase tracking-widest text-[8px] flex items-center justify-center gap-2 hover:bg-red-50 transition-all"><Trash2 size={12} /> Reset Budget</button>
                    </div>
                 </div>
              </section>
           </div>
        </div>
      </div>

      <AnimatePresence>
         {isEditingBudget && (
            <Modal title="Configure Budget" icon="💰" onClose={() => setIsEditingBudget(false)}>
               <form onSubmit={handleSaveBudget} className="space-y-5">
                  <div>
                     <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Budget Cycle</label>
                     <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-xl gap-1">
                        {['weekly', 'monthly'].map(p => (
                           <button key={p} type="button" onClick={() => setBudget({...budget, period: p})} className={`py-2.5 rounded-lg text-xs font-semibold transition-all capitalize ${budget.period === p ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>{p}</button>
                        ))}
                     </div>
                  </div>
                  <div>
                     <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Total Amount (RS)</label>
                     <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">RS</span>
                        <input type="number" value={tempAmount} onChange={e => setTempAmount(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:border-[#f97316] focus:bg-white py-3 pl-10 pr-4 rounded-xl text-base font-semibold outline-none transition-all text-gray-900" placeholder="0.00" />
                     </div>
                  </div>
                  <button type="submit" className="w-full bg-[#f97316] text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-all active:scale-95 shadow-md shadow-orange-200">Confirm Budget</button>
               </form>
            </Modal>
         )}
         {isAddingExpense && (
            <Modal title="Add Expense" icon="✏️" onClose={() => setIsAddingExpense(false)}>
               <form onSubmit={handleAddExpense} className="space-y-4">
                  <div>
                     <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                     <input value={newExpense.itemName} onChange={e => setNewExpense({...newExpense, itemName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 focus:border-[#f97316] focus:bg-white py-3 px-4 rounded-xl text-sm font-medium outline-none transition-all text-gray-900 placeholder-gray-400" placeholder="e.g. Chicken Rice Combo" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Amount (RS)</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">RS</span><input type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full bg-gray-50 border border-gray-200 focus:border-[#f97316] focus:bg-white py-3 pl-9 pr-3 rounded-xl text-sm font-semibold outline-none transition-all text-gray-900" placeholder="0" /></div>
                     </div>
                     <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
                        <div className="relative">
                           <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 focus:border-[#f97316] focus:bg-white py-3 pl-3 pr-8 rounded-xl text-sm font-medium outline-none transition-all appearance-none text-gray-900">
                              <option value="Canteen Passes">🎫 Canteen Passes</option>
                              <option value="Breakfast">🌅 Breakfast</option>
                              <option value="Lunch">☀️ Lunch</option>
                              <option value="Dinner">🌙 Dinner</option>
                              <option value="Snacks">🍕 Snacks</option>
                              <option value="Other Expense">📦 Other</option>
                           </select>
                           <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                     </div>
                  </div>
                  <div>
                     <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Category Target (RS) <span className="normal-case font-normal text-gray-300">— optional</span></label>
                     <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">RS</span><input type="number" value={categoryTarget} onChange={e => setCategoryTarget(e.target.value)} className="w-full bg-orange-50 border border-orange-100 focus:border-[#f97316] focus:bg-white py-3 pl-9 pr-3 rounded-xl text-sm font-semibold outline-none transition-all text-[#f97316]" placeholder="Set a spending target" /></div>
                     <p className="text-[10px] text-gray-400 mt-1 ml-1">Overrides the default budget split for this category.</p>
                  </div>
                  <button type="submit" className="w-full bg-[#f97316] text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-all active:scale-95 shadow-md shadow-orange-200">Record Expense</button>
               </form>
            </Modal>
         )}
      </AnimatePresence>
    </div>
  );
};

const Modal = ({ title, icon, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-lg">{icon}</span>}
          <h2 className="text-base font-semibold text-gray-900 tracking-tight">{title}</h2>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all"><XIconButton /></button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  </div>
);

const XIconButton = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default MealBudgetPage;
