import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  Clock3,
  DollarSign,
  Grid3x3,
  LayoutDashboard,
  MapPin,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  UtensilsCrossed,
  AlertCircle,
  ChevronRight,
  Activity,
  ChefHat,
  MessageSquare,
  TrendingDown,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
} from 'lucide-react';
import { reviewAPI } from '../../services/api';

const getGreeting = (hour) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80', // Kitchen/Canteen
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80', // Gourmet Food
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80', // Healthy Salad
];

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const formatMoney = (value) => `LKR ${Number(value || 0).toLocaleString()}`;

const quickActions = [
  { label: 'Manage Canteens', description: 'Create, update, and review all canteens.', icon: Store, path: '/admin/canteens', accent: 'from-orange-600 to-orange-400' },
  { label: 'Tables', description: 'Adjust seating and table capacity.', icon: Grid3x3, path: '/admin/tables', accent: 'from-orange-500 to-amber-500' },
  { label: 'Reservations', description: 'Review confirmed and pending bookings.', icon: Calendar, path: '/admin/reservations', accent: 'from-amber-600 to-orange-500' },
  { label: 'Menu Items', description: 'Control menu coverage across canteens.', icon: UtensilsCrossed, path: '/admin/menu', accent: 'from-orange-600 to-amber-400' },
  { label: 'Orders', description: 'Inspect the live order pipeline.', icon: ShoppingBag, path: '/admin/orders', accent: 'from-orange-500 to-orange-700' },
  { label: 'User Control', description: 'Manage accounts and system roles.', icon: Users, path: '/admin/users', accent: 'from-amber-500 to-orange-600' },
];

