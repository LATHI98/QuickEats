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
} from 'lucide-react';

const getGreeting = (hour) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const formatMoney = (value) => `LKR ${Number(value || 0).toLocaleString()}`;

const quickActions = [
  { label: 'Manage Canteens', description: 'Create, update, and review all canteens.', icon: Store, path: '/admin/canteens', accent: 'from-orange-500 to-amber-400' },
  { label: 'Tables', description: 'Adjust seating and table capacity.', icon: Grid3x3, path: '/admin/tables', accent: 'from-emerald-500 to-teal-400' },
  { label: 'Reservations', description: 'Review confirmed and pending bookings.', icon: Calendar, path: '/admin/reservations', accent: 'from-indigo-500 to-violet-500' },
  { label: 'Menu Items', description: 'Control menu coverage across canteens.', icon: UtensilsCrossed, path: '/admin/menu', accent: 'from-slate-900 to-slate-700' },
  { label: 'Orders', description: 'Inspect the live order pipeline.', icon: ShoppingBag, path: '/admin/orders', accent: 'from-rose-500 to-orange-500' },
  { label: 'User Control', description: 'Manage accounts and system roles.', icon: Users, path: '/admin/users', accent: 'from-cyan-500 to-blue-500' },
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

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [canteensRes, reservationsRes] = await Promise.all([
          api.get('/api/canteens'),
          api.get('/api/reservations/admin/all').catch(() => ({ data: [] })),
        ]);

        setCanteens(normalizeList(canteensRes.data));
        setReservations(normalizeList(reservationsRes.data));
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

      <section className="overflow-hidden rounded-[40px] border border-orange-100 bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white shadow-2xl shadow-orange-200/30">
        <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/90 backdrop-blur">
              <Sparkles size={14} /> Admin control center
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-['Gilroy_Heavy'] leading-tight tracking-tight md:text-5xl">
                {greeting}, {user?.name || 'Admin'}.
                <span className="block text-white/90">Manage the campus dining system from one clean view.</span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/85 md:text-lg">
                Keep an eye on canteens, reservations, tables, menu coverage, and account management without jumping between
                disconnected screens.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
              <Clock3 size={14} />
              <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-white/50">·</span>
              <span>{now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/canteens')}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-['Gilroy_Heavy'] text-orange-600 transition-colors hover:bg-orange-50"
              >
                Manage canteens <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/reservations')}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-['Gilroy_Heavy'] text-white transition-colors hover:bg-white/15"
              >
                Review reservations <Calendar size={16} />
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Platform status</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-['Gilroy_Heavy'] text-white">Operational</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-white/80">
                    <Activity size={14} />
                    <span>Realtime data connected</span>
                  </p>
                </div>
                <div className="rounded-2xl bg-white/15 px-3 py-2 text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Canteens</p>
                  <p className="text-lg font-['Gilroy_Heavy'] text-white">{canteens.length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Reservations</p>
                <p className="mt-2 text-3xl font-['Gilroy_Heavy'] text-white">{reservations.length}</p>
                <p className="mt-1 text-xs text-white/75">All reservation records</p>
              </div>
              <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Coverage</p>
                <p className="mt-2 text-3xl font-['Gilroy_Heavy'] text-white">100%</p>
                <p className="mt-1 text-xs text-white/75">Admin visibility</p>
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
                  <p className="mt-2 text-3xl font-['Gilroy_Heavy'] text-gray-900">{stat.value}</p>
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

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Management shortcuts</p>
              <h2 className="mt-2 text-2xl font-['Gilroy_Heavy'] text-gray-900">Open the areas you use most</h2>
            </div>
            <div className="rounded-2xl bg-orange-50 px-3 py-2 text-sm font-['Gilroy_Bold'] text-orange-700">
              Admin view
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  whileHover={{ y: -4 }}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="group rounded-[28px] border border-gray-100 bg-gray-50/70 p-5 text-left transition-all hover:border-orange-200 hover:bg-white hover:shadow-lg"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${action.accent} text-white shadow-lg shadow-orange-100`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 text-lg font-['Gilroy_Heavy'] text-gray-900">{action.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{action.description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-['Gilroy_Bold'] text-orange-600 transition-transform group-hover:translate-x-1">
                    Open <ChevronRight size={15} />
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-8 rounded-[30px] bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 p-6 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/50">Daily focus</p>
                <h3 className="mt-2 text-xl font-['Gilroy_Heavy']">What needs attention</h3>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/80">Updated live</div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Reservations</p>
                <p className="mt-2 text-lg font-['Gilroy_Heavy']">{pendingReservations} need review</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Top canteen</p>
                <p className="mt-2 text-lg font-['Gilroy_Heavy']">{topCanteens[0]?.name || 'No canteen yet'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Recent activity</p>
              <h2 className="mt-2 text-2xl font-['Gilroy_Heavy'] text-gray-900">Current snapshot</h2>
            </div>
            <button type="button" onClick={() => navigate('/admin/orders')} className="text-sm font-['Gilroy_Bold'] text-orange-600">
              View orders
            </button>
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
                        <p className="text-sm font-['Gilroy_Heavy'] text-gray-900">{activity.label}</p>
                        <p className="mt-1 text-sm leading-6 text-gray-500">{activity.detail}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-['Gilroy_Heavy'] uppercase tracking-widest text-gray-500 shadow-sm">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Top canteens</p>
                <h3 className="mt-1 text-lg font-['Gilroy_Heavy'] text-gray-900">Best rated locations</h3>
              </div>
              <BarChart3 size={18} className="text-orange-500" />
            </div>

            <div className="mt-4 space-y-3">
              {topCanteens.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-400">
                  No canteens available yet.
                </div>
              ) : (
                topCanteens.map((canteen, index) => (
                  <button
                    key={canteen._id}
                    type="button"
                    onClick={() => navigate('/admin/canteens')}
                    className="flex w-full items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-orange-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-xs font-['Gilroy_Heavy'] text-gray-500 shadow-sm">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-['Gilroy_Heavy'] text-gray-900">{canteen.name}</p>
                        <p className="text-xs text-gray-500">{canteen.owner || 'Owner not set'}</p>
                      </div>
                    </div>
                    <span className="text-sm font-['Gilroy_Bold'] text-orange-600">{Number(canteen.ratings || 0).toFixed(1)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
