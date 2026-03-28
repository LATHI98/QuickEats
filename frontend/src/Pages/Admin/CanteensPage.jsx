import React, { useEffect, useMemo, useState } from 'react';
import { Store, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { canteenAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const AdminCanteensPage = () => {
  const { user, selectedCanteenId, setSelectedCanteen } = useAuth();
  const [loading, setLoading] = useState(true);
  const [canteens, setCanteens] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await canteenAPI.getAll();
        const all = res.data?.data || [];
        setCanteens(all);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load canteens');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.role, user?.canteen]);

  const selected = useMemo(
    () => canteens.find(c => c._id === selectedCanteenId) || null,
    [canteens, selectedCanteenId]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-['Gilroy_Heavy'] text-gray-900">Select Canteen</h1>
        <p className="text-sm text-gray-500 mt-1">Switch your working canteen context for orders, billing, and queue.</p>
      </div>

      {!canteens.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No canteen is available for this account. Contact admin for canteen access setup.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canteens.map(c => {
            const active = selected?._id === c._id;
            return (
              <button
                key={c._id}
                type="button"
                onClick={() => {
                  setSelectedCanteen(c);
                  toast.success(`Switched to ${c.name}`);
                }}
                className={`text-left rounded-2xl border p-4 transition-all ${active
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-orange-300'
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-['Gilroy_Heavy'] text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{c.location || 'No location set'}</p>
                  </div>
                  {active ? <CheckCircle2 size={18} className="text-orange-600 shrink-0" /> : <Store size={18} className="text-gray-300 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCanteensPage;
