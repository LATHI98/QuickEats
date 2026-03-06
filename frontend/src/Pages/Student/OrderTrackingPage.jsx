import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QrCode, Clock, Hash, Users, RefreshCw, ChefHat, Package, Zap, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { orderAPI, queueAPI } from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_STEPS = [
  { id: 'pending', label: 'Order Placed', icon: Hash, description: 'Canteen has received your order' },
  { id: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Chef is working their magic' },
  { id: 'ready', label: 'Ready for Pickup', icon: Package, description: 'Grab your meal at the counter' },
];

const StatusTracker = ({ currentStatus }) => {
  const currentIndex = STATUS_STEPS.findIndex(s => s.id === currentStatus);

  return (
    <div className="relative mb-10 mt-4">
      <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-gray-100" />

      <div className="space-y-8 relative">
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex || currentStatus === 'completed';
          const isActive = index === currentIndex;
          const StepIcon = step.icon;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 ring-4 ring-orange-50' :
                      'bg-white border-2 border-gray-200 text-gray-300'
                  }`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : <StepIcon size={20} />}
                </div>
                {isActive && (
                  <motion.div
                    layoutId="pulse"
                    className="absolute inset-0 rounded-full bg-orange-500 opacity-20"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </div>

              <div className="pt-1">
                <h3 className={`font-['Gilroy_Heavy'] text-sm ${isCompleted ? 'text-green-600' : isActive ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                  {step.label}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 font-['Gilroy_Medium']">
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const OrderTrackingPage = () => {
  const [activeOrder, setActiveOrder] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [nowServing, setNowServing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const notifiedRef = useRef(false);

  const fetchActiveOrder = useCallback(async () => {
    try {
      // Find the most relevant active order
      const ordersRes = await orderAPI.getMyOrders();
      const allOrders = ordersRes.data.data || [];
      const active = allOrders.find(o => ['pending', 'preparing', 'ready'].includes(o.status));

      if (active) {
        const detail = await orderAPI.getMyOrderById(active._id);
        return detail.data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const fetchQueueInfo = useCallback(async (order) => {
    if (!order?.canteen) return;
    try {
      const canteenId = typeof order.canteen === 'object' ? order.canteen._id : order.canteen;
      const [posRes, statusRes] = await Promise.all([
        queueAPI.getMyPosition(canteenId, order._id),
        queueAPI.getStatus(canteenId),
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

  useEffect(() => {
    const interval = setInterval(() => refresh(true), 15000); // More frequent updates for "live" feel
    return () => clearInterval(interval);
  }, [refresh]);

  // "2 Minutes Away" notification logic
  useEffect(() => {
    if (activeOrder && activeOrder.status === 'preparing' && !notifiedRef.current) {
      const pickupTime = new Date(activeOrder.estimatedPickupTime).getTime();
      const now = new Date().getTime();
      const diffMinutes = (pickupTime - now) / (1000 * 60);

      if (diffMinutes <= 2 && diffMinutes > 0) {
        toast.info("🍕 Your order is almost ready! Head to the counter.", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        notifiedRef.current = true;
      }
    }
  }, [activeOrder]);

  const handleSkipQueue = async () => {
    if (!activeOrder) return;
    setClaiming(true);
    try {
      await queueAPI.skipQueue(activeOrder._id);
      toast.success("Priority activated! We'll call you as soon as possible.", { icon: <Zap fill="currentColor" /> });
      await refresh(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to skip queue");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto py-8 px-4 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-['Gilroy_Heavy'] text-gray-900 tracking-tight">Track Order</h1>
          <p className="text-gray-400 text-sm mt-1 font-['Gilroy_Medium']">Live updates from the kitchen</p>
        </div>
        <button
          onClick={() => refresh(true)}
          className={`p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all ${refreshing ? 'animate-spin-slow' : ''}`}
        >
          <RefreshCw size={20} className="text-gray-600" />
        </button>
      </div>

      {!activeOrder ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-gray-50 rounded-[40px] px-6"
        >
          <div className="w-24 h-24 bg-white shadow-sm rounded-[35px] flex items-center justify-center mx-auto mb-6 text-orange-400">
            <QrCode size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-['Gilroy_Heavy'] text-gray-900 mb-2">No Active Orders</h2>
          <p className="text-gray-400 text-sm font-['Gilroy_Medium'] max-w-xs mx-auto mb-8">
            When you place an order, its live progress and pickup details will appear here.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard/canteens'}
            className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-['Gilroy_Heavy'] hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
          >
            Order Something Fresh
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Animated Status Section */}
          <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
            <StatusTracker currentStatus={activeOrder.status} />

            {/* Dynamic Sub-status */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeOrder.status}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl text-orange-700"
              >
                <Clock size={18} />
                <span className="text-sm font-['Gilroy_Heavy']">
                  Estimated Pickup: {new Date(activeOrder.estimatedPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {activeOrder.status === 'ready' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-indigo-600 rounded-[32px] p-8 text-center text-white shadow-xl shadow-indigo-100"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-['Gilroy_Heavy'] uppercase tracking-widest mb-6">
                  <Zap size={10} fill="currentColor" /> Ready to Collect
                </div>

                <div className="bg-white p-6 rounded-[32px] mb-6 inline-block mx-auto">
                  <img
                    src={activeOrder.qrCodeData || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${activeOrder.pickupCode}&qzone=1&color=4338ca`}
                    alt="Pickup QR"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <p className="text-5xl font-['Gilroy_Heavy'] tracking-[0.2em] mb-2">{activeOrder.pickupCode}</p>
                <p className="text-indigo-100 text-sm font-['Gilroy_Medium']">Show this code at the canteen counter</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 rounded-[28px] p-6 text-center">
              <Hash size={20} className="text-orange-500 mx-auto mb-2" />
              <p className="text-4xl font-['Gilroy_Heavy'] text-gray-900">{activeOrder.queueNumber}</p>
              <p className="text-[10px] text-gray-400 font-['Gilroy_Heavy'] uppercase tracking-wider mt-1">Your Token</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-[28px] p-6 text-center">
              <Users size={20} className="text-orange-500 mx-auto mb-2" />
              <p className="text-4xl font-['Gilroy_Heavy'] text-gray-900">
                {queuePosition !== null ? queuePosition : '—'}
              </p>
              <p className="text-[10px] text-gray-400 font-['Gilroy_Heavy'] uppercase tracking-wider mt-1">Orders Ahead</p>
            </div>
          </div>

          {/* Priority / Skip Queue */}
          {!activeOrder.isPriorityClaimed && activeOrder.status !== 'ready' && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gray-900 rounded-[28px] p-6 text-white relative overflow-hidden group"
            >
              <div className="relative z-10">
                <h3 className="text-lg font-['Gilroy_Heavy'] mb-1 flex items-center gap-2">
                  <Zap size={18} className="text-orange-400" fill="currentColor" /> Already there?
                </h3>
                <p className="text-xs text-gray-400 mb-6 font-['Gilroy_Medium'] leading-relaxed">
                  Let the canteen know you've arrived and get bumped to the front.
                </p>
                <button
                  onClick={handleSkipQueue}
                  disabled={claiming}
                  className="w-full bg-white text-gray-900 py-4 rounded-2xl font-['Gilroy_Heavy'] transition-all hover:bg-orange-500 hover:text-white disabled:opacity-50"
                >
                  {claiming ? 'Activating Priority...' : "I'm Here! Skip the Queue"}
                </button>
              </div>
              <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-gray-800 rounded-full blur-[60px] group-hover:bg-orange-950 transition-colors" />
            </motion.div>
          )}

          {activeOrder.isPriorityClaimed && (
            <div className="bg-green-500 rounded-[28px] p-6 text-white flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Zap size={24} fill="currentColor" />
              </div>
              <div>
                <p className="text-xs font-['Gilroy_Heavy'] uppercase tracking-widest opacity-80">Priority Boost</p>
                <p className="font-['Gilroy_Heavy'] text-lg">You're at the front! 🚀</p>
              </div>
            </div>
          )}

          {/* Order Content */}
          <div className="bg-white border border-gray-100 rounded-[32px] p-8">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-50">
              <div>
                <p className="text-[10px] text-gray-400 font-['Gilroy_Heavy'] uppercase tracking-widest">Ordered from</p>
                <h4 className="font-['Gilroy_Heavy'] text-gray-900">{typeof activeOrder.canteen === 'object' ? activeOrder.canteen.name : 'Canteen'}</h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-['Gilroy_Heavy'] uppercase tracking-widest">Total Bill</p>
                <p className="font-['Gilroy_Heavy'] text-orange-600">LKR {activeOrder.totalPrice?.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-4">
              {activeOrder.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-[10px] font-['Gilroy_Heavy'] text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                      {item.quantity}x
                    </div>
                    <span className="text-sm font-['Gilroy_Medium'] text-gray-600 group-hover:text-gray-900 transition-colors">{item.name}</span>
                  </div>
                  <span className="text-xs font-['Gilroy_Heavy'] text-gray-400">LKR {(item.unitPrice * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;
