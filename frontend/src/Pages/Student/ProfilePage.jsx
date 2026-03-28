import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Hash, Shield, Edit3, 
  Save, X, Trash2, CheckCircle, ChevronRight, AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    phoneNumber: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        studentId: user.studentId || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount();
      toast.info('Account deleted. We are sorry to see you go.');
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 font-sans">
      {/* Header Section */}
      <header className="mb-12 flex flex-col items-center text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative group mb-6"
        >
          <div className="w-28 h-28 bg-gradient-to-tr from-orange-500 to-orange-400 rounded-[45px] flex items-center justify-center text-white shadow-2xl shadow-orange-200 relative z-10">
            <User size={48} strokeWidth={1.5} />
          </div>
          <div className="absolute inset-0 bg-orange-100 rounded-[45px] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
          
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute -bottom-2 -right-2 bg-white p-3 rounded-2xl shadow-xl text-orange-500 hover:scale-110 active:scale-95 transition-all z-20 border border-orange-50"
            >
              <Edit3 size={18} />
            </button>
          )}
        </motion.div>

        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">My Account</h1>
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200">
          <Shield size={12} className="text-orange-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{user?.role} Profile</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-gray-200/40 border border-gray-100">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-black text-gray-900">Personal Information</h2>
              {isEditing && (
                <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              )}
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <User size={12} className="text-orange-400" /> Full Name
                  </label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full py-4 px-6 rounded-2xl border transition-all text-sm font-bold ${
                      isEditing 
                      ? 'bg-white border-orange-100 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 text-gray-800' 
                      : 'bg-gray-50 border-transparent text-gray-500 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail size={12} className="text-orange-400" /> Email Address
                  </label>
                  <input
                    disabled={!isEditing}
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full py-4 px-6 rounded-2xl border transition-all text-sm font-bold ${
                      isEditing 
                      ? 'bg-white border-orange-100 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 text-gray-800' 
                      : 'bg-gray-50 border-transparent text-gray-500 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Hash size={12} className="text-orange-400" /> Student / Staff ID
                  </label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                    className={`w-full py-4 px-6 rounded-2xl border transition-all text-sm font-bold ${
                      isEditing 
                      ? 'bg-white border-orange-100 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 text-gray-800' 
                      : 'bg-gray-50 border-transparent text-gray-500 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Phone size={12} className="text-orange-400" /> Phone Number
                  </label>
                  <input
                    disabled={!isEditing}
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    placeholder="Enter 10 digit number"
                    className={`w-full py-4 px-6 rounded-2xl border transition-all text-sm font-bold ${
                      isEditing 
                      ? 'bg-white border-orange-100 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 text-gray-800' 
                      : 'bg-gray-50 border-transparent text-gray-500 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              {isEditing && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1a1a1a] text-white py-5 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-orange-600 hover:shadow-2xl hover:shadow-orange-200 transition-all active:scale-[0.98]"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save Changes</>}
                  </button>
                </motion.div>
              )}
            </form>
          </div>
        </div>

        {/* Account Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
             <h3 className="text-sm font-black text-gray-900 mb-6 uppercase tracking-widest">Account Security</h3>
             <ul className="space-y-4">
                <li className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group cursor-pointer hover:border-orange-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-orange-500" />
                    <span className="text-xs font-bold text-gray-600">Change Password</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </li>
             </ul>
          </div>

          <div className="bg-red-50/50 rounded-[2rem] p-8 border border-red-100 space-y-4">
             <div className="flex items-center gap-2 text-red-600">
               <AlertTriangle size={18} />
               <h3 className="text-xs font-black uppercase tracking-widest">Danger Zone</h3>
             </div>
             <p className="text-[11px] font-bold text-red-400 leading-relaxed">
               Permanently delete your account and all associated data. This action cannot be undone.
             </p>
             
             {!showDeleteConfirm ? (
               <button 
                 onClick={() => setShowDeleteConfirm(true)}
                 className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-widest hover:text-red-700 underline underline-offset-4 decoration-2"
               >
                 <Trash2 size={14} /> Delete My Account
               </button>
             ) : (
               <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 pt-2">
                 <p className="text-[10px] font-black text-red-700 uppercase">Are you absolutely sure?</p>
                 <div className="flex gap-2">
                   <button 
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                   >
                     Yes, Delete
                   </button>
                   <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-white text-gray-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-gray-200 hover:bg-gray-50 transition-colors"
                   >
                     Cancel
                   </button>
                 </div>
               </motion.div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
