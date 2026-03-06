import React, { useState, useEffect, useCallback } from 'react';
import { QrCode, Clock, Hash, Users, RefreshCw, ChefHat, Package } from 'lucide-react';
import { orderAPI, queueAPI } from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  preparing: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
};

const OrderTrackingPage = () => {
  const [activeOrder, setActiveOrder] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [nowServing, setNowServing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveOrder = useCallback(async () => {
    try {
      for (const status of ['ready', 'preparing', 'pending']) {
        const res = await orderAPI.getMyOrders({ status });
        const orders = res.data.data || [];
        if (orders.length > 0) {
          const detail = await orderAPI.getMyOrderById(orders[0]._id);
          return detail.data.data;
        }
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const fetchQueueInfo = useCallback(async (order) => {
    if (!order?.canteen) return;
    try {
      const [posRes, statusRes] = await Promise.all([
        queueAPI.getMyPosition(order.canteen, order._id),
        queueAPI.getStatus(order.canteen),
      ]);
      setQueuePosition(posRes.data.data?.ordersAhead ?? null);
      setNowServing(statusRes.data.data?.nowServing ?? null);
    } catch {
      // Queue info is non-critical
    }
  }, []);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const order = await fetchActiveOrder();
    setActiveOrder(order);
    if (order) await fetchQueueInfo(order);
    setLoading(false);
    setRefreshing(false);
  }, [fetchActiveOrder, fetchQueueInfo]);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => refresh(true), 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-['Gilroy_Heavy'] text-gray-900">Order Tracking</h1>
          <p className="text-gray-400 text-sm mt-1">Your active order & queue position</p>
        </div>
        <button
          onClick={() => refresh(true)}
          className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          title="Refresh"
        >
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>

      {!activeOrder ? (
        /* Empty state */
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-orange-50 rounded-[30px] flex items-center justify-center mx-auto mb-4 text-orange-400">
            <QrCode size={40} />
          </div>
          <p className="text-gray-900 font-['Gilroy_Heavy'] text-lg mb-1">No Active Order</p>
          <p className="text-gray-400 text-sm font-['Gilroy_Medium'] max-w-xs mx-auto">
            Place an order and your pickup code and queue position will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status banner */}
          <div className={`rounded-2xl px-5 py-3 flex items-center gap-3 ${STATUS_COLOR[activeOrder.status] || 'bg-gray-100 text-gray-600'}`}>
            {activeOrder.status === 'ready' ? <Package size={18} /> : <ChefHat size={18} />}
            <span className="font-['Gilroy_Heavy'] text-sm">
              {activeOrder.status === 'ready' && 'Your order is ready for pickup!'}
              {activeOrder.status === 'preparing' && 'Your order is being prepared...'}
              {activeOrder.status === 'pending' && 'Order placed — awaiting preparation'}
            </span>
          </div>

          {/* Pickup QR Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm">
            {activeOrder.status === 'ready' && activeOrder.pickupCode ? (
              <>
                <p className="text-xs font-['Gilroy_Heavy'] text-indigo-400 uppercase tracking-widest mb-3">Show this at the counter</p>
                <img
                  src={activeOrder.qrCodeData || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${activeOrder.pickupCode}&qzone=1&color=4338ca`}
                  alt="Pickup QR Code"
                  className="w-52 h-52 mx-auto rounded-xl mb-3"
                />
                <p className="text-4xl font-['Gilroy_Heavy'] text-indigo-700 tracking-widest mb-1">{activeOrder.pickupCode}</p>
                <p className="text-xs text-indigo-300">Staff will enter this code to confirm your delivery</p>
              </>
            ) : (
              <>
                <QrCode size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-['Gilroy_Medium']">
                  {activeOrder.status === 'pending' && 'Your QR code will appear here once your order is ready.'}
                  {activeOrder.status === 'preparing' && 'Still preparing — your QR code will show when ready!'}
                </p>
              </>
            )}
            <p className="text-xs text-gray-400 mt-4">Order #{activeOrder.queueNumber}</p>
          </div>

          {/* Queue & Pickup info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-2xl p-4 text-center">
              <Hash size={18} className="text-orange-400 mx-auto mb-1" />
              <p className="text-3xl font-['Gilroy_Heavy'] text-orange-600">{activeOrder.queueNumber}</p>
              <p className="text-xs text-gray-500">My Queue #</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-4 text-center">
              <Clock size={18} className="text-orange-400 mx-auto mb-1" />
              <p className="text-lg font-['Gilroy_Heavy'] text-orange-600">
                {new Date(activeOrder.estimatedPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-gray-500">Pickup Time</p>
            </div>
          </div>

          {/* Live queue stats */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <Users size={16} className="text-gray-400 mx-auto mb-1" />
              <p className="text-2xl font-['Gilroy_Heavy'] text-gray-800">
                {queuePosition !== null ? queuePosition : '—'}
              </p>
              <p className="text-xs text-gray-400">Orders Ahead</p>
            </div>
            <div className="text-center">
              <Package size={16} className="text-gray-400 mx-auto mb-1" />
              <p className="text-2xl font-['Gilroy_Heavy'] text-gray-800">
                {nowServing !== null ? `#${nowServing}` : '—'}
              </p>
              <p className="text-xs text-gray-400">Now Serving</p>
            </div>
          </div>

          {/* Items summary */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-sm font-['Gilroy_Heavy'] text-gray-700 mb-3">Order Summary</p>
            <div className="space-y-2">
              {activeOrder.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} × {item.quantity}</span>
                  <span className="text-gray-800 font-medium">LKR {(item.unitPrice * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-['Gilroy_Heavy'] pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-orange-600">LKR {activeOrder.totalPrice?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;
