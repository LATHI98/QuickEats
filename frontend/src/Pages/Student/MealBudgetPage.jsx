import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, TrendingUp, Calendar, 
  CheckCircle, AlertCircle, Save,
  ArrowRight, Coins, BarChart3,
  CreditCard, Plus, History, Trash2,
  ListFilter, ArrowUpRight, ArrowDownRight,
  Info, Ticket, Activity, Zap, Sparkles,
  ShoppingBag, Settings, Layout, ChevronLeft, ChevronRight
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

  // Form States
  const [tempAmount, setTempAmount] = useState('');
  const [newExpense, setNewExpense] = useState({ itemName: '', amount: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetData, passesData, expenseData] = await Promise.all([
        budgetService.getBudget(),
        purchasedPassService.getMyPasses(),
        expenseService.getExpenses()
      ]);
      setBudget(budgetData);
      setTempAmount(budgetData.amount.toString());
      setMyPasses(passesData);
      setManualExpenses(expenseData);
    } catch (error) {
      toast.error('Sync Error');
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const totalSpent = myPasses.reduce((sum, p) => sum + (p.price || 0), 0) + 
                       manualExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const balance = Math.max(0, budget.amount - totalSpent);
    const percentage = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;

    // Category breakdown
    const categories = [
      { name: 'Canteen Passes', spent: myPasses.reduce((sum, p) => sum + (p.price || 0), 0), budget: budget.amount * 0.6, icon: '🎫' },
      { name: 'Snacks/Manual', spent: manualExpenses.reduce((sum, e) => sum + (e.amount || 0), 0), budget: budget.amount * 0.3, icon: '🍕' },
      { name: 'Reservations', spent: 0, budget: budget.amount * 0.1, icon: '📅' }
    ];

    return { totalSpent, balance, percentage, categories };
  }, [myPasses, manualExpenses, budget]);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    try {
      const data = await budgetService.setBudget({ amount: Number(tempAmount), period: budget.period });
      setBudget(data);
      setIsEditingBudget(false);
      toast.success('Budget Updated');
    } catch (error) { toast.error('Failed'); }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const data = await expenseService.createExpense(newExpense);
      setManualExpenses([data, ...manualExpenses]);
      setIsAddingExpense(false);
      setNewExpense({ itemName: '', amount: '' });
    } catch (error) { toast.error('Failed'); }
  };

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">Loading Planner...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 font-sans text-[#37352f] bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
      
      {/* 1. Top Banner Image */}
      <div className="h-64 w-full relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
          alt="Banner" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -bottom-8 left-12 w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-xl border border-gray-100">
           🍴
        </div>
      </div>

      <div className="px-12 pt-16 space-y-8">
        {/* 2. Header Title */}
        <header>
           <h1 className="text-4xl font-black tracking-tight mb-4">Food Planner - Budget & All</h1>
           
           <div className="bg-[#fbf3db] p-4 rounded-lg border-l-4 border-[#dfab01] text-sm leading-relaxed">
              Hi there! For everyone who gets overwhelmed with overcrowded templates, here's a simple one to enjoy budgeting and planning your meals without exceeding your budget!
           </div>

           <div className="flex gap-6 mt-6 border-b border-gray-100 pb-2">
              <button className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-all border-b-2 border-transparent hover:border-[#37352f] pb-2">
                 <Layout size={16} /> Budget Overview
              </button>
              <button className="flex items-center gap-2 text-sm font-bold border-b-2 border-[#37352f] pb-2">
                 <Activity size={16} /> Overview
              </button>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
           {/* MAIN CONTENT Area (3 cols) */}
           <div className="lg:col-span-3 space-y-12">
              
              {/* Expense Categories Table */}
              <section>
                 <h2 className="text-xl font-black mb-6 flex items-center gap-2">Expense Categories</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                       <thead>
                          <tr className="text-gray-400 font-bold border-b border-gray-100">
                             <th className="pb-4 font-bold flex items-center gap-2"><Layout size={14}/> Category</th>
                             <th className="pb-4 font-bold"><Wallet size={14} className="inline mr-1"/> Budgeted</th>
                             <th className="pb-4 font-bold"><ArrowRight size={14} className="inline mr-1"/> Remaining</th>
                             <th className="pb-4 font-bold"><BarChart3 size={14} className="inline mr-1"/> Total Spent</th>
                             <th className="pb-4 font-bold text-right"><Plus size={14} className="inline mr-1"/> Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {totals.categories.map((cat, i) => (
                             <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 font-bold flex items-center gap-3">
                                   <span className="text-lg">{cat.icon}</span> {cat.name}
                                </td>
                                <td className="py-4 font-mono text-gray-500">{cat.budget.toFixed(1)}</td>
                                <td className="py-4 min-w-[150px]">
                                   <div className="flex flex-col gap-1.5">
                                      <span className="font-mono text-[11px] font-bold text-green-600">{(cat.budget - cat.spent).toFixed(1)}</span>
                                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                         <div 
                                           className="h-full bg-green-500/60 rounded-full" 
                                           style={{ width: `${Math.max(0, Math.min(100, ((cat.budget - cat.spent) / cat.budget) * 100))}%` }}
                                         />
                                      </div>
                                   </div>
                                </td>
                                <td className="py-4 font-mono text-gray-400">{cat.spent.toFixed(1)}</td>
                                <td className="py-4 text-right space-x-3">
                                   <button className="text-[11px] font-bold text-gray-400 hover:text-black hover:underline">Spent</button>
                                   <button className="text-[11px] font-bold text-gray-400 hover:text-black hover:underline">Remaining</button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </section>

              {/* Weekly/Monthly Board (Calendar style) */}
              <section className="bg-gray-50/50 rounded-2xl p-8 border border-gray-100">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-4">
                       <button className="text-sm font-black bg-white shadow-sm border border-gray-200 px-4 py-1.5 rounded-lg border-b-2 border-b-blue-500">Weekly</button>
                       <button className="text-sm font-bold text-gray-400 hover:text-black px-4 py-1.5 transition-all">Monthly</button>
                       <button className="text-sm font-bold text-gray-400 hover:text-black px-4 py-1.5 transition-all">Board</button>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400">
                       <span className="text-sm font-bold uppercase tracking-widest text-[#37352f]">Apr - May 2025</span>
                       <div className="flex gap-1">
                          <button className="p-1 hover:bg-gray-200 rounded-md transition-all"><ChevronLeft size={18} /></button>
                          <button className="text-xs font-bold px-2 hover:bg-gray-200 rounded-md">Today</button>
                          <button className="p-1 hover:bg-gray-200 rounded-md transition-all"><ChevronRight size={18} /></button>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                       <div key={d} className="bg-white p-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">{d}</div>
                    ))}
                    {Array.from({ length: 35 }, (_, i) => (
                       <div key={i} className="bg-white min-h-[100px] p-2 hover:bg-gray-50 transition-all border-b border-r border-gray-100">
                          <span className={`text-[11px] font-bold ${i+1 === new Date().getDate() ? 'bg-black text-white px-1.5 py-0.5 rounded-md shadow-sm' : 'text-gray-300'}`}>{i + 1}</span>
                          {(i === 1 || i === 5 || i === 12) && (
                             <div className="mt-2 text-[9px] font-black bg-orange-100 text-orange-700 p-1.5 rounded-md border border-orange-200 truncate">
                                🍕 Meal Purchased
                             </div>
                          )}
                       </div>
                    ))}
                 </div>
              </section>
           </div>

           {/* SIDEBAR Section (1 col) */}
           <div className="space-y-12">
              <section>
                 <h3 className="text-sm font-bold text-gray-400 mb-6 flex items-center justify-between">Monthly Budget Overview <Info size={14} /></h3>
                 <div className="bg-gray-50/50 rounded-2xl p-8 flex flex-col items-center border border-gray-50 shadow-inner group">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-8 self-start group-hover:text-[#37352f] transition-all">
                       <Activity size={16} /> Chart
                    </div>
                    
                    <div className="relative w-48 h-48 flex items-center justify-center">
                       {/* SVG Donut Chart */}
                       <svg className="w-full h-full -rotate-90">
                          <circle cx="96" cy="96" r="80" stroke="#f1f1ef" strokeWidth="20" fill="transparent" />
                          <motion.circle 
                            initial={{ strokeDashoffset: 502 }} animate={{ strokeDashoffset: 502 - (502 * Math.min(100, totals.percentage)) / 100 }}
                            cx="96" cy="96" r="80" stroke="#369dfd" strokeWidth="20" fill="transparent" strokeDasharray="502" 
                          />
                          <circle cx="96" cy="96" r="80" stroke="#ffb100" strokeWidth="20" strokeDasharray="100 402" strokeDashoffset="-200" fill="transparent" className="hidden" />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <h4 className="text-5xl font-black text-gray-900 tracking-tighter">{budget.amount}</h4>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Amount</span>
                       </div>
                    </div>

                    <div className="mt-10 flex gap-6 text-[11px] font-bold">
                       <span className="flex items-center gap-2 text-[#369dfd]"><div className="w-2.5 h-2.5 rounded-full bg-[#369dfd]" /> Remaining</span>
                       <span className="flex items-center gap-2 text-[#ffb100]"><div className="w-2.5 h-2.5 rounded-full bg-[#ffb100]" /> Spent</span>
                    </div>
                 </div>
              </section>

              <section className="bg-[#f1f1ef]/50 rounded-2xl p-6 border border-gray-100">
                 <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest italic">Inventory List :</h3>
                 <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600">
                       <div className="min-w-[12px] h-3 w-3 rounded-full border-2 border-gray-300" /> Item 1
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600">
                       <div className="min-w-[12px] h-3 w-3 rounded-full border-2 border-gray-300" /> Monthly Passes
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600">
                       <div className="min-w-[12px] h-3 w-3 rounded-full border-2 border-gray-300" /> Snacks Check
                    </li>
                 </ul>
                 <button className="mt-6 text-[10px] font-black text-gray-300 hover:text-gray-900 transition-all">+ New Entry</button>
              </section>

              <button 
                onClick={() => setIsEditingBudget(true)}
                className="w-full bg-[#37352f] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl active:scale-95"
              >
                 <Settings size={18} /> Configure Budget
              </button>
           </div>
        </div>
      </div>

      <AnimatePresence>
         {isEditingBudget && (
            <Modal title="Configure Portfolio" onClose={() => setIsEditingBudget(false)}>
               <form onSubmit={handleSaveBudget} className="space-y-8">
                  <div className="flex bg-gray-50 p-2 rounded-xl gap-2 text-xs font-bold">
                     <button type="button" onClick={() => setBudget({...budget, period: 'weekly'})} className={`flex-1 py-3 rounded-lg ${budget.period === 'weekly' ? 'bg-white shadow-md' : 'text-gray-400'}`}>Weekly</button>
                     <button type="button" onClick={() => setBudget({...budget, period: 'monthly'})} className={`flex-1 py-3 rounded-lg ${budget.period === 'monthly' ? 'bg-white shadow-md' : 'text-gray-400'}`}>Monthly</button>
                  </div>
                  <input type="number" placeholder="Enter Amount" value={tempAmount} onChange={e => setTempAmount(e.target.value)} className="w-full bg-[#fbf3db] border-2 border-transparent focus:border-[#dfab01] py-8 px-6 rounded-2xl text-4xl font-black outline-none" />
                  <button type="submit" className="w-full bg-[#37352f] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl">Confirm Plan</button>
               </form>
            </Modal>
         )}
      </AnimatePresence>
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/5 backdrop-blur-sm">
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg bg-white rounded-[30px] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100">
       <button onClick={onClose} className="absolute top-8 right-8 text-gray-300 hover:text-black transition-all font-bold">Close</button>
       <h2 className="text-3xl font-black mb-10">{title}</h2>
       {children}
    </motion.div>
  </div>
);

export default MealBudgetPage;
