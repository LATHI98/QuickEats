import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
    ArrowRight,
    BadgeCheck,
    CalendarCheck,
    CheckCircle2,
    Clock3,
    Coffee,
    CookingPot,
    LayoutDashboard,
    MapPin,
    PackageOpen,
    ReceiptText,
    RotateCcw,
    ShoppingBag,
    Sparkles,
    Store,
    Ticket,
    TimerReset,
    Users,
    UtensilsCrossed,
    ChevronRight,
} from 'lucide-react';

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

const quickActions = [
    { label: 'Open Orders', description: 'Review and process live student orders.', icon: ReceiptText, path: '/admin/orders', accent: 'from-orange-600 to-orange-400' },
    { label: 'Manage Menu', description: 'Add or update canteen items quickly.', icon: UtensilsCrossed, path: '/admin/menu', accent: 'from-orange-500 to-amber-400' },
    { label: 'Tables', description: 'Keep table capacity and seating visible.', icon: CalendarCheck, path: '/admin/tables', accent: 'from-amber-600 to-orange-400' },
    { label: 'Reservations', description: 'Monitor confirmed and pending reservations.', icon: BadgeCheck, path: '/admin/reservations', accent: 'from-orange-600 to-rose-400' },
];

const HERO_IMAGES = [
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80',
];

const shiftChecklist = [
    'Confirm today’s canteen context and open hours.',
    'Review pending orders and prioritize ready items.',
    'Validate reservations and table availability.',
    'Check meal-pass and pickup codes before rush hour.',
];

const DASHBOARD_POLL_INTERVAL_MS = 5000;

