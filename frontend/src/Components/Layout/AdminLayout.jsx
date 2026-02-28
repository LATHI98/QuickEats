import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const superAdminNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Canteens', path: '/admin/canteens', icon: Store },
  { label: 'Menu Items', path: '/admin/menu', icon: UtensilsCrossed },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

const managerNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'My Canteen', path: '/admin/canteens', icon: Store },
  { label: 'Menu', path: '/admin/menu', icon: UtensilsCrossed },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
];

const roleConfig = {
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
};

const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const config = roleConfig[user?.role] || roleConfig.canteenManager;
  const navItems = config.nav;
  const RoleIcon = config.icon;

  const isActive = (path) => {
    if (path === '/admin/dashboard') return location.pathname === '/admin/dashboard';
    return location.pathname.startsWith(path);
  };

  const pageTitle = navItems.find((n) => isActive(n.path))?.label || 'Dashboard';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-primaryBlue rounded-xl flex items-center justify-center shrink-0">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-gilroyBold text-gray-900 leading-none">QuickEats</h1>
          <p className="text-[10px] text-gray-400 font-gilroyRegular mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-3 py-3">
          <div className="w-10 h-10 rounded-full bg-primaryBlue flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-gilroyBold">{getInitials(user?.name)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-gilroyBold text-gray-800 truncate">{user?.name || 'Admin'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <RoleIcon size={10} className="text-primaryBlue shrink-0" />
              <p className="text-xs text-primaryBlue font-gilroyMedium">{config.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-gilroyMedium px-3 mb-3">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map(({ label, path, icon: Icon }) => (
            <li key={path}>
              <Link
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-gilroyMedium transition-all duration-150 group ${
                  isActive(path)
                    ? 'bg-primaryBlue/10 text-primaryBlue'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`shrink-0 transition-colors ${
                    isActive(path) ? 'text-primaryBlue' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                  size={18}
                />
                <span>{label}</span>
                {isActive(path) && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-primaryBlue/60" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-gilroyMedium text-gray-500 hover:bg-blue-50 hover:text-primaryBlue transition-all duration-150 group"
        >
          <LogOut className="shrink-0 group-hover:text-primaryBlue transition-colors" size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-white h-full shadow-2xl z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-lg font-gilroyBold text-gray-800">{pageTitle}</h2>
              <p className="text-xs text-gray-400 font-gilroyRegular hidden sm:block">
                Admin › {pageTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-9 h-9 rounded-full bg-primaryBlue flex items-center justify-center">
              <span className="text-white text-xs font-gilroyBold">{getInitials(user?.name)}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
