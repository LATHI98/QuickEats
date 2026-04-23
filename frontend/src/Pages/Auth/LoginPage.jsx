import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ChevronDown, User, Shield, Coffee, GraduationCap, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import loginNoodle from '../../assets/images/noodle.jpg';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const { login: authLogin, user, selectedCanteenId } = useAuth();

  if (user) {
    if (['student', 'universityStaff'].includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
    if (['admin', 'superAdmin'].includes(user.role)) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to={selectedCanteenId ? '/admin/dashboard' : '/admin/select-canteen'} replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authLogin(formData.email, formData.password, formData.role);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-stretch">
      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-8 bg-white z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full mx-auto"
        >
          <div className="mb-8">
            <Link to="/" className="text-3xl font-extrabold text-orange-600 inline-block mb-6">
              Quick<span className="text-gray-900">Eats</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-3 ml-1 uppercase tracking-wider">Login As</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'student', label: 'Student', icon: GraduationCap },
                  { id: 'admin', label: 'Admin', icon: Shield },
                  { id: 'universityStaff', label: 'University Staff', icon: Coffee },
                  { id: 'canteenStaff', label: 'Canteen Staff', icon: User },
                ].map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: role.id })}
                    className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-xl border-2 transition-all font-bold ${formData.role === role.id
                      ? 'border-orange-600 bg-orange-50 text-orange-600'
                      : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                      }`}
                  >
                    <role.icon className="w-4 h-4" />
                    <span className="text-[10px]">{role.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email"
                  name="email"
                  placeholder="name@university.edu"
                  required
                  className="w-full pl-11 pr-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-medium"
                  onChange={handleChange}
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-medium"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" virtual-id="forgot-password" className="text-sm font-bold text-orange-600 hover:text-orange-700">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-all shadow-lg hover:shadow-orange-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? "Signing in..." : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center text-gray-500 text-sm font-medium">
            New here?
            <Link to="/register" className="text-orange-600 font-bold ml-2 hover:underline">Create Account</Link>
          </div>
        </motion.div>
      </div>

      {/* Image Section */}
      <div className="hidden lg:block relative flex-1 bg-orange-50 overflow-hidden">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          src={loginNoodle}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Smart Dining"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-orange-950/60 to-transparent"></div>
        <div className="absolute bottom-20 left-20 right-20 text-white">

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
