import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Hash, LogOut, GraduationCap } from 'lucide-react';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
      <Icon size={15} className="text-gray-500" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-gray-400 font-gilroyRegular">{label}</p>
      <p className="text-sm text-gray-700 font-gilroyMedium truncate">{value || '—'}</p>
    </div>
  </div>
);

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Cover */}
        <div className="bg-defaultRed h-20 sm:h-24 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.15),transparent)]" />
        </div>
        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          <div className="flex items-end justify-between -mt-7 mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-defaultRed border-4 border-white flex items-center justify-center shrink-0">
              <span className="text-white text-lg sm:text-xl font-gilroyBold">{initials}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-defaultRed/10 text-defaultRed text-xs font-gilroyMedium px-3 py-1.5 rounded-full">
              <GraduationCap size={12} /> Student
            </span>
          </div>
          <h2 className="text-lg font-gilroyBold text-gray-800">{user?.name}</h2>
          <p className="text-xs text-gray-400 font-gilroyRegular mt-0.5">Member since {new Date().getFullYear()}</p>

          <div className="mt-4">
            <InfoRow icon={Mail} label="Email address" value={user?.email} />
            <InfoRow icon={Hash} label="Student ID" value={user?.studentId} />
          </div>
        </div>
      </div>

      {/* Account actions */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <p className="text-xs font-gilroyBold text-gray-400 uppercase tracking-widest">Account</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-5 py-4 text-sm font-gilroyMedium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} className="shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
