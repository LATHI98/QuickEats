import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const { login, user, loading: authLoading } = useAuth();

  // All hooks must be declared before any conditional returns
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Already logged in — redirect to their dashboard
  if (!authLoading && user) {
    return <Navigate to={user.role === 'student' ? '/dashboard' : '/admin/dashboard'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-defaultRed/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-defaultRed/5 rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-defaultRed w-full" />

          <div className="px-8 py-10">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-defaultRed/10 rounded-2xl flex items-center justify-center mb-4">
                <UtensilsCrossed className="w-8 h-8 text-defaultRed" />
              </div>
              <h1 className="text-2xl font-gilroyBold text-gray-900">QuickEats</h1>
              <p className="text-sm text-gray-500 font-gilroyRegular mt-1">
                Canteen Management System
              </p>
            </div>

            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-xl font-gilroyBold text-gray-800">Welcome back</h2>
              <p className="text-sm text-gray-500 font-gilroyRegular mt-0.5">
                Sign in to your account to continue
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-gilroyRegular">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-gilroyMedium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-gilroyRegular text-gray-800 placeholder-gray-400 focus:outline-none focus:border-defaultRed focus:ring-2 focus:ring-defaultRed/10 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-gilroyMedium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm font-gilroyRegular text-gray-800 placeholder-gray-400 focus:outline-none focus:border-defaultRed focus:ring-2 focus:ring-defaultRed/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-defaultRed hover:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-gilroyBold py-3 rounded-xl transition-colors duration-200 mt-2 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="text-center text-xs text-gray-400 font-gilroyRegular mt-6">
              Don't have an account? Contact your administrator.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 font-gilroyRegular">
          © {new Date().getFullYear()} QuickEats. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
