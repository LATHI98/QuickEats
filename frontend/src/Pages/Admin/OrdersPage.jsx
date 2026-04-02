import React, { useEffect, useState } from 'react';
import { ShoppingBag, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/order');
      setOrders(data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.foodId?.price || 0) * o.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-['Gilroy_Bold'] text-gray-900">Orders</h1>
          <p className="text-gray-400 font-['Gilroy_Medium'] mt-1">All incoming orders and their details.</p>
        </div>
        <button onClick={fetchOrders}
          className="flex items-center gap-2 border-2 border-gray-100 text-gray-500 px-5 py-3 rounded-2xl font-['Gilroy_Bold'] text-sm hover:bg-gray-50 transition-all">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, color: 'bg-orange-50 text-orange-600' },
          { label: 'Items Sold', value: orders.reduce((s, o) => s + o.quantity, 0), color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Revenue', value: `LKR ${totalRevenue.toFixed(2)}`, color: 'bg-green-50 text-green-600' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl p-5 ${stat.color.split(' ')[0]} border border-gray-100`}>
            <p className="text-sm font-['Gilroy_Medium'] text-gray-400">{stat.label}</p>
            <p className={`text-3xl font-['Gilroy_Heavy'] mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-300">
            <ShoppingBag size={48} />
            <p className="mt-4 font-['Gilroy_Bold'] text-gray-400">No orders yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {['#', 'Food Item', 'Category', 'Unit Price', 'Qty', 'Total', 'Date'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-['Gilroy_Bold'] text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => {
                const food = order.foodId;
                const total = (food?.price || 0) * order.quantity;
                return (
                  <tr key={order._id} className="border-b border-gray-50 last:border-0 hover:bg-orange-50/30 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-['Gilroy_Medium']">{idx + 1}</td>
                    <td className="px-6 py-4 font-['Gilroy_Bold'] text-gray-900">{food?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-['Gilroy_Bold']">{food?.category || '—'}</span>
                    </td>
                    <td className="px-6 py-4 font-['Gilroy_Medium'] text-gray-700">LKR {(food?.price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 font-['Gilroy_Bold'] text-gray-900">{order.quantity}</td>
                    <td className="px-6 py-4 font-['Gilroy_Bold'] text-green-600">LKR {total.toFixed(2)}</td>
                    <td className="px-6 py-4 font-['Gilroy_Medium'] text-gray-400 text-xs">
                      {new Date(order.date).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

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
  const { user, selectedCanteenId, selectedCanteenName } = useAuth();
  const canteenId = selectedCanteenId;
  const canManagePayments = ['canteenStaff', 'canteenManager'].includes(user?.role);

  const [tab, setTab] = useState('orders'); // 'orders' | 'queue' | 'billing'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [verificationOrder, setVerificationOrder] = useState(null);
  const [verificationForm, setVerificationForm] = useState({ amountReceived: '', verificationCode: '' });
  const [verificationErrors, setVerificationErrors] = useState({});
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);
  const [pickupOrder, setPickupOrder] = useState(null);
  const [pickupForm, setPickupForm] = useState({ pickupCode: '' });
  const [pickupErrors, setPickupErrors] = useState({});
  const [pickupSubmitting, setPickupSubmitting] = useState(false);
  const [rejectOrder, setRejectOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [adminCancelOrder, setAdminCancelOrder] = useState(null);
  const [adminCancelReason, setAdminCancelReason] = useState('');
  const [adminCancelSubmitting, setAdminCancelSubmitting] = useState(false);
  const [codeInputTouched, setCodeInputTouched] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!canteenId) {
      setOrders([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params = {};
      params.canteen = canteenId;
      if (statusFilter) params.status = statusFilter;
      const res = await orderAPI.getCanteenOrders(params);
      setOrders(res.data.data || []);
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.message || 'Failed to load orders');
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
    // If cancelling, open the specialized modal first
    if (status === 'cancelled') {
        const orderToCancel = orders.find(o => o._id === orderId);
        setAdminCancelOrder(orderToCancel);
        setAdminCancelReason('');
        return;
    }
    try {
      await orderAPI.updateOrderStatus(orderId, status);
      toast.success(`Order marked as ${status}`);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleConfirmAdminCancel = async () => {
    if (!adminCancelOrder) return;
    setAdminCancelSubmitting(true);
    try {
        await orderAPI.updateOrderStatus(adminCancelOrder._id, 'cancelled', adminCancelReason);
        toast.success('Order cancelled and student notified.');
        setAdminCancelOrder(null);
        fetchOrders(true);
    } catch (err) {
        toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
        setAdminCancelSubmitting(false);
    }
  };

  const handleOpenVerifyCash = (order) => {
    setVerificationOrder(order);
    setVerificationForm({
      amountReceived: String(order.totalPrice || ''),
      verificationCode: '',
    });
    setVerificationErrors({});
  };

  const handleVerificationInputChange = (field, value) => {
    if (field === 'amountReceived') {
      const normalized = value.replace(/,/g, '').trim();
      if (normalized === '') {
        setVerificationForm((prev) => ({ ...prev, amountReceived: '' }));
        setVerificationErrors((prev) => ({ ...prev, amountReceived: '' }));
        return;
      }
      if (!/^\d*(\.\d{0,2})?$/.test(normalized)) return;
      setVerificationForm((prev) => ({ ...prev, amountReceived: normalized }));
      setVerificationErrors((prev) => ({ ...prev, amountReceived: '' }));
      return;
    }

    if (field === 'verificationCode') {
      const sanitizedCode = String(value || '').replace(/\D/g, '').slice(0, 6);
      setVerificationForm((prev) => ({ ...prev, verificationCode: sanitizedCode }));
      setVerificationErrors((prev) => ({ ...prev, verificationCode: '' }));
      return;
    }

    setVerificationForm((prev) => ({ ...prev, [field]: value }));
    setVerificationErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleConfirmVerifyCash = async () => {
    if (!verificationOrder) return;

    const nextErrors = {};
    const amountRaw = String(verificationForm.amountReceived || '').trim();
    const amountReceived = Number(amountRaw);
    const verificationCode = String(verificationForm.verificationCode || '').trim();
    const minAmount = Number(verificationOrder.totalPrice || 0);
    const maxReasonableAmount = Math.max(minAmount + 5000, minAmount * 5);

    if (!CURRENCY_INPUT_REGEX.test(amountRaw) || !Number.isFinite(amountReceived) || amountReceived <= 0) {
      nextErrors.amountReceived = 'Enter a valid amount with up to 2 decimals';
    } else if (amountReceived < minAmount) {
      nextErrors.amountReceived = `Amount must be at least LKR ${minAmount.toLocaleString()}`;
    } else if (amountReceived > maxReasonableAmount) {
      nextErrors.amountReceived = 'Amount looks too high. Please re-check before confirming';
    }

    if (!VERIFICATION_CODE_REGEX.test(verificationCode)) {
      nextErrors.verificationCode = 'Enter the 6-digit verification code';
    }

    if (Object.keys(nextErrors).length > 0) {
      setVerificationErrors(nextErrors);
      return;
    }

    setVerificationSubmitting(true);
    try {
      await paymentAPI.verifyPayment(verificationOrder._id, { amountReceived, verificationCode });
      const change = Math.max(0, amountReceived - (verificationOrder.totalPrice || 0));
      toast.success(`Cash payment verified${change > 0 ? ` · Change LKR ${change.toLocaleString()}` : ''}`);
      setVerificationOrder(null);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerificationSubmitting(false);
    }
  };

  const handleRejectCash = (order) => {
    setRejectOrder(order);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectOrder) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 5) {
      toast.error('Please provide a rejection reason (at least 5 characters)');
      return;
    }
    setRejectSubmitting(true);
    try {
      await paymentAPI.rejectPayment(rejectOrder._id, trimmed);
      toast.success('Payment rejected — student will be notified to resubmit.');
      setRejectOrder(null);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleOpenPickupVerify = (order) => {
    setPickupOrder(order);
    setPickupForm({ pickupCode: '' });
    setPickupErrors({});
  };

  const handleConfirmPickup = async () => {
    if (!pickupOrder) return;
    setPickupSubmitting(true);
    try {
      await orderAPI.verifyPickup(pickupOrder._id, { 
        pickupCode: pickupForm.pickupCode,
        qrValidated: true // Backend still logs it for activity, but doesn't require it as a hurdle
      });
      toast.success('Order delivered!');
      setPickupOrder(null);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setPickupSubmitting(false);
    }
  };

  const handlePickupByCode = async (codeToSubmit = null) => {
    const code = (codeToSubmit || codeInput).trim().toUpperCase();
    if (!PICKUP_CODE_REGEX.test(code)) {
        if (!codeToSubmit) toast.warn('Please enter a valid 6-character code');
        return;
    }
    setCodeVerifying(true);
    try {
      await orderAPI.pickupByCode(code);
      toast.success('Transfer complete! Order marked as delivered.');
      setCodeInput('');
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Pickup verification failed');
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
          <p className="text-gray-400 text-sm mt-1">
            Manage incoming orders and queue
            {selectedCanteenName ? ` · ${selectedCanteenName}` : ''}
          </p>
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
        <QueueBoard canteenIdProp={canteenId} isAdmin={false} />
      ) : tab === 'billing' ? (
        <BillingBoard canteenId={canteenId} />
      ) : (
        <>
          {!canteenId && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Select a canteen first to enable orders, billing, queue, and payment workflows.
            </div>
          )}

          {/* Pickup Code Entry Bar */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 mb-5">
            <form onSubmit={(e) => { e.preventDefault(); handlePickupByCode(); }} className="flex items-center gap-3">
              <QrCode size={18} className="text-indigo-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <input
                  value={codeInput}
                  onChange={e => {
                    setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                    setCodeInputTouched(true);
                  }}
                  placeholder="Enter pickup code (e.g. QK82F1)"
                  maxLength={6}
                  autoComplete="off"
                  className="w-full bg-transparent text-sm font-['Gilroy_Heavy'] text-indigo-700 placeholder-indigo-300 focus:outline-none tracking-widest uppercase"
                />
              </div>
              <span className={`text-[11px] font-['Gilroy_Heavy'] whitespace-nowrap ${
                codeInput.length === 6 ? 'text-indigo-600' : 'text-indigo-300'
              }`}>
                {codeInput.length}/6
              </span>
              <button
                type="button"
                onClick={() => setQrScannerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl text-xs font-['Gilroy_Heavy'] transition-colors whitespace-nowrap"
              >
                <QrCode size={13} /> Scan QR
              </button>
              <button
                type="submit"
                disabled={codeVerifying || !PICKUP_CODE_REGEX.test(codeInput.trim().toUpperCase())}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-['Gilroy_Heavy'] transition-colors whitespace-nowrap"
              >
                {codeVerifying ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={13} />}
                Confirm Delivery
              </button>
            </form>
            {/* Inline validation hints */}
            {codeInputTouched && codeInput.length > 0 && codeInput.length < 6 && (
              <p className="text-[11px] text-indigo-400 mt-1.5 pl-7">Enter all 6 characters of the pickup code</p>
            )}
          </div>

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
                  onVerifyCash={handleOpenVerifyCash}
                  onRejectCash={handleRejectCash}
                  onVerifyPickup={handleOpenPickupVerify}
                  canManagePayments={canManagePayments}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CashVerificationModal
        order={verificationOrder}
        form={verificationForm}
        errors={verificationErrors}
        submitting={verificationSubmitting}
        onChange={handleVerificationInputChange}
        onClose={() => setVerificationOrder(null)}
        onSubmit={handleConfirmVerifyCash}
      />

      <PickupVerificationModal
        order={pickupOrder}
        form={pickupForm}
        onChange={(updates) => setPickupForm({ ...pickupForm, ...updates })}
        submitting={pickupSubmitting}
        onClose={() => setPickupOrder(null)}
        onSubmit={handleConfirmPickup}
        onOpenScanner={() => setQrScannerOpen(true)}
      />

      <RejectPaymentModal
        order={rejectOrder}
        reason={rejectReason}
        onChange={setRejectReason}
        submitting={rejectSubmitting}
        onClose={() => setRejectOrder(null)}
        onSubmit={handleConfirmReject}
      />

      <ConfirmCancelAdminModal
        order={adminCancelOrder}
        reason={adminCancelReason}
        onChange={setAdminCancelReason}
        submitting={adminCancelSubmitting}
        onClose={() => setAdminCancelOrder(null)}
        onSubmit={handleConfirmAdminCancel}
      />
    </div>
  );
};

export default AdminOrdersPage;
