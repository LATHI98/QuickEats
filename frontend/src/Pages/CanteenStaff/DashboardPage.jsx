import React, { useEffect, useMemo, useState } from 'react';
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
    { label: 'Open Orders', description: 'Review and process live student orders.', icon: ReceiptText, path: '/admin/orders', accent: 'from-slate-900 to-slate-700' },
    { label: 'Manage Menu', description: 'Add or update canteen items quickly.', icon: UtensilsCrossed, path: '/admin/menu', accent: 'from-orange-500 to-amber-400' },
    { label: 'Tables', description: 'Keep table capacity and seating visible.', icon: CalendarCheck, path: '/admin/tables', accent: 'from-emerald-500 to-teal-400' },
    { label: 'Reservations', description: 'Monitor confirmed and pending reservations.', icon: BadgeCheck, path: '/admin/reservations', accent: 'from-indigo-500 to-violet-500' },
];

const shiftChecklist = [
    'Confirm today’s canteen context and open hours.',
    'Review pending orders and prioritize ready items.',
    'Validate reservations and table availability.',
    'Check meal-pass and pickup codes before rush hour.',
];

const StatCard = ({ icon: Icon, label, value, note, tone }) => (
    <div className={`rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-lg shadow-black/5 backdrop-blur ${tone || ''}`}>
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{label}</p>
                <p className="mt-2 text-3xl font-['Gilroy_Heavy'] text-gray-900">{value}</p>
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
    const activeCanteenId = selectedCanteenId || user?.canteen || '';
    const [canteen, setCanteen] = useState(null);
    const [orders, setOrders] = useState([]);
    const [tables, setTables] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const loadDashboard = async () => {
            if (!activeCanteenId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
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
                console.error('Failed to load staff dashboard', err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [activeCanteenId]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
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
        <div className="relative mx-auto max-w-7xl space-y-10 overflow-hidden pb-10">
            <div className="absolute left-0 top-0 -z-10 h-72 w-72 rounded-full bg-orange-100/70 blur-3xl" />
            <div className="absolute right-0 top-24 -z-10 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />

            <section className="overflow-hidden rounded-[40px] border border-orange-100 bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white shadow-2xl shadow-orange-200/30">
                <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/90 backdrop-blur">
                            <Sparkles size={14} /> Live canteen operations
                        </div>

                        <div className="space-y-4">
                            <h1 className="max-w-3xl text-4xl font-['Gilroy_Heavy'] leading-tight tracking-tight md:text-5xl">
                                {greeting}, {user?.name || 'Staff'}.
                                <span className="block text-white/90">Keep orders, tables, and pickups moving smoothly.</span>
                            </h1>
                            <p className="max-w-2xl text-base leading-7 text-white/85 md:text-lg">
                                This dashboard gives you the canteen’s live operating view: incoming orders, table and reservation load,
                                and the fastest routes to the menu and order queue.
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
                                onClick={() => navigate('/admin/orders')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-['Gilroy_Heavy'] text-orange-600 transition-colors hover:bg-orange-50"
                            >
                                Open live orders <ArrowRight size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/menu')}
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-['Gilroy_Heavy'] text-white transition-colors hover:bg-white/15"
                            >
                                Manage menu <UtensilsCrossed size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Active canteen</p>
                            <div className="mt-3 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-2xl font-['Gilroy_Heavy'] text-white">{canteen?.name || selectedCanteenName || 'Selected canteen'}</p>
                                    <p className="mt-2 flex items-center gap-2 text-sm text-white/80">
                                        <MapPin size={14} />
                                        <span>{canteen?.openHours || 'Open hours not configured'}</span>
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-white/15 px-3 py-2 text-right">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Queue</p>
                                    <p className="text-lg font-['Gilroy_Heavy'] text-white">{orders.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <StatCard icon={ShoppingBag} label="Orders" value={loading ? '—' : orders.length} note="All tracked order records" />
                            <StatCard icon={Clock3} label="Pending" value={loading ? '—' : pendingOrders} note="Still waiting to be processed" />
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
                            <h2 className="mt-2 text-2xl font-['Gilroy_Heavy'] text-gray-900">Quick actions</h2>
                        </div>
                        <div className="rounded-2xl bg-orange-50 px-3 py-2 text-sm font-['Gilroy_Bold'] text-orange-700">
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
                                <p className="text-xs uppercase tracking-[0.25em] text-white/50">Shift checklist</p>
                                <h3 className="mt-2 text-xl font-['Gilroy_Heavy']">Start-of-shift focus</h3>
                            </div>
                            <div className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/80">Recommended</div>
                        </div>

                        <div className="mt-5 space-y-3">
                            {shiftChecklist.map((item, index) => (
                                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3">
                                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-['Gilroy_Heavy']">
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
                            <h2 className="mt-2 text-2xl font-['Gilroy_Heavy'] text-gray-900">Order status snapshot</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/orders')}
                            className="text-sm font-['Gilroy_Bold'] text-orange-600"
                        >
                            See all
                        </button>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                        {statusPills.map((pill) => (
                            <div key={pill.label} className={`rounded-full px-4 py-2 text-sm font-['Gilroy_Bold'] ${pill.color}`}>
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
                                            <p className="text-sm font-['Gilroy_Heavy'] text-gray-900">Order #{order.queueNumber || '—'}</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {order.payment?.status || 'unpaid'} · {order.status || 'pending'}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-['Gilroy_Heavy'] uppercase tracking-widest text-gray-600 shadow-sm">
                                            {formatMoney(order.totalPrice)}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                        <span>{(order.items?.length || 0)} item(s)</span>
                                        <span className="inline-flex items-center gap-1 font-['Gilroy_Bold'] text-orange-600">
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
                            <h2 className="mt-2 text-2xl font-['Gilroy_Heavy'] text-gray-900">Tables & reservations</h2>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-['Gilroy_Bold'] text-emerald-700">
                            {activeTables} tables
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4">
                        <div className="rounded-[26px] border border-gray-100 bg-gray-50/70 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-['Gilroy_Heavy'] text-gray-900">Current table count</p>
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
                                    <p className="text-sm font-['Gilroy_Heavy'] text-gray-900">Reservation status</p>
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
                                <span className="mt-1 block text-base font-['Gilroy_Heavy']">Review table bookings</span>
                            </span>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Menu operations</p>
                            <h2 className="mt-2 text-2xl font-['Gilroy_Heavy'] text-gray-900">Fast management shortcuts</h2>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[26px] border border-gray-100 bg-gray-50/70 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-['Gilroy_Heavy'] text-gray-900">Meal pass</p>
                                    <p className="mt-1 text-sm text-gray-500">Validate and process meal pass requests.</p>
                                </div>
                                <Ticket size={20} className="text-orange-600" />
                            </div>
                        </div>

                        <div className="rounded-[26px] border border-gray-100 bg-gray-50/70 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-['Gilroy_Heavy'] text-gray-900">Menu status</p>
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
                            <span className="mt-2 block text-base font-['Gilroy_Heavy'] text-gray-900">Go to meal pass tools</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/admin/menu')}
                            className="rounded-[26px] border border-gray-200 bg-white px-5 py-4 text-left transition-colors hover:border-orange-200 hover:bg-orange-50"
                        >
                            <span className="block text-xs uppercase tracking-[0.2em] text-gray-400">Menu manager</span>
                            <span className="mt-2 block text-base font-['Gilroy_Heavy'] text-gray-900">Update menu items</span>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CanteenStaffDashboard;
