import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Menu,
  Bell,
  ChevronRight,
  Shield,
  ChefHat,
  LayoutGrid,
  Clock,
  Ticket,
  Grid3x3,
  Calendar,
  BriefcaseBusiness,
  LifeBuoy,
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

const superAdminNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Canteens', path: '/admin/canteens', icon: Store },
  { label: 'Tables', path: '/admin/tables', icon: Grid3x3 },
  { label: 'Reservations', path: '/admin/reservations', icon: Calendar },
  { label: 'Menu Items', path: '/admin/menu', icon: UtensilsCrossed },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

const managerNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'My Canteen', path: '/admin/canteens', icon: Store },
  { label: 'Tables', path: '/admin/tables', icon: Grid3x3 },
  { label: 'Reservations', path: '/admin/reservations', icon: Calendar },
  { label: 'Menu', path: '/admin/menu', icon: UtensilsCrossed },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
];

const canteenStaffNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Tables', path: '/admin/tables', icon: Grid3x3 },
  { label: 'Reservations', path: '/admin/reservations', icon: Calendar },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Meal Pass', path: '/admin/meal-pass', icon: Ticket },
  { label: 'Menu Management', path: '/admin/menu', icon: UtensilsCrossed },
];

const roleConfig = {
  admin: {
    label: 'Admin',
    icon: Shield,
    nav: superAdminNav,
  },
  superAdmin: {
    label: 'Super Admin',
    icon: Shield,
    nav: superAdminNav,
  },
  canteenManager: {
    label: 'Canteen Manager',
    icon: ChefHat,
    nav: managerNav,
  },
  canteenStaff: {
    label: 'Canteen Staff',
    icon: ChefHat,
    nav: canteenStaffNav,
  },
};

const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

