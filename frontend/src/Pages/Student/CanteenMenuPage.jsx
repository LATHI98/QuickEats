import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, Search, UtensilsCrossed, CheckCircle } from 'lucide-react';
import { canteenAPI, cartAPI, queueAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CanteenMenuPage = () => {
  const { canteenId } = useParams();
  const navigate = useNavigate();

  const [canteen, setCanteen] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState({}); // { menuItemId: quantity }
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [addingId, setAddingId] = useState(null);

  // Fetch canteen info + menu
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [canteenRes, menuRes, queueRes] = await Promise.all([
          canteenAPI.getById(canteenId),
          canteenAPI.getMenu(canteenId),
          queueAPI.getStatus(canteenId).catch(() => ({ data: { data: null } })),
        ]);
        setCanteen(canteenRes.data.data);
        setMenuItems(menuRes.data.data || []);
        if (queueRes.data.data) {
          setQueueStatus(queueRes.data.data);
        }
      } catch {
        toast.error('Failed to load menu');
        navigate('/dashboard/canteens');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [canteenId, navigate]);

  const categories = ['', ...new Set(menuItems.map(i => i.category).filter(Boolean))];

  const filtered = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleAdd = useCallback(async (item) => {
    const current = cart[item._id] || 0;
    const newQty = current + 1;
    setAddingId(item._id);
    try {
      if (current === 0) {
        await cartAPI.addItem(item._id, 1);
        toast.success(`${item.name} added to cart`);
      } else {
        await cartAPI.updateItem(item._id, newQty);
      }
      setCart(prev => ({ ...prev, [item._id]: newQty }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    } finally {
      setAddingId(null);
    }
  }, [cart]);

  const handleRemove = useCallback(async (item) => {
    const current = cart[item._id] || 0;
    if (current <= 0) return;
    const newQty = current - 1;
    try {
      if (newQty === 0) {
        await cartAPI.removeItem(item._id);
        setCart(prev => { const c = { ...prev }; delete c[item._id]; return c; });
      } else {
        await cartAPI.updateItem(item._id, newQty);
        setCart(prev => ({ ...prev, [item._id]: newQty }));
      }
    } catch {
      toast.error('Failed to update cart');
    }
  }, [cart]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Back + header */}
      <button onClick={() => navigate('/dashboard/canteens')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-5 transition-colors">
        <ArrowLeft size={16} /> All Canteens
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-['Gilroy_Heavy'] text-gray-900">{canteen?.name}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-gray-400 text-sm">{canteen?.location}</p>
            {queueStatus?.estimatedWaitTime > 0 && (
              <span className="bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full text-xs font-['Gilroy_Medium'] border border-orange-100 flex items-center gap-1">
                ⏱ ~{queueStatus.estimatedWaitTime} min wait
              </span>
            )}
          </div>
        </div>
        {cartCount > 0 && (
          <button
            onClick={() => navigate('/dashboard/cart')}
            className="relative flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-['Gilroy_Heavy'] text-sm transition-colors"
          >
            <ShoppingCart size={16} />
            View Cart
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
              {cartCount}
            </span>
          </button>
        )}
      </div>

      {/* Surge Alert Banner */}
      {queueStatus?.surgeAlert && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
          <div className="text-red-500 mt-0.5">🔥</div>
          <div>
            <h3 className="font-['Gilroy_Heavy'] text-red-800 text-sm mb-0.5">Surge Alert: High Demand</h3>
            <p className="text-red-600 text-xs">This canteen is currently very busy. Order early to avoid long wait times!</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search menu..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      {/* Category filters */}
      {categories.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {cat === '' ? 'All' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Menu items */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <UtensilsCrossed size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-['Gilroy_Medium']">No items found</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(item => {
            const qty = cart[item._id] || 0;
            const isAdding = addingId === item._id;
            return (
              <div key={item._id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <p className="font-['Gilroy_Heavy'] text-gray-900 truncate">{item.name}</p>
                    {qty > 0 && <CheckCircle size={14} className="text-orange-500 shrink-0" />}
                  </div>
                  {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
                  {item.category && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-medium">
                      {item.category}
                    </span>
                  )}
                  <p className="font-['Gilroy_Heavy'] text-orange-600 mt-1 text-sm">LKR {item.price?.toLocaleString()}</p>
                </div>

                {qty === 0 ? (
                  <button
                    onClick={() => handleAdd(item)}
                    disabled={isAdding}
                    className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 shrink-0"
                  >
                    {isAdding ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRemove(item)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus size={14} className="text-gray-600" />
                    </button>
                    <span className="w-6 text-center font-['Gilroy_Heavy'] text-gray-900 text-sm">{qty}</span>
                    <button
                      onClick={() => handleAdd(item)}
                      className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => navigate('/dashboard/cart')}
            className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-8 py-3.5 rounded-2xl shadow-2xl font-['Gilroy_Heavy'] text-sm transition-colors"
          >
            <ShoppingCart size={16} />
            View Cart · {cartCount} item{cartCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
};

export default CanteenMenuPage;
