import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, X, Clock, Hash, CheckCircle, ChefHat, Package, XCircle, CreditCard, RefreshCw, RotateCcw, QrCode, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, cartAPI, canteenAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { reorderOrderToCart } from '../../utils/reorder';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-700', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-700', icon: Package },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-600', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-500', icon: XCircle },
};

const PAYMENT_STATUS = {
  unpaid: { label: 'Unpaid', color: 'text-red-500', dotColor: 'bg-red-400' },
  pending_verification: { label: 'Awaiting Verification', color: 'text-amber-600', dotColor: 'bg-amber-400' },
  verified: { label: 'Verified', color: 'text-green-600', dotColor: 'bg-green-500' },
  rejected: { label: 'Rejected', color: 'text-red-500', dotColor: 'bg-red-500' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${cfg.color}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
};

// ─── Confirm Cancel Modal ─────────────────────────────────────────────────────

const ConfirmCancelModal = ({ order, submitting, onClose, onConfirm }) => {
  if (!order) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900">Cancel This Order?</h3>
          <p className="text-sm text-gray-500 mt-1">Order <strong>#{order.queueNumber}</strong> will be cancelled and cannot be undone.</p>
        </div>

        {/* Order items summary */}
        <div className="bg-gray-50 rounded-xl p-3 mb-5">
          {order.items?.map((item, i) => (
            <p key={i} className="text-xs text-gray-600 mb-0.5">{item.name} × {item.quantity}</p>
          ))}
          <p className="text-sm font-extrabold text-gray-900 mt-2 pt-2 border-t border-gray-200">
            Total: LKR {order.totalPrice?.toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="py-3 rounded-xl border border-gray-200 text-gray-600 font-extrabold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            onClick={() => onConfirm(order._id)}
            disabled={submitting}
            className="py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle size={14} />
                Cancel Order
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Order Detail Modal ───────────────────────────────────────────────────────

const OrderDetailModal = ({ order, onClose, onCancel, onPayNow, onReorder, reorderingId }) => {
  if (!order) return null;
  const paymentCfg = PAYMENT_STATUS[order.payment?.status] || PAYMENT_STATUS.unpaid;
  const canCancel = order.status === 'pending' && order.payment?.status === 'unpaid';
  const isReady = order.status === 'ready';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center justify-between p-8 border-b border-gray-50">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Order #{order.queueNumber}</h2>
            <p className="text-xs text-gray-400 mt-1 font-medium">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Status */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
            <span className="text-sm font-extrabold text-gray-500">Current Status</span>
            <StatusBadge status={order.status} />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-3xl p-6 text-center">
              <Hash size={20} className="text-orange-400 mx-auto mb-2" />
              <p className="text-3xl font-extrabold text-orange-600">{order.queueNumber}</p>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mt-1">Token ID</p>
            </div>
            <div className="bg-orange-50 rounded-3xl p-6 text-center">
              <Clock size={20} className="text-orange-400 mx-auto mb-2" />
              <p className="text-lg font-extrabold text-orange-600">
                {new Date(order.estimatedPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mt-1">Pickup Time</p>
            </div>
          </div>

          {/* Pickup Code & QR — shown when order is ready */}
          {isReady && order.pickupCode && (
            <div className="rounded-3xl bg-indigo-50 border border-indigo-100 p-5 text-center">
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-extrabold mb-2">Your Pickup Code</p>
              <p className="text-4xl tracking-[0.25em] font-extrabold text-indigo-700 mb-3">{order.pickupCode}</p>
              {order.qrCodeData && (
                <img
                  src={order.qrCodeData}
                  alt="Pickup QR Code"
                  className="w-36 h-36 mx-auto rounded-xl mb-2"
                />
              )}
              <p className="text-xs text-indigo-500 leading-relaxed mt-2">
                Show this code or QR to canteen staff when picking up your order.
              </p>
            </div>
          )}

          {isReady && !order.pickupCode && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
              <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Pickup code not yet generated. Please check again in a moment or contact canteen staff.
              </p>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest mb-4">Cart Summary</h3>
            <div className="space-y-4 bg-gray-50/50 p-6 rounded-3xl">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm font-medium">
                  <span className="text-gray-600">{item.name} <span className="text-orange-500 font-extrabold ml-1">×{item.quantity}</span></span>
                  <span className="text-gray-900">LKR {(item.unitPrice * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="font-extrabold text-gray-900">Total Bill</span>
                <span className="text-xl font-extrabold text-orange-600">LKR {order.totalPrice?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={() => onReorder(order)}
              disabled={reorderingId === order._id}
              className="w-full h-16 flex items-center justify-center gap-3 bg-gray-900 text-white rounded-2xl font-extrabold transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-50"
            >
              {reorderingId === order._id ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <>
                  <RotateCcw size={20} />
                  <span>One-Tap Reorder</span>
                </>
              )}
            </button>

            {order.status !== 'cancelled' &&
              (order.payment?.status === 'unpaid' || order.payment?.status === 'rejected') && (
                <button
                  onClick={() => onPayNow(order._id)}
                  className="w-full h-16 flex items-center justify-center gap-3 bg-orange-500 text-white rounded-2xl font-extrabold hover:bg-orange-600 transition-all shadow-xl shadow-orange-100"
                >
                  <CreditCard size={20} />
                  {order.payment?.status === 'rejected' ? 'Fix Payment' : 'Pay Now'}
                </button>
              )}

            {canCancel && (
              <button
                onClick={() => onCancel(order)}
                className="w-full py-4 text-red-400 text-xs font-extrabold hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const FILTERS = [
  { value: '', label: 'All Orders' },
  { value: 'pending', label: 'Queued' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Past' },
];

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [reorderingId, setReorderingId] = useState(null);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await orderAPI.getMyOrders(params);
      setOrders(res.data.data || []);
    } catch {
      if (!silent) toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleReorder = async (order) => {
    setReorderingId(order._id);
    try {
      const result = await reorderOrderToCart({ order, cartAPI, canteenAPI });
      if (result.skippedItems.length > 0) {
        toast.warn(`Added ${result.addedCount} item(s). Skipped unavailable items: ${result.skippedItems.join(', ')}`);
      } else {
        toast.success('Successfully added items to cart! 🛒');
      }
      navigate('/dashboard/cart');
    } catch (err) {
      toast.error('Could not reorder all items. Some may be unavailable.');
    } finally {
      setReorderingId(null);
    }
  };

  const handlePayNow = (orderId) => {
    navigate(`/dashboard/payment/${orderId}`);
  };

  // Opens styled cancel modal instead of window.confirm()
  const handleCancelRequest = (order) => {
    setCancelOrder(order);
  };

  const handleConfirmCancel = async (orderId) => {
    setCancelSubmitting(true);
    try {
      await orderAPI.cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      setCancelOrder(null);
      setSelectedOrder(null);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel this order');
    } finally {
      setCancelSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Order History</h1>
          <p className="text-gray-400 text-sm mt-1 font-medium">Manage and repeat your favorites</p>
        </div>
        <button
          onClick={() => fetchOrders(true)}
          className={`p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={20} className="text-gray-500" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-6 -mx-2 px-2 no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-widest transition-all ${statusFilter === f.value
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-100'
              : 'bg-white border border-gray-100 text-gray-400 hover:border-gray-300'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-[40px]">
          <div className="w-20 h-20 bg-white shadow-sm rounded-[30px] flex items-center justify-center mx-auto mb-6 text-orange-400">
            <ShoppingBag size={36} strokeWidth={1.5} />
          </div>
          <p className="text-gray-400 font-extrabold text-lg">No orders found</p>
          <p className="text-gray-400 text-sm mt-1 font-medium">Your culinary journey starts with your first order!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order, index) => {
            const paymentCfg = PAYMENT_STATUS[order.payment?.status] || PAYMENT_STATUS.unpaid;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white border border-gray-100 rounded-[32px] p-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <ShoppingBag size={20} />
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">Queue #{order.queueNumber}</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      {order.items?.length} Items · LKR {order.totalPrice?.toLocaleString()}
                    </p>
                  </div>

                  {/* Pickup code badge for ready orders */}
                  {order.status === 'ready' && order.pickupCode && (
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                      <QrCode size={14} className="text-indigo-400" />
                      <span className="text-xs font-extrabold text-indigo-700 tracking-widest">{order.pickupCode}</span>
                      <span className="text-[9px] text-indigo-400 ml-auto">Show at counter</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      {/* Distinct dot colors per payment status */}
                      <div className={`w-2 h-2 rounded-full ${paymentCfg.dotColor}`} />
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest ${paymentCfg.color}`}>
                        {paymentCfg.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Ordered</p>
                      <p className="text-xs font-extrabold text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReorder(order);
                    }}
                    disabled={reorderingId === order._id}
                    className="w-full py-3 bg-gray-50 group-hover:bg-orange-50 rounded-xl text-gray-400 group-hover:text-orange-600 font-extrabold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all mt-2"
                  >
                    {reorderingId === order._id ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <>
                        <RotateCcw size={12} />
                        Reorder Fast
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          reorderingId={reorderingId}
          onClose={() => setSelectedOrder(null)}
          onPayNow={handlePayNow}
          onCancel={handleCancelRequest}
          onReorder={handleReorder}
        />
      )}

      {/* Styled cancel confirmation modal */}
      <ConfirmCancelModal
        order={cancelOrder}
        submitting={cancelSubmitting}
        onClose={() => setCancelOrder(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};

export default OrdersPage;
