import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, Search, UtensilsCrossed, CheckCircle, Star, AlertCircle, Clock3, Sparkles, MapPin, ChefHat } from 'lucide-react';
import { canteenAPI, cartAPI, queueAPI } from '../../services/api';
import ReviewModal from '../../Components/ReviewModal';
import ReviewListModal from '../../Components/ReviewListModal';
import { toast } from 'react-toastify';
import { MessageCircle } from 'lucide-react';

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
  const [reviewModal, setReviewModal] = useState({ isOpen: false, targetId: null, targetName: '', mode: 'ratings' });
  const [viewReviewsModal, setViewReviewsModal] = useState({ isOpen: false, targetId: null, targetName: '', mode: 'ratings' });
  const [crossCanteenPrompt, setCrossCanteenPrompt] = useState({ isOpen: false, item: null });
  const [switchingCart, setSwitchingCart] = useState(false);

  // Fetch canteen info + menu + recommendations
  useEffect(() => {
    const handleOpenSubmit = (e) => {
      if (e.detail.type === 'food') {
        setReviewModal({
          isOpen: true,
          targetId: e.detail.targetId,
          targetName: e.detail.targetName,
          mode: e.detail.mode || 'ratings'
        });
      }
    };
    window.addEventListener('openReviewSubmit', handleOpenSubmit);
    return () => window.removeEventListener('openReviewSubmit', handleOpenSubmit);
  }, []);

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

    window.refreshMenu = fetch;
    return () => { delete window.refreshMenu; };
  }, [canteenId, navigate]);

  const categories = ['', ...new Set(menuItems.map(i => i.category).filter(Boolean))];

  const filtered = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || item.category === selectedCategory;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    // 1. Availability first
    if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
    // 2. High ratings (4.0+) first
    const aTop = (a.ratings || 0) >= 4.0;
    const bTop = (b.ratings || 0) >= 4.0;
    if (aTop && !bTop) return -1;
    if (!aTop && bTop) return 1;
    // 3. Then by rating descending
    return (b.ratings || 0) - (a.ratings || 0);
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

  const formatLKR = (value) => `LKR ${Number(value || 0).toLocaleString()}`;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 md:px-6">
      <button onClick={() => navigate('/dashboard/canteens')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors">
        <ArrowLeft size={16} /> All Canteens
      </button>

      <div className="relative overflow-hidden rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 md:p-8 mb-6 shadow-sm">
        <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-orange-100/60 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-amber-100/70 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-orange-100 text-orange-700 text-xs font-extrabold uppercase tracking-wider">
              <ChefHat size={13} /> Student Menu
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3">{canteen?.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} className="text-orange-500" />
                {canteen?.location || 'Campus canteen'}
              </span>
              {queueStatus?.estimatedWaitTime > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 border border-orange-100 text-orange-700 font-semibold">
                  <Clock3 size={14} /> ~{queueStatus.estimatedWaitTime} min wait
                </span>
              )}
            </div>
          </div>

          {cartCount > 0 && (
            <button
              onClick={() => navigate('/dashboard/cart')}
              className="relative inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-xl font-extrabold text-sm transition-colors self-start"
            >
              <ShoppingCart size={16} />
              Open Cart
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 bg-gray-900 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {queueStatus?.surgeAlert && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
          <div className="text-red-500 mt-0.5">🔥</div>
          <div>
            <h3 className="font-extrabold text-red-800 text-sm mb-0.5">Surge Alert: High Demand</h3>
            <p className="text-red-600 text-xs">{queueStatus.surgeReason || 'This canteen is currently very busy. Order early to avoid long wait times!'}</p>
          </div>
        </div>
      )}

      {recommendedSlots.length > 0 && (
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
          <p className="text-xs uppercase tracking-widest text-emerald-700 font-extrabold mb-2 inline-flex items-center gap-1.5">
            <Sparkles size={13} /> Recommended Pickup Times
          </p>
          <div className="flex flex-wrap gap-2">
            {recommendedSlots.slice(0, 5).map((slot, idx) => {
              const active = selectedSlot === slot.time;
              return (
                <button
                  type="button"
                  key={`${slot.time}-${idx}`}
                  onClick={() => setSelectedSlot(slot.time)}
                  className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-colors ${active ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}
                >
                  {slot.timeLabel || new Date(slot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 mb-6 shadow-sm">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search dishes, drinks, combos..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {categories.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${selectedCategory === cat
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {cat === '' ? 'All' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <UtensilsCrossed size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No items found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => {
            const qty = cart[item._id] || 0;
            const isAdding = addingId === item._id;
            const unavailable = item.isAvailable === false;
            return (
              <div key={item._id} className={`group relative bg-white border rounded-[24px] overflow-hidden transition-all flex flex-col ${
                item.ratings >= 4.0 
                  ? 'border-orange-200 shadow-[0_0_20px_rgba(249,115,22,0.1)] ring-1 ring-orange-100' 
                  : 'border-gray-100 shadow-sm hover:shadow-xl hover:shadow-orange-100/30'
              }`}>
                <div className="relative h-44 bg-gradient-to-br from-orange-50 to-amber-50 shrink-0">
                  {/* Side Rating Badge */}
                  <div className="absolute top-3 -left-1 z-10">
                    <div className="bg-white px-2 py-1 rounded-r-lg shadow-md border-y border-r border-orange-100 flex items-center gap-1">
                      <Star size={10} className="fill-orange-500 text-orange-500" />
                      <span className="text-[10px] font-black text-gray-900">{Number(item.ratings || 0).toFixed(1)}</span>
                    </div>
                  </div>

                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed size={30} className="text-orange-200" />
                    </div>
                  )}
                  {item.category && (
                    <span className="absolute top-3 left-14 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[10px] font-extrabold text-gray-700 uppercase tracking-wide border border-gray-100">
                      {item.category}
                    </span>
                  )}
                  {unavailable && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gray-900/85 text-white text-[10px] font-extrabold uppercase tracking-wide">
                      Unavailable
                    </span>
                  )}
                  {item.ratings >= 4.0 && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-orange-600 text-white text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 shadow-lg border border-orange-500">
                      <Sparkles size={10} /> Top Rated
                    </span>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-extrabold text-gray-900 leading-tight line-clamp-2">{item.name}</h3>
                  </div>

                  {item.description && <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2.25rem] leading-relaxed">{item.description}</p>}

                    <div className="flex items-center justify-between mb-4 mt-auto">
                      <p className="font-extrabold text-lg text-orange-700">{formatLKR(item.price)}</p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setViewReviewsModal({ isOpen: true, targetId: item._id, targetName: item.name, mode: 'ratings' })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-100"
                        >
                          <Star size={10} fill="currentColor" /> Rate
                        </button>
                        <button
                          onClick={() => setViewReviewsModal({ isOpen: true, targetId: item._id, targetName: item.name, mode: 'reviews' })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100"
                        >
                          <MessageCircle size={10} /> Reviews
                        </button>
                      </div>
                    </div>

                  {qty === 0 ? (
                    <button
                      onClick={() => handleAdd(item)}
                      disabled={isAdding || unavailable}
                      className="w-full h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white inline-flex items-center justify-center gap-2 font-extrabold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAdding ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus size={16} />
                      )}
                      Add to Cart
                    </button>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 px-2 py-1.5">
                      <button
                        onClick={() => handleRemove(item)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Minus size={14} className="text-gray-600" />
                      </button>
                      <span className="w-8 text-center font-extrabold text-gray-900">{qty}</span>
                      <button
                        onClick={() => handleAdd(item)}
                        className="w-8 h-8 rounded-lg bg-orange-600 hover:bg-orange-700 flex items-center justify-center text-white transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
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
        mode={reviewModal.mode}
        onReviewSubmitted={() => {
          if (window.refreshMenu) window.refreshMenu();
        }}
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
      <ReviewListModal
        isOpen={viewReviewsModal.isOpen}
        onClose={() => setViewReviewsModal({ ...viewReviewsModal, isOpen: false })}
        targetId={viewReviewsModal.targetId}
        targetName={viewReviewsModal.targetName}
        type="food"
        initialMode={viewReviewsModal.mode}
      />
    </div>
  );
};

export default CanteenMenuPage;
