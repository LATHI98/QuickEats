import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown, Menu, X, CreditCard, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [scrolled, setScrolled] = React.useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Mock user check (replace with real auth state later)
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
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
                        <span className="text-2xl font-['Gilroy_Heavy'] text-orange-600 group-hover:scale-105 transition-transform tracking-tight">
                            Quick<span className="text-gray-900">Eats</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-12">
                        <Link to="/" className="text-gray-600 hover:text-orange-600 font-['Gilroy_Bold'] text-sm transition-all uppercase tracking-widest">Home</Link>
                        <a href="#about" className="text-gray-600 hover:text-orange-600 font-['Gilroy_Bold'] text-sm transition-all uppercase tracking-widest">About Us</a>
                        <a href="#contact" className="text-gray-600 hover:text-orange-600 font-['Gilroy_Bold'] text-sm transition-all uppercase tracking-widest">Contact Us</a>

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center space-x-3 bg-gray-50 p-1.5 pr-5 rounded-full hover:bg-orange-50 transition-all border border-gray-100"
                                >
                                    <div className="w-9 h-9 bg-orange-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                                        <User size={18} className="text-white" />
                                    </div>
                                    <span className="text-gray-900 text-sm font-['Gilroy_Bold']">{user.name.split(' ')[0]}</span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-4 w-64 bg-white rounded-[32px] shadow-2xl border border-gray-100 py-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-6 py-4 border-b border-gray-50 mb-3">
                                            <p className="text-[10px] text-gray-400 font-['Gilroy_Bold'] uppercase tracking-widest mb-1">Authenticated</p>
                                            <p className="text-gray-900 font-['Gilroy_Bold'] truncate text-sm">{user.email}</p>
                                        </div>
                                        <Link to="/dashboard" className="flex items-center space-x-3 px-6 py-3.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all font-['Gilroy_Medium']">
                                            <div className="w-8 h-8 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-600">
                                                <User size={16} />
                                            </div>
                                            <span>Dashboard</span>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-6 py-3.5 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all flex items-center space-x-3 font-['Gilroy_Bold'] mt-2"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                                                <LogOut size={16} />
                                            </div>
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-orange-600 text-white px-10 py-3 rounded-full font-['Gilroy_Bold'] text-sm hover:bg-orange-700 transition-all shadow-xl shadow-orange-900/20 active:scale-95 border border-orange-500/20"
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
                            <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between px-6 py-5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-3xl transition-all font-['Gilroy_Bold'] group">
                                <span>Home</span>
                                <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
                            </Link>
                            <a href="#about" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between px-6 py-5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-3xl transition-all font-['Gilroy_Bold'] group">
                                <span>About Us</span>
                                <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
                            </a>
                            <a href="#contact" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between px-6 py-5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-3xl transition-all font-['Gilroy_Bold'] group">
                                <span>Contact Us</span>
                                <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
                            </a>
                            {!user && (
                                <Link
                                    to="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block mx-2 mt-6 bg-orange-600 text-white text-center py-5 rounded-[32px] font-['Gilroy_Bold'] text-lg shadow-2xl shadow-orange-900/20"
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