const AdminLayout = () => {
  const { user, logout, selectedCanteenName } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const showCanteenSelector = ['canteenStaff', 'canteenManager'].includes(user?.role);

  const config = roleConfig[user?.role] || roleConfig.admin;
  const navItems = config.nav;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-['Gilroy_Medium']">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col`}>
        {/* Sidebar Header: Logo */}
        <div className="p-6 pb-2">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-100">
              <UtensilsCrossed className="text-white w-5 h-5" />
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
              <UserIcon className="text-orange-600 w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-['Gilroy_Bold'] text-gray-900 truncate">{user?.name || 'Admin'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <config.icon size={10} className="text-orange-500 shrink-0" />
                <p className="text-[10px] text-gray-400 font-['Gilroy_Bold'] uppercase tracking-widest">{config.label}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="space-y-8 pb-8">
            {/* Section: MAIN */}
            <div>
              <p className="px-4 text-[10px] font-['Gilroy_Bold'] text-gray-300 uppercase tracking-[0.2em] mb-4">Main</p>
              <nav className="space-y-1">
                <MenuLink
                  to="/admin/dashboard"
                  icon={LayoutDashboard}
                  label="Dashboard"
                  active={location.pathname === '/admin/dashboard'}
                />
                <MenuLink
                  to="/admin/orders"
                  icon={ShoppingBag}
                  label="Orders"
                  active={location.pathname === '/admin/orders'}
                />
                <MenuLink
                  to="/admin/event-catering"
                  icon={BriefcaseBusiness}
                  label="Event Catering"
                  active={location.pathname === '/admin/event-catering'}
                  badge="New"
                />
                {user?.role === 'canteenStaff' && (
                  <MenuLink
                    to="/admin/meal-pass"
                    icon={Ticket}
                    label="Meal Pass"
                    active={location.pathname === '/admin/meal-pass'}
                    badge="Staff"
                  />
                )}
                {user?.role === 'superAdmin' && (
                  <MenuLink
                    to="/admin/users"
                    icon={Users}
                    label="User Control"
                    active={location.pathname === '/admin/users'}
                  />
                )}
              </nav>
            </div>

            {/* Section: MANAGEMENT / OPERATIONS */}
            <div>
              <p className="px-4 text-[10px] font-['Gilroy_Bold'] text-gray-300 uppercase tracking-[0.2em] mb-4">
                {user?.role === 'canteenStaff' ? 'Operations' : 'Management'}
              </p>
              <nav className="space-y-1">
                {user?.role !== 'canteenStaff' && (
                  <MenuLink
                    to="/admin/canteens"
                    icon={Store}
                    label={user?.role === 'superAdmin' ? 'Canteens' : 'My Canteen'}
                    active={location.pathname === '/admin/canteens'}
                  />
                )}
                {['superAdmin', 'admin', 'canteenManager', 'canteenStaff'].includes(user?.role) && (
                  <>
                    <MenuLink
                      to="/admin/tables"
                      icon={Grid3x3}
                      label="Tables Manager"
                      active={location.pathname === '/admin/tables'}
                    />
                    <MenuLink
                      to="/admin/reservations"
                      icon={Calendar}
                      label="Reservations"
                      active={location.pathname === '/admin/reservations'}
                    />
                  </>
                )}
                <MenuLink
                  to="/admin/menu"
                  icon={UtensilsCrossed}
                  label="Menu Manager"
                  active={location.pathname === '/admin/menu'}
                />
                <MenuLink
                  to="/admin/staff"
                  icon={LayoutGrid}
                  label="Staff Dashboard"
                  active={location.pathname === '/admin/staff'}
                  badge={user?.role === 'canteenStaff' ? 'You' : undefined}
                />
                <MenuLink
                  to="/admin/event-catering"
                  icon={BriefcaseBusiness}
                  label="Event Catering"
                  active={location.pathname === '/admin/event-catering'}
                />
                <MenuLink
                  to="/admin/meal-pass"
                  icon={Ticket}
                  label="Meal Pass"
                  active={location.pathname === '/admin/meal-pass'}
                />
                <MenuLink
                  to="/admin/approvals"
                  icon={Clock}
                  label="Meal Pass Records"
                  active={location.pathname === '/admin/approvals'}
                />
              </nav>
            </div>


            {/* Section: ACCOUNT */}
            <div>
              <p className="px-4 text-[10px] font-['Gilroy_Bold'] text-gray-300 uppercase tracking-[0.2em] mb-4">Account</p>
              <nav className="space-y-1">
                <MenuLink
                  to="/admin/settings"
                  icon={Settings}
                  label="Settings"
                  active={location.pathname === '/admin/settings'}
                />
                <MenuLink
                  to="/admin/help"
                  icon={LifeBuoy}
                  label="Help Center"
                  active={location.pathname === '/admin/help'}
                />
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Logout */}
        <div className="p-4 mt-auto border-t border-gray-50">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-6 py-4 text-gray-400 hover:text-red-600 transition-all rounded-xl hover:bg-red-50 group font-['Gilroy_Bold'] text-sm"
          >
            <LogOut className="w-5 h-5 opacity-70 group-hover:opacity-100" />
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
                placeholder="Search admin records..."
                className="w-full pl-12 pr-6 py-2.5 bg-gray-50/50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-50 transition-all font-['Gilroy_Medium'] text-sm text-gray-600"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Minimal Actions */}
            <div className="flex items-center space-x-1">
              <HeaderIconButton icon={Bell} dot color="text-gray-400" />
            </div>

            {showCanteenSelector && (
              <Link
                to="/admin/select-canteen"
                className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 text-orange-700 text-xs font-['Gilroy_Heavy'] hover:bg-orange-100 transition-colors"
              >
                <Store size={14} />
                {selectedCanteenName ? `Switch: ${selectedCanteenName}` : 'Select Canteen'}
              </Link>
            )}

            {/* Profile Pic with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:border-orange-600/30 transition-all focus:outline-none"
              >
                <UserIcon className="text-gray-400 w-6 h-6" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 overflow-hidden"
                    >
                      <div className="px-5 py-3 border-b border-gray-50 mb-2">
                        <p className="text-sm font-['Gilroy_Heavy'] text-gray-900 truncate">{user?.name || 'Admin'}</p>
                        <p className="text-[10px] text-gray-400 font-['Gilroy_Bold'] uppercase tracking-widest mt-0.5">{config.label}</p>
                      </div>

                      <div className="px-2 space-y-1">
                        <Link
                          to="/admin/settings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all rounded-xl font-['Gilroy_Bold'] text-sm"
                        >
                          <Settings className="w-4.5 h-4.5" />
                          <span>Settings</span>
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
        <div className="flex-1 overflow-y-auto px-10 pb-10 bg-[#FDFDFD] scroll-smooth">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// Sub-components for better organization
const MenuLink = ({ to, icon: Icon, label, active, badge }) => (
  <Link
    to={to}
    state={to === '/admin/menu' ? { from: '/admin/menu' } : undefined}
    className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${active
      ? 'bg-orange-50/70 text-gray-900'
      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
  >
    {active && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full shadow-[2px_0_8px_rgba(234,88,12,0.3)]"></div>
    )}
    <div className="flex items-center space-x-3">
      <Icon className={`w-4.5 h-4.5 ${active ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
      <span className={`text-[13px] ${active ? 'font-["Gilroy_Heavy"] text-gray-900' : 'font-["Gilroy_Bold"]'}`}>{label}</span>
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

// Alias User to UserIcon because User is a popular name and sometimes conflicts with roles
import { User as UserIcon, Search } from 'lucide-react';

export default AdminLayout;

