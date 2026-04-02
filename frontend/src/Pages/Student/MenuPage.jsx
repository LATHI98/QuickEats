import React, { useEffect, useState } from 'react';
import { ShoppingBag, Plus, Minus, UtensilsCrossed, CheckCircle2, XCircle, ChevronDown, Coffee, Sun, Moon, Sunrise } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const CATEGORIES = [
  { key: 'all',        label: 'All Items',  icon: UtensilsCrossed, color: 'text-gray-500',   bg: 'bg-gray-50'    },
  { key: 'breakfast',  label: 'Breakfast',  icon: Sunrise,         color: 'text-yellow-600', bg: 'bg-yellow-50'  },
  { key: 'lunch',      label: 'Lunch',      icon: Sun,             color: 'text-orange-600', bg: 'bg-orange-50'  },
  { key: 'dinner',     label: 'Dinner',     icon: Moon,            color: 'text-indigo-600', bg: 'bg-indigo-50'  },
  { key: 'beverages',  label: 'Beverages',  icon: Coffee,          color: 'text-green-600',  bg: 'bg-green-50'   },
];

const OrdersPage = () => {
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [placing, setPlacing] = useState(null);
  const [tab, setTab] = useState('menu');
  const [category, setCategory] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeCategory = CATEGORIES.find(c => c.key === category);
  const ActiveIcon = activeCategory.icon;

  const fetchFoods = async () => {
    try {
      setLoadingFoods(true);
      const { data } = await api.get('/api/food');
      setFoods(data.filter(f => f.available));
    } catch {
      toast.error('Could not load menu');
    } finally {
      setLoadingFoods(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const { data } = await api.get('/api/order');
      setOrders(data);
    } catch {
      toast.error('Could not load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => { fetchFoods(); fetchOrders(); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (!e.target.closest('#category-dropdown')) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredFoods = category === 'all'
    ? foods
    : foods.filter(f => f.category?.toLowerCase() === category);

  const setQty = (id, val) => setQuantities(p => ({ ...p, [id]: Math.max(1, val) }));

  const placeOrder = async (food) => {
    const qty = quantities[food._id] || 1;
    if (qty > food.stock) { toast.error('Not enough stock'); return; }
    setPlacing(food._id);
    try {
      await api.post('/api/order', { foodId: food._id, quantity: qty });
      toast.success(`Ordered ${qty}x ${food.name}!`);
      setQuantities(p => ({ ...p, [food._id]: 1 }));
      await fetchFoods();
      await fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally {
      setPlacing(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-['Gilroy_Bold'] text-gray-900">My Menu</h1>
        <p className="text-gray-400 font-['Gilroy_Medium'] mt-1">Browse available food and place orders.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ key: 'menu', label: 'Order Food' }, { key: 'history', label: 'Order History' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-6 py-3 rounded-2xl font-['Gilroy_Bold'] text-sm transition-all ${
              tab === t.key ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Order Food Tab */}
      {tab === 'menu' && (
        <>
          {/* Category Dropdown */}
          <div className="flex items-center gap-4">
            <div id="category-dropdown" className="relative">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center gap-3 bg-white border-2 border-gray-100 hover:border-orange-300 px-5 py-3 rounded-2xl font-['Gilroy_Bold'] text-sm text-gray-700 transition-all shadow-sm min-w-[180px] justify-between"
              >
                <span className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center ${activeCategory.bg}`}>
                    <ActiveIcon size={14} className={activeCategory.color} />
                  </span>
                  {activeCategory.label}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-200/60 overflow-hidden z-30 min-w-[200px]">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => { setCategory(cat.key); setDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-['Gilroy_Bold'] transition-colors hover:bg-gray-50 ${
                        category === cat.key ? 'text-orange-600 bg-orange-50/60' : 'text-gray-700'
                      }`}
                    >
                      {(() => { const CatIcon = cat.icon; return (
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${cat.bg}`}>
                        <CatIcon size={15} className={cat.color} />
                      </span>
                      ); })()}
                      {cat.label}
                      {category === cat.key && (
                        <span className="ml-auto w-2 h-2 bg-orange-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-sm font-['Gilroy_Medium'] text-gray-400">
              {filteredFoods.length} item{filteredFoods.length !== 1 ? 's' : ''} available
            </span>
          </div>

          {loadingFoods ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-300">
              <ActiveIcon size={48} className="opacity-30" />
              <p className="mt-4 font-['Gilroy_Bold'] text-gray-400">
                No {activeCategory.label.toLowerCase()} available right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFoods.map(food => {
                const qty = quantities[food._id] || 1;
                const catInfo = CATEGORIES.find(c => c.key === food.category?.toLowerCase()) || CATEGORIES[0];
                const CatInfoIcon = catInfo.icon;
                const recentlyRestocked = food.restockedAt &&
                  (new Date() - new Date(food.restockedAt)) < 24 * 60 * 60 * 1000;
                return (
                  <div key={food._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-orange-50 transition-all overflow-hidden group">
                    {/* Top colored banner */}
                    <div className={`h-2 ${
                      food.category?.toLowerCase() === 'breakfast' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                      food.category?.toLowerCase() === 'lunch'     ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      food.category?.toLowerCase() === 'dinner'    ? 'bg-gradient-to-r from-indigo-400 to-indigo-600' :
                      food.category?.toLowerCase() === 'beverages' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      'bg-gradient-to-r from-orange-400 to-orange-600'
                    }`} />
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-['Gilroy_Bold'] text-gray-900 text-lg">{food.name}</h3>
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className={`inline-flex items-center gap-1 text-xs font-['Gilroy_Bold'] px-2 py-0.5 rounded-full capitalize ${catInfo.bg} ${catInfo.color}`}>
                              <CatInfoIcon size={10} />
                              {food.category}
                            </span>
                            {recentlyRestocked && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-['Gilroy_Bold'] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                                ✦ Restocked
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-2xl font-['Gilroy_Heavy'] text-orange-600">LKR {Number(food.price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center text-xs text-gray-400 font-['Gilroy_Medium']">
                        <span className="flex items-center gap-1">
                          {food.available
                            ? <><CheckCircle2 size={13} className="text-green-500" />
                                <span className={recentlyRestocked ? 'text-green-600 font-["Gilroy_Bold"]' : ''}>
                                  {food.stock} left{recentlyRestocked ? ' (freshly stocked)' : ''}
                                </span>
                              </>
                            : <><XCircle size={13} className="text-red-400" /> Out of stock</>}
                        </span>
                      </div>
                      {/* Quantity + Order */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2">
                          <button onClick={() => setQty(food._id, qty - 1)} className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-white text-gray-400 hover:text-orange-600 transition-colors">
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-['Gilroy_Bold'] text-gray-900">{qty}</span>
                          <button onClick={() => setQty(food._id, qty + 1)} className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-white text-gray-400 hover:text-orange-600 transition-colors">
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => placeOrder(food)}
                          disabled={placing === food._id || food.stock < 1}
                          className="flex-1 bg-orange-600 text-white py-2.5 rounded-2xl font-['Gilroy_Bold'] text-sm hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          {placing === food._id ? 'Ordering...' : 'Order Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Order History Tab */}
      {tab === 'history' && (
        loadingOrders ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-300">
            <ShoppingBag size={48} />
            <p className="mt-4 font-['Gilroy_Bold'] text-gray-400">No orders placed yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  {['#', 'Food Item', 'Category', 'Unit Price', 'Qty', 'Total', 'Date'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-['Gilroy_Bold'] text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...orders].reverse().map((order, idx) => {
                  const food = order.foodId;
                  const total = (food?.price || 0) * order.quantity;
                  return (
                    <tr key={order._id} className="border-b border-gray-50 last:border-0 hover:bg-orange-50/20 transition-colors">
                      <td className="px-6 py-4 text-gray-400 font-['Gilroy_Medium']">{idx + 1}</td>
                      <td className="px-6 py-4 font-['Gilroy_Bold'] text-gray-900">{food?.name || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-['Gilroy_Bold']">{food?.category || '—'}</span>
                      </td>
                      <td className="px-6 py-4 font-['Gilroy_Medium'] text-gray-700">LKR {(food?.price || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 font-['Gilroy_Bold'] text-gray-900">{order.quantity}</td>
                      <td className="px-6 py-4 font-['Gilroy_Bold'] text-orange-600">LKR {total.toFixed(2)}</td>
                      <td className="px-6 py-4 font-['Gilroy_Medium'] text-gray-400 text-xs">
                        {new Date(order.date).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default OrdersPage;
