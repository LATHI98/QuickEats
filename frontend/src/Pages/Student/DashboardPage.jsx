import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  ArrowRight,
  Clock3,
  MapPin,
  ReceiptText,
  Salad,
  ShoppingBag,
  Star,
  Ticket,
  TimerReset,
  UtensilsCrossed,
  BadgeCheck,
  Sparkles,
  ChevronRight,
  Store,
  CheckCircle2,
} from 'lucide-react';

const quickActions = [
  { title: 'Browse Canteens', description: 'See what is open now and jump straight to the menu.', icon: Store, path: '/dashboard/canteens', accent: 'from-orange-500 to-amber-400' },
  { title: 'My Orders', description: 'Track pending, ready, and completed orders in one place.', icon: ReceiptText, path: '/dashboard/orders', accent: 'from-slate-900 to-slate-700' },
  { title: 'Reservations', description: 'Reserve a table before lunch rush starts.', icon: BadgeCheck, path: '/dashboard/reservations', accent: 'from-emerald-500 to-teal-400' },
  { title: 'Meal Pass', description: 'Use your meal pass or follow your campus meal plan.', icon: Ticket, path: '/dashboard/meal-pass', accent: 'from-indigo-500 to-violet-500' },
];

const flowSteps = [
  { title: 'Pick a canteen', text: 'Explore canteens, compare ratings, and choose where you want to eat.' },
  { title: 'Choose your meal', text: 'Open a menu, add items to cart, and keep everything in one order flow.' },
  { title: 'Pay and track', text: 'Confirm payment, follow status updates, and pick up when the order is ready.' },
];

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const formatMoney = (value) => `LKR ${Number(value || 0).toLocaleString()}`;

