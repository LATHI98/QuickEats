import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, LayoutList, BarChart2, RefreshCw, CheckCircle, ChefHat, Package, XCircle, Banknote, QrCode, ChevronDown, Wallet, TrendingUp, Clock, AlertCircle, ChevronRight, Users, CreditCard } from 'lucide-react';
import { orderAPI, paymentAPI, queueAPI, canteenAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', next: ['preparing', 'cancelled'] },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-700', next: ['ready', 'cancelled'] },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-700', next: ['completed'] },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-600', next: [] },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-500', next: [] },
};

const PAYMENT_STATUS = {
  unpaid: { label: 'Unpaid', color: 'text-gray-400', bg: 'bg-gray-100' },
  pending_verification: { label: 'Verify Cash', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  verified: { label: 'Paid', color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-500', bg: 'bg-red-100' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
  );
};


// ─── Order Card ───────────────────────────────────────────────────────────────

const OrderCard = ({ order, onStatusChange, onVerifyCash, onRejectCash, onVerifyPickup }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const paymentCfg = PAYMENT_STATUS[order.payment?.status] || PAYMENT_STATUS.unpaid;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      {/* Top row */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-['Gilroy_Heavy'] text-gray-900">Queue #{order.queueNumber}</span>
            <StatusBadge status={order.status} />
            {/* Payment status badge */}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-['Gilroy_Heavy'] ${paymentCfg.bg} ${paymentCfg.color}`}>
              {paymentCfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {order.student?.name || 'Student'} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {/* Canteen name (for admin seeing all canteens) */}
          {order.canteen?.name && (
            <p className="text-xs text-gray-400">{order.canteen.name}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-['Gilroy_Heavy'] text-orange-600">LKR {order.totalPrice?.toLocaleString()}</p>
          {/* Group vs Individual badge */}
          {order.groupSession ? (
            <span className="flex items-center justify-end gap-1 text-[10px] font-['Gilroy_Heavy'] text-blue-600 mt-0.5">
              <Users size={10} />
              Group · {order.groupSession.paymentMode === 'pay_together' ? 'Creator Pays' : 'Split'}
            </span>
          ) : (
            <span className="flex items-center justify-end gap-1 text-[10px] font-['Gilroy_Heavy'] text-gray-400 mt-0.5">
              <CreditCard size={10} /> Individual
            </span>
          )}
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
        {/* QR Pickup verify — now one-click */}
        {order.status === 'ready' && (
          <button
            onClick={() => onVerifyPickup(order._id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-['Gilroy_Heavy'] transition-colors"
          >
            <CheckCircle size={12} /> Mark Delivered
          </button>
        )}
      </div>

      {/* Pickup Code — shown when order is ready */}
      {order.status === 'ready' && order.pickupCode && (
        <div className="mt-3 flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
          <QrCode size={16} className="text-indigo-400 shrink-0" />
          <div>
            <p className="text-[10px] text-indigo-400 font-['Gilroy_Heavy'] uppercase tracking-wide">Student Pickup Code</p>
            <p className="text-2xl font-['Gilroy_Heavy'] text-indigo-700 tracking-widest">{order.pickupCode}</p>
          </div>
          <p className="ml-auto text-[10px] text-indigo-300 italic">Match with student's code to confirm</p>
        </div>
      )}
    </div>
  );
};


// ─── Queue Board Tab ──────────────────────────────────────────────────────────

const REFRESH_INTERVAL = 30; // seconds

const QueueBoard = ({ canteenIdProp, isAdmin }) => {
  const [canteenId, setCanteenId] = useState(canteenIdProp || '');
  const [canteens, setCanteens] = useState([]);
  const [slots, setSlots] = useState([]);
  const [nowServingInput, setNowServingInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [calling, setCalling] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [queueData, setQueueData] = useState(null);

  // For admin: load canteen list so they can pick one
  useEffect(() => {
    if (isAdmin) {
      canteenAPI.getAll().then(r => {
        const list = r.data.data || [];
        setCanteens(list);
        if (!canteenId && list.length > 0) setCanteenId(list[0]._id);
      }).catch(() => { });
    }
  }, [isAdmin]);

  const fetchQueue = useCallback(async (showLoader = false) => {
    if (!canteenId) return;
    if (showLoader) setLoading(true);
    try {
      const [statusRes, slotsRes] = await Promise.all([
        queueAPI.getStatus(canteenId),
        queueAPI.getSlots(canteenId),
      ]);
      setQueueData(statusRes.data.data);
      setSlots(slotsRes.data.data || []);
      setCountdown(REFRESH_INTERVAL);
    } catch {
      toast.error('Failed to load queue data');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [canteenId]);

  useEffect(() => { fetchQueue(true); }, [fetchQueue]);

  // Auto-refresh with countdown
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { fetchQueue(false); return REFRESH_INTERVAL; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [fetchQueue]);

  const handleSetNowServing = async (e) => {
    e.preventDefault();
    if (!nowServingInput) return;
    try {
      await queueAPI.setNowServing(canteenId, Number(nowServingInput));
      toast.success(`Now serving #${nowServingInput}`);
      setNowServingInput('');
      fetchQueue(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleCallNext = async () => {
    setCalling(true);
    try {
      const res = await queueAPI.callNext(canteenId);
      toast.success(`Calling Queue #${res.data.data.nowServing}!`);
      fetchQueue(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No pending orders to call');
    } finally {
      setCalling(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const grouped = queueData?.grouped || {};
  const activeStatuses = ['pending', 'preparing', 'ready'];
  const totalActive = queueData?.totalActive || 0;

  return (
    <div className="space-y-5">

      {/* Admin-only: Canteen Picker */}
      {isAdmin && (
        <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
          <BarChart2 size={16} className="text-orange-500" />
          <label className="text-sm font-['Gilroy_Heavy'] text-gray-700 whitespace-nowrap">Viewing Canteen:</label>
          <select
            value={canteenId}
            onChange={e => setCanteenId(e.target.value)}
            className="flex-1 border-0 bg-transparent text-sm text-gray-600 focus:outline-none focus:ring-0 font-['Gilroy_Medium'] cursor-pointer"
          >
            {canteens.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {!canteenId ? (
        <div className="text-center py-16 text-gray-400 text-sm">Select a canteen to view the queue board.</div>
      ) : loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Now Serving Hero Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Now serving display */}
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-['Gilroy_Heavy'] text-gray-400 uppercase tracking-widest mb-1">Now Serving</p>
                  <p className="text-6xl font-['Gilroy_Heavy'] text-orange-600 leading-none">
                    {queueData?.nowServing ? `#${queueData.nowServing}` : '—'}
                  </p>
                </div>
                {queueData?.nextQueueNumber && (
                  <div className="border-l pl-6">
                    <p className="text-[10px] font-['Gilroy_Heavy'] text-gray-400 uppercase tracking-widest mb-1">Up Next</p>
                    <p className="text-3xl font-['Gilroy_Heavy'] text-gray-400">#{queueData.nextQueueNumber}</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-3 w-full sm:w-auto">
                <button
                  onClick={handleCallNext}
                  disabled={calling || totalActive === 0}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-['Gilroy_Heavy'] text-sm transition-colors"
                >
                  {calling ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  Call Next
                </button>
                <form onSubmit={handleSetNowServing} className="flex gap-2">
                  <input
                    type="number" min={1}
                    value={nowServingInput}
                    onChange={e => setNowServingInput(e.target.value)}
                    placeholder="Set # manually"
                    className="flex-1 w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <button type="submit" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-['Gilroy_Heavy'] transition-colors">Set</button>
                </form>
              </div>
            </div>

            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs text-gray-400">Auto-refreshing in <span className="font-['Gilroy_Heavy'] text-gray-600">{countdown}s</span></p>
              <button onClick={() => fetchQueue(false)} className="ml-auto text-xs text-orange-500 hover:underline font-['Gilroy_Heavy']">Refresh now</button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {activeStatuses.map(s => {
              const cfg = STATUS_CONFIG[s];
              const count = (grouped[s] || []).length;
              return (
                <div key={s} className={`rounded-2xl border p-3 text-center ${cfg.color}`}>
                  <p className="text-2xl font-['Gilroy_Heavy']">{count}</p>
                  <p className="text-xs font-['Gilroy_Heavy'] opacity-75 mt-0.5">{cfg.label}</p>
                </div>
              );
            })}
          </div>

          {/* Active Orders Board */}
          {activeStatuses.map(status => {
            const list = grouped[status] || [];
            if (list.length === 0) return null;
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-['Gilroy_Heavy'] ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-xs text-gray-400">{list.length} order{list.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {list.map(o => (
                    <div key={o._id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cfg.color} bg-white`}>
                      <span className="text-xl font-['Gilroy_Heavy']">#{o.queueNumber}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-['Gilroy_Heavy'] text-gray-900 truncate">{o.student?.name || 'Student'}</p>
                        <p className="text-xs text-gray-400">{new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {totalActive === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} className="text-green-400" />
              </div>
              All caught up! No active orders in the queue.
            </div>
          )}

          {/* Time Slots Capacity */}
          {slots.length > 0 && (
            <div>
              <p className="text-sm font-['Gilroy_Heavy'] text-gray-700 mb-3">Upcoming Pickup Slots</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {slots.slice(0, 12).map((slot, i) => {
                  const pct = Math.round((slot.orderCount / slot.maxCapacity) * 100);
                  return (
                    <div key={i} className={`rounded-xl p-2.5 text-center border ${slot.isFull ? 'border-red-200 bg-red-50' : pct >= 70 ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100 bg-white'}`}>
                      <p className="font-['Gilroy_Heavy'] text-gray-700 text-xs">
                        {new Date(slot.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className={`text-[10px] mt-0.5 font-['Gilroy_Heavy'] ${slot.isFull ? 'text-red-500' : pct >= 70 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {slot.orderCount}/{slot.maxCapacity}
                        {slot.isFull && ' FULL'}
                      </p>
                      <div className="w-full h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${slot.isFull ? 'bg-red-400' : pct >= 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};




// ─── Billing Board Tab ────────────────────────────────────────────────────────

const BillingBoard = ({ canteenId }) => {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payFilter, setPayFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchBilling = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const params = {};
      if (date) params.date = date;
      const res = await orderAPI.getCanteenOrders(params);
      setAllOrders(res.data.data || []);
    } catch {
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [date]);

  useEffect(() => { fetchBilling(); }, [fetchBilling]);

  // Derived stats
  const stats = allOrders.reduce((acc, o) => {
    const ps = o.payment?.status || 'unpaid';
    const amt = o.totalPrice || 0;
    if (ps === 'verified') { acc.collected += amt; acc.collectedCount += 1; }
    else if (ps === 'pending_verification') { acc.awaitingVerification += amt; acc.awaitingCount += 1; }
    else if (ps === 'unpaid') { acc.unpaid += amt; acc.unpaidCount += 1; }
    else if (ps === 'rejected') { acc.rejected += amt; acc.rejectedCount += 1; }
    return acc;
  }, { collected: 0, collectedCount: 0, awaitingVerification: 0, awaitingCount: 0, unpaid: 0, unpaidCount: 0, rejected: 0, rejectedCount: 0 });

  const filtered = payFilter ? allOrders.filter(o => (o.payment?.status || 'unpaid') === payFilter) : allOrders;

  const PAY_FILTERS = [
    { value: '', label: 'All' },
    { value: 'verified', label: 'Paid' },
    { value: 'pending_verification', label: 'Awaiting' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'rejected', label: 'Rejected' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Controls: Date Picker + Refresh */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <button
          onClick={() => fetchBilling(true)}
          className={`mt-5 p-2 rounded-full hover:bg-gray-100 transition-colors ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp size={20} className="text-green-600" />}
          label="Collected"
          amount={stats.collected}
          count={stats.collectedCount}
          color="bg-green-50 border-green-100"
          amtColor="text-green-700"
        />
        <StatCard
          icon={<Clock size={20} className="text-yellow-600" />}
          label="Awaiting Verification"
          amount={stats.awaitingVerification}
          count={stats.awaitingCount}
          color="bg-yellow-50 border-yellow-100"
          amtColor="text-yellow-700"
        />
        <StatCard
          icon={<Wallet size={20} className="text-gray-500" />}
          label="Unpaid"
          amount={stats.unpaid}
          count={stats.unpaidCount}
          color="bg-gray-50 border-gray-100"
          amtColor="text-gray-600"
        />
        <StatCard
          icon={<AlertCircle size={20} className="text-red-500" />}
          label="Rejected"
          amount={stats.rejected}
          count={stats.rejectedCount}
          color="bg-red-50 border-red-100"
          amtColor="text-red-600"
        />
      </div>

      {/* Payment Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {PAY_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setPayFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${payFilter === f.value ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Billing Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No orders matching this filter.</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-['Gilroy_Heavy'] text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Order Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(order => {
                const ps = order.payment?.status || 'unpaid';
                const pCfg = PAYMENT_STATUS[ps] || PAYMENT_STATUS.unpaid;
                const sCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-['Gilroy_Heavy'] text-gray-700">#{order.queueNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-['Gilroy_Heavy'] text-gray-800 leading-tight">{order.student?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{order.student?.studentId || order.student?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sCfg.color}`}>{sCfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <PayBadge ps={ps} label={pCfg.label} />
                    </td>
                    <td className="px-4 py-3 text-right font-['Gilroy_Heavy'] text-orange-600">LKR {order.totalPrice?.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-100">
                <td colSpan={5} className="px-4 py-3 text-xs font-['Gilroy_Heavy'] text-gray-500 uppercase">Total Shown</td>
                <td className="px-4 py-3 text-right font-['Gilroy_Heavy'] text-gray-900">
                  LKR {filtered.reduce((s, o) => s + (o.totalPrice || 0), 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, amount, count, color, amtColor }) => (
  <div className={`rounded-2xl border p-4 ${color}`}>
    <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-['Gilroy_Heavy'] text-gray-500 uppercase tracking-wide">{label}</span></div>
    <p className={`text-xl font-['Gilroy_Heavy'] ${amtColor}`}>LKR {amount.toLocaleString()}</p>
    <p className="text-xs text-gray-400 mt-0.5">{count} order{count !== 1 ? 's' : ''}</p>
  </div>
);

const PAY_BADGE_STYLES = {
  verified: 'bg-green-100 text-green-700',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  unpaid: 'bg-gray-100 text-gray-500',
  rejected: 'bg-red-100 text-red-600',
};

const PayBadge = ({ ps, label }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PAY_BADGE_STYLES[ps] || 'bg-gray-100 text-gray-500'}`}>{label}</span>
);



const AdminOrdersPage = () => {
  const { user } = useAuth();
  const canteenId = user?.canteen;

  const [tab, setTab] = useState('orders'); // 'orders' | 'queue' | 'billing'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeVerifying, setCodeVerifying] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const isAdmin = ['admin', 'superAdmin'].includes(user?.role);
      const params = {};
      // Staff filter by their assigned canteen; admins see all by default
      if (!isAdmin && canteenId) params.canteen = canteenId;
      if (statusFilter) params.status = statusFilter;
      const res = await orderAPI.getCanteenOrders(params);
      setOrders(res.data.data || []);
    } catch {
      if (!silent) toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, canteenId, user?.role]);

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

  const handleVerifyPickup = async (orderId) => {
    try {
      await orderAPI.verifyPickup(orderId);
      toast.success('✓ Delivered — order completed!');
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not confirm delivery');
    }
  };

  const handlePickupByCode = async (e) => {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setCodeVerifying(true);
    try {
      const res = await orderAPI.pickupByCode(code);
      toast.success(`✓ ${res.data.message}`);
      setCodeInput('');
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid pickup code');
    } finally {
      setCodeVerifying(false);
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
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'orders' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <LayoutList size={14} /> Orders
        </button>
        <button
          onClick={() => setTab('billing')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'billing' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Wallet size={14} /> Billing
        </button>
        <button
          onClick={() => setTab('queue')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'queue' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <BarChart2 size={14} /> Queue Board
        </button>
      </div>

      {tab === 'queue' ? (
        <QueueBoard canteenIdProp={canteenId} isAdmin={['admin', 'superAdmin'].includes(user?.role)} />
      ) : tab === 'billing' ? (
        <BillingBoard canteenId={canteenId} />
      ) : (
        <>
          {/* Pickup Code Entry Bar */}
          <form onSubmit={handlePickupByCode} className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 mb-5">
            <QrCode size={18} className="text-indigo-400 shrink-0" />
            <input
              value={codeInput}
              onChange={e => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter student pickup code (e.g. QK82F1)"
              maxLength={6}
              className="flex-1 bg-transparent text-sm font-['Gilroy_Heavy'] text-indigo-700 placeholder-indigo-300 focus:outline-none tracking-widest uppercase"
            />
            <button
              type="submit"
              disabled={codeVerifying || codeInput.length < 4}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-['Gilroy_Heavy'] transition-colors"
            >
              {codeVerifying ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={13} />}
              Confirm Delivery
            </button>
          </form>

          {/* Status filters */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {[{ value: '', label: 'All' }, ...ORDER_STATUSES.map(s => ({ value: s, label: STATUS_CONFIG[s].label }))].map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === f.value
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