const StatCard = ({ icon: Icon, label, value, note, tone }) => (
    <div className={`rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-lg shadow-black/5 backdrop-blur ${tone || ''}`}>
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{label}</p>
                <p className="mt-2 text-3xl font-extrabold text-gray-900">{value}</p>
                {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
                <Icon size={20} />
            </div>
        </div>
    </div>
);

const CanteenStaffDashboard = () => {
    const navigate = useNavigate();
    const { user, selectedCanteenId, selectedCanteenName } = useAuth();
    const assignedCanteenId = typeof user?.canteen === 'object' ? user?.canteen?._id : user?.canteen;
    const activeCanteenId = selectedCanteenId || assignedCanteenId || '';
    const [canteen, setCanteen] = useState(null);
    const [orders, setOrders] = useState([]);
    const [tables, setTables] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());
    const [heroIndex, setHeroIndex] = useState(0);

    const fetchDashboard = useCallback(async (silent = false) => {
        if (!activeCanteenId) {
            setLoading(false);
            return;
        }

        try {
            if (!silent) setLoading(true);
            const [canteenRes, ordersRes, tablesRes, reservationsRes] = await Promise.all([
                api.get(`/api/canteens/${activeCanteenId}`),
                api.get('/api/orders/canteen', { params: { canteen: activeCanteenId } }),
                api.get(`/api/tables/canteen/${activeCanteenId}`),
                api.get(`/api/reservations/admin/canteen/${activeCanteenId}`),
            ]);

            setCanteen(canteenRes.data);
            setOrders(normalizeList(ordersRes.data));
            setTables(normalizeList(tablesRes.data));
            setReservations(normalizeList(reservationsRes.data));
        } catch (err) {
            if (!silent) {
                console.error('Failed to load staff dashboard', err);
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, [activeCanteenId]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    useEffect(() => {
        if (!activeCanteenId) return;

        const handleWindowFocus = () => fetchDashboard(true);
        const handleVisibilityChange = () => {
            if (!document.hidden) fetchDashboard(true);
        };

        const interval = setInterval(() => fetchDashboard(true), DASHBOARD_POLL_INTERVAL_MS);
        window.addEventListener('focus', handleWindowFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleWindowFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [activeCanteenId, fetchDashboard]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const heroTimer = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 3000);
        return () => clearInterval(heroTimer);
    }, []);

    const pendingOrders = useMemo(() => orders.filter((order) => order.status === 'pending').length, [orders]);
    const preparingOrders = useMemo(() => orders.filter((order) => order.status === 'preparing').length, [orders]);
    const readyOrders = useMemo(() => orders.filter((order) => order.status === 'ready').length, [orders]);
    const confirmedReservations = useMemo(() => reservations.filter((reservation) => reservation.status === 'confirmed').length, [reservations]);
    const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0), [orders]);
    const activeTables = useMemo(() => tables.length, [tables]);
    const recentOrders = orders.slice(0, 4);
    const greeting = getGreeting(now.getHours());

    const statusPills = [
        { label: 'Pending', value: pendingOrders, color: 'bg-amber-50 text-amber-700' },
        { label: 'Preparing', value: preparingOrders, color: 'bg-blue-50 text-blue-700' },
        { label: 'Ready', value: readyOrders, color: 'bg-emerald-50 text-emerald-700' },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-10 pb-10 px-4">
            <div className="absolute left-0 top-0 -z-10 h-72 w-72 rounded-full bg-orange-100/70 blur-3xl" />
            <div className="absolute right-0 top-24 -z-10 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />

            <section className="relative overflow-hidden rounded-[40px] border border-orange-100 bg-gray-900 text-white shadow-2xl shadow-orange-200/20 group mt-0">
                {/* Hero Image Slider Background */}
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
                                alt="Canteen Operations"
                                className="h-full w-full object-cover scale-105 transition-transform duration-[10s] group-hover:scale-100"
                            />
                        </motion.div>
                    ))}
                    {/* Dark Overlays for Readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                <div className="relative z-10 grid gap-8 px-10 py-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-8">
                    <div className="space-y-4">
                        <div className="pt-2"></div>

                        <div className="space-y-2">
                            <h1 className="max-w-3xl text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
                                {greeting}, {user?.name || 'Staff'}.
                                <span className="block text-orange-200">Keep orders & tables moving.</span>
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-white/70">
                                Monitor live orders, table load, and reservations in one glance.
                            </p>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs text-white/90 backdrop-blur">
                            <Clock3 size={12} />
                            <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-white/50">·</span>
                            <span>{now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/orders')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-xs font-extrabold text-orange-600 transition-all hover:bg-orange-50 active:scale-95"
                            >
                                Live orders <ArrowRight size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/menu')}
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-extrabold text-white transition-all hover:bg-white/15 backdrop-blur active:scale-95"
                            >
                                Manage menu <UtensilsCrossed size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="relative flex items-center justify-center lg:justify-end">
                        <div className="relative z-10 grid gap-3 w-full max-w-sm">
                            <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Active Canteen</p>
                                <div className="mt-2 flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xl font-extrabold text-white">{canteen?.name || selectedCanteenName || 'Main'}</p>
                                        <p className="mt-1 flex items-center gap-2 text-xs text-white/70">
                                            <MapPin size={12} />
                                            <span>{canteen?.openHours || '08:00 AM - 08:00 PM'}</span>
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-white/15 px-3 py-1.5 text-right backdrop-blur">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Queue</p>
                                        <p className="text-base font-extrabold text-white">{orders.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-[24px] border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Total Orders</p>
                                    <p className="mt-1 text-xl font-extrabold text-white">{loading ? '—' : orders.length}</p>
                                </div>
                                <div className="rounded-[24px] border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Pending</p>
                                    <p className="mt-1 text-xl font-extrabold text-white">{loading ? '—' : pendingOrders}</p>
                                </div>
                            </div>
                        </div>

                        {/* Floating elements */}
                        <div className="absolute -right-20 -top-10 h-64 w-64 rotate-12 opacity-20 transition-transform group-hover:rotate-6 lg:opacity-40">
                            <img 
                                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80" 
                                className="h-full w-full rounded-3xl object-cover shadow-2xl" 
                                alt=""
                            />
                        </div>
                        <div className="absolute -bottom-10 -right-10 h-40 w-40 -rotate-12 opacity-10 transition-transform group-hover:-rotate-6 lg:opacity-30">
                            <img 
                                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80" 
                                className="h-full w-full rounded-2xl object-cover shadow-2xl" 
                                alt=""
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={ReceiptText} label="Revenue today" value={loading ? '—' : formatMoney(totalRevenue)} note="Current order total snapshot" />
                <StatCard icon={CookingPot} label="Preparing" value={loading ? '—' : preparingOrders} note="In kitchen workflow" />
                <StatCard icon={CheckCircle2} label="Ready for pickup" value={loading ? '—' : readyOrders} note="Waiting for student confirmation" />
                <StatCard icon={CalendarCheck} label="Confirmed reservations" value={loading ? '—' : confirmedReservations} note="Seats already locked in" />
            </section>

            <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Operations</p>
                            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Quick actions</h2>
                        </div>
                        <div className="rounded-2xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700">
                            Staff view
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
                                    <h3 className="mt-4 text-lg font-extrabold text-gray-900">{action.label}</h3>
                                    <p className="mt-2 text-sm leading-6 text-gray-500">{action.description}</p>
                                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-600 transition-transform group-hover:translate-x-1">
                                        Open <ChevronRight size={15} />
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>

                    <div className="mt-8 rounded-[30px] bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-6 text-white shadow-xl shadow-orange-200/40">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-white/50">Shift checklist</p>
                                <h3 className="mt-2 text-xl font-extrabold">Start-of-shift focus</h3>
                            </div>
                            <div className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/80">Recommended</div>
                        </div>

                        <div className="mt-5 space-y-3">
                            {shiftChecklist.map((item, index) => (
                                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3">
                                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm leading-6 text-white/85">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Live queue</p>
                            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Order status snapshot</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/orders')}
                            className="text-sm font-bold text-orange-600"
                        >
                            See all
                        </button>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                        {statusPills.map((pill) => (
                            <div key={pill.label} className={`rounded-full px-4 py-2 text-sm font-bold ${pill.color}`}>
                                {pill.label}: {pill.value}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 space-y-4">
                        {loading ? (
                            <div className="rounded-[26px] border border-dashed border-gray-200 px-5 py-8 text-center text-sm text-gray-400">
                                Loading live queue...
                            </div>
                        ) : recentOrders.length === 0 ? (
                            <div className="rounded-[26px] border border-dashed border-gray-200 px-5 py-8 text-center text-sm text-gray-400">
                                No orders yet for this canteen.
                            </div>
                        ) : (
                            recentOrders.map((order) => (
                                <button
                                    key={order._id}
                                    type="button"
                                    onClick={() => navigate('/admin/orders')}
                                    className="w-full rounded-[26px] border border-gray-100 bg-gray-50/60 px-5 py-4 text-left transition-all hover:border-orange-200 hover:bg-orange-50/50"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-extrabold text-gray-900">Order #{order.queueNumber || '—'}</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {order.payment?.status || 'unpaid'} · {order.status || 'pending'}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-gray-600 shadow-sm">
                                            {formatMoney(order.totalPrice)}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                        <span>{(order.items?.length || 0)} item(s)</span>
                                        <span className="inline-flex items-center gap-1 font-bold text-orange-600">
                                            Open order <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Table operations</p>
                            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Tables & reservations</h2>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                            {activeTables} tables
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4">
                        <div className="rounded-[26px] border border-gray-100 bg-gray-50/70 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-extrabold text-gray-900">Current table count</p>
                                    <p className="mt-1 text-sm text-gray-500">Keep seating information visible for students and staff.</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
                                    <Users size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[26px] border border-gray-100 bg-gray-50/70 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-extrabold text-gray-900">Reservation status</p>
                                    <p className="mt-1 text-sm text-gray-500">Track confirmed reservations for the canteen.</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
                                    <Ticket size={20} />
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/admin/reservations')}
                            className="inline-flex items-center justify-between rounded-[26px] bg-orange-500 px-5 py-4 text-left text-white transition-colors hover:bg-orange-600"
                        >
                            <span>
                                <span className="block text-xs uppercase tracking-[0.2em] text-white/75">Open reservations</span>
                                <span className="mt-1 block text-base font-extrabold">Review table bookings</span>
                            </span>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Menu operations</p>
                            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Fast management shortcuts</h2>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[26px] border border-gray-100 bg-gray-50/70 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-extrabold text-gray-900">Meal pass</p>
                                    <p className="mt-1 text-sm text-gray-500">Validate and process meal pass requests.</p>
                                </div>
                                <Ticket size={20} className="text-orange-600" />
                            </div>
                        </div>

                        <div className="rounded-[26px] border border-gray-100 bg-gray-50/70 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-extrabold text-gray-900">Menu status</p>
                                    <p className="mt-1 text-sm text-gray-500">Update availability and keep items current.</p>
                                </div>
                                <UtensilsCrossed size={20} className="text-orange-600" />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/admin/meal-pass')}
                            className="rounded-[26px] border border-gray-200 bg-white px-5 py-4 text-left transition-colors hover:border-orange-200 hover:bg-orange-50"
                        >
                            <span className="block text-xs uppercase tracking-[0.2em] text-gray-400">Meal pass</span>
                            <span className="mt-2 block text-base font-extrabold text-gray-900">Go to meal pass tools</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/admin/menu')}
                            className="rounded-[26px] border border-gray-200 bg-white px-5 py-4 text-left transition-colors hover:border-orange-200 hover:bg-orange-50"
                        >
                            <span className="block text-xs uppercase tracking-[0.2em] text-gray-400">Menu manager</span>
                            <span className="mt-2 block text-base font-extrabold text-gray-900">Update menu items</span>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CanteenStaffDashboard;
