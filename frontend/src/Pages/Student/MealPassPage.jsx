import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Sunrise, Sun, Coffee, Croissant, 
  IceCream, MapPin, Ticket, X, CalendarDays, 
  CreditCard, User, QrCode, CreditCard as CashIcon, ShieldCheck, 
  Phone, Lock, Hash
} from 'lucide-react';
import mealPassService from '../../services/mealPassService';
import purchasedPassService from '../../services/purchasedPassService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';



const CATEGORIES = [
  { id: 'all', name: 'All Meals', icon: Ticket },
  { id: 'breakfast', name: 'Breakfast', icon: Sunrise },
  { id: 'lunch', name: 'Lunch', icon: Sun },
  { id: 'snacks', name: 'Snacks', icon: Croissant },
  { id: 'beverages', name: 'Beverages', icon: Coffee },
];

const MealPassPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');

  const [searchQuery, setSearchQuery] = useState('');
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [activePasses, setActivePasses] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    phoneNumber: '',
    duration: 'week',
    paymentMethod: 'online',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const [MEAL_PASS_ITEMS, setMealPassItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMealPasses = async () => {
      try {
        setLoading(true);
        const data = await mealPassService.getMealPasses();
        setMealPassItems(data);
      } catch (err) {
        toast.error('Failed to load meal passes');
      } finally {
        setLoading(false);
      }
    };

    const fetchMyPurchasedPasses = async () => {
      try {
        const data = await purchasedPassService.getMyPasses();
        setActivePasses(data);
      } catch (error) {
        console.error('Error fetching purchased passes');
      }
    };

    fetchMealPasses();
    if (user) {
      fetchMyPurchasedPasses();
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        studentId: user.studentId || '',
        phoneNumber: user.phoneNumber || ''
      }));
    }
  }, [user]);

  const filteredItems = useMemo(() => {
    return MEAL_PASS_ITEMS.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.canteen.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [MEAL_PASS_ITEMS, activeCategory, searchQuery]);

  const handleProceedToPay = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.studentId || !formData.phoneNumber) {
      toast.error('All fields are mandatory');
      return;
    }

    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    if (formData.paymentMethod === 'online') {
      if (!formData.cardNumber || !formData.expiry || !formData.cvv) {
        toast.error('Card details are mandatory for online payment');
        return;
      }
      if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
        toast.error('Invalid card number (should be 16 digits)');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(formData.expiry)) {
        toast.error('Invalid expiry format (MM/YY)');
        return;
      }
      if (formData.cvv.length !== 3) {
        toast.error('Invalid CVV (should be 3 digits)');
        return;
      }
    }

    if (!user) {
      toast.error('Please login to purchase a meal pass');
      navigate('/login');
      return;
    }

    const now = new Date();
    const expiry = new Date();
    if (formData.duration === 'week') expiry.setDate(now.getDate() + 7);
    else expiry.setMonth(now.getMonth() + 1);

    const purchaseData = {
      userId: user._id,
      mealPassId: selectedMeal._id,
      name: formData.name,
      studentId: formData.studentId,
      userRole: user.role,
      phoneNumber: formData.phoneNumber,
      duration: formData.duration,
      mealName: selectedMeal ? selectedMeal.name : 'Any Default Meal',
      canteen: selectedMeal ? selectedMeal.canteen : 'Multiple Locations',
      issuedAt: now.toISOString(),
      validUntil: expiry.toISOString(),
      paymentMethod: formData.paymentMethod,
      ticketId: 'MP-' + Math.floor(100000 + Math.random() * 900000),
      price: typeof selectedMeal.price === 'string' ? Number(selectedMeal.price.replace(/[^0-9]/g, '')) : Number(selectedMeal.price) || 0
    };


    try {
      await purchasedPassService.createPurchase(purchaseData);
      toast.success(purchaseData.paymentMethod === 'cash' 
        ? 'Purchase request sent! Please pay at canteen for approval.' 
        : 'Meal pass purchased successfully!');
      
      setShowPurchaseModal(false);
      navigate('/dashboard/my-passes'); 
    } catch (error) {
      toast.error('Failed to process purchase');
    }
  };


  return (
    <div className="max-w-7xl mx-auto pt-2 pb-10 px-4 md:px-8 font-sans relative">

      {/* Header & Search */}
      <div className="flex flex-col items-center mb-8 -mt-4">

        <h1 className="text-[120px] absolute opacity-5 font-black text-gray-400 pointer-events-none -translate-y-16 tracking-tighter">Menu</h1>
        
        <div className="relative z-10 w-full max-w-xl mx-auto flex items-center bg-white border border-gray-200 rounded-full p-2 shadow-sm focus-within:shadow-md transition-shadow">
          <Search size={20} className="text-gray-400 ml-4 mr-2" />
          <input 
            type="text" 
            placeholder="Search meals or canteens here..." 
            className="flex-1 bg-transparent border-none outline-none text-gray-700 font-medium placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-full font-semibold transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex justify-center gap-6 md:gap-12 mb-16 overflow-x-auto pt-6 pb-6 px-4 hide-scrollbar">
        {CATEGORIES.map(category => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className="flex flex-col items-center gap-3 group whitespace-nowrap"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110' : 'bg-gray-100/80 text-gray-500 group-hover:bg-gray-200 group-hover:scale-105'
              }`}>
                <Icon size={28} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-sm font-semibold transition-colors ${
                isActive ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-800'
              }`}>
                {category.name}
              </span>
            </button>
          );
        })}

        {/* View My Meal Passes - Permanently visible routing to history page */}
        <button
          onClick={() => navigate('/dashboard/my-passes')}
          className="flex flex-col items-center gap-3 group whitespace-nowrap ml-4 pl-8 md:pl-12 border-l-2 border-dashed border-gray-200 shrink-0"
        >
          <div className={`relative w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-all duration-300 ${activePasses.filter(p => p.status !== 'rejected').length > 0 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-100/80 text-gray-500 group-hover:bg-gray-200'} group-hover:scale-110`}>
            <ShieldCheck size={28} strokeWidth={2.5} />
            {activePasses.filter(p => p.status !== 'rejected').length > 0 && (
              <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                {activePasses.filter(p => p.status !== 'rejected').length}
              </div>
            )}
          </div>
          <span className={`text-sm font-black uppercase tracking-widest hidden sm:block ${activePasses.length > 0 ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-800'}`}>
            My Passes
          </span>
          <span className={`text-sm font-black uppercase tracking-widest sm:hidden ${activePasses.length > 0 ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-800'}`}>
            Passes
          </span>
        </button>
      </div>

      {/* Food Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-[24px] h-96 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >

          <AnimatePresence mode="popLayout">
            {filteredItems.map(item => (
               <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -8 }}
                onClick={() => {
                  setSelectedMeal(item);
                  setShowPurchaseModal(true);
                }}
                className="cursor-pointer bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(249,115,22,0.15)] border border-gray-100 transition-all flex flex-col hover:border-orange-200 group"
              >
              <div className="relative h-48 group-hover:shadow-[inset_0_0_60px_rgba(0,0,0,0.05)] transition-all duration-500 overflow-hidden">

                  <img 
                   src={item.image ? (item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
                   alt={item.name} 
                   className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-30 group-hover:opacity-10 transition-opacity" />

                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm p-3 rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all font-bold text-orange-500 text-sm shadow-xl z-10 flex items-center gap-2">
                  <Ticket size={16} /> Get Pass
                </div>
                {item.discount && (
                  <div className="absolute top-6 left-6 bg-gray-900/95 backdrop-blur-sm px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                    <Ticket size={14} className="text-white" />
                    <span className="text-xs font-semibold text-white tracking-wide">{item.discount}</span>
                  </div>
                )}
              </div>

                 <div className="p-5 pt-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-orange-600 transition-colors line-clamp-1">{item.name}</h3>
                    <span className="text-base font-black text-gray-900 whitespace-nowrap">{item.price}</span>
                  </div>

                   <div className="flex items-center gap-1 text-orange-500 text-xs font-semibold mb-3">
                    <MapPin size={14} />
                    <span>{item.canteen}</span>
                  </div>

                   <p className="text-gray-500 text-[13px] font-medium leading-relaxed mb-4 line-clamp-2">
                    {item.description}
                  </p>

                   <div className="flex flex-wrap gap-1.5 mt-auto">
                    {item.tags?.map(tag => (
                      <span 
                        key={tag} 
                        className="bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredItems.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Ticket size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No meals found</h3>
              <p className="text-gray-500 font-medium">Try adjusting your category or search to find available meal passes.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* --- PURCHASE MODAL --- */}
      <AnimatePresence>
        {showPurchaseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setShowPurchaseModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden"
            >
              <div className="bg-orange-50 p-5 border-b border-orange-100 flex flex-col gap-1 relative">
                <button onClick={() => setShowPurchaseModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors bg-white p-2 rounded-full shadow-sm">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <Ticket className="text-orange-500" /> Meal Pass
                </h2>
                {selectedMeal && (
                  <p className="text-sm font-bold text-gray-500 mt-1">Pass For: <span className="text-orange-600">{selectedMeal.name}</span></p>
                )}
              </div>

              <form onSubmit={handleProceedToPay} className="p-5 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        readOnly
                        type="text" 
                        placeholder="John Doe"
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 outline-none font-medium text-gray-500 text-sm cursor-not-allowed"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      {user?.role === 'universityStaff' ? 'Staff ID' : 'Student ID'}
                    </label>
                    <div className="relative">
                      <QrCode size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        readOnly
                        type="text" 
                        placeholder={user?.role === 'universityStaff' ? 'STAFF-12345' : 'STU-12345'}
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 outline-none font-medium text-gray-500 text-sm cursor-not-allowed"
                        value={formData.studentId}
                        onChange={e => setFormData({...formData, studentId: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number (10 Digits)</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        readOnly
                        type="tel" 
                        maxLength="10"
                        placeholder="07XXXXXXXX"
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 outline-none font-medium text-gray-500 text-sm cursor-not-allowed"
                        value={formData.phoneNumber}
                        onChange={e => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '')})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Pass Duration</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, duration: 'week'})}
                      className={`py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all text-sm ${
                        formData.duration === 'week' ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <CalendarDays size={16} /> 1 Week
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, duration: 'month'})}
                      className={`py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all text-sm ${
                        formData.duration === 'month' ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <CalendarDays size={16} /> 1 Month
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: 'online'})}
                      className={`py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all text-sm ${
                        formData.paymentMethod === 'online' ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <CreditCard size={16} /> Pay Online
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: 'cash'})}
                      className={`py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all text-sm ${
                        formData.paymentMethod === 'cash' ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <CashIcon size={16} /> Pay Cash
                    </button>
                  </div>
                  {formData.paymentMethod === 'online' && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="relative">
                        <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                        <input 
                          type="text"
                          placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                          maxLength="19"
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-11 pr-4 outline-none focus:border-orange-500 focus:bg-white transition-all font-medium text-gray-700 text-xs tracking-[0.1em]"
                          value={formData.cardNumber}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                            setFormData({...formData, cardNumber: val});
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                          <input 
                            type="text"
                            placeholder="Exp: MM/YY"
                            maxLength="5"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-11 pr-4 outline-none focus:border-orange-500 focus:bg-white transition-all font-medium text-gray-700 text-xs"
                            value={formData.expiry}
                            onChange={e => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                              setFormData({...formData, expiry: val});
                            }}
                          />
                        </div>
                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                          <input 
                            type="password"
                            placeholder="CVV: 123"
                            maxLength="3"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-11 pr-4 outline-none focus:border-orange-500 focus:bg-white transition-all font-medium text-gray-700 text-xs"
                            value={formData.cvv}
                            onChange={e => setFormData({...formData, cvv: e.target.value.replace(/\D/g, '')})}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600 outline-none text-white py-3.5 rounded-xl font-black text-base shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-1"
                >
                  Proceed to Pay
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MealPassPage;
