import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Hash, Lock, Shield, AlertTriangle,
  Eye, EyeOff, Save, Trash2, CheckCircle2, XCircle,
  GraduationCap, Users, Settings, Loader2, KeyRound,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'access', label: 'Access & Role', icon: Shield },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

const ROLE_CONFIG = {
  student: {
    label: 'Student',
    icon: GraduationCap,
    accent: 'bg-blue-50 border-blue-100 text-blue-700',
    iconColor: 'text-blue-600',
    description: 'Standard campus student account with full ordering, tracking, and budget features.',
    features: [
      { label: 'Browse & order from canteens', available: true },
      { label: 'Real-time order tracking', available: true },
      { label: 'Meal budget management', available: true },
      { label: 'Group ordering sessions', available: true },
      { label: 'Table reservations', available: true },
      { label: 'Event catering requests', available: true },
      { label: 'Meal pass & digital passes', available: true },
      { label: 'Health meal planning', available: true },
      { label: 'Submit support tickets', available: true },
      { label: 'Canteen staff dashboard', available: false },
      { label: 'User administration', available: false },
      { label: 'System settings', available: false },
    ],
  },
  universityStaff: {
    label: 'University Staff',
    icon: Users,
    accent: 'bg-purple-50 border-purple-100 text-purple-700',
    iconColor: 'text-purple-600',
    description: 'University staff account with the same ordering capabilities as students.',
    features: [
      { label: 'Browse & order from canteens', available: true },
      { label: 'Real-time order tracking', available: true },
      { label: 'Meal budget management', available: true },
      { label: 'Group ordering sessions', available: true },
      { label: 'Table reservations', available: true },
      { label: 'Event catering requests', available: true },
      { label: 'Meal pass & digital passes', available: true },
      { label: 'Submit support tickets', available: true },
      { label: 'Canteen staff dashboard', available: false },
      { label: 'Canteen management', available: false },
      { label: 'User administration', available: false },
    ],
  },
};

const panelVariants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
};

