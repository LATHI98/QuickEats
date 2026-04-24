import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown, Menu, X, CreditCard, MessageSquare, Bell, Trash2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { notificationAPI } from '../services/api';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'budget_exceeded':
                return <AlertCircle size={16} className="text-red-500" />;
            case 'pass_verified':
                return <CheckCircle2 size={16} className="text-green-500" />;
            case 'pass_rejected':
                return <X size={16} className="text-red-500" />;
            default:
                return <Info size={16} className="text-blue-500" />;
        }
    };

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100 py-4 shadow-sm'
            : 'bg-transparent py-6'
            }`}>
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <span className="text-2xl font-extrabold text-orange-600 group-hover:scale-105 transition-transform tracking-tight">
                            Quick<span className="text-gray-900">Eats</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-gray-600 hover:text-orange-600 font-bold text-sm transition-all uppercase tracking-widest">Home</Link>
                        <a href="#about" className="text-gray-600 hover:text-orange-600 font-bold text-sm transition-all uppercase tracking-widest">About Us</a>
                        <a href="#contact" className="text-gray-600 hover:text-orange-600 font-bold text-sm transition-all uppercase tracking-widest">Contact Us</a>

                        {user ? (
                            <div className="flex items-center space-x-4">
                                {/* Notifications Bell */}
                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                        className="relative p-2.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all border border-transparent hover:border-orange-100"
                                    >
                                        <Bell size={20} />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isNotificationsOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-4 w-80 sm:w-96 bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden z-50"
                                            >
                                                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Notifications</h3>
                                                    <div className="flex space-x-3">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await notificationAPI.sendTestNotification();
                                                                } catch (err) {
                                                                    console.error('Test notification failed:', err);
                                                                }
                                                            }}
                                                            className="text-[10px] text-blue-600 font-bold hover:text-blue-700 transition-colors uppercase tracking-widest"
                                                        >
                                                            Test
                                                        </button>
                                                        {unreadCount > 0 && (
                                                            <button
                                                                onClick={markAllAsRead}
                                                                className="text-[10px] text-orange-600 font-bold hover:text-orange-700 transition-colors uppercase tracking-widest"
                                                            >
                                                                Mark all read
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                                    {notifications.length > 0 ? (
                                                        notifications.map((notif) => (
                                                            <div
                                                                key={notif._id}
                                                                className={`px-6 py-4 border-b border-gray-50 flex space-x-4 transition-colors relative group ${notif.isRead ? 'bg-white' : 'bg-orange-50/30'}`}
                                                            >
                                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notif.isRead ? 'bg-gray-100' : 'bg-orange-100'}`}>
                                                                    {getNotificationIcon(notif.type)}
                                                                </div>
                                                                <div className="flex-1 min-w-0" onClick={() => !notif.isRead && markAsRead(notif._id)}>
                                                                    <p className={`text-sm font-bold ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</p>
                                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                                                        {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        deleteNotification(notif._id);
                                                                    }}
                                                                    className="absolute right-4 top-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-6 py-12 text-center">
                                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                <Bell size={24} className="text-gray-300" />
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-500">No notifications yet</p>
                                                            <p className="text-xs text-gray-400 mt-1">We'll notify you when things happen</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-50 text-center">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Real-time alerts enabled</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Profile Dropdown */}
                                <div className="relative" ref={profileRef}>
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center space-x-3 bg-gray-50 p-1.5 pr-5 rounded-full hover:bg-orange-50 transition-all border border-gray-100"
                                    >
                                        <div className="w-9 h-9 bg-orange-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                                            <User size={18} className="text-white" />
                                        </div>
                                        <span className="text-gray-900 text-sm font-bold">{user.name.split(' ')[0]}</span>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isProfileOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-4 w-64 bg-white rounded-[32px] shadow-2xl border border-gray-100 py-4 overflow-hidden"
                                            >
                                                <div className="px-6 py-4 border-b border-gray-50 mb-3">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Authenticated</p>
                                                    <p className="text-gray-900 font-bold truncate text-sm">{user.email}</p>
                                                </div>
                                                <Link to="/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center space-x-3 px-6 py-3.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all font-medium">
                                                    <div className="w-8 h-8 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-600">
                                                        <User size={16} />
                                                    </div>
                                                    <span>Dashboard</span>
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-6 py-3.5 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all flex items-center space-x-3 font-bold mt-2"
                                                >
                                                    <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                                                        <LogOut size={16} />
                                                    </div>
                                                    <span>Logout</span>
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-orange-600 text-white px-10 py-3 rounded-full font-bold text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-900/20 active:scale-95 border border-orange-500/20"
                            >
                                Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-900 hover:text-orange-600 transition-colors p-3 bg-gray-50 rounded-2xl"
                        >
                            {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden border-t border-gray-100 bg-white shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 space-y-3">
                            <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between px-6 py-5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-3xl transition-all font-bold group">
                                <span>Home</span>
                                <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
                            </Link>
                            <a href="#about" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between px-6 py-5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-3xl transition-all font-bold group">
                                <span>About Us</span>
                                <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
                            </a>
                            <a href="#contact" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between px-6 py-5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-3xl transition-all font-bold group">
                                <span>Contact Us</span>
                                <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
                            </a>
                            {!user && (
                                <Link
                                    to="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block mx-2 mt-6 bg-orange-600 text-white text-center py-5 rounded-[32px] font-bold text-lg shadow-2xl shadow-orange-900/20"
                                >
                                    Login / Register
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Navbar;
