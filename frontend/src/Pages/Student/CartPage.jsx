import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingCart, Minus, Plus, Trash2, ArrowLeft, ClipboardList, Lock } from 'lucide-react';
import { cartAPI, orderAPI, groupSessionAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [cartRes, sessionRes] = await Promise.all([
        cartAPI.getCart(),
        groupSessionAPI.getActiveSession().catch(() => ({ data: { data: null } }))
      ]);
      setCart(cartRes.data.data);
      if (sessionRes.data?.data) {
        setSession(sessionRes.data.data);
      }
    } catch {
      toast.error('Failed to load cart data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const payload = session ? { groupSessionId: session._id } : undefined;
      const res = await orderAPI.placeOrder(payload);
      const order = res.data.data;
      toast.success(`Order placed! Queue #${order.queueNumber}`);
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
        <h1 className="text-3xl font-['Gilroy_Heavy'] text-gray-900">My Cart</h1>
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
          <p className="text-gray-900 font-['Gilroy_Heavy'] text-lg mb-1">Your cart is empty</p>
          <p className="text-gray-400 text-sm mb-6 font-['Gilroy_Medium']">
            Browse canteens and add items to get started
          </p>
          <button
            onClick={() => navigate('/dashboard/canteens')}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-['Gilroy_Heavy'] transition-colors"
          >
            Browse Canteens
          </button>
        </div>
      ) : (
        <>
          {/* Canteen name */}
          {cart?.canteen?.name && (
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
              <ClipboardList size={14} />
              <span>From <span className="font-['Gilroy_Heavy'] text-gray-700">{cart.canteen.name}</span></span>
            </div>
          )}

          {/* Group Session Alert */}
          {session && (
            <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
              <Users size={18} className="text-blue-500 mt-0.5" />
              <div>
                <p className="text-blue-800 text-sm font-['Gilroy_Heavy']">Part of Group Order</p>
                <p className="text-blue-600 text-xs mt-0.5">Share Code: {session.shareCode}</p>
              </div>
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
                    <p className="font-['Gilroy_Heavy'] text-gray-900 truncate">{item.name}</p>
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
                    <span className="w-6 text-center font-['Gilroy_Heavy'] text-gray-900 text-sm">
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

          {/* Total + Place Order */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
              <span className="font-['Gilroy_Heavy'] text-lg text-gray-900">
                LKR {total.toLocaleString()}
              </span>
            </div>

            {(() => {
              if (!session) {
                return (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-['Gilroy_Heavy'] transition-colors"
                  >
                    {placing ? 'Placing Order...' : `Place Order · LKR ${total.toLocaleString()}`}
                  </button>
                );
              }

              // Session logic
              if (session.status === 'open') {
                return (
                  <button disabled className="w-full bg-gray-200 text-gray-500 py-3.5 rounded-xl font-['Gilroy_Heavy'] flex justify-center items-center gap-2">
                    <Lock size={16} /> Lock Group Session First
                  </button>
                );
              }

              const isCreator = session.creator._id === JSON.parse(localStorage.getItem('user')).id;
              if (session.paymentMode === 'pay_together' && !isCreator) {
                return (
                  <button disabled className="w-full bg-gray-200 text-gray-500 py-3.5 rounded-xl font-['Gilroy_Heavy'] text-sm">
                    Waiting for Creator to Pay
                  </button>
                );
              }

              return (
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-['Gilroy_Heavy'] transition-colors"
                >
                  {placing ? 'Placing Order...' : (
                    session.paymentMode === 'pay_together' ? 'Pay for Everyone' : 'Place Group Order'
                  )}
                </button>
              );
            })()}

            <p className="text-xs text-gray-400 text-center mt-3">
              You'll choose payment method on the next screen
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
