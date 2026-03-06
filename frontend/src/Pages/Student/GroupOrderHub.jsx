import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, KeyRound, Copy, Check, Lock, ArrowRight, Play, UtensilsCrossed } from 'lucide-react';
import { groupSessionAPI, canteenAPI, cartAPI } from '../../services/api';
import { toast } from 'react-toastify';

const GroupOrderHub = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [canteens, setCanteens] = useState([]);

    // Create Form State
    const [isCreating, setIsCreating] = useState(false);
    const [selectedCanteen, setSelectedCanteen] = useState('');
    const [paymentMode, setPaymentMode] = useState('pay_separately');

    // Join Form State
    const [isJoining, setIsJoining] = useState(false);
    const [shareCode, setShareCode] = useState('');

    // UI State
    const [copied, setCopied] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchSession = async () => {
        try {
            setLoading(true);
            const res = await groupSessionAPI.getActiveSession();
            if (res.data.success && res.data.data) {
                setSession(res.data.data);
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                // Only log or ignore 404 since it implies no active session
                console.error('Failed to get active session', err);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCanteens = async () => {
        try {
            const res = await canteenAPI.getAll();
            setCanteens(res.data.data);
            if (res.data.data.length > 0) setSelectedCanteen(res.data.data[0]._id);
        } catch (err) {
            toast.error('Failed to load canteens');
        }
    };

    useEffect(() => {
        fetchSession();
        fetchCanteens();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!selectedCanteen) return toast.error('Select a canteen');
        setActionLoading(true);
        try {
            await cartAPI.clearCart(); // Clear personal cart first to avoid conflict
            const res = await groupSessionAPI.createSession({ canteenId: selectedCanteen, paymentMode });
            toast.success('Group session created!');
            setSession(res.data.data);
            setIsCreating(false);
            fetchSession(); // Re-fetch to populate
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create session');
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!shareCode) return toast.error('Enter a share code');
        setActionLoading(true);
        try {
            await cartAPI.clearCart(); // Clear personal cart first
            const res = await groupSessionAPI.joinSession(shareCode);
            toast.success('Joined group session!');
            setIsJoining(false);
            fetchSession();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to join session');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLock = async () => {
        if (!window.confirm('Are you sure you want to lock the session? No more members can join.')) return;
        setActionLoading(true);
        try {
            await groupSessionAPI.lockSession(session._id);
            toast.success('Session locked');
            fetchSession();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to lock session');
        } finally {
            setActionLoading(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(session.shareCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Copied to clipboard');
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    // NO ACTIVE SESSION VIEW
    if (!session) {
        return (
            <div className="max-w-2xl mx-auto py-8 px-4">
                <h1 className="text-3xl font-['Gilroy_Heavy'] text-gray-900 mb-2">Group Ordering</h1>
                <p className="text-gray-500 mb-8">Create a session and share the code with friends, or join an existing session to order together!</p>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Create Session Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                                <Plus size={24} />
                            </div>
                            <h2 className="text-xl font-['Gilroy_Heavy'] text-gray-900 mb-2">Create a Session</h2>
                            <p className="text-gray-500 text-sm mb-6">Start a new group order, pick a canteen, and decide how you want to split the bill.</p>
                        </div>

                        {isCreating ? (
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-['Gilroy_Medium'] text-gray-500 mb-1">Select Canteen</label>
                                    <select
                                        value={selectedCanteen}
                                        onChange={e => setSelectedCanteen(e.target.value)}
                                        className="w-full text-sm border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:ring-orange-300 focus:border-orange-300"
                                    >
                                        {canteens.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-['Gilroy_Medium'] text-gray-500 mb-1">Payment Mode</label>
                                    <select
                                        value={paymentMode}
                                        onChange={e => setPaymentMode(e.target.value)}
                                        className="w-full text-sm border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:ring-orange-300 focus:border-orange-300"
                                    >
                                        <option value="pay_separately">Pay Separately (Everyone pays their own items)</option>
                                        <option value="pay_together">Pay Together (You pay for everyone)</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 border rounded-xl text-sm font-['Gilroy_Medium'] flex-1">Cancel</button>
                                    <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-['Gilroy_Medium'] flex-1 disabled:opacity-50">Start</button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                disabled={isJoining}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl font-['Gilroy_Heavy'] hover:bg-gray-800 transition-colors"
                            >
                                Create Group Session
                            </button>
                        )}
                    </div>

                    {/* Join Session Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                <KeyRound size={24} />
                            </div>
                            <h2 className="text-xl font-['Gilroy_Heavy'] text-gray-900 mb-2">Join a Session</h2>
                            <p className="text-gray-500 text-sm mb-6">Have a code from a friend? Enter it here to join their group order.</p>
                        </div>

                        {isJoining ? (
                            <form onSubmit={handleJoin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-['Gilroy_Medium'] text-gray-500 mb-1">Share Code</label>
                                    <input
                                        type="text"
                                        value={shareCode}
                                        onChange={e => setShareCode(e.target.value.toUpperCase())}
                                        placeholder="e.g. A1B2C3"
                                        className="w-full text-center tracking-widest uppercase font-mono border-gray-200 rounded-xl px-3 py-3 bg-gray-50 focus:ring-blue-300 focus:border-blue-300"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setIsJoining(false)} className="px-4 py-2 border rounded-xl text-sm font-['Gilroy_Medium'] flex-1">Cancel</button>
                                    <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-['Gilroy_Medium'] flex-1 disabled:opacity-50">Join</button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsJoining(true)}
                                disabled={isCreating}
                                className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-['Gilroy_Heavy'] hover:bg-blue-100 transition-colors"
                            >
                                Join with Code
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ACTIVE SESSION VIEW
    const isCreator = session.creator._id === JSON.parse(localStorage.getItem('user')).id;

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-['Gilroy_Heavy'] text-gray-900">Active Group Order</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-['Gilroy_Medium'] ${session.status === 'locked' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {session.status.toUpperCase()}
                </span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between border-b pb-6 mb-6">
                    <div className="flex-1">
                        <h2 className="text-sm text-gray-400 font-['Gilroy_Medium'] uppercase tracking-wider mb-1">Share Code</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-mono tracking-widest font-bold text-gray-900">{session.shareCode}</span>
                            <button
                                onClick={copyCode}
                                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                                title="Copy code"
                            >
                                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Share this code with friends so they can join!
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 min-w-[200px]">
                        <p className="text-xs text-gray-500 mb-1 font-['Gilroy_Medium']">Canteen</p>
                        <p className="font-['Gilroy_Heavy'] text-gray-900 mb-3">{session.canteen?.name || 'Loading...'}</p>
                        <p className="text-xs text-gray-500 mb-1 font-['Gilroy_Medium']">Payment Mode</p>
                        <p className="font-['Gilroy_Heavy'] text-gray-900">
                            {session.paymentMode === 'pay_together' ? 'Creator Pays All' : 'Split Bill (Pay Seprately)'}
                        </p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-['Gilroy_Heavy'] text-gray-900 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-blue-500" />
                        Members ({session.members.length})
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 mb-6">
                        {session.members.map(m => (
                            <div key={m._id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-gray-400 border shadow-sm">
                                    {m.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-['Gilroy_Heavy'] text-gray-900">
                                        {m.name} {m._id === session.creator._id && <span className="text-[10px] ml-1 bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-md">Creator</span>}
                                    </p>
                                    <p className="text-xs text-gray-400">@{m.username}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => navigate(`/dashboard/canteens/${session.canteen?._id || session.canteen}/menu`)}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-['Gilroy_Heavy'] hover:bg-gray-800 transition-colors"
                        >
                            <UtensilsCrossed size={18} /> View Menu & Add Items
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/cart')}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-xl font-['Gilroy_Heavy'] hover:bg-blue-100 transition-colors border border-blue-100"
                        >
                            Go to Cart <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {isCreator && session.status === 'open' && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 text-center">
                    <p className="text-orange-800 text-sm mb-3">Once everyone has added their items to their cart, lock the session to proceed to checkout.</p>
                    <button
                        onClick={handleLock}
                        disabled={actionLoading}
                        className="flex items-center gap-2 mx-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-['Gilroy_Heavy'] transition-colors"
                    >
                        <Lock size={16} /> Lock Session
                    </button>
                </div>
            )}

            {session.status === 'locked' && (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center flex flex-col items-center">
                    <Lock size={24} className="text-green-600 mb-2" />
                    <h3 className="font-['Gilroy_Heavy'] text-green-900 text-lg mb-1">Session Locked!</h3>
                    <p className="text-green-700 text-sm mb-4">You can now proceed to checkout your items.</p>
                    <button
                        onClick={() => navigate('/dashboard/cart')}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-['Gilroy_Heavy'] transition-colors"
                    >
                        Go to Checkout <Play size={16} />
                    </button>
                </div>
            )}

        </div>
    );
};

export default GroupOrderHub;
