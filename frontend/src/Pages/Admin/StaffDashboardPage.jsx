import React, { useEffect, useState } from 'react';
import {
  Plus, Pencil, PackagePlus, Check, X, RefreshCw,
  UtensilsCrossed, TrendingUp, CheckCircle, XCircle,
  Sunrise, Sun, Moon, Coffee, ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'beverages', 'snacks', 'other'];

const CAT_META = {
  breakfast:  { icon: Sunrise,        color: 'text-yellow-600', bg: 'bg-yellow-50'  },
  lunch:      { icon: Sun,            color: 'text-orange-600', bg: 'bg-orange-50'  },
  dinner:     { icon: Moon,           color: 'text-indigo-600', bg: 'bg-indigo-50'  },
  beverages:  { icon: Coffee,         color: 'text-green-600',  bg: 'bg-green-50'   },
};
const catMeta = (cat) => CAT_META[cat?.toLowerCase()] || { icon: UtensilsCrossed, color: 'text-gray-500', bg: 'bg-gray-50' };

const EMPTY_ADD = { name: '', category: 'breakfast', price: '', stock: '', available: true };

// ─── Tab pill ────────────────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, icon: Icon, label, count }) => (
  <button onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
      active ? 'bg-orange-600 text-white shadow-lg shadow-orange-100'
              : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
    }`}>
    <Icon size={16} />
    {label}
    {count !== undefined && (
      <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-orange-50 text-orange-600'}`}>
        {count}
      </span>
    )}
  </button>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const StaffDashboardPage = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('add'); // 'add' | 'prices' | 'restock'

  // --- Add form state ---
  const [addForm, setAddForm] = useState(EMPTY_ADD);
  const [adding, setAdding] = useState(false);

  // --- Edit price inline state ---
  const [editPriceId, setEditPriceId] = useState(null);
  const [editPriceVal, setEditPriceVal] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  // --- Restock inline state ---
  const [restockAmounts, setRestockAmounts] = useState({});
  const [restocking, setRestocking] = useState(null);

  const fetchFoods = async () => {
    try { setLoading(true); const { data } = await api.get('/api/food'); setFoods(data); }
    catch { toast.error('Failed to load menu items'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFoods(); }, []);

  // ── Add Item ──────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const payload = { ...addForm, price: Number(addForm.price), stock: Number(addForm.stock) };
      const { data } = await api.post('/api/food', payload);
      setFoods(p => [...p, data]);
      setAddForm(EMPTY_ADD);
      toast.success(`"${data.name}" added to menu!`);
    } catch { toast.error('Failed to add item'); }
    finally { setAdding(false); }
  };

  // ── Edit Price ────────────────────────────────────────────────────────────
  const startEditPrice = (food) => { setEditPriceId(food._id); setEditPriceVal(food.price); };
  const cancelEditPrice = () => { setEditPriceId(null); setEditPriceVal(''); };

  const savePrice = async (food) => {
    const newPrice = Number(editPriceVal);
    if (isNaN(newPrice) || newPrice < 0) { toast.error('Invalid price'); return; }
    setSavingPrice(true);
    try {
      const { data } = await api.put(`/api/food/${food._id}`, { ...food, price: newPrice });
      setFoods(p => p.map(f => f._id === food._id ? data : f));
      toast.success(`Price updated to LKR ${newPrice.toFixed(2)}`);
      cancelEditPrice();
    } catch { toast.error('Failed to update price'); }
    finally { setSavingPrice(false); }
  };

  // ── Restock ───────────────────────────────────────────────────────────────
  const handleRestock = async (food) => {
    const amount = Number(restockAmounts[food._id] || 0);
    if (!amount || amount <= 0) { toast.error('Enter a valid restock amount'); return; }
    setRestocking(food._id);
    try {
      const { data } = await api.patch(`/api/food/${food._id}/restock`, { amount });
      setFoods(p => p.map(f => f._id === food._id ? data : f));
      setRestockAmounts(p => ({ ...p, [food._id]: '' }));
      toast.success(`+${amount} units added to "${food.name}" — now ${data.stock} in stock`);
    } catch (err) { toast.error(err.response?.data?.message || 'Restock failed'); }
    finally { setRestocking(null); }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Items',    value: foods.length,                             bg: 'bg-orange-50', color: 'text-orange-600' },
    { label: 'Available',      value: foods.filter(f => f.available).length,    bg: 'bg-green-50',  color: 'text-green-600'  },
    { label: 'Out of Stock',   value: foods.filter(f => !f.available).length,   bg: 'bg-red-50',    color: 'text-red-500'    },
    { label: 'Low Stock (≤5)', value: foods.filter(f => f.stock <= 5 && f.stock > 0).length, bg: 'bg-yellow-50', color: 'text-yellow-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-400 font-medium mt-1">Add items, edit prices and restock inventory.</p>
        </div>
        <button onClick={fetchFoods} className="flex items-center gap-2 border-2 border-gray-100 text-gray-500 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-gray-100`}>
            <p className="text-sm font-medium text-gray-400">{s.label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-3">
        <TabBtn active={tab === 'add'}     onClick={() => setTab('add')}     icon={Plus}        label="Add New Item" />
        <TabBtn active={tab === 'prices'}  onClick={() => setTab('prices')}  icon={Pencil}      label="Edit Prices"  count={foods.length} />
        <TabBtn active={tab === 'restock'} onClick={() => setTab('restock')} icon={PackagePlus} label="Restock"      count={foods.filter(f => f.stock <= 5).length} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ══════════ ADD NEW ITEM ══════════ */}
          {tab === 'add' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Plus size={18} className="text-orange-600" />
                </span>
                Add New Food Item
              </h2>
              <form onSubmit={handleAdd} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Item Name</label>
                    <input type="text" placeholder="e.g. Nasi Lemak" required
                      value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl focus:border-orange-500 focus:bg-white outline-none font-medium transition-all" />
                  </div>

                  {/* Category dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                    <div className="relative">
                      <select
                        value={addForm.category}
                        onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))}
                        className="w-full appearance-none px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl focus:border-orange-500 focus:bg-white outline-none font-medium transition-all capitalize cursor-pointer">
                        {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                      <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price (LKR)</label>
                    <input type="number" min="0" step="0.01" placeholder="0.00" required
                      value={addForm.price} onChange={e => setAddForm(p => ({ ...p, price: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl focus:border-orange-500 focus:bg-white outline-none font-medium transition-all" />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Initial Stock</label>
                    <input type="number" min="0" placeholder="0" required
                      value={addForm.stock} onChange={e => setAddForm(p => ({ ...p, stock: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl focus:border-orange-500 focus:bg-white outline-none font-medium transition-all" />
                  </div>

                  {/* Available toggle */}
                  <div className="flex items-center gap-3 pt-1">
                    <button type="button" onClick={() => setAddForm(p => ({ ...p, available: !p.available }))}
                      className={`w-12 h-6 rounded-full transition-colors ${addForm.available ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <span className={`block w-5 h-5 bg-white rounded-full shadow mx-0.5 transition-transform ${addForm.available ? 'translate-x-6' : ''}`} />
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                      Mark as <span className={addForm.available ? 'text-green-600 font-bold' : 'text-gray-400'}>available</span>
                    </span>
                  </div>
                </div>

                <button type="submit" disabled={adding}
                  className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-base hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Plus size={18} />
                  {adding ? 'Adding...' : 'Add to Menu'}
                </button>
              </form>
            </div>
          )}

          {/* ══════════ EDIT PRICES ══════════ */}
          {tab === 'prices' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {foods.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                  <UtensilsCrossed size={40} />
                  <p className="mt-3 font-bold text-gray-400">No items yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      {['Item', 'Category', 'Current Price', 'Stock', 'Update Price'].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {foods.map(food => {
                      const meta = catMeta(food.category);
                      const CatIcon = meta.icon;
                      const isEditing = editPriceId === food._id;
                      return (
                        <tr key={food._id} className="border-b border-gray-50 last:border-0 hover:bg-orange-50/20 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{food.name}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full capitalize ${meta.bg} ${meta.color}`}>
                              <CatIcon size={11} />{food.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-orange-600">LKR {Number(food.price).toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`flex items-center gap-1 text-xs font-bold ${food.available ? 'text-green-600' : 'text-red-500'}`}>
                              {food.available ? <CheckCircle size={13} /> : <XCircle size={13} />} {food.stock}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400 font-bold">LKR</span>
                                <input type="number" min="0" step="0.01" autoFocus
                                  value={editPriceVal}
                                  onChange={e => setEditPriceVal(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') savePrice(food); if (e.key === 'Escape') cancelEditPrice(); }}
                                  className="w-24 px-3 py-2 bg-gray-50 border-2 border-orange-400 rounded-xl outline-none font-bold text-sm" />
                                <button onClick={() => savePrice(food)} disabled={savingPrice}
                                  className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-colors">
                                  <Check size={15} />
                                </button>
                                <button onClick={cancelEditPrice}
                                  className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition-colors">
                                  <X size={15} />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => startEditPrice(food)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-orange-50 text-gray-500 hover:text-orange-600 rounded-xl font-bold text-xs transition-colors">
                                <Pencil size={13} /> Edit Price
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ══════════ RESTOCK ══════════ */}
          {tab === 'restock' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {foods.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                  <UtensilsCrossed size={40} />
                  <p className="mt-3 font-bold text-gray-400">No items yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      {['Item', 'Category', 'Current Stock', 'Status', 'Add Stock', ''].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {foods.map(food => {
                      const meta = catMeta(food.category);
                      const CatIcon = meta.icon;
                      const isLow = food.stock <= 5 && food.stock > 0;
                      const isOut = food.stock === 0;
                      const recentlyRestocked = food.restockedAt &&
                        (new Date() - new Date(food.restockedAt)) < 24 * 60 * 60 * 1000;

                      return (
                        <tr key={food._id} className={`border-b border-gray-50 last:border-0 transition-colors ${isOut ? 'bg-red-50/30' : isLow ? 'bg-yellow-50/30' : 'hover:bg-gray-50/50'}`}>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-gray-900">{food.name}</p>
                              {recentlyRestocked && (
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                  ✓ Restocked today
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full capitalize ${meta.bg} ${meta.color}`}>
                              <CatIcon size={11} />{food.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-2xl font-extrabold ${isOut ? 'text-red-500' : isLow ? 'text-yellow-600' : 'text-gray-900'}`}>
                              {food.stock}
                            </span>
                            <span className="text-xs text-gray-400 font-medium ml-1">units</span>
                          </td>
                          <td className="px-6 py-4">
                            {isOut
                              ? <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full"><XCircle size={12} /> Out of Stock</span>
                              : isLow
                                ? <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full">⚠ Low Stock</span>
                                : <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full"><CheckCircle size={12} /> Good</span>
                            }
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400 font-bold">+</span>
                              <input
                                type="number" min="1" placeholder="qty"
                                value={restockAmounts[food._id] || ''}
                                onChange={e => setRestockAmounts(p => ({ ...p, [food._id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleRestock(food)}
                                className="w-20 px-3 py-2 bg-gray-50 border-2 border-transparent focus:border-orange-400 rounded-xl outline-none font-bold text-sm transition-all"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleRestock(food)}
                              disabled={restocking === food._id || !restockAmounts[food._id]}
                              className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-2xl font-bold text-xs hover:bg-orange-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-orange-100">
                              <PackagePlus size={14} />
                              {restocking === food._id ? 'Adding...' : 'Restock'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StaffDashboardPage;
