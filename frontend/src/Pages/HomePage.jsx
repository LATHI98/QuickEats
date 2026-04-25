import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  CreditCard,
  Users,
  ShoppingBag
} from 'lucide-react';
import Navbar from '../Components/Navbar';

const HERO_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2000",
    title: "Gourmet Campus Feasts",
    desc: "A world of flavors delivered to your study break."
  },
  {
    url: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&q=80&w=2000",
    title: "Order on the Go",
    desc: "Your favorite meals, just a few taps away."
  },
  {
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=2000",
    title: "Fresh & Delicious",
    desc: "Quality ingredients, prepared with campus speed."
  },
  {
    url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=2000",
    title: "Smart Canteen Dining",
    desc: "Integrated ordering for the modern student."
  }
];

const FEATURES = [
  {
    icon: <ShoppingBag className="w-8 h-8 text-orange-600" />,
    title: "Smart Food Ordering",
    desc: "Skip queues and pre-order your meals easily."
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
    title: "AI Chatbot Assistant",
    desc: "Ask about menu, prices, or crowd status instantly."
  },
  {
    icon: <CreditCard className="w-8 h-8 text-green-600" />,
    title: "Budget Tracker",
    desc: "Track your monthly food expenses and stay within budget."
  },
  {
    icon: <Users className="w-8 h-8 text-purple-600" />,
    title: "Live Crowd Indicator",
    desc: "Check canteen crowd levels before visiting."
  }
];

