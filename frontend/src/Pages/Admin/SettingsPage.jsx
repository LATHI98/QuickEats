import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Lock, Shield, AlertTriangle,
  Eye, EyeOff, Save, Trash2, CheckCircle2, XCircle,
  ChefHat, Settings, Loader2, KeyRound, Crown,
  ShieldCheck, LogOut, Store, SlidersHorizontal,
  Bell, RefreshCw, ListFilter, ToggleLeft, ToggleRight,
  Megaphone, UserPlus, Clock, FileText,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import api, { canteenAPI, systemAPI } from '../../services/api';

// ── Role configuration ───────────────────────────────────────────────────────
const ROLE_CONFIG = {
  canteenStaff: {
    label: 'Canteen Staff', icon: ChefHat,
    accent: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
    description: 'Operational role for order management and meal pass verification at your assigned canteen.',
    features: [
      { label: 'View and manage incoming orders', ok: true },
      { label: 'Update order statuses', ok: true },
      { label: 'Meal pass verification', ok: true },
      { label: 'Staff dashboard access', ok: true },
      { label: 'View canteen reservations', ok: true },
      { label: 'Canteen configuration', ok: false },
      { label: 'Menu management', ok: false },
      { label: 'User management', ok: false },
    ],
    canDelete: true,
  },
  canteenManager: {
    label: 'Canteen Manager', icon: Store,
    accent: 'bg-blue-50 border-blue-100 text-blue-800',
    iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    description: 'Full canteen operational control — configuration, menu, tables, and staff oversight.',
    features: [
      { label: 'Order and queue management', ok: true },
      { label: 'Canteen operational settings', ok: true },
      { label: 'Menu and item management', ok: true },
      { label: 'Table and reservation management', ok: true },
      { label: 'Meal pass management', ok: true },
      { label: 'Event catering management', ok: true },
      { label: 'User management', ok: false },
      { label: 'System administration', ok: false },
    ],
    canDelete: true,
  },
  admin: {
    label: 'Administrator', icon: ShieldCheck,
    accent: 'bg-orange-50 border-orange-100 text-orange-800',
    iconBg: 'bg-orange-100', iconColor: 'text-orange-600',
    description: 'System-wide administrator with full canteen, user, and operational management capabilities.',
    features: [
      { label: 'All canteen management', ok: true },
      { label: 'User management & creation', ok: true },
      { label: 'Orders and reservations oversight', ok: true },
      { label: 'Event catering tracking', ok: true },
      { label: 'Meal pass approvals', ok: true },
      { label: 'Support ticket management', ok: true },
      { label: 'Urgent staff notification broadcast', ok: true },
      { label: 'System settings configuration', ok: true },
      { label: 'Superadmin role assignment', ok: false },
    ],
    canDelete: false,
  },
  superAdmin: {
    label: 'Super Administrator', icon: Crown,
    accent: 'bg-purple-50 border-purple-100 text-purple-800',
    iconBg: 'bg-purple-100', iconColor: 'text-purple-600',
    description: 'Full platform authority — user role assignment, system configuration, and all admin capabilities.',
    features: [
      { label: 'All canteen management', ok: true },
      { label: 'User management & role assignment', ok: true },
      { label: 'Orders and reservations oversight', ok: true },
      { label: 'Event catering tracking', ok: true },
      { label: 'Meal pass approvals', ok: true },
      { label: 'Support ticket management', ok: true },
      { label: 'Urgent staff notification broadcast', ok: true },
      { label: 'System-wide configuration', ok: true },
      { label: 'Create users with any role', ok: true },
    ],
    canDelete: false,
  },
};

// ── Preference defaults (localStorage) ────────────────────────────────────────
const PREF_KEYS = {
  refresh: 'qe_staff_refresh_interval',
  sound: 'qe_staff_sound_alert',
  filter: 'qe_staff_default_filter',
};

const REFRESH_OPTIONS = [
  { label: '15 seconds', value: '15000' },
  { label: '30 seconds', value: '30000' },
  { label: '1 minute', value: '60000' },
];

