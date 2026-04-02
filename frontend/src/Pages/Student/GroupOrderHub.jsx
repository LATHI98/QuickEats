import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, KeyRound, Copy, Check, Lock, ArrowRight, Play, UtensilsCrossed, Settings, Trash2, X, LogOut, Info } from 'lucide-react';
import { groupSessionAPI, canteenAPI, cartAPI } from '../../services/api';
import { toast } from 'react-toastify';

const GroupOrderHub = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [canteens, setCanteens] = useState([]);

    // Create Form State
    const [isCreating, setIsCreating] = useState(false);
    const [selectedCanteen, setSelectedCanteen] = useState('');
    const [paymentMode, setPaymentMode] = useState('pay_separately');
    const [groupName, setGroupName] = useState('');

    // Join Form State
    const [isJoining, setIsJoining] = useState(false);
    const [shareCode, setShareCode] = useState('');

    // Edit Session State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPaymentMode, setEditPaymentMode] = useState('');

    // UI State
    const [copied, setCopied] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const [memberStatuses, setMemberStatuses] = useState([]);

    const fetchSession = async () => {
        try {
            setLoading(true);
            const res = await groupSessionAPI.getActiveSession();
            if (res.data.success && res.data.data) {
                setSession(res.data.data);
            } else {
                setSession(null);
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                // Only log or ignore 404 since it implies no active session
                console.error('Failed to get active session', err);
            } else {
                setSession(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchMemberStatuses = async (sessionId) => {
        try {
            const res = await groupSessionAPI.getMemberStatus(sessionId);
            setMemberStatuses(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch member statuses', err);
        }
    };

    const fetchCanteens = async () => {
        try {
            const res = await canteenAPI.getAll();
            const allCanteens = Array.isArray(res.data)
                ? res.data
                : Array.isArray(res.data?.data)
                    ? res.data.data
                    : [];
            setCanteens(allCanteens);
            if (allCanteens.length > 0) setSelectedCanteen(allCanteens[0]._id);
        } catch (err) {
            toast.error('Failed to load canteens');
        }
    };

    useEffect(() => {
        fetchSession();
        fetchCanteens();

        // Polling for real-time collaboration feel
        const interval = setInterval(() => {
            fetchSession();
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    // Fetch member statuses whenever session updates
    useEffect(() => {
        if (session && session._id) {
            fetchMemberStatuses(session._id);
        }
    }, [session]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!selectedCanteen) return toast.error('Select a canteen');
        setActionLoading(true);
        try {
            await cartAPI.clearCart(); // Clear personal cart first to avoid conflict
            const res = await groupSessionAPI.createSession({ canteenId: selectedCanteen, paymentMode, name: groupName });
            toast.success('Group session created!');
            setSession(res.data.data);
            setIsCreating(false);
            setGroupName('');
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
            setIsSwitching(false);
            setShareCode('');
            fetchSession();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to join session');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLock = async () => {
        if (!window.confirm('Are you sure you want to lock the session? No more members can join and items cannot be added.')) return;
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

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await groupSessionAPI.editSession(session._id, { name: editName, paymentMode: editPaymentMode });
            toast.success('Session updated');
            setIsEditing(false);
            fetchSession();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update session');
        } finally {
            setActionLoading(false);
        }
    }

    const handleRemoveMember = async (memberId, memberName) => {
        if (!window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) return;
        setActionLoading(true);
        try {
            await groupSessionAPI.removeMember(session._id, memberId);
            toast.success(`${memberName} removed from group`);
            fetchSession();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove member');
        } finally {
            setActionLoading(false);
        }
    }

    const handleCancelSession = async () => {
        if (!window.confirm('Are you sure you want to cancel and delete this ENTIRE group session? All group carts will be cleared.')) return;
        setActionLoading(true);
        try {
            await groupSessionAPI.deleteSession(session._id);
            toast.success('Group session cancelled');
            setSession(null); // Return to home view
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel session');
        } finally {
            setActionLoading(false);
        }
    }

    const handleLeaveSession = async () => {
        if (!window.confirm('Are you sure you want to leave this group session? Your cart will be cleared.')) return;
        setActionLoading(true);
        try {
            await groupSessionAPI.leaveSession(session._id, currentUser.id);
            toast.success('Left the group session');
            setSession(null); // Return to home view
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to leave session');
        } finally {
            setActionLoading(false);
        }
    }

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

    // NO ACTIVE SESSION VIEW (or switching)
    if (!session || isSwitching) {
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
                                    <label className="block text-xs font-['Gilroy_Medium'] text-gray-500 mb-1">Group Name</label>
                                    <input
                                        type="text"
                                        value={groupName}
                                        onChange={e => setGroupName(e.target.value)}
                                        placeholder="e.g., Study Mates Lunch"
                                        className="w-full text-sm border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:ring-orange-300 focus:border-orange-300"
                                        required
                                    />
                                </div>
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
    const isCreator = session.creator._id === currentUser.id;

    // EDIT MODAL for Creator
    const openEditModal = () => {
        setEditName(session.name);
        setEditPaymentMode(session.paymentMode);
        setIsEditing(true);
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-['Gilroy_Heavy'] text-gray-900 flex items-center gap-3">
                        {session.name}
                        <span className={`px-3 py-1 rounded-full text-xs font-['Gilroy_Medium'] ${session.status === 'locked' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                            {session.status.toUpperCase()}
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                        <span>Created by <span className="font-['Gilroy_Heavy']">{session.creator.name}</span></span>
                        &bull;
                        <span>Canteen: <span className="font-['Gilroy_Heavy']">{session.canteen?.name || 'Loading...'}</span></span>
                    </p>
                </div>

                {/* Actions Top Right */}
                <div className="flex gap-2">
                    {isCreator && session.status === 'open' && (
                        <button
                            onClick={openEditModal}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-['Gilroy_Medium'] transition-colors"
                        >
                            <Settings size={16} /> Edit Group
                        </button>
                    )}

                    {isCreator && session.status === 'open' && (
                        <button
                            onClick={handleCancelSession}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-['Gilroy_Medium'] transition-colors"
                        >
                            <Trash2 size={16} /> Cancel Group
                        </button>
                    )}

                    {!isCreator && session.status === 'open' && (
                        <button
                            onClick={handleLeaveSession}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-['Gilroy_Medium'] transition-colors"
                        >
                            <LogOut size={16} /> Leave Group
                        </button>
                    )}
                    <button
                        onClick={() => {
                          if (isSwitching) setIsSwitching(false);
                          else setIsSwitching(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-['Gilroy_Medium'] transition-colors"
                    >
                        <Users size={16} /> {isSwitching ? 'Back to Current' : 'Join Different Group'}
                    </button>
                </div>
            </div>

            {/* Invite & Details Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">

                    {/* Share Code & QR */}
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-sm text-gray-400 font-['Gilroy_Medium'] uppercase tracking-wider mb-2">Step 1: Invite Friends</h2>
                        <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto md:mx-0">
                            Have your friends scan the QR code or enter the share code to join this group.
                        </p>

                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {session.qrCodeData && (
                                <img src={session.qrCodeData} alt="Join QR Code" className="w-32 h-32 rounded-xl border object-contain p-1" />
                            )}
                            <div>
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <span className="text-5xl font-mono tracking-widest font-bold text-gray-900">{session.shareCode}</span>
                                </div>
                                <button
                                    onClick={copyCode}
                                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 text-sm font-['Gilroy_Medium'] flex items-center justify-center md:justify-start gap-2 mx-auto md:mx-0"
                                >
                                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                    {copied ? 'Copied URL!' : 'Copy Code'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Payment Mode Info */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 min-w-[240px] text-center md:text-left">
                        <p className="text-xs text-gray-500 mb-1 font-['Gilroy_Medium'] uppercase tracking-wider">Payment Rules</p>
                        <p className="font-['Gilroy_Heavy'] text-gray-900 text-lg mb-2">
                            {session.paymentMode === 'pay_together' ? 'Creator Pays All' : 'Split Bill'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-start gap-1 justify-center md:justify-start">
                            <Info size={14} className="shrink-0 mt-0.5" />
                            {session.paymentMode === 'pay_together' ? 'The creator will checkout and pay for everyone.' : 'Everyone must pay for their own items separately at checkout.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Bar / Step 2 & 3 */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Step 2: Add Items */}
                <div className={`rounded-2xl p-6 border ${session.status === 'locked' ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-indigo-50 border-indigo-100'}`}>
                    <h2 className="text-sm text-indigo-400 font-['Gilroy_Heavy'] uppercase tracking-wider mb-2">Step 2: Add Food</h2>
                    <p className={`text-sm mb-4 ${session.status === 'locked' ? 'text-gray-500' : 'text-indigo-900'}`}>Everyone needs to add their own items to the cart now.</p>

                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/dashboard/canteens/${session.canteen?._id || session.canteen}/menu`)}
                            disabled={session.status === 'locked'}
                            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-['Gilroy_Heavy'] hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <UtensilsCrossed size={16} /> Go to Menu
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/cart')}
                            className="flex-1 flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-200 py-3 rounded-xl font-['Gilroy_Heavy'] hover:bg-indigo-50 transition-colors"
                        >
                            View Cart
                        </button>
                    </div>
                </div>

                {/* Step 3: Lock & Checkout */}
                <div className={`rounded-2xl p-6 border ${session.status === 'locked' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-100'}`}>
                    <h2 className={`text-sm font-['Gilroy_Heavy'] uppercase tracking-wider mb-2 ${session.status === 'locked' ? 'text-green-600' : 'text-orange-400'}`}>
                        Step 3: Checkout
                    </h2>
                    <p className={`text-sm mb-4 ${session.status === 'locked' ? 'text-green-800' : 'text-orange-900'}`}>
                        {session.status === 'locked' ? 'Session locked! Proceed to checkout.' : 'Once everyone is finished adding items, lock the session.'}
                    </p>

                    {isCreator && session.status === 'open' && (
                        <button
                            onClick={handleLock}
                            disabled={actionLoading}
                            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-['Gilroy_Heavy'] transition-colors"
                        >
                            <Lock size={16} /> Lock Session
                        </button>
                    )}

                    {!isCreator && session.status === 'open' && (
                        <button disabled className="w-full flex items-center justify-center gap-2 bg-orange-200 text-orange-600 py-3 rounded-xl font-['Gilroy_Heavy'] cursor-not-allowed">
                            <Lock size={16} /> Waiting for Creator to Lock...
                        </button>
                    )}

                    {session.status === 'locked' && (
                        <button
                            onClick={() => navigate('/dashboard/cart')}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-['Gilroy_Heavy'] transition-colors"
                        >
                            Go to Checkout <Play size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Members List */}
            <div>
                <h3 className="text-lg font-['Gilroy_Heavy'] text-gray-900 mb-4 flex items-center gap-2">
                    <Users size={20} className="text-blue-500" />
                    Members ({session.members.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    {session.members.map(m => (
                        <div key={m._id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center font-bold text-gray-400 border border-gray-200">
                                    {m.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-['Gilroy_Heavy'] text-gray-900 flex items-center gap-2">
                                        {m.name} 
                                        {m._id === session.creator._id && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-md">Creator</span>}
                                        {m._id === currentUser.id && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">You</span>}
                                        {(() => {
                                            const status = memberStatuses.find(s => s._id === m._id);
                                            if (status?.hasItems) return <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200" title="Has items in cart" />;
                                            return <span className="w-2 h-2 rounded-full bg-gray-200" title="Cart empty" />;
                                        })()}
                                    </p>
                                    <p className="text-xs text-gray-400">@{m.username}</p>
                                </div>
                            </div>

                            {/* Remove button for creator */}
                            {isCreator && m._id !== session.creator._id && session.status === 'open' && (
                                <button
                                    onClick={() => handleRemoveMember(m._id, m.name)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Kick member"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>


            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-['Gilroy_Heavy'] text-gray-900">Edit Group</h2>
                            <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-['Gilroy_Medium'] text-gray-500 mb-1">Group Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full text-sm border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:ring-orange-300 focus:border-orange-300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-['Gilroy_Medium'] text-gray-500 mb-1">Payment Mode</label>
                                <select
                                    value={editPaymentMode}
                                    onChange={e => setEditPaymentMode(e.target.value)}
                                    className="w-full text-sm border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:ring-orange-300 focus:border-orange-300"
                                >
                                    <option value="pay_separately">Pay Separately</option>
                                    <option value="pay_together">Pay Together</option>
                                </select>
                            </div>
                            <div className="pt-2">
                                <button type="submit" disabled={actionLoading} className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-['Gilroy_Heavy']">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default GroupOrderHub;