const getGreeting = (hour) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const CanteenCard = ({ canteen, onOpenMenu }) => (
  <motion.div
    whileHover={{ y: -6 }}
    transition={{ duration: 0.25 }}
    className="group overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-sm hover:shadow-2xl hover:shadow-orange-100/40 transition-all"
  >
    <button type="button" onClick={onOpenMenu} className="block w-full text-left">
      <div className="relative h-52 overflow-hidden">
        {canteen.photo ? (
          <img
            src={canteen.photo}
            alt={canteen.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 text-orange-400">
            <Store size={56} />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-5 text-white">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/70">Canteen</p>
              <h3 className="mt-1 text-2xl font-['Gilroy_Heavy'] leading-tight">{canteen.name || 'Untitled Canteen'}</h3>
            </div>
            <div className="rounded-2xl bg-white/15 px-3 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm font-['Gilroy_Bold']">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                {(canteen.ratings ?? 0).toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-['Gilroy_Bold'] text-gray-900">{canteen.owner || 'Owner not set'}</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <MapPin size={13} />
              <span>{canteen.openHours || 'Open hours not set'}</span>
            </p>
          </div>
          <ChevronRight size={16} className="mt-1 text-gray-300 transition-colors group-hover:text-orange-500" />
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-gray-500">
          {canteen.description || 'Browse menus, add to cart, and track orders from this canteen.'}
        </p>

        <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
          <span>{canteen.email || 'No email set'}</span>
          <span className="inline-flex items-center gap-1 text-orange-600 font-['Gilroy_Bold']">
            Open Menu <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </button>
  </motion.div>
);

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div className={`rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-lg shadow-black/5 backdrop-blur ${tone}`}>
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{label}</p>
        <p className="mt-2 text-3xl font-['Gilroy_Heavy'] text-gray-900">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [canteensRes, ordersRes] = await Promise.all([
          api.get('/api/canteens'),
          api.get('/api/orders/my').catch(() => ({ data: [] })),
        ]);

        setCanteens(normalizeList(canteensRes.data));
        setOrders(normalizeList(ordersRes.data));
      } catch (err) {
        console.error('Failed to load student dashboard', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const recentOrders = orders.slice(0, 3);
  const activeOrders = orders.filter((order) => !['completed', 'cancelled'].includes(order.status));
  const readyOrders = orders.filter((order) => order.status === 'ready').length;
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const greeting = getGreeting(now.getHours());

  return (
    <div className="relative mx-auto max-w-7xl space-y-10 overflow-hidden pb-10">
      <div className="absolute left-0 top-0 -z-10 h-72 w-72 rounded-full bg-orange-100/60 blur-3xl" />
      <div className="absolute right-0 top-24 -z-10 h-96 w-96 rounded-full bg-amber-100/60 blur-3xl" />

      <section className="overflow-hidden rounded-[40px] border border-orange-100 bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white shadow-2xl shadow-orange-200/30">
        <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.3fr_0.7fr] lg:px-10 lg:py-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-orange-200">
              <Sparkles size={14} /> QuickEats student flow
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-['Gilroy_Heavy'] leading-tight tracking-tight md:text-5xl">
                {greeting}, {user?.name || 'Student'}.
                <span className="block text-orange-300">Your order journey is ready right now.</span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                Start from one dashboard and move through the full flow: discover canteens, open menus, add items to cart,
                follow order progress, and reserve a table when needed.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
              <Clock3 size={14} />
              <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-white/50">·</span>
              <span>{now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard/canteens')}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-['Gilroy_Heavy'] text-white transition-colors hover:bg-orange-600"
              >
                Browse canteens <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/orders')}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-['Gilroy_Heavy'] text-white transition-colors hover:bg-white/10"
              >
                View my orders <ShoppingBag size={16} />
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={ReceiptText} label="Active orders" value={loading ? '—' : activeOrders.length} tone="" />
              <StatCard icon={BadgeCheck} label="Ready now" value={loading ? '—' : readyOrders} tone="" />
            </div>
            <StatCard icon={TimerReset} label="Total spent" value={loading ? '—' : formatMoney(totalSpent)} tone="" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.title}
              whileHover={{ y: -4 }}
              type="button"
              onClick={() => navigate(action.path)}
              className="group rounded-[30px] border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:shadow-xl"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${action.accent} text-white shadow-lg shadow-orange-100`}>
                <Icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-['Gilroy_Heavy'] text-gray-900">{action.title}</h3>
              <p className="mt-2 min-h-[48px] text-sm leading-6 text-gray-500">{action.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-['Gilroy_Bold'] text-orange-600 transition-transform group-hover:translate-x-1">
                Open <ArrowRight size={15} />
              </span>
            </motion.button>
          );
        })}
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Order flow</p>
              <h2 className="mt-2 text-2xl font-['Gilroy_Heavy'] text-gray-900">How the system works</h2>
            </div>
            <div className="rounded-2xl bg-orange-50 px-3 py-2 text-sm font-['Gilroy_Bold'] text-orange-700">
              Student journey
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {flowSteps.map((step, index) => (
              <div key={step.title} className="flex gap-4 rounded-[28px] border border-gray-100 bg-gray-50/70 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-sm font-['Gilroy_Heavy'] text-white">
                  0{index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-['Gilroy_Heavy'] text-gray-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-500">{step.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/order-tracking')}
              className="flex items-center justify-between rounded-[26px] bg-orange-500 px-5 py-4 text-left text-white transition-colors hover:bg-orange-600"
            >
              <span>
                <span className="block text-xs uppercase tracking-[0.2em] text-white/75">Track orders</span>
                <span className="mt-1 block text-base font-['Gilroy_Heavy']">Live pickup progress</span>
              </span>
              <Clock3 size={20} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/reservations')}
              className="flex items-center justify-between rounded-[26px] border border-gray-200 bg-white px-5 py-4 text-left transition-colors hover:border-orange-200 hover:bg-orange-50"
            >
              <span>
                <span className="block text-xs uppercase tracking-[0.2em] text-gray-400">Reserve seating</span>
                <span className="mt-1 block text-base font-['Gilroy_Heavy'] text-gray-900">Book a table early</span>
              </span>
              <BadgeCheck size={20} className="text-orange-600" />
            </button>
          </div>
        </div>

        <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Recent activity</p>
              <h2 className="mt-2 text-2xl font-['Gilroy_Heavy'] text-gray-900">Your latest orders</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/orders')}
              className="text-sm font-['Gilroy_Bold'] text-orange-600"
            >
              See all
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-[26px] border border-dashed border-gray-200 px-5 py-8 text-center text-sm text-gray-400">
                Loading recent orders...
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-gray-200 px-5 py-8 text-center text-sm text-gray-400">
                No orders yet. Place your first one from a canteen menu.
              </div>
            ) : (
              recentOrders.map((order) => (
                <button
                  key={order._id}
                  type="button"
                  onClick={() => navigate('/dashboard/orders')}
                  className="w-full rounded-[26px] border border-gray-100 bg-gray-50/60 px-5 py-4 text-left transition-all hover:border-orange-200 hover:bg-orange-50/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-['Gilroy_Heavy'] text-gray-900">Order #{order.queueNumber || '—'}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {order.canteen?.name || 'Canteen'} · {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-['Gilroy_Heavy'] uppercase tracking-widest text-gray-600 shadow-sm">
                      {order.status || 'pending'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>{(order.items?.length || 0)} item(s)</span>
                    <span className="font-['Gilroy_Heavy'] text-gray-900">{formatMoney(order.totalPrice)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Canteen network</p>
            <h2 className="mt-2 text-2xl font-['Gilroy_Heavy'] text-gray-900">Choose where to eat</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/canteens')}
            className="hidden items-center gap-2 text-sm font-['Gilroy_Bold'] text-orange-600 md:inline-flex"
          >
            View all canteens <ArrowRight size={15} />
          </button>
        </div>

        {loading ? (
          <div className="rounded-[32px] border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-400">
            Loading canteens...
          </div>
        ) : canteens.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-400">
            No canteens available yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {canteens.slice(0, 6).map((canteen) => (
              <CanteenCard
                key={canteen._id}
                canteen={canteen}
                onOpenMenu={() => navigate(`/dashboard/canteens/${canteen._id}/menu`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;

