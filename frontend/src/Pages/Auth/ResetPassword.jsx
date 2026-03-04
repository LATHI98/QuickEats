import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, KeyRound, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: location.state?.email || '',
        otp: '',
        newPassword: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/auth/reset-password', formData);
            toast.success('Password reset successful! You can now login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Password reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100"
            >
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-['Gilroy_Bold'] text-gray-900">Reset Password</h1>
                    <p className="text-gray-500 mt-2 font-['Gilroy_Medium']">Enter the 6-digit OTP sent to your email.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            name="otp"
                            placeholder="Enter OTP"
                            required
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-['Gilroy_Medium']"
                            onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="password"
                            name="newPassword"
                            placeholder="New Password"
                            required
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-['Gilroy_Medium']"
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 text-white py-5 rounded-2xl font-['Gilroy_Bold'] text-lg hover:bg-orange-700 transition-all shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        {loading ? "Resetting..." : (
                            <>
                                <span>Update Password</span>
                                <CheckCircle className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
