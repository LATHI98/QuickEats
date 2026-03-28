import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, ArrowRight, ArrowLeft, GraduationCap, Shield, Coffee } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import authSide from '../../assets/images/auth_side.png';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'student'
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', formData);
            toast.success(res.data.message);
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-stretch">
            {/* Form Section */}
            <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 bg-white z-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="max-w-md w-full mx-auto"
                >
                    <div className="mb-10">
                        <Link to="/" className="text-4xl font-['Gilroy_Heavy'] text-orange-600 inline-block mb-8">
                            Quick<span className="text-gray-900">Eats</span>
                        </Link>
                        <h1 className="text-4xl font-['Gilroy_Bold'] text-gray-900 mb-3">Create Account</h1>
                        <p className="text-gray-500 font-['Gilroy_Medium']">Start your smart campus life today.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-['Gilroy_Bold'] text-gray-700 mb-4 ml-1 uppercase tracking-wider">Join As</label>
                            <div className="grid grid-cols-2 gap-3">
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
                                        className={`flex items-center justify-center space-x-3 px-4 py-4 rounded-2xl border-2 transition-all font-['Gilroy_Bold'] ${formData.role === role.id
                                            ? 'border-orange-600 bg-orange-50 text-orange-600'
                                            : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        <role.icon className="w-5 h-5" />
                                        <span className="text-xs">{role.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Full Name"
                                    required
                                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-['Gilroy_Medium']"
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="relative group">
                                <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Username"
                                    required
                                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-['Gilroy_Medium']"
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="name@university.edu"
                                    required
                                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-['Gilroy_Medium']"
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Create Password"
                                    required
                                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-['Gilroy_Medium']"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-600 text-white py-6 rounded-2xl font-['Gilroy_Bold'] text-xl hover:bg-orange-700 transition-all shadow-xl hover:shadow-orange-200 flex items-center justify-center space-x-3 disabled:opacity-50 mt-4"
                        >
                            {loading ? "Creating Account..." : (
                                <>
                                    <span>Sign Up</span>
                                    <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center text-gray-500 font-['Gilroy_Medium']">
                        Already have an account?
                        <Link to="/login" className="text-orange-600 font-['Gilroy_Bold'] ml-2 hover:underline">Log in</Link>
                    </div>
                </motion.div>
            </div>

            {/* Image Section */}
            <div className="hidden lg:block relative flex-1 bg-orange-50 overflow-hidden">
                <motion.img
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                    src={authSide}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="Campus Dining"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-orange-950/60 to-transparent"></div>
                <div className="absolute bottom-20 left-20 right-20 text-white">

                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
