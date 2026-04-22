import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Utensils,
  ClipboardList,
  User,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  MessageSquare,
  Ticket,
  CalendarCheck,
  Salad,
  WalletCards,
  BriefcaseBusiness,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cartAPI } from '../../services/api';

const StudentLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [cartMeta, setCartMeta] = useState({ count: 0, total: 0 });
  const location = useLocation();
  const { user, logout } = useAuth();

  const shouldShowFloatingCart = useMemo(() => !location.pathname.startsWith('/dashboard/cart'), [location.pathname]);

  useEffect(() => {
    let mounted = true;

    const updateCartMeta = async () => {
      try {
        const res = await cartAPI.getCart();
        const cartData = res?.data?.data || {};

        const groups = Array.isArray(cartData.groups)
          ? cartData.groups
          : (Array.isArray(cartData.items)
            ? [{ items: cartData.items, totalPrice: cartData.totalPrice || 0 }]
            : []);

        const count = groups.reduce((sum, group) => sum + (group.items || []).reduce((s, item) => s + Number(item.quantity || 0), 0), 0);
        const total = groups.reduce((sum, group) => sum + Number(group.totalPrice || 0), 0);

        if (mounted) {
          setCartMeta({ count, total });
        }
      } catch {
        if (mounted) {
          setCartMeta({ count: 0, total: 0 });
        }
      }
    };

    const onFocus = () => updateCartMeta();
    const onVisibility = () => {
      if (!document.hidden) updateCartMeta();
    };

    updateCartMeta();
    const interval = setInterval(updateCartMeta, 5000);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-['Gilroy_Medium']">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col`}>
        {/* Sidebar Header: Logo */}
        <div className="p-6 pb-2">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-100">
              <Utensils className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-['Gilroy_Heavy'] text-gray-900 tracking-tight">
              Quick<span className="text-orange-600">Eats</span>
            </span>
          </Link>
        </div>

        {/* Sidebar User Card */}
        <div className="px-6 py-6 border-b border-gray-50 mb-4">
          <div className="flex items-center space-x-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center overflow-hidden border border-orange-100">
              <User className="text-orange-600 w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-['Gilroy_Heavy'] text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-500 font-['Gilroy_Heavy'] uppercase tracking-widest mt-0.5">

                {user?.role === 'universityStaff' ? 'University Staff' : 'Premium Student'}

              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="space-y-8 pb-8">
            {/* Section: MAIN */}
            <div>
              <p className="px-4 text-[11px] font-['Gilroy_Heavy'] text-gray-400 uppercase tracking-[0.2em] mb-4">Main</p>
              <nav className="space-y-1">
                <MenuLink to="/dashboard" icon={Home} label="Dashboard" active={location.pathname === '/dashboard'} />
                <MenuLink to="/dashboard/orders" icon={ClipboardList} label="My Order" active={location.pathname === '/dashboard/orders'} />
                <MenuLink to="/dashboard/canteens" icon={Utensils} label="Canteens" active={location.pathname === '/dashboard/canteens'} />
                <MenuLink to="/dashboard/group-order" icon={Users} label="Group Order" active={location.pathname === '/dashboard/group-order'} badge="New" />
                <MenuLink
                  to="/dashboard/event-catering"
                  icon={BriefcaseBusiness}
                  label="Event Catering"
                  active={location.pathname === '/dashboard/event-catering'}
                  badge="New"
                />
              </nav>
            </div>

            {/* Section: DINING */}
            <div>
              <p className="px-4 text-[11px] font-['Gilroy_Heavy'] text-gray-400 uppercase tracking-[0.2em] mb-4">Dining</p>
              <nav className="space-y-1">
                <MenuLink to="/dashboard/reservations" icon={CalendarCheck} label="Reservations" active={location.pathname === '/dashboard/reservations'} />
                <MenuLink to="/dashboard/meal-pass" icon={Ticket} label="Meal Pass" active={location.pathname === '/dashboard/meal-pass'} badge="New" />
                <MenuLink to="/dashboard/budget" icon={CreditCard} label="Meal Budget" active={location.pathname === '/dashboard/budget'} />
                <MenuLink to="/dashboard/meal-plan" icon={Salad} label="Sports Meal Plan" active={location.pathname === '/dashboard/meal-plan'} badge="SLIIT" />
                <MenuLink to="/dashboard/reviews" icon={MessageSquare} label="Reviews & Rating" active={location.pathname === '/dashboard/reviews'} />
              </nav>
            </div>

            {/* Section: ACCOUNT */}
            <div>
              <p className="px-4 text-[11px] font-['Gilroy_Heavy'] text-gray-400 uppercase tracking-[0.2em] mb-4">Account</p>
              <nav className="space-y-1">
                <MenuLink to="/dashboard/profile" icon={User} label="My Profile" active={location.pathname === '/dashboard/profile'} />
                <MenuLink to="/dashboard/settings" icon={Settings} label="Settings" active={location.pathname === '/dashboard/settings'} />
                <MenuLink to="/dashboard/help" icon={LifeBuoy} label="Help Center" active={location.pathname === '/dashboard/help'} />
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Logout */}
        <div className="p-4 mt-auto border-t border-gray-50">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-6 py-4 text-gray-500 hover:text-red-600 transition-all rounded-xl hover:bg-red-50 group font-['Gilroy_Heavy'] text-sm"
          >
            <LogOut className="w-5 h-5 opacity-80 group-hover:opacity-100" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-50 flex items-center justify-between px-10 z-40 sticky top-0 shadow-sm">
          <div className="flex items-center flex-1">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-gray-400 mr-4"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative max-w-sm w-full hidden md:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-12 pr-6 py-2.5 bg-gray-50/50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-50 transition-all font-['Gilroy_Medium'] text-sm text-gray-600"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Minimal Actions */}
            <div className="flex items-center space-x-1">
              <HeaderIconButton icon={Bell} dot color="text-gray-400" />
            </div>

            {/* Profile Pic */}
            {/* Profile Pic with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:border-orange-600/30 transition-all focus:outline-none"
              >
                <User className="text-gray-400 w-6 h-6" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    {/* Invisible backdrop to close dropdown */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>

                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 overflow-hidden"
                    >
                      <div className="px-5 py-3 border-b border-gray-50 mb-2">
                        <p className="text-sm font-['Gilroy_Heavy'] text-gray-900 truncate">{user?.name || 'User'}</p>
                        <p className="text-[10px] text-gray-400 font-['Gilroy_Bold'] uppercase tracking-widest mt-0.5">{user?.role === 'universityStaff' ? 'Staff' : 'Student'}</p>
                      </div>

                      <div className="px-2 space-y-1">
                        <Link
                          to="/dashboard/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all rounded-xl font-['Gilroy_Bold'] text-sm"
                        >
                          <User className="w-4.5 h-4.5" />
                          <span>My Profile</span>
                        </Link>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl font-['Gilroy_Bold'] text-sm"
                        >
                          <LogOut className="w-4.5 h-4.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content Area */}
        <div className="flex-1 overflow-y-auto pt-2 px-10 pb-10 bg-[#FDFDFD] scroll-smooth">
          <Outlet />
        </div>
      </main>

      {shouldShowFloatingCart && (
        <Link
          to="/dashboard/cart"
          className="fixed right-5 bottom-5 z-50 group"
          aria-label="Open cart"
        >
          <div className="rounded-2xl border border-orange-200 bg-white shadow-xl shadow-orange-100/70 px-4 py-3 min-w-[140px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center relative">
                <WalletCards className="w-5 h-5" />
                {cartMeta.count > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-gray-900 text-white text-[10px] font-['Gilroy_Heavy'] flex items-center justify-center">
                    {cartMeta.count}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-['Gilroy_Heavy']">My Cart</p>
                <p className="text-sm font-['Gilroy_Heavy'] text-gray-900">
                  {cartMeta.count > 0 ? `LKR ${cartMeta.total.toLocaleString()}` : 'No items'}
                </p>
              </div>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
};

// Sub-components for better organization
const MenuLink = ({ to, icon: Icon, label, active, badge }) => (
  <Link
    to={to}
    className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${active
      ? 'bg-orange-50/70 text-gray-900'
      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
  >
    {active && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full shadow-[2px_0_8px_rgba(234,88,12,0.3)]"></div>
    )}
    <div className="flex items-center space-x-3">
      <Icon className={`w-5 h-5 ${active ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
      <span className={`text-[13px] font-["Gilroy_Heavy"] ${active ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>{label}</span>
    </div>
    {badge && (
      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-['Gilroy_Heavy'] uppercase ${badge === 'New'
        ? 'bg-orange-600 text-white shadow-sm'
        : 'bg-gray-900 text-white'
        }`}>
        {badge}
      </span>
    )}
  </Link>
);

const HeaderIconButton = ({ icon: Icon, badge, dot, color }) => (
  <button className={`relative p-2.5 rounded-xl transition-all hover:bg-orange-50 hover:text-orange-600 ${color}`}>
    <Icon className="w-5 h-5" />
    {badge && (
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-['Gilroy_Heavy'] rounded-full flex items-center justify-center border-2 border-white">
        {badge}
      </span>
    )}
    {dot && (
      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
    )}
  </button>
);

export default StudentLayout;
