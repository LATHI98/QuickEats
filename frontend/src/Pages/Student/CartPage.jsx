import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingCart, Minus, Plus, Trash2, ArrowLeft, ClipboardList, Lock, Zap, Clock, X } from 'lucide-react';
import { cartAPI, orderAPI, groupSessionAPI, queueAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [cartGroups, setCartGroups] = useState([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState('');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [recommendedSlots, setRecommendedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [pickupMode, setPickupMode] = useState('scheduled'); // 'scheduled' | 'instant'
  const [instantPickupConfirmed, setInstantPickupConfirmed] = useState(false);
  const [memberStatuses, setMemberStatuses] = useState([]);
  const [showGroupChoice, setShowGroupChoice] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [cartRes, sessionRes] = await Promise.all([
        cartAPI.getCart(),
        groupSessionAPI.getActiveSession().catch(() => ({ data: { data: null } }))
      ]);

      let activeSession = null;
      let currentCart = null;

      if (sessionRes.data?.data) {
        activeSession = sessionRes.data.data;
        setSession(activeSession);
      } else {
        setSession(null);
      }

      const currentUser = JSON.parse(localStorage.getItem('user'));
      const isCreator = activeSession && activeSession.creator._id === currentUser.id;

      if (activeSession && isCreator && activeSession.paymentMode === 'pay_together') {
        const mergedRes = await groupSessionAPI.getMergedCart(activeSession._id);
        currentCart = mergedRes.data?.data || { items: [], totalPrice: 0 };
        currentCart.canteen = activeSession.canteen;
      } else {
        currentCart = cartRes.data?.data || { items: [], totalPrice: 0 };
      }

      const groupsFromApi = Array.isArray(currentCart?.groups)
        ? currentCart.groups
        : (currentCart?.items?.length ? [{
          canteen: currentCart.canteen || null,
          items: currentCart.items,
          totalPrice: currentCart.totalPrice || 0,
        }] : []);

      setCartGroups(groupsFromApi);

      const selectedStillExists = groupsFromApi.some((g) => (g.canteen?._id || g.canteen) === selectedCanteenId);
      const nextSelectedCanteenId = selectedStillExists
        ? selectedCanteenId
        : (groupsFromApi[0]?.canteen?._id || groupsFromApi[0]?.canteen || '');

      setSelectedCanteenId(nextSelectedCanteenId || '');

      const activeGroup = groupsFromApi.find((g) => (g.canteen?._id || g.canteen) === (nextSelectedCanteenId || '')) || groupsFromApi[0] || null;
      setCart(activeGroup);

      if (activeSession && isCreator && activeSession.paymentMode === 'pay_separately') {
        const statusRes = await groupSessionAPI.getMemberStatus(activeSession._id).catch(() => ({ data: { data: [] } }));
        setMemberStatuses(statusRes.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load cart data');
    } finally {
      setLoading(false);
    }
  }, [selectedCanteenId]);

  useEffect(() => { 
    fetchData(); 
    
    // Polling for group members readiness
    const interval = setInterval(() => {
        fetchData();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (!cartGroups.length) {
      setCart(null);
      return;
    }

    const activeGroup = cartGroups.find((g) => (g.canteen?._id || g.canteen) === selectedCanteenId) || cartGroups[0];
    setCart(activeGroup || null);
  }, [cartGroups, selectedCanteenId]);

  useEffect(() => {
    const loadSlotsForSelectedCanteen = async () => {
      if (!cart?.canteen) {
        setRecommendedSlots([]);
        setSelectedSlot(null);
        return;
      }

      const canteenId = cart.canteen._id || cart.canteen;
      const slotsRes = await queueAPI.getRecommendedSlots(canteenId).catch(() => ({ data: { data: [] } }));
      const slots = slotsRes.data?.data || [];
      setRecommendedSlots(slots);

      if (!slots.length) {
        setSelectedSlot(null);
        return;
      }

      const stillValid = slots.some((slot) => slot.time === selectedSlot);
      if (!stillValid) {
        setSelectedSlot(slots[1]?.time || slots[0]?.time || null);
      }
    };

    loadSlotsForSelectedCanteen();
  }, [cart?.canteen, selectedSlot]);

  const handleUpdate = async (menuItemId, newQty) => {
    setUpdatingId(menuItemId);
    try {
      if (newQty <= 0) {
        await cartAPI.removeItem(menuItemId);
      } else {
        await cartAPI.updateItem(menuItemId, newQty);
      }
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear your entire cart?')) return;
    try {
      await cartAPI.clearCart();
      setCart(null);
      toast.success('Cart cleared');
    } catch {
      toast.error('Failed to clear cart');
    }
  };

  const handlePlaceOrder = async (isBulk = false) => {
    const selectedSlotDate = selectedSlot ? new Date(selectedSlot) : null;
    const slotValid = !!selectedSlotDate && !Number.isNaN(selectedSlotDate.getTime()) && selectedSlotDate.getTime() >= (Date.now() - 60000);

    if (!cart?.items?.length) {
      toast.error('Your cart is empty');
      return;
    }
    if (!total || total <= 0) {
      toast.error('Invalid cart total. Refresh and try again.');
      return;
    }
    if (pickupMode === 'scheduled' && !slotValid) {
      toast.error('Select a valid pickup slot before placing the order');
      return;
    }
    if (pickupMode === 'instant' && !instantPickupConfirmed) {
      toast.error('Confirm you are ready for instant pickup at the counter');
      return;
    }

    setPlacing(true);
    try {
      const payload = {
        canteenId: cart.canteen?._id || cart.canteen,
        items: cart.items.map((it) => ({
          menuItem: it.menuItem._id || it.menuItem,
          name: it.name,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
        })),
        preferredSlotTime: pickupMode === 'scheduled' ? selectedSlot : null,
        instantPickup: pickupMode === 'instant',
      };
      const isCreator = session && session.creator._id === JSON.parse(localStorage.getItem('user')).id;
      const isPaySeparately = session && session.paymentMode === 'pay_separately';
      
      if (session) {
        payload.groupSessionId = session._id;
        if (isCreator && isPaySeparately && isBulk) {
           payload.submitGroup = true;
        }
      }

      const res = await orderAPI.placeOrder(payload);
      const order = res.data.data;
      toast.success(`Order placed! Queue #${order.queueNumber}${pickupMode === 'instant' ? ' · Instant pickup mode' : ''}`);
      navigate(`/dashboard/payment/${order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const items = cart?.items || [];
  const total = cart?.totalPrice || 0;
  const isEmpty = items.length === 0;
  const selectedSlotDate = selectedSlot ? new Date(selectedSlot) : null;
  const hasValidSlot = pickupMode === 'instant' || (!!selectedSlotDate && !Number.isNaN(selectedSlotDate.getTime()) && selectedSlotDate.getTime() >= (Date.now() - 60000));
  const canPlaceOrder = !placing && !isEmpty && total > 0 && (pickupMode === 'scheduled' ? hasValidSlot : instantPickupConfirmed);

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">My Cart</h1>
        {!isEmpty && (
          <button
            onClick={handleClear}
            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
          >
            <Trash2 size={13} /> Clear all
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-orange-50 rounded-[30px] flex items-center justify-center mx-auto mb-4 text-orange-300">
            <ShoppingCart size={40} />
          </div>
          <p className="text-gray-900 font-extrabold text-lg mb-1">Your cart is empty</p>
          <p className="text-gray-400 text-sm mb-6 font-medium">
            Browse canteens and add items to get started
          </p>
          <button
            onClick={() => navigate('/dashboard/canteens')}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-extrabold transition-colors"
          >
            Browse Canteens
          </button>
        </div>
      ) : (
        <>
          {cartGroups.length > 1 && (
            <div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50 p-3">
              <p className="text-[11px] uppercase tracking-wider text-orange-500 font-extrabold mb-2">Canteens in your cart</p>
              <div className="flex flex-wrap gap-2">
                {cartGroups.map((group) => {
                  const groupCanteenId = group.canteen?._id || group.canteen;
                  const isActive = groupCanteenId === selectedCanteenId;
                  return (
                    <button
                      key={groupCanteenId || group.canteen?.name || 'unknown-canteen'}
                      type="button"
                      onClick={() => setSelectedCanteenId(groupCanteenId || '')}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-colors ${isActive
                        ? 'bg-orange-600 text-white'
                        : 'bg-white border border-orange-100 text-orange-700 hover:bg-orange-100'
                        }`}
                    >
                      {(group.canteen?.name || 'Canteen')} · {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Canteen name */}
          {cart?.canteen?.name && (
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
              <ClipboardList size={14} />
              <span>From <span className="font-extrabold text-gray-700">{cart.canteen.name}</span></span>
            </div>
          )}

          {session && (
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-start gap-3 mb-4">
                <Users size={20} className="text-blue-500 mt-0.5" />
                <div>
                  <p className="text-blue-900 font-extrabold">Part of Group Order</p>
                  <p className="text-blue-600 text-xs mt-0.5">Share Code: {session.shareCode}</p>
                </div>
              </div>
              
              {/* Member Status List for Creator in split pay */}
              {session.paymentMode === 'pay_separately' && session.creator._id === JSON.parse(localStorage.getItem('user')).id && memberStatuses.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-blue-400 font-extrabold mb-1">Friends' Readiness</p>
                  <div className="grid grid-cols-2 gap-2">
                    {memberStatuses.map(m => (
                      <div key={m._id} className="flex items-center gap-2 bg-white/50 border border-blue-100/50 rounded-xl px-2 py-1.5">
                        <div className={`w-2 h-2 rounded-full ${m.hasItems ? 'bg-green-400' : 'bg-gray-300'}`} />
                        <span className="text-[11px] font-medium text-blue-800 truncate">{m.name}</span>
                        {m.hasItems && <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded-md ml-auto">Ready</span>}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-blue-500 mt-2 italic">Creator Tip: You can place orders for everyone shown as 'Ready' above.</p>
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div className="space-y-3 mb-6">
            {items.map(item => {
              const isUpdating = updatingId === item.menuItem?._id || updatingId === item.menuItem;
              const itemId = item.menuItem?._id || item.menuItem;
              return (
                <div key={itemId} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-extrabold text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-orange-600 font-medium mt-0.5">
                      LKR {item.unitPrice?.toLocaleString()} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdate(itemId, item.quantity - 1)}
                      disabled={isUpdating}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      {item.quantity === 1 ? <Trash2 size={13} className="text-red-400" /> : <Minus size={14} className="text-gray-600" />}
                    </button>
                    <span className="w-6 text-center font-extrabold text-gray-900 text-sm">
                      {isUpdating ? (
                        <span className="inline-block w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                      ) : item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdate(itemId, item.quantity + 1)}
                      disabled={isUpdating}
                      className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white disabled:opacity-40 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pickup Mode Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-orange-500" />
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Pickup Mode</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setPickupMode('scheduled');
                  setInstantPickupConfirmed(false);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${pickupMode === 'scheduled'
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={15} className="text-gray-500" />
                  <span className="font-extrabold text-gray-900">Scheduled</span>
                </div>
                <p className="text-xs text-gray-500">Join queue with recommended pickup timing</p>
              </button>

              <button
                onClick={() => {
                  setPickupMode('instant');
                  setSelectedSlot(null);
                  setInstantPickupConfirmed(false);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${pickupMode === 'instant'
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={15} className="text-orange-500" />
                  <span className="font-extrabold text-gray-900">Instant Pickup</span>
                </div>
                <p className="text-xs text-gray-500">Real-time payment and pickup at counter</p>
              </button>
            </div>

            {pickupMode === 'instant' && (
              <label className="mt-3 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={instantPickupConfirmed}
                  onChange={(e) => setInstantPickupConfirmed(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-xs text-orange-700">
                  I am at the canteen counter and ready to complete payment and pickup immediately.
                </span>
              </label>
            )}
          </div>

          {/* Pickup Vibe Selection */}
          {pickupMode === 'scheduled' && recommendedSlots.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-orange-500" />
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Choose your Pickup Vibe</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {recommendedSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.time;
                  return (
                    <button
                      key={slot.type}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${isSelected
                        ? 'border-orange-500 bg-orange-50 shadow-md ring-1 ring-orange-200'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900">{slot.label}</span>
                          {slot.type === 'Optimized' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-bold uppercase">Best</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{slot.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-gray-900">
                          {new Date(slot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-sm">
                          <Plus size={12} className="rotate-45" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Total + Place Order */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
              <span className="font-extrabold text-lg text-gray-900">
                LKR {total.toLocaleString()}
              </span>
            </div>

            {(() => {
              if (!session) {
                return (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={!canPlaceOrder}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-extrabold transition-colors"
                  >
                    {placing ? 'Placing Order...' : `Place Order · LKR ${total.toLocaleString()}`}
                  </button>
                );
              }

              if (session.status === 'open') {
                return (
                  <button disabled className="w-full bg-gray-200 text-gray-500 py-3.5 rounded-xl font-extrabold flex justify-center items-center gap-2">
                    <Lock size={16} /> Lock Group Session First
                  </button>
                );
              }

              const isCreator = session.creator._id === JSON.parse(localStorage.getItem('user')).id;

              if (session.paymentMode === 'pay_together' && !isCreator) {
                return (
                  <button disabled className="w-full bg-gray-200 text-gray-500 py-3.5 rounded-xl font-extrabold text-sm">
                    Waiting for Creator to Pay
                  </button>
                );
              }

              if (isCreator) {
                return (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Group Payment Mode</p>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await groupSessionAPI.editSession(session._id, { paymentMode: 'pay_separately' });
                              setSession({ ...session, paymentMode: 'pay_separately' });
                              toast.success('Updated to Pay Separately');
                            } catch (err) { toast.error('Failed to update mode'); }
                          }}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${session.paymentMode === 'pay_separately' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                        >
                          Pay Separately
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await groupSessionAPI.editSession(session._id, { paymentMode: 'pay_together' });
                              setSession({ ...session, paymentMode: 'pay_together' });
                              toast.success('Updated to Pay Together');
                            } catch (err) { toast.error('Failed to update mode'); }
                          }}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${session.paymentMode === 'pay_together' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                        >
                          Pay for Everyone
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (session.paymentMode === 'pay_separately' && session.creator._id === JSON.parse(localStorage.getItem('user')).id) {
                          setShowGroupChoice(true);
                        } else {
                          handlePlaceOrder(false);
                        }
                      }}
                      disabled={!canPlaceOrder}
                      className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-extrabold transition-all shadow-lg shadow-orange-100"
                    >
                      {placing ? 'Placing...' : (
                        session.paymentMode === 'pay_together' ? 'Pay for Everyone & Order' : 'Order'
                      )}
                    </button>
                    {session.paymentMode === 'pay_separately' && (
                       <p className="text-[10px] text-gray-400 text-center mt-2 px-4">
                         As creator, you can choose to order for the entire group or just yourself.
                       </p>
                    )}
                  </div>
                );
              }

              return (
                <button
                  onClick={handlePlaceOrder}
                  disabled={!canPlaceOrder}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-extrabold transition-colors"
                >
                  {placing ? 'Placing Order...' : 'Place My Order'}
                </button>
              );
            })()}

            <p className="text-xs text-gray-400 text-center mt-3">
              {pickupMode === 'instant'
                ? 'You will pay now and can complete pickup in real-time at the counter'
                : "You'll choose payment method on the next screen"}
            </p>
            {!canPlaceOrder && (
              <p className="text-xs text-red-500 text-center mt-2">
                {pickupMode === 'instant'
                  ? 'Confirm instant pickup readiness to continue.'
                  : 'Select a valid pickup slot to continue.'}
              </p>
            )}
          </div>
        </>
      )}
      {/* Group Order Choice Modal */}
      {showGroupChoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-orange-500 p-6 text-white">
              <div className="flex justify-between items-center mb-2">
                <Users size={24} />
                <button onClick={() => setShowGroupChoice(false)}>
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-xl font-extrabold">Place Group Order?</h3>
              <p className="text-orange-100 text-sm mt-1">Choose how you want to submit.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  setShowGroupChoice(false);
                  handlePlaceOrder(true);
                }}
                className="w-full p-4 border-2 border-orange-500 rounded-2xl text-left hover:bg-orange-50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-orange-600">Submit for Everyone</span>
                  <div className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded-full">Recommended</div>
                </div>
                <p className="text-xs text-gray-500">Creates separate orders for all 'Ready' members simultaneously. Everyone pays for their own food.</p>
              </button>

              <button
                onClick={() => {
                  setShowGroupChoice(false);
                  handlePlaceOrder(false);
                }}
                className="w-full p-4 border border-gray-100 rounded-2xl text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-extrabold text-gray-700 block mb-1">Place Only My Order</span>
                <p className="text-xs text-gray-500">Only your items will be submitted. Group members will remain in session.</p>
              </button>

              <button
                onClick={() => setShowGroupChoice(false)}
                className="w-full text-center text-sm text-gray-400 py-2 hover:text-gray-600 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