const statCardTone = [
  'from-blue-50 to-white',
  'from-emerald-50 to-white',
  'from-orange-50 to-white',
  'from-violet-50 to-white',
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [heroIndex, setHeroIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, positive: 0, neutral: 0, negative: 0 });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [canteensRes, reservationsRes, reviewsRes] = await Promise.all([
          api.get('/api/canteens'),
          api.get('/api/reservations/admin/all').catch(() => ({ data: [] })),
          reviewAPI.getAll().catch(() => ({ data: { data: [] } })),
        ]);

        setCanteens(normalizeList(canteensRes.data));
        setReservations(normalizeList(reservationsRes.data));
        
        const reviewList = normalizeList(reviewsRes.data);
        setReviews(reviewList);
        
        // Calculate stats
        if (reviewList.length > 0) {
          const avg = reviewList.reduce((acc, r) => acc + r.rating, 0) / reviewList.length;
          const pos = reviewList.filter(r => r.rating >= 4).length;
          const neg = reviewList.filter(r => r.rating <= 2).length;
          const neu = reviewList.length - pos - neg;
          setReviewStats({
            average: avg.toFixed(1),
            positive: ((pos / reviewList.length) * 100).toFixed(0),
            neutral: ((neu / reviewList.length) * 100).toFixed(0),
            negative: ((neg / reviewList.length) * 100).toFixed(0)
          });
        }
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
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
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(heroTimer);
  }, []);

  const greeting = getGreeting(now.getHours());
  const confirmedReservations = useMemo(() => reservations.filter((reservation) => reservation.status === 'confirmed').length, [reservations]);
  const cancelledReservations = useMemo(() => reservations.filter((reservation) => reservation.status === 'cancelled').length, [reservations]);
  const pendingReservations = useMemo(() => reservations.filter((reservation) => reservation.status !== 'confirmed' && reservation.status !== 'cancelled').length, [reservations]);
  const todayReservations = useMemo(() => {
    const today = new Date();
    return reservations.filter((reservation) => {
      const reservationDate = new Date(reservation.reservationDate);
      return (
        reservationDate.getFullYear() === today.getFullYear() &&
        reservationDate.getMonth() === today.getMonth() &&
        reservationDate.getDate() === today.getDate()
      );
    }).length;
  }, [reservations]);
  const topCanteens = useMemo(
    () => [...canteens].sort((a, b) => (Number(b.ratings || 0) - Number(a.ratings || 0))).slice(0, 3),
    [canteens]
  );
  const recentActivity = useMemo(() => {
    const canteenCount = canteens.length;
    return [
      {
        id: 1,
        label: `${canteenCount} canteen${canteenCount === 1 ? '' : 's'} available`,
        detail: 'Active locations ready for menu and order management.',
        time: 'Live now',
        icon: Store,
        tone: 'text-orange-600',
        bg: 'bg-orange-50',
      },
      {
        id: 2,
        label: `${todayReservations} reservation${todayReservations === 1 ? '' : 's'} today`,
        detail: 'Seats booked across the platform for the current day.',
        time: 'Today',
        icon: Calendar,
        tone: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
      {
        id: 3,
        label: `${confirmedReservations} confirmed reservations`,
        detail: 'Bookings that are already locked in and visible to staff.',
        time: 'Current',
        icon: CheckCircle2,
        tone: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      {
        id: 4,
        label: `${pendingReservations} pending reservations`,
        detail: 'Items still awaiting action or confirmation.',
        time: 'Review',
        icon: AlertCircle,
        tone: 'text-amber-600',
        bg: 'bg-amber-50',
      },
    ];
  }, [canteens.length, todayReservations, confirmedReservations, pendingReservations]);

  const stats = [
    { label: 'Total Canteens', value: canteens.length, icon: Store, tone: statCardTone[0], note: 'All registered outlets' },
    { label: 'Reservations Today', value: todayReservations, icon: Calendar, tone: statCardTone[1], note: 'Bookings scheduled now' },
    { label: 'Confirmed', value: confirmedReservations, icon: CheckCircle2, tone: statCardTone[2], note: 'Confirmed reservations' },
    { label: 'Cancelled', value: cancelledReservations, icon: AlertCircle, tone: statCardTone[3], note: 'Cancelled reservations' },
  ];

  return (
    <div className="relative mx-auto max-w-7xl space-y-10 overflow-hidden pb-10">
      <div className="absolute left-0 top-0 -z-10 h-72 w-72 rounded-full bg-orange-100/70 blur-3xl" />
      <div className="absolute right-0 top-24 -z-10 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />

      <section className="relative overflow-hidden rounded-[40px] border border-orange-100 bg-gray-900 text-white shadow-2xl shadow-orange-200/20 group mt-0">
        {/* Hero Slider Background */}
        <div className="absolute inset-0">
          {HERO_IMAGES.map((img, idx) => (
            <motion.div
              key={img}
              initial={{ opacity: 0 }}
              animate={{ opacity: heroIndex === idx ? 1 : 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <img
                src={img}
                alt="System Admin"
                className="h-full w-full object-cover scale-105 transition-transform duration-[10s] group-hover:scale-100 opacity-50"
              />
            </motion.div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 grid gap-8 px-10 py-6 lg:grid-cols-[1fr_1fr] lg:py-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/90 backdrop-blur">
              <Sparkles size={12} /> Admin control center
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
                {greeting}, {user?.name || 'Admin'}.
                <span className="block text-orange-200">Campus dining at a glance.</span>
              </h1>
              <p className="max-w-2xl text-xs leading-5 text-white/70">
                Manage canteens, reservations, and system-wide settings from your unified control board.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-[10px] text-white/90 backdrop-blur">
              <Clock3 size={11} />
              <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-white/50">·</span>
              <span>{now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/canteens')}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-50"
              >
                Canteens <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/reservations')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/15"
              >
                Reservations <Calendar size={14} />
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">System Monitoring</p>
              <div className="mt-2 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-extrabold text-white">OPERATIONAL</p>
                  <p className="mt-1 flex items-center gap-2 text-[10px] text-white/70">
                    <Activity size={12} />
                    <span>Realtime systems synchronized</span>
                  </p>
                </div>
                <div className="rounded-2xl bg-white/15 px-3 py-1.5 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Outlets</p>
                  <p className="text-base font-extrabold text-white">{canteens.length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[24px] border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Reservations</p>
                <p className="mt-1 text-xl font-extrabold text-white">{reservations.length}</p>
              </div>
              <div className="rounded-[24px] border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Platform</p>
                <p className="mt-1 text-xl font-extrabold text-white">100%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              whileHover={{ y: -4 }}
              className={`rounded-[28px] border border-white/70 bg-gradient-to-br ${stat.tone} p-5 shadow-lg shadow-black/5 backdrop-blur`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-extrabold text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{stat.note}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
                  <Icon size={20} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-8">
          {/* Sentiment Analysis Card */}
          <div className="rounded-[36px] border border-gray-100 bg-white p-8 shadow-sm overflow-hidden relative group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity" />
             
             <div className="relative z-10">
               <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Customer Sentiment</p>
               <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Feedback Analytics</h2>
               
               <div className="mt-8 flex items-end gap-6">
                 <div className="text-5xl font-black text-orange-600 tracking-tighter">{reviewStats.average}</div>
                 <div className="pb-1">
                    <div className="flex gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14} fill={s <= Math.round(reviewStats.average) ? '#f97316' : 'transparent'} className={s <= Math.round(reviewStats.average) ? 'text-orange-500' : 'text-gray-200'} />
                      ))}
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Platform Rating</p>
                 </div>
               </div>

               <div className="mt-10 space-y-5">
                 <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-emerald-600 flex items-center gap-1.5"><ThumbsUp size={12} /> Positive</span>
                     <span className="text-gray-900">{reviewStats.positive}%</span>
                   </div>
                   <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: `${reviewStats.positive}%` }} className="h-full bg-emerald-500 rounded-full" />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-amber-500 flex items-center gap-1.5"><Activity size={12} /> Neutral</span>
                     <span className="text-gray-900">{reviewStats.neutral}%</span>
                   </div>
                   <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: `${reviewStats.neutral}%` }} className="h-full bg-amber-400 rounded-full" />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-red-500 flex items-center gap-1.5"><ThumbsDown size={12} /> Negative</span>
                     <span className="text-gray-900">{reviewStats.negative}%</span>
                   </div>
                   <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: `${reviewStats.negative}%` }} className="h-full bg-red-500 rounded-full" />
                   </div>
                 </div>
               </div>

               <div className="mt-10 pt-8 border-t border-gray-50 grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100/50">
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Total Reviews</p>
                    <p className="text-xl font-black text-gray-900">{reviews.length}</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Response Rate</p>
                    <p className="text-xl font-black text-gray-900">84%</p>
                 </div>
               </div>
             </div>
          </div>

          <div className="rounded-[36px] border border-gray-100 bg-white p-8 shadow-sm">
             <div className="flex items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-orange-500" />
                  Top Canteens
                </h3>
                <BarChart3 size={18} className="text-gray-300" />
             </div>
             <div className="space-y-3">
               {topCanteens.map((canteen, index) => (
                 <div key={canteen._id} className="group flex items-center justify-between p-4 rounded-[24px] bg-gray-50 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-orange-100">
                   <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${index === 0 ? 'bg-orange-600 text-white shadow-orange-200' : 'bg-white text-gray-400'}`}>
                       {index + 1}
                     </div>
                     <div>
                       <p className="text-sm font-black text-gray-900">{canteen.name}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{canteen.ratings >= 4.5 ? '⭐ Top Performer' : 'Good Quality'}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-black text-orange-600">{Number(canteen.ratings || 0).toFixed(1)}</p>
                     <p className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">System Score</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Order command center</p>
                <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Live order operations</h2>
              </div>
              <button type="button" onClick={() => navigate('/admin/orders')} className="text-sm font-bold text-orange-600">
                Open orders hub
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/orders')}
                  className="rounded-xl border border-orange-100 bg-white px-4 py-3 text-left hover:bg-orange-50 transition-colors"
                >
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-extrabold">Orders</p>
                  <p className="text-sm font-extrabold text-gray-900 mt-1">Track live order flow</p>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/orders')}
                  className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-left hover:bg-emerald-50 transition-colors"
                >
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-extrabold">Billing</p>
                  <p className="text-sm font-extrabold text-gray-900 mt-1">Review payment state</p>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/orders')}
                  className="rounded-xl border border-indigo-100 bg-white px-4 py-3 text-left hover:bg-indigo-50 transition-colors"
                >
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-extrabold">Queue Board</p>
                  <p className="text-sm font-extrabold text-gray-900 mt-1">Manage serving sequence</p>
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-4 rounded-[26px] border border-gray-100 bg-gray-50/60 p-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${activity.bg} ${activity.tone}`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-extrabold text-gray-900">{activity.label}</p>
                          <p className="mt-1 text-sm leading-6 text-gray-500">{activity.detail}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 shadow-sm">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Reviews Mini Feed */}
          <div className="rounded-[36px] border border-gray-100 bg-white p-8 shadow-sm">
             <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Decision making</p>
                  <h3 className="mt-1 text-lg font-extrabold text-gray-900">Recent Feedback Feed</h3>
                </div>
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <MessageCircle size={18} />
                </div>
             </div>
             
             <div className="space-y-4">
               {reviews.length === 0 ? (
                 <div className="py-10 text-center border-2 border-dashed border-gray-50 rounded-[24px]">
                   <p className="text-xs font-bold text-gray-300 uppercase tracking-widest italic">No recent feedback</p>
                 </div>
               ) : (
                 reviews.slice(0, 4).map((rev, idx) => (
                   <div key={idx} className="p-4 rounded-[24px] bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={8} fill={s <= rev.rating ? '#f97316' : 'transparent'} className={s <= rev.rating ? 'text-orange-500' : 'text-gray-200'} />
                          ))}
                        </div>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-600 italic line-clamp-2 leading-relaxed">"{rev.comment || 'No comment provided'}"</p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-orange-200" />
                        <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest">{rev.canteenId?.name || rev.foodId?.name || 'Item/Canteen'}</span>
                      </div>
                   </div>
                 ))
               )}
               {reviews.length > 4 && (
                 <button className="w-full py-3 text-[10px] font-black text-orange-600 uppercase tracking-widest hover:bg-orange-50 rounded-xl transition-all">
                   View All {reviews.length} Reviews
                 </button>
               )}
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