const FILTER_OPTIONS = [
  { label: 'All Orders', value: 'all' },
  { label: 'Pending Only', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Ready for Pickup', value: 'ready' },
];

const loadPrefs = () => ({
  refresh: localStorage.getItem(PREF_KEYS.refresh) || '30000',
  sound: localStorage.getItem(PREF_KEYS.sound) !== 'false',
  filter: localStorage.getItem(PREF_KEYS.filter) || 'all',
});

// ── Tab builder ───────────────────────────────────────────────────────────────
const buildTabs = (role) => {
  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
  ];
  if (role === 'canteenManager') {
    tabs.push({ id: 'canteen', label: 'Canteen', icon: Store });
  }
  if (role === 'canteenStaff' || role === 'canteenManager') {
    tabs.push({ id: 'preferences', label: 'Preferences', icon: SlidersHorizontal });
  }
  if (role === 'admin' || role === 'superAdmin') {
    tabs.push({ id: 'system', label: 'System', icon: Settings });
  }
  tabs.push({ id: 'access', label: 'Access & Role', icon: Shield });
  tabs.push({ id: 'danger', label: 'Danger Zone', icon: AlertTriangle });
  return tabs;
};

const panelVariants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
};

// ─────────────────────────────────────────────────────────────────────────────
const SettingsPage = () => {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const role = user?.role || 'canteenStaff';
  const tabs = buildTabs(role);
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.canteenStaff;
  const RoleIcon = roleConfig.icon;

  const [activeTab, setActiveTab] = useState('account');

  // Account
  const [accountForm, setAccountForm] = useState({ name: '', email: '', phoneNumber: '' });
  const [accountBusy, setAccountBusy] = useState(false);

  // Password
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwBusy, setPwBusy] = useState(false);

  // Canteen settings (canteenManager)
  const [canteenData, setCanteenData] = useState(null);
  const [canteenForm, setCanteenForm] = useState({ openHours: '', description: '', notice: '', isOpen: true });
  const [canteenBusy, setCanteenBusy] = useState(false);
  const [canteenLoading, setCanteenLoading] = useState(false);

  // System settings (admin/superAdmin)
  const [sysConfig, setSysConfig] = useState({ announcement: '', announcementActive: false, allowRegistration: true });
  const [sysBusy, setSysBusy] = useState(false);
  const [sysLoading, setSysLoading] = useState(false);

  // Dashboard preferences (canteenStaff / canteenManager)
  const [prefs, setPrefs] = useState(loadPrefs);

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  // ── Load account form ──────────────────────────────────────────────────────
  useEffect(() => {
    if (user) setAccountForm({ name: user.name || '', email: user.email || '', phoneNumber: user.phoneNumber || '' });
  }, [user]);

  // ── Load canteen data ──────────────────────────────────────────────────────
  const loadCanteen = useCallback(async () => {
    if (!user?.canteen) return;
    try {
      setCanteenLoading(true);
      const { data } = await canteenAPI.getById(typeof user.canteen === 'object' ? user.canteen._id : user.canteen);
      setCanteenData(data);
      setCanteenForm({
        openHours: data.openHours || '',
        description: data.description || '',
        notice: data.notice || '',
        isOpen: data.isOpen !== false,
      });
    } catch {
      toast.error('Could not load canteen details');
    } finally {
      setCanteenLoading(false);
    }
  }, [user?.canteen]);

  // ── Load system config ─────────────────────────────────────────────────────
  const loadSystemConfig = useCallback(async () => {
    try {
      setSysLoading(true);
      const { data } = await systemAPI.getConfig();
      setSysConfig({
        announcement: data.config?.announcement || '',
        announcementActive: data.config?.announcementActive || false,
        allowRegistration: data.config?.allowRegistration !== false,
      });
    } catch {
      toast.error('Could not load system config');
    } finally {
      setSysLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'canteen' && role === 'canteenManager') loadCanteen();
    if (activeTab === 'system' && (role === 'admin' || role === 'superAdmin')) loadSystemConfig();
  }, [activeTab]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAccountSave = async (e) => {
    e.preventDefault();
    if (!accountForm.name.trim() || !accountForm.email.trim()) { toast.warn('Name and email are required'); return; }
    try {
      setAccountBusy(true);
      await updateProfile(accountForm);
      toast.success('Account updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally { setAccountBusy(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = pwForm;
    if (!currentPassword || !newPassword || !confirmPassword) { toast.warn('All fields are required'); return; }
    if (newPassword.length < 6) { toast.warn('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.warn('Passwords do not match'); return; }
    try {
      setPwBusy(true);
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally { setPwBusy(false); }
  };

  const handleCanteenSave = async (e) => {
    e.preventDefault();
    const canteenId = typeof user.canteen === 'object' ? user.canteen._id : user.canteen;
    if (!canteenId) { toast.warn('No canteen assigned to your account'); return; }
    try {
      setCanteenBusy(true);
      const { data } = await canteenAPI.updateSettings(canteenId, canteenForm);
      setCanteenData(data.canteen);
      toast.success('Canteen settings saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save canteen settings');
    } finally { setCanteenBusy(false); }
  };

  const handleSystemSave = async (e) => {
    e.preventDefault();
    try {
      setSysBusy(true);
      const { data } = await systemAPI.updateConfig(sysConfig);
      setSysConfig({
        announcement: data.config.announcement,
        announcementActive: data.config.announcementActive,
        allowRegistration: data.config.allowRegistration,
      });
      toast.success('System settings saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save system settings');
    } finally { setSysBusy(false); }
  };

  const savePrefs = (next) => {
    setPrefs(next);
    localStorage.setItem(PREF_KEYS.refresh, next.refresh);
    localStorage.setItem(PREF_KEYS.sound, String(next.sound));
    localStorage.setItem(PREF_KEYS.filter, next.filter);
    toast.success('Preferences saved');
  };

  const handleDeleteAccount = async () => {
    try { setDeleteBusy(true); await deleteAccount(); }
    catch { toast.error('Failed to delete account'); setDeleteBusy(false); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 font-['Gilroy_Medium']">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-100">
          <Settings size={26} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-['Gilroy_Heavy'] text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account, operational settings, and system preferences.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            const isDanger = tab.id === 'danger';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 lg:shrink flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-['Gilroy_Heavy'] transition-all text-left whitespace-nowrap ${
                  active
                    ? isDanger ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-orange-600 text-white shadow-lg shadow-orange-100'
                    : isDanger ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
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
          <motion.div key={activeTab} variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.14 }}>

            {/* ── Account ───────────────────────────────────── */}
            {activeTab === 'account' && (
              <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <SectionHeader title="Account Information" desc="Update your name, email, and contact details." />
                <form onSubmit={handleAccountSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Full Name" Icon={User}>
                      <input value={accountForm.name} onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))} className="settings-input" placeholder="Your full name" />
                    </Field>
                    <Field label="Email Address" Icon={Mail}>
                      <input type="email" value={accountForm.email} onChange={(e) => setAccountForm((f) => ({ ...f, email: e.target.value }))} className="settings-input" placeholder="your@email.com" />
                    </Field>
                    <Field label="Phone Number" Icon={Phone}>
                      <input type="tel" value={accountForm.phoneNumber} onChange={(e) => setAccountForm((f) => ({ ...f, phoneNumber: e.target.value }))} className="settings-input" placeholder="+94 7X XXX XXXX" />
                    </Field>
                  </div>
                  <div className="flex justify-end pt-2">
                    <SaveButton loading={accountBusy} icon={Save} label="Save Changes" />
                  </div>
                </form>
              </section>
            )}

            {/* ── Security ──────────────────────────────────── */}
            {activeTab === 'security' && (
              <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <SectionHeader title="Change Password" desc="Keep your account secure with a strong password." />
                <form onSubmit={handlePasswordChange} className="space-y-5 max-w-md">
                  <PwField label="Current Password" value={pwForm.currentPassword} show={showPw.current} onChange={(v) => setPwForm((f) => ({ ...f, currentPassword: v }))} onToggle={() => setShowPw((s) => ({ ...s, current: !s.current }))} />
                  <PwField label="New Password" value={pwForm.newPassword} show={showPw.next} onChange={(v) => setPwForm((f) => ({ ...f, newPassword: v }))} onToggle={() => setShowPw((s) => ({ ...s, next: !s.next }))} />
                  <PwField label="Confirm New Password" value={pwForm.confirmPassword} show={showPw.confirm} onChange={(v) => setPwForm((f) => ({ ...f, confirmPassword: v }))} onToggle={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))} />
                  <div className="pt-2">
                    <button type="submit" disabled={pwBusy} className="inline-flex items-center gap-2.5 rounded-2xl bg-gray-900 px-8 py-4 text-white font-['Gilroy_Heavy'] hover:bg-black shadow-lg transition-all active:scale-95 disabled:opacity-50">
                      {pwBusy ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />}
                      Update Password
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* ── Canteen Settings (canteenManager) ─────────── */}
            {activeTab === 'canteen' && (
              <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <SectionHeader title="Canteen Settings" desc="Control your canteen's availability, hours, and student-facing information." />

                {canteenLoading ? (
                  <div className="py-16 flex items-center justify-center gap-3 text-gray-400">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-sm font-['Gilroy_Bold']">Loading canteen data…</span>
                  </div>
                ) : !user?.canteen ? (
                  <div className="py-12 text-center text-gray-400 text-sm font-['Gilroy_Bold']">No canteen is assigned to your account.</div>
                ) : (
                  <form onSubmit={handleCanteenSave} className="space-y-6">

                    {/* Open / Closed toggle */}
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${canteenForm.isOpen ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <div>
                          <p className="font-['Gilroy_Heavy'] text-gray-900 text-sm">
                            Canteen is currently <span className={canteenForm.isOpen ? 'text-emerald-600' : 'text-gray-400'}>{canteenForm.isOpen ? 'Open' : 'Closed'}</span>
                          </p>
                          <p className="text-xs text-gray-400 font-['Gilroy_Medium'] mt-0.5">Toggle to control whether students can see your canteen as active.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCanteenForm((f) => ({ ...f, isOpen: !f.isOpen }))}
                        className="shrink-0"
                      >
                        {canteenForm.isOpen
                          ? <ToggleRight size={36} className="text-emerald-500" />
                          : <ToggleLeft size={36} className="text-gray-300" />
                        }
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="Open Hours" Icon={Clock}>
                        <input
                          value={canteenForm.openHours}
                          onChange={(e) => setCanteenForm((f) => ({ ...f, openHours: e.target.value }))}
                          className="settings-input"
                          placeholder="e.g. Mon–Fri 7:30 AM – 5:00 PM"
                        />
                      </Field>

                      <Field label="Student-Facing Notice" Icon={Megaphone}>
                        <input
                          value={canteenForm.notice}
                          onChange={(e) => setCanteenForm((f) => ({ ...f, notice: e.target.value }))}
                          className="settings-input"
                          placeholder="e.g. Closed for stock-taking on Friday"
                        />
                      </Field>
                    </div>

                    <Field label="Canteen Description" Icon={FileText}>
                      <textarea
                        value={canteenForm.description}
                        onChange={(e) => setCanteenForm((f) => ({ ...f, description: e.target.value }))}
                        rows={4}
                        className="settings-input resize-none"
                        placeholder="Describe your canteen for students…"
                      />
                    </Field>

                    <div className="flex justify-end pt-2">
                      <SaveButton loading={canteenBusy} icon={Store} label="Save Canteen Settings" />
                    </div>
                  </form>
                )}
              </section>
            )}

            {/* ── Dashboard Preferences (staff / manager) ───── */}
            {activeTab === 'preferences' && (
              <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 space-y-8">
                <SectionHeader title="Dashboard Preferences" desc="Personalise how your order dashboard behaves. Changes apply immediately and are saved locally." />

                {/* Auto-refresh interval */}
                <PrefBlock icon={RefreshCw} title="Auto-Refresh Interval" desc="How often the order list refreshes automatically.">
                  <div className="grid grid-cols-3 gap-3">
                    {REFRESH_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => savePrefs({ ...prefs, refresh: opt.value })}
                        className={`rounded-2xl border px-4 py-3 text-sm font-['Gilroy_Heavy'] transition-all ${
                          prefs.refresh === opt.value
                            ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </PrefBlock>

                {/* Sound alert */}
                <PrefBlock icon={Bell} title="New Order Sound Alert" desc="Play a sound when a new order arrives in your dashboard.">
                  <button
                    type="button"
                    onClick={() => savePrefs({ ...prefs, sound: !prefs.sound })}
                    className="flex items-center gap-3"
                  >
                    {prefs.sound
                      ? <ToggleRight size={36} className="text-emerald-500" />
                      : <ToggleLeft size={36} className="text-gray-300" />
                    }
                    <span className={`text-sm font-['Gilroy_Heavy'] ${prefs.sound ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {prefs.sound ? 'Enabled' : 'Disabled'}
                    </span>
                  </button>
                </PrefBlock>

                {/* Default order filter */}
                <PrefBlock icon={ListFilter} title="Default Order Filter" desc="Which order status is selected when you open the dashboard.">
                  <div className="grid grid-cols-2 gap-3">
                    {FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => savePrefs({ ...prefs, filter: opt.value })}
                        className={`rounded-2xl border px-4 py-3 text-sm font-['Gilroy_Heavy'] transition-all text-left ${
                          prefs.filter === opt.value
                            ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </PrefBlock>
              </section>
            )}

            {/* ── System Settings (admin / superAdmin) ──────── */}
            {activeTab === 'system' && (
              <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <SectionHeader title="System Settings" desc="Control platform-wide behaviour visible to all users." />

                {sysLoading ? (
                  <div className="py-16 flex items-center justify-center gap-3 text-gray-400">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-sm font-['Gilroy_Bold']">Loading system config…</span>
                  </div>
                ) : (
                  <form onSubmit={handleSystemSave} className="space-y-8">

                    {/* Allow registration toggle */}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-50">
                            <UserPlus size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-['Gilroy_Heavy'] text-gray-900 text-sm">Student Registration</p>
                            <p className="text-xs text-gray-400 font-['Gilroy_Medium'] mt-0.5">
                              Allow new students to create accounts on the platform.
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setSysConfig((c) => ({ ...c, allowRegistration: !c.allowRegistration }))}>
                          {sysConfig.allowRegistration
                            ? <ToggleRight size={36} className="text-emerald-500" />
                            : <ToggleLeft size={36} className="text-gray-300" />
                          }
                        </button>
                      </div>
                      <p className={`text-xs font-['Gilroy_Heavy'] ml-11 ${sysConfig.allowRegistration ? 'text-emerald-600' : 'text-red-500'}`}>
                        Registration is currently {sysConfig.allowRegistration ? 'open' : 'closed'}
                      </p>
                    </div>

                    {/* Announcement banner */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-amber-50">
                            <Megaphone size={18} className="text-amber-600" />
                          </div>
                          <div>
                            <p className="font-['Gilroy_Heavy'] text-gray-900 text-sm">System Announcement</p>
                            <p className="text-xs text-gray-400 font-['Gilroy_Medium'] mt-0.5">
                              Show a banner message to all users on the platform.
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setSysConfig((c) => ({ ...c, announcementActive: !c.announcementActive }))}>
                          {sysConfig.announcementActive
                            ? <ToggleRight size={36} className="text-amber-500" />
                            : <ToggleLeft size={36} className="text-gray-300" />
                          }
                        </button>
                      </div>

                      <textarea
                        value={sysConfig.announcement}
                        onChange={(e) => setSysConfig((c) => ({ ...c, announcement: e.target.value }))}
                        rows={3}
                        className="settings-input resize-none"
                        placeholder="e.g. Scheduled maintenance tonight from 11 PM – 1 AM. Some features may be unavailable."
                      />

                      {sysConfig.announcementActive && (
                        <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-2">
                          <Megaphone size={15} className="text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-800 font-['Gilroy_Medium']">
                            {sysConfig.announcement || 'No announcement text entered yet.'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <SaveButton loading={sysBusy} icon={Settings} label="Save System Settings" />
                    </div>
                  </form>
                )}
              </section>
            )}

            {/* ── Access & Role ──────────────────────────────── */}
            {activeTab === 'access' && (
              <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 space-y-8">
                <SectionHeader title="Access & Role" desc="Your assigned role and the capabilities it grants." />

                <div className={`flex items-start gap-4 rounded-2xl border px-5 py-4 ${roleConfig.accent}`}>
                  <div className={`p-2 rounded-xl shrink-0 ${roleConfig.iconBg}`}>
                    <RoleIcon size={20} className={roleConfig.iconColor} />
                  </div>
                  <div>
                    <p className="font-['Gilroy_Heavy'] text-base">{roleConfig.label}</p>
                    <p className="text-xs opacity-70 font-['Gilroy_Medium'] mt-0.5 leading-relaxed">{roleConfig.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {roleConfig.features.map((feat) => (
                    <div key={feat.label} className="flex items-center gap-3 py-2.5 px-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                      {feat.ok ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" /> : <XCircle size={15} className="text-gray-300 shrink-0" />}
                      <span className={`text-sm font-['Gilroy_Bold'] ${feat.ok ? 'text-gray-700' : 'text-gray-400'}`}>{feat.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Danger Zone ────────────────────────────────── */}
            {activeTab === 'danger' && (
              <section className="bg-white rounded-[32px] border border-red-100 shadow-sm p-8 space-y-6">
                <SectionHeader title="Danger Zone" desc="Sensitive account actions — proceed with caution." />

                {/* Sign out */}
                <DangerCard icon={LogOut} title="Sign Out" desc="End your current session. You will need to log in again.">
                  {!logoutConfirm ? (
                    <button onClick={() => setLogoutConfirm(true)} className="inline-flex items-center gap-2 text-gray-600 font-['Gilroy_Heavy'] text-sm hover:text-gray-900 underline underline-offset-4">
                      <LogOut size={14} /> Sign out of my account
                    </button>
                  ) : (
                    <ConfirmRow
                      onConfirm={logout}
                      onCancel={() => setLogoutConfirm(false)}
                      confirmLabel="Yes, Sign Out"
                      confirmClass="bg-gray-900 hover:bg-black text-white"
                    />
                  )}
                </DangerCard>

                {/* Delete — staff/manager only */}
                {roleConfig.canDelete && (
                  <DangerCard icon={Trash2} title="Delete Account" desc="Permanently delete your account and all associated data. This cannot be undone." red>
                    {!deleteConfirm ? (
                      <button onClick={() => setDeleteConfirm(true)} className="inline-flex items-center gap-2 text-red-600 font-['Gilroy_Heavy'] text-sm hover:text-red-700 underline underline-offset-4">
                        <AlertTriangle size={14} /> I want to delete my account
                      </button>
                    ) : (
                      <ConfirmRow
                        onConfirm={handleDeleteAccount}
                        onCancel={() => setDeleteConfirm(false)}
                        confirmLabel="Yes, Delete"
                        confirmClass="bg-red-600 hover:bg-red-700 text-white"
                        loading={deleteBusy}
                      />
                    )}
                  </DangerCard>
                )}

                {/* Admin protection note */}
                {!roleConfig.canDelete && (
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/30 p-5 flex items-start gap-3">
                    <AlertTriangle size={17} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-orange-800 font-['Gilroy_Medium'] leading-relaxed">
                      Admin and Super Admin accounts are protected from self-deletion. To remove an admin account, use the <span className="font-['Gilroy_Heavy']">User Management</span> panel.
                    </p>
                  </div>
                )}
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// ── Shared sub-components ─────────────────────────────────────────────────────
const SectionHeader = ({ title, desc }) => (
  <div className="mb-8">
    <h2 className="text-xl font-['Gilroy_Heavy'] text-gray-900">{title}</h2>
    <p className="text-sm text-gray-500 mt-1">{desc}</p>
  </div>
);

const Field = ({ label, Icon, children }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-1.5 text-[11px] font-['Gilroy_Heavy'] text-gray-400 uppercase tracking-widest">
      <Icon size={11} className="text-orange-400" />{label}
    </label>
    {children}
  </div>
);

const PwField = ({ label, value, show, onChange, onToggle }) => (
  <Field label={label} Icon={Lock}>
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className="settings-input pr-12" placeholder="••••••••" />
      <button type="button" onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </Field>
);

const SaveButton = ({ loading, icon: Icon, label }) => (
  <button type="submit" disabled={loading} className="inline-flex items-center gap-2.5 rounded-2xl bg-orange-600 px-8 py-4 text-white font-['Gilroy_Heavy'] hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50">
    {loading ? <Loader2 size={17} className="animate-spin" /> : <Icon size={17} />}
    {label}
  </button>
);

const PrefBlock = ({ icon: Icon, title, desc, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-orange-50"><Icon size={17} className="text-orange-600" /></div>
      <div>
        <p className="font-['Gilroy_Heavy'] text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-400 font-['Gilroy_Medium'] mt-0.5">{desc}</p>
      </div>
    </div>
    {children}
  </div>
);

const DangerCard = ({ icon: Icon, title, desc, children, red }) => (
  <div className={`rounded-2xl border p-6 space-y-4 ${red ? 'border-red-100 bg-red-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
    <div className="flex items-start gap-4">
      <div className={`p-2.5 rounded-xl shrink-0 ${red ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-['Gilroy_Heavy'] text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
    <div className="ml-14">{children}</div>
  </div>
);

const ConfirmRow = ({ onConfirm, onCancel, confirmLabel, confirmClass, loading }) => (
  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
    <p className="text-xs font-['Gilroy_Heavy'] text-gray-700 uppercase tracking-widest">Are you sure?</p>
    <div className="flex gap-3">
      <button onClick={onConfirm} disabled={loading} className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-['Gilroy_Heavy'] text-sm transition-all disabled:opacity-50 ${confirmClass}`}>
        {loading && <Loader2 size={15} className="animate-spin" />}
        {confirmLabel}
      </button>
      <button onClick={onCancel} className="rounded-2xl border border-gray-200 bg-white px-6 py-3 text-gray-600 font-['Gilroy_Heavy'] text-sm hover:bg-gray-50 transition-all">
        Cancel
      </button>
    </div>
  </motion.div>
);

export default SettingsPage;
