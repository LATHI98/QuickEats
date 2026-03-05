import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, LayoutList, BarChart2, RefreshCw, CheckCircle, ChefHat, Package, XCircle, Banknote, QrCode, ChevronDown } from 'lucide-react';
import { orderAPI, paymentAPI, queueAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700', next: ['preparing', 'cancelled'] },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-700',     next: ['ready', 'cancelled'] },
  ready:     { label: 'Ready',     color: 'bg-green-100 text-green-700',   next: ['completed'] },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-600',     next: [] },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-500',       next: [] },
};

const PAYMENT_STATUS = {
  unpaid:               { label: 'Unpaid',          color: 'text-gray-400' },
  pending_verification: { label: 'Verify Cash',      color: 'text-yellow-600' },
  verified:             { label: 'Paid',             color: 'text-green-600' },
  rejected:             { label: 'Rejected',         color: 'text-red-500' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
  );
};


// ─── Order Card ───────────────────────────────────────────────────────────────

const OrderCard = ({ order, onStatusChange, onVerifyCash, onRejectCash, onVerifyPickup }) => {
  const [qrInput, setQrInput] = useState('');
  const [showQrInput, setShowQrInput] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const paymentCfg = PAYMENT_STATUS[order.payment?.status] || PAYMENT_STATUS.unpaid;

  const submit = (e) => {
    e.preventDefault();
    onVerifyPickup(order._id, qrInput.trim());
    setQrInput('');
    setShowQrInput(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-['Gilroy_Heavy'] text-gray-900">Queue #{order.queueNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {order.student?.name || 'Student'} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-['Gilroy_Heavy'] text-orange-600">LKR {order.totalPrice?.toLocaleString()}</p>
          <p className={`text-xs font-medium ${paymentCfg.color}`}>{paymentCfg.label}</p>
        </div>
      </div>

      {/* Items toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-3"
      >
        {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
        <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="space-y-1 mb-3 pl-2 border-l-2 border-orange-100">
          {order.items?.map((item, i) => (
            <p key={i} className="text-xs text-gray-600">{item.name} × {item.quantity} — LKR {(item.unitPrice * item.quantity).toLocaleString()}</p>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Status advance */}
        {cfg.next.filter(s => s !== 'cancelled').map(next => (
          <button
            key={next}
            onClick={() => onStatusChange(order._id, next)}
            className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {next === 'preparing' && <ChefHat size={12} />}
            {next === 'ready' && <Package size={12} />}
            {next === 'completed' && <CheckCircle size={12} />}
            Mark {STATUS_CONFIG[next]?.label}
          </button>
        ))}
        {/* Cancel */}
        {cfg.next.includes('cancelled') && (
          <button
            onClick={() => onStatusChange(order._id, 'cancelled')}
            className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
          >
            <XCircle size={12} /> Cancel
          </button>
        )}
        {/* Verify Cash */}
        {order.payment?.status === 'pending_verification' && (
          <>
            <button
              onClick={() => onVerifyCash(order._id, true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Banknote size={12} /> Verify Cash
            </button>
            <button
              onClick={() => onRejectCash(order._id)}
              className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
            >
              <XCircle size={12} /> Reject
            </button>
          </>
        )}
        {/* QR Pickup verify */}
        {order.status === 'ready' && (
          <button
            onClick={() => setShowQrInput(!showQrInput)}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <QrCode size={12} /> Verify Pickup
          </button>
        )}
      </div>

      {/* QR input form */}
      {showQrInput && (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            value={qrInput}
            onChange={e => setQrInput(e.target.value)}
            placeholder="Paste QR token..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button type="submit" className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium">
            Confirm
          </button>
        </form>
      )}
    </div>
  );
};


// ─── Queue Board Tab ──────────────────────────────────────────────────────────

const QueueBoard = ({ canteenId }) => {
  const [queueData, setQueueData] = useState(null);
  const [slots, setSlots] = useState([]);
  const [nowServingInput, setNowServingInput] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    if (!canteenId) return;
    setLoading(true);
    try {
      const [statusRes, slotsRes] = await Promise.all([
        queueAPI.getStatus(canteenId),
        queueAPI.getSlots(canteenId),
      ]);
      setQueueData(statusRes.data.data);
      setSlots(slotsRes.data.data || []);
    } catch {
      toast.error('Failed to load queue data');
    } finally {
      setLoading(false);
    }
  }, [canteenId]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);
  useEffect(() => {
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleSetNowServing = async (e) => {
    e.preventDefault();
    if (!nowServingInput) return;
    try {
      await queueAPI.setNowServing(canteenId, Number(nowServingInput));
      toast.success(`Now serving #${nowServingInput}`);
      setNowServingInput('');
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const grouped = queueData?.grouped || {};
  const activeStatuses = ['pending', 'preparing', 'ready'];

  return (
    <div className="space-y-6">
      {/* Now serving control */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Now Serving</p>
            <p className="text-5xl font-['Gilroy_Heavy'] text-orange-600 mt-1">
              {queueData?.nowServing != null ? `#${queueData.nowServing}` : '—'}
            </p>
          </div>
          <form onSubmit={handleSetNowServing} className="flex gap-2">
            <input
              type="number"
              min={1}
              value={nowServingInput}
              onChange={e => setNowServingInput(e.target.value)}
              placeholder="Queue #"
              className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-['Gilroy_Heavy'] transition-colors"
            >
              Set
            </button>
          </form>
        </div>
      </div>

      {/* Active orders grouped by status */}
      {activeStatuses.map(status => {
        const list = grouped[status] || [];
        if (list.length === 0) return null;
        const cfg = STATUS_CONFIG[status];
        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
              <span className="text-xs text-gray-400">{list.length} order{list.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {list.map(o => (
                <div key={o._id} className={`px-3 py-2 rounded-xl text-sm font-['Gilroy_Heavy'] ${cfg.color}`}>
                  #{o.queueNumber}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Time slots */}
      {slots.length > 0 && (
        <div>
          <p className="text-sm font-['Gilroy_Heavy'] text-gray-700 mb-3">Upcoming Slots (Capacity)</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.slice(0, 8).map((slot, i) => (
              <div key={i} className={`rounded-xl p-2 text-center text-xs border ${slot.isFull ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'}`}>
                <p className="font-medium text-gray-700">{new Date(slot.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p className={slot.isFull ? 'text-red-500' : 'text-gray-400'}>{slot.orderCount}/{slot.maxCapacity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminOrdersPage = () => {
  const { user } = useAuth();
  const canteenId = user?.canteen;

  const [tab, setTab] = useState('orders'); // 'orders' | 'queue'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params = { canteen: canteenId };
      if (statusFilter) params.status = statusFilter;
      const res = await orderAPI.getCanteenOrders(params);
      setOrders(res.data.data || []);
    } catch {
      if (!silent) toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, canteenId]);

  useEffect(() => { if (tab === 'orders') fetchOrders(); }, [fetchOrders, tab]);
  useEffect(() => {
    if (tab !== 'orders') return;
    const interval = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(interval);
  }, [fetchOrders, tab]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await orderAPI.updateOrderStatus(orderId, status);
      toast.success(`Order marked as ${status}`);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleVerifyCash = async (orderId) => {
    try {
      await paymentAPI.verifyPayment(orderId);
      toast.success('Cash payment verified');
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleRejectCash = async (orderId) => {
    const reason = window.prompt('Rejection reason (optional):') ?? '';
    try {
      await paymentAPI.rejectPayment(orderId, reason);
      toast.success('Payment rejected');
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  const handleVerifyPickup = async (orderId, qrToken) => {
    if (!qrToken) return toast.error('Enter the QR token');
    try {
      await orderAPI.verifyPickup(orderId, qrToken);
      toast.success('Pickup verified — order completed!');
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid QR token');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-['Gilroy_Heavy'] text-gray-900">Orders</h1>
          <p className="text-gray-400 text-sm mt-1">Manage incoming orders and queue</p>
        </div>
        {tab === 'orders' && (
          <button
            onClick={() => fetchOrders(true)}
            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setTab('orders')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'orders' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutList size={14} /> Orders
        </button>
        <button
          onClick={() => setTab('queue')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'queue' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart2 size={14} /> Queue Board
        </button>
      </div>

      {tab === 'queue' ? (
        <QueueBoard canteenId={canteenId} />
      ) : (
        <>
          {/* Status filters */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {[{ value: '', label: 'All' }, ...ORDER_STATUSES.map(s => ({ value: s, label: STATUS_CONFIG[s].label }))].map(f => (
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

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-orange-50 rounded-[24px] flex items-center justify-center mx-auto mb-4 text-orange-400">
                <ShoppingBag size={32} />
              </div>
              <p className="text-gray-400 font-['Gilroy_Medium']">No orders found</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {orders.map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  onVerifyCash={handleVerifyCash}
                  onRejectCash={handleRejectCash}
                  onVerifyPickup={handleVerifyPickup}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminOrdersPage;
