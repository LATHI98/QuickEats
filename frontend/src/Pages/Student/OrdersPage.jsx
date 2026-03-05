import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, X, Clock, Hash, CheckCircle, ChefHat, Package, XCircle, CreditCard, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-700',     icon: ChefHat },
  ready:     { label: 'Ready',     color: 'bg-green-100 text-green-700',   icon: Package },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-600',     icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-500',       icon: XCircle },
};

const PAYMENT_STATUS = {
  unpaid:               { label: 'Unpaid',                color: 'text-red-500' },
  pending_verification: { label: 'Awaiting Verification', color: 'text-yellow-600' },
  verified:             { label: 'Verified',              color: 'text-green-600' },
  rejected:             { label: 'Rejected',              color: 'text-red-500' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
};

const OrderDetailModal = ({ order, onClose, onCancel, onPayNow }) => {
  if (!order) return null;
  const paymentCfg = PAYMENT_STATUS[order.payment?.status] || PAYMENT_STATUS.unpaid;
  const canCancel = order.status === 'pending' && order.payment?.status === 'unpaid';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-['Gilroy_Heavy'] text-gray-900">Order #{order.queueNumber}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <StatusBadge status={order.status} />
          </div>

          {/* Queue & Pickup */}
          <div className="bg-orange-50 rounded-xl p-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <Hash size={16} className="text-orange-400 mx-auto mb-1" />
              <p className="text-2xl font-['Gilroy_Heavy'] text-orange-600">{order.queueNumber}</p>
              <p className="text-xs text-gray-500">Queue Number</p>
            </div>
            <div className="text-center">
              <Clock size={16} className="text-orange-400 mx-auto mb-1" />
              <p className="text-sm font-['Gilroy_Heavy'] text-orange-600">
                {new Date(order.estimatedPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-gray-500">Pickup Time</p>
            </div>
          </div>

          {/* QR Code */}
          {order.qrCode && (
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-2">Show this QR at pickup</p>
              <img src={order.qrCode} alt="QR Code" className="w-36 h-36 mx-auto rounded-xl border border-gray-100" />
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-sm font-['Gilroy_Heavy'] text-gray-700 mb-2">Items</p>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} × {item.quantity}</span>
                  <span className="text-gray-800 font-medium">LKR {(item.unitPrice * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-['Gilroy_Heavy'] pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-orange-600">LKR {order.totalPrice?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-['Gilroy_Heavy'] text-gray-700 mb-2">Payment</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Method</span>
              <span className="capitalize text-gray-700">{order.payment?.method || '—'}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium ${paymentCfg.color}`}>{paymentCfg.label}</span>
            </div>
            {order.payment?.rejectionReason && (
              <p className="text-xs text-red-500 mt-1">Reason: {order.payment.rejectionReason}</p>
            )}
          </div>

          {/* Action buttons */}
          {order.status !== 'cancelled' &&
           (order.payment?.status === 'unpaid' || order.payment?.status === 'rejected') && (
            <button
              onClick={() => onPayNow(order._id)}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-['Gilroy_Heavy'] transition-colors"
            >
              <CreditCard size={16} />
              {order.payment?.status === 'rejected' ? 'Re-submit Payment' : 'Pay Now'}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onCancel(order._id)}
              className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 py-3 rounded-xl font-['Gilroy_Heavy'] hover:bg-red-50 transition-colors"
            >
              <XCircle size={16} /> Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const openDetail = async (orderId) => {
    try {
      const res = await orderAPI.getMyOrderById(orderId);
      setSelectedOrder(res.data.data);
    } catch {
      toast.error('Failed to load order details');
    }
  };

  const handlePayNow = (orderId) => {
    navigate(`/dashboard/payment/${orderId}`);
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await orderAPI.cancelOrder(orderId);
      toast.success('Order cancelled');
      setSelectedOrder(null);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel this order');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-['Gilroy_Heavy'] text-gray-900">My Orders</h1>
          <p className="text-gray-400 text-sm mt-1">Track your food orders and history</p>
        </div>
        <button
          onClick={() => fetchOrders(true)}
          className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-orange-50 rounded-[30px] flex items-center justify-center mx-auto mb-4 text-orange-400">
            <ShoppingBag size={40} />
          </div>
          <p className="text-gray-400 font-['Gilroy_Medium']">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const paymentCfg = PAYMENT_STATUS[order.payment?.status] || PAYMENT_STATUS.unpaid;
            return (
              <div
                key={order._id}
                onClick={() => openDetail(order._id)}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-['Gilroy_Heavy'] text-gray-900">Queue #{order.queueNumber}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} · LKR {order.totalPrice?.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                      <span className={`font-medium ${paymentCfg.color}`}>{paymentCfg.label}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Pickup</p>
                  <p className="text-sm font-['Gilroy_Heavy'] text-gray-700">
                    {new Date(order.estimatedPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onPayNow={handlePayNow}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default OrdersPage;
