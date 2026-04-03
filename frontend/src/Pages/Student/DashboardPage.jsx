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
  Image as ImageIcon,
} from 'lucide-react';

import burgerImg from '../../assets/images/burger.png';
import pizzaImg from '../../assets/images/pizza.png';
import chickenImg from '../../assets/images/chicken.jpg';
import noodleImg from '../../assets/images/noodle.jpg';
import sushiImg from '../../assets/images/sushi.png';

import ReviewModal from '../../Components/ReviewModal';

const heroImages = [burgerImg, pizzaImg, chickenImg, noodleImg, sushiImg];

const quickActions = [
  { title: 'Browse Canteens', description: 'See what is open now and jump straight to the menu.', icon: Store, path: '/dashboard/canteens', accent: 'from-orange-600 to-amber-500' },
  { title: 'My Orders', description: 'Track pending, ready, and completed orders in one place.', icon: ReceiptText, path: '/dashboard/orders', accent: 'from-orange-500 to-rose-400' },
  { title: 'Reservations', description: 'Reserve a table before lunch rush starts.', icon: BadgeCheck, path: '/dashboard/reservations', accent: 'from-amber-500 to-orange-400' },
  { title: 'Meal Pass', description: 'Use your meal pass or follow your campus meal plan.', icon: Ticket, path: '/dashboard/meal-pass', accent: 'from-orange-400 to-amber-300' },
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

const CanteenCard = ({ canteen, onOpenMenu, onRate }) => (
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

        <p className="text-xs text-gray-400 mb-2">Contact: {canteen.email || 'No email set'}</p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRate(); }}
          className="flex items-center gap-1.5 font-['Gilroy_Bold'] text-amber-600 hover:text-amber-700 mb-5 transition-colors text-xs"
        >
          <Star size={12} strokeWidth={2.5} /> Rate & Review
        </button>

        <button
          type="button"
          onClick={() => onOpenMenu()}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-[24px] font-['Gilroy_Heavy'] text-sm tracking-wide shadow-lg shadow-orange-600/10 transition-all active:scale-95 text-center"
        >
          Order Now & Menu
        </button>
      </div>
    </button>
  </motion.div>
);

const StatCard = ({ icon: Icon, label, value, tone, small, dark }) => (
  <div className={`rounded-[28px] border ${dark ? 'border-white/20 bg-white/10' : 'border-white/60 bg-white/80'} ${small ? 'p-4' : 'p-5'} shadow-lg shadow-black/5 backdrop-blur-md ${tone}`}>
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className={`text-[10px] uppercase tracking-[0.2em] ${dark ? 'text-white/60' : 'text-gray-400'}`}>{label}</p>
        <p className={`mt-1 ${small ? 'text-2xl' : 'text-3xl'} font-['Gilroy_Heavy'] ${dark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      </div>
      <div className={`flex ${small ? 'h-10 w-10' : 'h-12 w-12'} items-center justify-center rounded-2xl ${dark ? 'bg-white/10 text-white' : 'bg-white text-orange-600 shadow-sm'}`}>
        <Icon size={small ? 18 : 20} />
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
  const [heroIndex, setHeroIndex] = useState(0);
  
  // Review Modal State
  const [reviewModal, setReviewModal] = useState({ isOpen: false, targetId: null, targetName: '', type: 'canteen' });

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

  useEffect(() => {
    const heroTimer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(heroTimer);
  }, []);

  const recentOrders = orders.slice(0, 3);
  const activeOrders = orders.filter((order) => !['completed', 'cancelled'].includes(order.status));
  const readyOrders = orders.filter((order) => order.status === 'ready').length;
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const greeting = getGreeting(now.getHours());

  return (
    <div className="relative mx-auto max-w-7xl overflow-hidden pb-10">
      <div className="absolute left-0 top-0 -z-10 h-72 w-72 rounded-full bg-orange-100/60 blur-3xl" />
      <div className="absolute right-0 top-24 -z-10 h-96 w-96 rounded-full bg-amber-100/60 blur-3xl" />

      <div className="space-y-10">
        <section className="relative overflow-hidden rounded-[40px] border border-gray-100 bg-gray-900 text-white shadow-2xl shadow-orange-200/20 group">
          {/* Hero Image Slider Background */}
          <div className="absolute inset-0">
            {heroImages.map((img, idx) => (
              <motion.div
                key={img}
                initial={{ opacity: 0 }}
                animate={{ opacity: heroIndex === idx ? 1 : 0 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                <img
                  src={img}
                  alt="Delicious food background"
                  className="h-full w-full object-cover scale-105 transition-transform duration-[10s] group-hover:scale-100"
                />
              </motion.div>
            ))}
            {/* Dark Overlays for Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-black/20" />
          </div>

          <div className="relative z-10 grid gap-6 px-10 py-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">

            <div className="space-y-3">
              <h1 className="max-w-3xl text-2xl font-['Gilroy_Heavy'] leading-tight tracking-tight md:text-3xl">
                {greeting}, {user?.name || 'Student'}.
                <span className="block text-orange-200">Your journey is ready.</span>
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/70">
                Explore canteens, open menus, add items to cart, follow order progress, and reserve a table when needed.
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
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-['Gilroy_Heavy'] text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700 hover:scale-105 active:scale-95"
              >
                Order Now <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/orders')}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-['Gilroy_Heavy'] text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
              >
                Track status <ShoppingBag size={16} />
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={ReceiptText} label="Active" value={loading ? '—' : activeOrders.length} dark small />
              <StatCard icon={BadgeCheck} label="Ready" value={loading ? '—' : readyOrders} dark small />
            </div>
            <StatCard icon={TimerReset} label="Total spent" value={loading ? '—' : formatMoney(totalSpent)} dark small />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.title}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              type="button"
              onClick={() => navigate(action.path)}
              className="group relative overflow-hidden rounded-[32px] border border-orange-50 bg-white p-6 text-left shadow-sm transition-all hover:shadow-2xl hover:shadow-orange-100/50"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-50/50 transition-transform group-hover:scale-150" />
              <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${action.accent} text-white shadow-lg shadow-orange-200/50`}>
                <Icon size={24} />
              </div>
              <h3 className="relative mt-5 text-xl font-['Gilroy_Heavy'] text-gray-900 group-hover:text-orange-600 transition-colors">{action.title}</h3>
              <p className="mt-2 min-h-[48px] text-sm leading-6 text-gray-500">{action.description}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-['Gilroy_Bold'] text-orange-600">
                  Open <ArrowRight size={15} />
                </span>
                <ChevronRight size={16} className="text-gray-200 group-hover:text-orange-300 group-hover:translate-x-1 transition-all" />
              </div>
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
              <div key={step.title} className="group flex gap-4 rounded-[28px] border border-orange-50 bg-white p-5 hover:border-orange-200 transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-sm font-['Gilroy_Heavy'] text-white transition-transform group-hover:scale-110">
                  0{index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-['Gilroy_Heavy'] text-gray-900 group-hover:text-orange-600 transition-colors">{step.title}</h3>
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
                onRate={() => setReviewModal({ isOpen: true, targetId: canteen._id, targetName: canteen.name, type: 'canteen' })}
              />
            ))}
          </div>
        )}
      </section>
      </div>

      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
        targetId={reviewModal.targetId}
        targetName={reviewModal.targetName}
        type={reviewModal.type}
        onReviewSubmitted={() => {
          // Re-fetch canteens to show updated stars
          api.get('/api/canteens').then(res => setCanteens(res.data));
        }}
      />
    </div>
  );
};

export default StudentDashboard;

