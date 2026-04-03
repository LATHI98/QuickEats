import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, Search, UtensilsCrossed, CheckCircle, Star, AlertCircle } from 'lucide-react';
import { canteenAPI, cartAPI, queueAPI } from '../../services/api';
import ReviewModal from '../../Components/ReviewModal';
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
  const [recommendedSlots, setRecommendedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, targetId: null, targetName: '' });
  const [crossCanteenPrompt, setCrossCanteenPrompt] = useState({ isOpen: false, item: null });
  const [switchingCart, setSwitchingCart] = useState(false);

  // Fetch canteen info + menu + recommendations
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [canteenRes, menuRes, queueRes, recommendRes] = await Promise.all([
          canteenAPI.getById(canteenId),
          canteenAPI.getMenu(canteenId),
          queueAPI.getStatus(canteenId).catch(() => ({ data: { data: null } })),
          queueAPI.getRecommendedSlots(canteenId).catch(() => ({ data: { data: [] } })),
        ]);
        setCanteen(canteenRes.data.data);
        const menuList = Array.isArray(menuRes.data)
          ? menuRes.data
          : Array.isArray(menuRes.data?.data)
            ? menuRes.data.data
            : [];
        setMenuItems(menuList);
        if (queueRes.data.data) {
          setQueueStatus(queueRes.data.data);
        }
        if (recommendRes.data.data?.length > 0) {
          setRecommendedSlots(recommendRes.data.data);
          // Auto-select ASAP by default
          setSelectedSlot(recommendRes.data.data[0].time);
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
    if (item.isAvailable === false) {
      toast.warn('This item is currently unavailable');
      return;
    }

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
      const message = err?.response?.data?.message || 'Failed to add item';
      const code = err?.response?.data?.code;

      if (code === 'CROSS_CANTEEN_CART_CONFLICT' || message.includes('another canteen')) {
        setCrossCanteenPrompt({ isOpen: true, item });
        return;
      }

      toast.error(message);
    } finally {
      setAddingId(null);
    }
  }, [cart]);

  const handleConfirmSwitchCart = async () => {
    const pendingItem = crossCanteenPrompt.item;
    if (!pendingItem) {
      setCrossCanteenPrompt({ isOpen: false, item: null });
      return;
    }

    setSwitchingCart(true);
    try {
      await cartAPI.clearCart();
      await cartAPI.addItem(pendingItem._id, 1);
      setCart({ [pendingItem._id]: 1 });
      toast.success(`${pendingItem.name} added to your new cart`);
      setCrossCanteenPrompt({ isOpen: false, item: null });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not switch cart and add this item');
    } finally {
      setSwitchingCart(false);
    }
  };

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
          <h1 className="text-3xl font-extrabold text-gray-900">{canteen?.name}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-gray-400 text-sm">{canteen?.location}</p>
            {queueStatus?.estimatedWaitTime > 0 && (
              <span className="bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full text-xs font-medium border border-orange-100 flex items-center gap-1">
                ⏱ ~{queueStatus.estimatedWaitTime} min wait
              </span>
            )}
          </div>
        </div>
        {cartCount > 0 && (
          <button
            onClick={() => navigate('/dashboard/cart')}
            className="relative flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-extrabold text-sm transition-colors"
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
            <h3 className="font-extrabold text-red-800 text-sm mb-0.5">Surge Alert: High Demand</h3>
            <p className="text-red-600 text-xs">{queueStatus.surgeReason || 'This canteen is currently very busy. Order early to avoid long wait times!'}</p>
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
          <p className="text-gray-400 font-medium">No items found</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(item => {
            const qty = cart[item._id] || 0;
            const isAdding = addingId === item._id;
            return (
              <div key={item._id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                {/* Image */}
                {item.image ? (
                  <div className="w-20 h-20 shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                  </div>
                ) : (
                  <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-xl flex items-center justify-center">
                    <UtensilsCrossed size={24} className="text-gray-300" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-gray-900 truncate">{item.name}</p>
                      {qty > 0 && <CheckCircle size={14} className="text-orange-500 shrink-0" />}
                    </div>
                    {item.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
                    {item.category && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-medium">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="font-extrabold text-orange-600 text-sm">LKR {item.price?.toLocaleString()}</p>
                    <button
                      onClick={() => setReviewModal({ isOpen: true, targetId: item._id, targetName: item.name })}
                      className="flex flex-col items-center justify-center px-2 py-1 rounded-xl text-[9px] font-['Gilroy_Heavy'] uppercase tracking-widest text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all group/rate"
                    >
                      <Star size={11} fill="currentColor" className="mb-0.5 group-hover/rate:scale-110 transition-transform" />
                      <span>Rate</span>
                    </button>
                  </div>
                </div>

                {qty === 0 ? (
                  <button
                    onClick={() => handleAdd(item)}
                    disabled={isAdding || item.isAvailable === false}
                    className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
                    <span className="w-6 text-center font-extrabold text-gray-900 text-sm">{qty}</span>
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
            className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-8 py-3.5 rounded-2xl shadow-2xl font-extrabold text-sm transition-colors"
          >
            <ShoppingCart size={16} />
            View Cart · {cartCount} item{cartCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
        targetId={reviewModal.targetId}
        targetName={reviewModal.targetName}
        type="food"
      />

      {crossCanteenPrompt.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-gray-100 shadow-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-0.5 w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">You already have items from another canteen</h3>
                <p className="text-sm text-gray-500 mt-1">
                  If you continue, we will start a new cart for <span className="font-extrabold text-gray-700">{canteen?.name || 'this canteen'}</span> and remove the current cart items.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 mb-5">
              <p className="text-xs uppercase tracking-widest text-orange-500 font-extrabold">Selected item</p>
              <p className="mt-1 text-sm font-extrabold text-gray-900">{crossCanteenPrompt.item?.name}</p>
              <p className="text-xs text-gray-500 mt-1">Choose how you want to continue with your orders.</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={handleConfirmSwitchCart}
                disabled={switchingCart}
                className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white py-3 text-sm font-extrabold transition-colors"
              >
                {switchingCart ? 'Switching cart...' : 'Yes, start a new order for this canteen'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCrossCanteenPrompt({ isOpen: false, item: null });
                  navigate('/dashboard/cart');
                }}
                className="w-full rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 text-sm font-extrabold transition-colors"
              >
                Keep current cart and view it
              </button>

              <button
                type="button"
                onClick={() => setCrossCanteenPrompt({ isOpen: false, item: null })}
                className="w-full rounded-xl text-gray-500 hover:text-gray-700 py-2 text-xs font-extrabold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanteenMenuPage;