const HomePage = () => {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000); // Tighter timing for more energy
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white font-medium selection:bg-orange-100 selection:text-orange-900">
      <Navbar />

      {/* Hero Section: Modern Asymmetric Layout */}
      <section className="relative pt-24 pb-12 lg:pt-36 lg:pb-24 overflow-hidden bg-white">
        {/* Background Accents to reduce white space */}
        <div className="absolute top-0 right-0 w-[60%] h-full bg-orange-50/40 -skew-x-12 transform origin-top-right z-0 hidden lg:block"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-50/50 rounded-full blur-[120px] z-0"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
            {/* Left Column: Tighter Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-20"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                QuickEats <br />
                <span className="text-orange-600">Smart Campus Dining</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-lg leading-relaxed font-medium">
                Experience the future of campus meals. Pre-order, track spending, and skip queues with India's most advanced dining platform.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto bg-orange-600 text-white px-10 py-5 rounded-3xl font-bold text-lg hover:bg-orange-700 transition-all shadow-xl shadow-orange-900/20 hover:-translate-y-1 active:scale-95 flex items-center justify-center group"
                >
                  Get started
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </button>
                <button className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 px-10 py-5 rounded-3xl font-bold text-lg transition-all active:scale-95">
                  Explore Menus
                </button>
              </div>

              {/* Decorative Floating Card (Reduces White Space) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12 hidden md:flex items-center space-x-4 bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white/40 shadow-sm max-w-xs"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 grow-0 shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">Instant Verification</p>
                  <p className="text-xs text-gray-500 mt-0.5">Your order is ready in minutes.</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column: Dynamic Asymmetric Image Stack */}
            <div className="relative h-[500px] lg:h-[650px] w-full">
              {/* Back Decor Blob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-100/50 rounded-full blur-[100px] -z-10 rotate-12"></div>

              {/* Main Slider (Asymmetric Placement) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute right-0 top-0 w-[90%] h-[90%] bg-white p-3 rounded-[60px] shadow-2xl border border-gray-100 z-10"
              >
                <div className="relative w-full h-full rounded-[48px] overflow-hidden bg-gray-50">
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="absolute inset-0"
                    >
                      <img
                        src={HERO_IMAGES[idx].url}
                        alt={HERO_IMAGES[idx].title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent"></div>

                      {/* Integrated Text Overlay */}
                      <div className="absolute bottom-8 left-8 right-8 text-white">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-1"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">Featured</p>
                          <h4 className="text-2xl font-extrabold tracking-tight">{HERO_IMAGES[idx].title}</h4>
                          <p className="text-sm font-medium text-white/70">{HERO_IMAGES[idx].desc}</p>
                        </motion.div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Accent Overlapping Image: High-fidelity Menu Preview */}
              <motion.div
                initial={{ opacity: 0, x: -50, y: 50 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="absolute -left-8 bottom-6 w-[55%] h-[60%] bg-white p-3 rounded-[40px] shadow-2xl border border-gray-100 z-20 hidden md:block"
              >
                <div className="w-full h-full rounded-[30px] overflow-hidden relative shadow-inner bg-gray-50">
                  <img
                    src="https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&q=80&w=1000"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    alt="Menu Preview"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-transparent opacity-40"></div>
                </div>
              </motion.div>

              {/* Floating Decorative Glass Card */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 bottom-20 z-30 bg-white/40 backdrop-blur-xl p-5 rounded-3xl border border-white/40 shadow-xl hidden lg:block"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 leading-none">Fast Checkout</p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest leading-none">99% Success Rate</p>
                  </div>
                </div>
              </motion.div>

              {/* Navigation Indicators (Integrated) */}
              <div className="absolute bottom-12 right-12 z-20 flex space-x-2.5">
                {HERO_IMAGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${idx === i ? 'w-10 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center space-x-2 bg-orange-50 text-orange-600 px-6 py-2 rounded-full mb-6 border border-orange-100"
            >
              <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold uppercase tracking-widest">Platform Highlights</span>
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 tracking-tight">
              Beyond Just <span className="text-orange-600">Ordering</span>
            </h2>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto font-medium">
              A complete ecosystem designed to modernize your entire campus dining journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Feature 1: Smart Ordering */}
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-white p-12 rounded-[60px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden h-[500px] flex flex-col justify-between"
            >
              <div className="relative z-10">
                <div className="w-20 h-20 bg-orange-50 rounded-[30px] flex items-center justify-center mb-10 group-hover:bg-orange-600 transition-colors">
                  <ShoppingBag className="w-10 h-10 text-orange-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-3xl font-extrabold text-gray-900 mb-6">Smart Food Ordering</h3>
                <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-sm">
                  Skip the long campus queues. Browse menus, pre-order, and pay—all before you even arrive at the canteen.
                </p>
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-[400px] bg-orange-50 rounded-[50px] rotate-12 group-hover:rotate-6 transition-transform flex items-center justify-center p-8 opacity-40 md:opacity-100">
                <div className="bg-white w-full h-full rounded-[40px] shadow-2xl border border-gray-100 p-6 flex flex-col space-y-4">
                  <div className="w-full h-12 bg-gray-50 rounded-2xl"></div>
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="w-full h-4 bg-gray-50 rounded-full"></div>
                      <div className="w-2/3 h-4 bg-gray-50 rounded-full"></div>
                    </div>
                  </div>
                  <div className="w-full h-14 bg-orange-600 rounded-2xl mt-auto"></div>
                </div>
              </div>
            </motion.div>

            {/* Feature 2: AI Chatbot */}
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-gray-900 p-12 rounded-[60px] shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden h-[500px] flex flex-col justify-between"
            >
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/10 rounded-[30px] flex items-center justify-center mb-10 group-hover:bg-orange-600 transition-colors">
                  <MessageSquare className="w-10 h-10 text-orange-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-3xl font-extrabold text-white mb-6">AI Chatbot Assistant</h3>
                <p className="text-xl text-white/50 font-medium leading-relaxed max-w-sm">
                  Instant answers to your queries. Ask about today's special, item prices, or live crowd status in any canteen.
                </p>
              </div>
              <div className="absolute -right-10 bottom-10 space-y-4 max-w-[280px]">
                <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl rounded-br-none border border-white/10 text-white/70 text-sm font-bold self-end translate-x-10 group-hover:translate-x-0 transition-transform delay-75">
                  "Is the Main Canteen crowded right now?"
                </div>
                <div className="bg-orange-600 p-5 rounded-3xl rounded-bl-none text-white text-sm font-bold group-hover:-translate-x-4 transition-transform">
                  "It's quite clear! Current Wait: 5 mins."
                </div>
              </div>
            </motion.div>

            {/* Feature 3: Budget Tracker */}
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-white p-12 rounded-[60px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden h-[500px] flex flex-col justify-between"
            >
              <div className="relative z-10">
                <div className="w-20 h-20 bg-blue-50 rounded-[30px] flex items-center justify-center mb-10 group-hover:bg-blue-600 transition-colors">
                  <CreditCard className="w-10 h-10 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-3xl font-extrabold text-gray-900 mb-6">Budget Tracker</h3>
                <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-sm">
                  Take control of your spending. Monitor daily expenses and set smart limits to ensure you stay within your monthly budget.
                </p>
              </div>
              <div className="absolute -right-10 -bottom-10 w-80 h-64 bg-blue-50/50 rounded-full blur-[60px]"></div>
              <div className="relative z-10 bg-white border border-gray-100 p-8 rounded-[40px] shadow-xl max-w-[320px] self-end mt-4 group-hover:scale-105 transition-transform">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-400 font-bold text-xs uppercase">Monthly Budget</span>
                  <span className="text-blue-600 font-extrabold text-sm">75% Used</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '75%' }}
                    className="h-full bg-blue-600 rounded-full"
                  ></motion.div>
                </div>
                <div className="mt-6 flex justify-between">
                  <div className="text-2xl font-extrabold text-gray-900">₹4,250</div>
                  <div className="text-sm text-gray-400 font-bold">/ ₹6,000</div>
                </div>
              </div>
            </motion.div>

            {/* Feature 4: Crowd Indicator */}
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-[#F8F9FA] p-12 rounded-[60px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden h-[500px] flex flex-col justify-between"
            >
              <div className="relative z-10">
                <div className="w-20 h-20 bg-emerald-50 rounded-[30px] flex items-center justify-center mb-10 group-hover:bg-emerald-600 transition-colors">
                  <Users className="w-10 h-10 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex items-center space-x-3 mb-6">
                  <h3 className="text-3xl font-extrabold text-gray-900">Live Crowd Indicator</h3>
                  <span className="flex items-center px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full animate-pulse uppercase tracking-widest">Live</span>
                </div>
                <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-sm">
                  Real-time status of every dining hall. Know exactly how busy a canteen is before you step out.
                </p>
              </div>
              <div className="relative z-10 space-y-4 max-w-[320px] self-center w-full">
                {[
                  { name: 'Canteen A', level: '80%', color: 'bg-orange-500', status: 'Near Capacity' },
                  { name: 'University Cafe', level: '25%', color: 'bg-emerald-500', status: 'Quiet' },
                  { name: 'Admin Block', level: '50%', color: 'bg-amber-500', status: 'Moderate' }
                ].map((c, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{c.name}</p>
                      <p className={`text-[10px] font-bold uppercase ${c.color.replace('bg-', 'text-')}`}>{c.status}</p>
                    </div>
                    <div className="w-24 h-2 bg-gray-50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: c.level }}
                        className={`h-full ${c.color}`}
                      ></motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why QuickEats is Different Section */}
      <section className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-orange-100 rounded-full blur-[80px] opacity-40"></div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-100 rounded-full blur-[80px] opacity-40"></div>

              <div className="relative group">
                <div className="absolute inset-0 bg-orange-600/5 rounded-[60px] translate-x-4 translate-y-4 group-hover:translate-x-6 group-hover:translate-y-6 transition-transform"></div>
                <img
                  src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=1000"
                  className="relative w-full h-[600px] object-cover rounded-[60px] shadow-2xl border-4 border-white"
                  alt="Modern Campus Dining"
                />
              </div>
            </div>

            <div>
              <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-10 leading-tight">
                Why QuickEats is <span className="text-orange-600 block">Different</span>
              </h2>
              <div className="space-y-6">
                {[
                  { text: "All-in-one canteen management", color: "bg-orange-50 text-orange-600" },
                  { text: "Saves time during peak hours", color: "bg-blue-50 text-blue-600" },
                  { text: "Helps students manage money", color: "bg-green-50 text-green-600" },
                  { text: "Smart crowd monitoring", color: "bg-purple-50 text-purple-600" }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center space-x-6 bg-white p-8 rounded-[35px] shadow-sm border border-gray-50 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50 transition-all cursor-default"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center grow-0 shrink-0 ${item.color}`}>
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <span className="text-xl text-gray-800 font-bold">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-40 bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[150px] -mr-[400px] -mt-[400px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] -ml-[300px] -mb-[300px]"></div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-12 leading-tight">
              Ready to Upgrade <br /> Your Campus Life?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-orange-600 text-white px-14 py-7 rounded-full font-bold text-2xl hover:bg-orange-700 transition-all shadow-2xl hover:shadow-orange-500/30 flex items-center justify-center group"
              >
                Join Now
                <ArrowRight className="ml-3 w-7 h-7 group-hover:translate-x-2 transition-transform" />
              </button>
              <button className="w-full sm:w-auto bg-transparent text-white border-2 border-white/20 px-14 py-7 rounded-full font-bold text-2xl hover:bg-white hover:text-gray-900 transition-all">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="bg-black py-24 text-center text-white/40 text-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-4xl font-extrabold text-white mb-10">
            Quick<span className="text-orange-600">Eats</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mb-12 font-bold text-white/60">
            <Link to="#" className="hover:text-orange-600 transition-colors">About</Link>
            <Link to="#" className="hover:text-orange-600 transition-colors">Features</Link>
            <Link to="#" className="hover:text-orange-600 transition-colors">Pricing</Link>
            <Link to="#" className="hover:text-orange-600 transition-colors">Contact</Link>
          </div>
          <p className="mb-12 max-w-lg mx-auto leading-relaxed text-base">
            The ultimate smart dining platform for campuses worldwide. Efficiency, transparency, and delicious food.
          </p>
          <div className="pt-12 border-t border-white/10 font-bold tracking-widest uppercase text-xs">
            © 2026 QuickEats Global. Designed for Excellence.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