const SettingsPage = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const [activeTab, setActiveTab] = useState('account');

  const [accountForm, setAccountForm] = useState({ name: '', email: '', studentId: '', phoneNumber: '' });
  const [accountBusy, setAccountBusy] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwBusy, setPwBusy] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setAccountForm({
        name: user.name || '',
        email: user.email || '',
        studentId: user.studentId || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  const handleAccountSave = async (e) => {
    e.preventDefault();
    if (!accountForm.name.trim() || !accountForm.email.trim()) {
      toast.warn('Name and email are required');
      return;
    }
    try {
      setAccountBusy(true);
      await updateProfile(accountForm);
      toast.success('Account updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setAccountBusy(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = pwForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warn('All password fields are required');
      return;
    }
    if (newPassword.length < 6) {
      toast.warn('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warn('New passwords do not match');
      return;
    }
    try {
      setPwBusy(true);
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setPwBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteBusy(true);
      await deleteAccount();
    } catch {
      toast.error('Failed to delete account');
      setDeleteBusy(false);
    }
  };

  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.student;
  const RoleIcon = roleConfig.icon;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 font-['Gilroy_Medium']">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-100">
          <Settings size={26} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-['Gilroy_Heavy'] text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account, security, and role information.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const isDanger = tab.id === 'danger';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 lg:shrink flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-['Gilroy_Heavy'] transition-all text-left whitespace-nowrap ${
                  active
                    ? isDanger
                      ? 'bg-red-600 text-white shadow-lg shadow-red-100'
                      : 'bg-orange-600 text-white shadow-lg shadow-orange-100'
                    : isDanger
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.14 }}
          >
            {/* ── Account ─────────────────────────────────────── */}
            {activeTab === 'account' && (
              <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <div className="mb-8">
                  <h2 className="text-xl font-['Gilroy_Heavy'] text-gray-900">Account Information</h2>
                  <p className="text-sm text-gray-500 mt-1">Update your personal details and contact information.</p>
                </div>
                <form onSubmit={handleAccountSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Full Name" Icon={User}>
                      <input
                        value={accountForm.name}
                        onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))}
                        className="settings-input"
                        placeholder="Your full name"
                      />
                    </Field>
                    <Field label="Email Address" Icon={Mail}>
                      <input
                        type="email"
                        value={accountForm.email}
                        onChange={(e) => setAccountForm((f) => ({ ...f, email: e.target.value }))}
                        className="settings-input"
                        placeholder="your@email.com"
                      />
                    </Field>
                    <Field label="Student / Staff ID" Icon={Hash}>
                      <input
                        value={accountForm.studentId}
                        onChange={(e) => setAccountForm((f) => ({ ...f, studentId: e.target.value }))}
                        className="settings-input"
                        placeholder="e.g. CS/2021/001"
                      />
                    </Field>
                    <Field label="Phone Number" Icon={Phone}>
                      <input
                        type="tel"
                        value={accountForm.phoneNumber}
                        onChange={(e) => setAccountForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                        className="settings-input"
                        placeholder="+94 7X XXX XXXX"
                      />
                    </Field>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={accountBusy}
                      className="inline-flex items-center gap-2.5 rounded-2xl bg-orange-600 px-8 py-4 text-white font-['Gilroy_Heavy'] hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {accountBusy ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* ── Security ─────────────────────────────────────── */}
            {activeTab === 'security' && (
              <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <div className="mb-8">
                  <h2 className="text-xl font-['Gilroy_Heavy'] text-gray-900">Change Password</h2>
                  <p className="text-sm text-gray-500 mt-1">Use a strong, unique password to keep your account safe.</p>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-5 max-w-md">
                  <PwField
                    label="Current Password"
                    value={pwForm.currentPassword}
                    show={showPw.current}
                    onChange={(v) => setPwForm((f) => ({ ...f, currentPassword: v }))}
                    onToggle={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                  />
                  <PwField
                    label="New Password"
                    value={pwForm.newPassword}
                    show={showPw.next}
                    onChange={(v) => setPwForm((f) => ({ ...f, newPassword: v }))}
                    onToggle={() => setShowPw((s) => ({ ...s, next: !s.next }))}
                  />
                  <PwField
                    label="Confirm New Password"
                    value={pwForm.confirmPassword}
                    show={showPw.confirm}
                    onChange={(v) => setPwForm((f) => ({ ...f, confirmPassword: v }))}
                    onToggle={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                  />
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={pwBusy}
                      className="inline-flex items-center gap-2.5 rounded-2xl bg-gray-900 px-8 py-4 text-white font-['Gilroy_Heavy'] hover:bg-black shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      {pwBusy ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />}
                      Update Password
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* ── Access & Role ─────────────────────────────────── */}
            {activeTab === 'access' && (
              <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 space-y-8">
                <div>
                  <h2 className="text-xl font-['Gilroy_Heavy'] text-gray-900">Access & Role</h2>
                  <p className="text-sm text-gray-500 mt-1">Your current role and what you can access in QuickEats.</p>
                </div>

                <div className={`inline-flex items-center gap-3 rounded-2xl border px-5 py-3 ${roleConfig.accent}`}>
                  <RoleIcon size={20} className={roleConfig.iconColor} />
                  <div>
                    <p className="font-['Gilroy_Heavy'] text-sm">{roleConfig.label}</p>
                    <p className="text-xs opacity-70 font-['Gilroy_Medium'] mt-0.5">{roleConfig.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {roleConfig.features.map((feat) => (
                    <div
                      key={feat.label}
                      className="flex items-center gap-3 py-2.5 px-4 rounded-2xl bg-gray-50/50 border border-gray-100"
                    >
                      {feat.available
                        ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                        : <XCircle size={15} className="text-gray-300 shrink-0" />
                      }
                      <span className={`text-sm font-['Gilroy_Bold'] ${feat.available ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Danger Zone ───────────────────────────────────── */}
            {activeTab === 'danger' && (
              <section className="bg-white rounded-[32px] border border-red-100 shadow-sm p-8 space-y-8">
                <div>
                  <h2 className="text-xl font-['Gilroy_Heavy'] text-gray-900">Danger Zone</h2>
                  <p className="text-sm text-gray-500 mt-1">Irreversible actions — proceed with caution.</p>
                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50/30 p-6 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-red-100 text-red-600 shrink-0">
                      <Trash2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-['Gilroy_Heavy'] text-gray-900 mb-1">Delete Account</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Permanently deletes your account and all associated data including orders, passes, and budgets.
                        This cannot be undone.
                      </p>
                    </div>
                  </div>

                  {!deleteConfirm ? (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="ml-14 inline-flex items-center gap-2 text-red-600 font-['Gilroy_Heavy'] text-sm hover:text-red-700 underline underline-offset-4 decoration-red-300"
                    >
                      <AlertTriangle size={14} />
                      I want to delete my account
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="ml-14 space-y-3"
                    >
                      <p className="text-xs font-['Gilroy_Heavy'] text-red-700 uppercase tracking-widest">
                        Are you absolutely sure? This cannot be undone.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteBusy}
                          className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-white font-['Gilroy_Heavy'] text-sm hover:bg-red-700 transition-all disabled:opacity-50"
                        >
                          {deleteBusy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-gray-600 font-['Gilroy_Heavy'] text-sm hover:bg-gray-50 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const Field = ({ label, Icon, children }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-1.5 text-[11px] font-['Gilroy_Heavy'] text-gray-400 uppercase tracking-widest">
      <Icon size={11} className="text-orange-400" />
      {label}
    </label>
    {children}
  </div>
);

const PwField = ({ label, value, show, onChange, onToggle }) => (
  <Field label={label} Icon={Lock}>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="settings-input pr-12"
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </Field>
);

export default SettingsPage;
