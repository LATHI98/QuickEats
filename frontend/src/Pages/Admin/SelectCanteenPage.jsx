import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { canteenAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const SelectCanteenPage = () => {
  const navigate = useNavigate();
  const { user, selectedCanteenId, setSelectedCanteen } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickedId, setPickedId] = useState(selectedCanteenId || '');

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        const res = await canteenAPI.getAll();
        const all = res.data?.data || [];

        setCanteens(all);

        if (all.length === 1) {
          setPickedId(all[0]._id);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load canteens');
      } finally {
        setLoading(false);
      }
    };

    fetchCanteens();
  }, [user?.role, user?.canteen]);

  const pickedCanteen = useMemo(
    () => canteens.find(c => c._id === pickedId) || null,
    [canteens, pickedId]
  );

  const handleContinue = () => {
    if (!pickedCanteen) {
      toast.error('Please select a canteen to continue');
      return;
    }
    setSelectedCanteen(pickedCanteen);
    navigate('/admin/dashboard', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Store className="text-orange-600" size={20} />
          </div>
          <h1 className="text-2xl font-['Gilroy_Heavy'] text-gray-900">Select Canteen</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Choose the canteen context before accessing orders, billing, queue, and payment workflows.
        </p>

        {canteens.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No canteen is available for this account. Contact an admin to configure canteen access.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 mb-6">
            {canteens.map(c => {
              const selected = pickedId === c._id;
              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setPickedId(c._id)}
                  className={`text-left rounded-2xl border p-4 transition-all ${selected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-['Gilroy_Heavy'] text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{c.location || 'No location set'}</p>
                    </div>
                    {selected && <CheckCircle2 size={18} className="text-orange-600 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!pickedCanteen}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-['Gilroy_Heavy'] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectCanteenPage;
