import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            toast.success('OTP sent to your email');
            navigate('/reset-password', { state: { email } });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
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
                <div className="mb-10 text-center">
                    <Link to="/login" className="flex items-center text-gray-500 hover:text-orange-600 transition-colors mb-6 font-['Gilroy_Medium']">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>
                    <h1 className="text-3xl font-['Gilroy_Bold'] text-gray-900">Forgot Password?</h1>
                    <p className="text-gray-500 mt-2 font-['Gilroy_Medium']">Enter your email and we'll send you an OTP.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            required
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-['Gilroy_Medium']"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 text-white py-5 rounded-2xl font-['Gilroy_Bold'] text-lg hover:bg-orange-700 transition-all shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        {loading ? "Sending..." : (
                            <>
                                <span>Send OTP</span>
                                <Send className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
