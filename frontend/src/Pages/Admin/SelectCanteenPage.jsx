import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, CheckCircle2, ArrowRight, Lock, Search, Sparkles, Shield, ChevronRight, Clock3, MapPin, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import { canteenAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const getGreeting = (hour) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const SelectCanteenPage = () => {
  const navigate = useNavigate();
  const { user, selectedCanteenId, setSelectedCanteen } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickedId, setPickedId] = useState(selectedCanteenId || '');
  const [canteenPassword, setCanteenPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(new Date());
  const passwordRef = useRef(null);

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        const res = await canteenAPI.getAll();
        const all = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        setCanteens(all);

        if (all.length === 1) {
          setPickedId(all[0]._id);
          return;
        }

        if (selectedCanteenId && all.some((canteen) => canteen._id === selectedCanteenId)) {
          setPickedId(selectedCanteenId);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load canteens');
      } finally {
        setLoading(false);
      }
    };

    fetchCanteens();
  }, [user?.role, user?.canteen]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const pickedCanteen = useMemo(
    () => canteens.find(c => c._id === pickedId) || null,
    [canteens, pickedId]
  );

  useEffect(() => {
    if (!pickedCanteen) return;
    setCanteenPassword('');
    passwordRef.current?.focus();
  }, [pickedCanteen?._id]);

  const filteredCanteens = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return canteens;
    return canteens.filter((canteen) =>
      [canteen.name, canteen.owner, canteen.description, canteen.openHours, canteen.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [canteens, searchTerm]);

  const handleContinue = async () => {
    if (!pickedCanteen) {
      toast.error('Please select a canteen to continue');
      return;
    }
    if (!canteenPassword.trim()) {
      toast.error('Please enter the canteen password');
      return;
    }

    try {
      await canteenAPI.verifyPassword(pickedCanteen._id, canteenPassword.trim());
      setSelectedCanteen(pickedCanteen);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid canteen password');
    }
  };

  const greeting = getGreeting(now.getHours());

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <div className="flex flex-col items-center gap-4 rounded-[28px] border border-gray-100 bg-white px-8 py-10 shadow-sm">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-sm font-['Gilroy_Bold'] text-gray-900">Loading canteen access</p>
            <p className="text-xs text-gray-500 mt-1">Preparing your staff canteen list...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[40px] border border-orange-100 bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white shadow-2xl shadow-orange-200/30">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/90 backdrop-blur">
                <Sparkles size={14} /> Staff canteen access
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-['Gilroy_Heavy'] leading-tight tracking-tight md:text-5xl">
                  {greeting}, {user?.name || 'Staff'}.
                  <span className="block text-white/90">Choose your canteen, then unlock the staff workspace.</span>
                </h1>
                <p className="max-w-2xl text-base leading-7 text-white/85 md:text-lg">
                  Pick the correct canteen context before handling orders, reservations, tables, payments, or pickup verification.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
                <Clock3 size={14} />
                <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-white/50">·</span>
                <span>{now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Access secured</p>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-['Gilroy_Heavy'] text-white">Password gated</p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-white/80">
                      <Shield size={14} />
                      <span>Verify before entering staff tools</span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/15 px-3 py-2 text-right">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Canteens</p>
                    <p className="text-lg font-['Gilroy_Heavy'] text-white">{canteens.length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Selected canteen</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-['Gilroy_Heavy'] text-white">{pickedCanteen?.name || 'No canteen selected'}</p>
                    <p className="mt-1 text-sm text-white/80">{pickedCanteen?.owner || 'Choose from the list below'}</p>
                  </div>
                  <ChevronRight size={18} className="text-white/60" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Available canteens</p>
                <h2 className="mt-2 text-2xl font-['Gilroy_Heavy'] text-gray-900">Select the right workspace</h2>
              </div>
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by canteen, owner, or hours"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-orange-400 focus:bg-white"
                />
              </div>
            </div>

            {canteens.length === 0 ? (
              <div className="mt-6 rounded-[28px] border border-dashed border-amber-200 bg-amber-50 px-5 py-8 text-sm text-amber-800">
                No canteen is available for this account. Contact an admin to configure canteen access.
              </div>
            ) : filteredCanteens.length === 0 ? (
              <div className="mt-6 rounded-[28px] border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-sm text-gray-500">
                No canteens match your search.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {filteredCanteens.map((canteen) => {
                  const selected = pickedId === canteen._id;
                  return (
                    <motion.button
                      key={canteen._id}
                      type="button"
                      whileHover={{ y: -4 }}
                      onClick={() => setPickedId(canteen._id)}
                      aria-pressed={selected}
                      className={`text-left rounded-[28px] border p-5 transition-all ${selected
                        ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100/50 ring-2 ring-orange-100'
                        : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-md'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-lg font-['Gilroy_Heavy'] text-gray-900 truncate">{canteen.name}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                            <MapPin size={13} />
                            <span>{canteen.openHours || 'Open hours not set'}</span>
                          </p>
                        </div>
                        {selected ? (
                          <span className="inline-flex items-center rounded-full bg-orange-600 px-2.5 py-1 text-[10px] font-['Gilroy_Heavy'] uppercase tracking-[0.2em] text-white shrink-0">
                            Selected
                          </span>
                        ) : (
                          <CheckCircle2 size={18} className="text-gray-300 shrink-0" />
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Star size={13} className="text-amber-500 fill-amber-500" />
                          {(canteen.ratings ?? 0).toFixed(1)}
                        </span>
                        <span className="font-['Gilroy_Bold'] text-orange-600">{canteen.owner || 'No owner'}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[36px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <Lock size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Verification</p>
                <h2 className="mt-1 text-2xl font-['Gilroy_Heavy'] text-gray-900">Canteen password</h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-gray-500">
              Enter the canteen access password before continuing into the selected staff workspace.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-['Gilroy_Bold'] text-gray-700">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="password"
                    value={canteenPassword}
                    onChange={(e) => setCanteenPassword(e.target.value)}
                    ref={passwordRef}
                    disabled={!pickedCanteen}
                    placeholder="Enter the canteen password"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-orange-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-gray-100 bg-gray-50/70 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Current selection</p>
                    <p className="mt-2 text-lg font-['Gilroy_Heavy'] text-gray-900">
                      {pickedCanteen?.name || 'Select a canteen first'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {pickedCanteen?.owner || 'The details of the selected canteen will appear here.'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Status</p>
                    <p className="text-sm font-['Gilroy_Bold'] text-orange-600">Ready to verify</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                disabled={!pickedCanteen}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3.5 text-sm font-['Gilroy_Heavy'] text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue to staff dashboard
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SelectCanteenPage;
