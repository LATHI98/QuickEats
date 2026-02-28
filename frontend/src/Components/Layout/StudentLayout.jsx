import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  User,
  LogOut,
  Menu,
  Bell,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Canteens', path: '/dashboard/canteens', icon: UtensilsCrossed },
  { label: 'Orders', path: '/dashboard/orders', icon: ShoppingBag },
  { label: 'Profile', path: '/dashboard/profile', icon: User },
];

const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const pageTitle = navItems.find((n) => isActive(n.path))?.label || 'Dashboard';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-defaultRed rounded-xl flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-gilroyBold text-gray-900 leading-none">QuickEats</h1>
            <p className="text-[10px] text-gray-400 font-gilroyRegular mt-0.5">Canteen System</p>
          </div>
        </div>
        {/* Close button â€” mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-red-50 rounded-xl px-3 py-3">
          <div className="w-10 h-10 rounded-full bg-defaultRed flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-gilroyBold">{getInitials(user?.name)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-gilroyBold text-gray-800 truncate">{user?.name || 'Student'}</p>
            <p className="text-xs text-defaultRed font-gilroyMedium">Student</p>
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
                    ? 'bg-defaultRed/10 text-defaultRed'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`shrink-0 transition-colors ${
                    isActive(path) ? 'text-defaultRed' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                  size={18}
                />
                <span>{label}</span>
                {isActive(path) && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-defaultRed/60" />
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
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-gilroyMedium text-gray-500 hover:bg-red-50 hover:text-defaultRed transition-all duration-150 group"
        >
          <LogOut className="shrink-0 group-hover:text-defaultRed transition-colors" size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* â”€â”€ DESKTOP: Fixed left sidebar â”€â”€ */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 shrink-0">
        <SidebarContent />
      </aside>

      {/* â”€â”€ MOBILE: Slide-over sidebar â”€â”€ */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl z-10 animate-[slideIn_0.25s_ease-out]">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* â”€â”€ MAIN CONTENT â”€â”€ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger â€” mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-gilroyBold text-gray-800">{pageTitle}</h2>
              <p className="text-[11px] text-gray-400 font-gilroyRegular hidden sm:block">
                Dashboard â€º {pageTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-9 h-9 rounded-full bg-defaultRed flex items-center justify-center">
              <span className="text-white text-xs font-gilroyBold">{getInitials(user?.name)}</span>
            </div>
          </div>
        </header>

        {/* Page content â€” extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>

        {/* â”€â”€ MOBILE: Bottom Navigation Bar â”€â”€ */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-area-pb">
          <div className="flex items-center justify-around px-2 py-1">
            {navItems.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-150 min-w-[56px] ${
                  isActive(path) ? 'text-defaultRed' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive(path) ? 'bg-defaultRed/10' : ''}`}>
                  <Icon size={20} />
                </div>
                <span className={`text-[10px] font-gilroyMedium leading-none ${isActive(path) ? 'text-defaultRed' : 'text-gray-400'}`}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </nav>

      </div>
    </div>
  );
};

export default StudentLayout;
