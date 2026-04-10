import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { canteenAPI, eventCateringAPI } from '../../services/api';

const initialForm = {
  canteenId: '',
  packageId: '',
  eventName: '',
  eventDateTime: '',
  headcount: 50,
  venue: '',
  budget: '',
  preferredPaymentMethod: 'cash',
  notes: '',
};

const MIN_HEADCOUNT = 10;
const MAX_HEADCOUNT = 2000;
const MIN_EVENT_LEAD_HOURS = 2;

const validateRequestForm = ({ form, requestedItems }) => {
  const errors = {};
  const eventDate = new Date(form.eventDateTime);
  const minAllowed = new Date(Date.now() + MIN_EVENT_LEAD_HOURS * 60 * 60 * 1000);

  if (!form.canteenId) errors.canteenId = 'Please select a canteen.';
  if (!form.eventName?.trim() || form.eventName.trim().length < 3) errors.eventName = 'Event name must be at least 3 characters.';
  if (form.eventName?.trim()?.length > 120) errors.eventName = 'Event name must be less than 120 characters.';
  if (!form.venue?.trim() || form.venue.trim().length < 3) errors.venue = 'Venue must be at least 3 characters.';
  if (!Number.isFinite(Number(form.headcount)) || Number(form.headcount) < MIN_HEADCOUNT || Number(form.headcount) > MAX_HEADCOUNT) {
    errors.headcount = `Headcount must be between ${MIN_HEADCOUNT} and ${MAX_HEADCOUNT}.`;
  }
  if (!form.eventDateTime || Number.isNaN(eventDate.getTime()) || eventDate < minAllowed) {
    errors.eventDateTime = `Event must be at least ${MIN_EVENT_LEAD_HOURS} hours from now.`;
  }
  if (form.budget !== '' && (!Number.isFinite(Number(form.budget)) || Number(form.budget) < 0)) {
    errors.budget = 'Budget must be a non-negative number.';
  }

  const normalizedItems = requestedItems
    .map((item) => ({
      name: String(item.name || '').trim(),
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
    }))
    .filter((item) => item.name && item.quantity > 0);

  if (!form.packageId && normalizedItems.length === 0) {
    errors.selectedItems = 'Add at least one required food item or select a package.';
  }

  return { errors, normalizedItems };
};

const EventCateringRequestPage = () => {
  const navigate = useNavigate();
  const [canteens, setCanteens] = useState([]);
  const [packages, setPackages] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loadingRecentRequests, setLoadingRecentRequests] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [loadingMenuItems, setLoadingMenuItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(initialForm);
  const [requestedItems, setRequestedItems] = useState([{ name: '', quantity: 1, unitPrice: 0, notes: '' }]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');

  useEffect(() => {
    const loadCanteens = async () => {
      try {
        const res = await canteenAPI.getAll();
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setCanteens(list);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load canteens');
      }
    };
    loadCanteens();
  }, []);

  useEffect(() => {
    const loadMyRequests = async () => {
      try {
        setLoadingRecentRequests(true);
        const res = await eventCateringAPI.getMyRequests();
        const list = res.data?.data || [];
        setRecentRequests(list.slice(0, 3));
      } catch (_err) {
        setRecentRequests([]);
      } finally {
        setLoadingRecentRequests(false);
      }
    };

    loadMyRequests();
  }, []);

  useEffect(() => {
    const loadPackages = async () => {
      if (!form.canteenId) {
        setPackages([]);
        return;
      }
      try {
        setLoadingPackages(true);
        const res = await eventCateringAPI.getPackages({ canteen: form.canteenId });
        setPackages(res.data?.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load catering packages');
      } finally {
        setLoadingPackages(false);
      }
    };
    loadPackages();
  }, [form.canteenId]);

  useEffect(() => {
    const loadMenuItems = async () => {
      if (!form.canteenId) {
        setMenuItems([]);
        setSelectedMenuItemId('');
        return;
      }
      try {
        setLoadingMenuItems(true);
        const res = await canteenAPI.getMenu(form.canteenId);
        const list = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res.data?.data) ? res.data.data : []);
        setMenuItems(list.filter((item) => item?.isAvailable !== false));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load canteen menu items');
      } finally {
        setLoadingMenuItems(false);
      }
    };

    loadMenuItems();
  }, [form.canteenId]);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg._id === form.packageId) || null,
    [packages, form.packageId]
  );

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validated = validateRequestForm({ form, requestedItems });
    setErrors(validated.errors);
    if (Object.keys(validated.errors).length > 0) {
      toast.error('Please correct highlighted fields before submitting.');
      return;
    }

    try {
      const normalizedItems = requestedItems
        .map((item) => ({
          name: String(item.name || '').trim(),
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          notes: String(item.notes || '').trim(),
        }))
        .filter((item) => item.name && item.quantity > 0);

      setSubmitting(true);
      await eventCateringAPI.createRequest({
        canteenId: form.canteenId,
        packageId: form.packageId || null,
        eventName: form.eventName,
        eventDateTime: form.eventDateTime,
        headcount: Number(form.headcount),
        venue: form.venue,
        budget: form.budget ? Number(form.budget) : null,
        preferredPaymentMethod: form.preferredPaymentMethod,
        selectedItems: normalizedItems,
        notes: form.notes,
      });
      toast.success('Catering request submitted successfully.');
      setForm(initialForm);
      setRequestedItems([{ name: '', quantity: 1, unitPrice: 0, notes: '' }]);
      setSelectedMenuItemId('');
      setErrors({});
      const updated = await eventCateringAPI.getMyRequests();
      setRecentRequests((updated.data?.data || []).slice(0, 3));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-extrabold text-gray-900">Event Catering Request</h1>
      <p className="text-sm text-gray-500 mt-1">Submit a request, receive quote, approve, and track fulfillment.</p>

      <div className="mt-4 bg-white border-2 border-orange-200 rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-extrabold text-orange-700 uppercase tracking-wide">Catering Tracking</h2>
            <p className="text-xs text-gray-500 mt-1">Use this section to monitor quote, payment, and progress without leaving this page.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/event-catering/tracking')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 whitespace-nowrap"
          >
            View Full Tracking
          </button>
        </div>

        {loadingRecentRequests ? (
          <p className="text-sm text-gray-500">Loading recent requests...</p>
        ) : recentRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No catering requests yet. Submit your first one below.</p>
        ) : (
          <div className="space-y-2">
            {recentRequests.map((item) => {
              const totalPayable = Number(item.payment?.totalPayable || item.quote?.totalQuoted || 0);
              const amountPaid = Number(item.payment?.amountPaid || 0);
              const progress = totalPayable > 0 ? Math.min(100, Math.round((amountPaid / totalPayable) * 100)) : 0;
              return (
                <div key={item._id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-gray-800 truncate">{item.eventName}</p>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">{item.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Quote LKR {Number(item.quote?.totalQuoted || 0).toLocaleString()} · Paid LKR {amountPaid.toLocaleString()} · Due LKR {Number(item.payment?.amountDue || 0).toLocaleString()}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-orange-100 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">Need full timeline details, quote approval, or receipt actions?</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/event-catering/tracking')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            Open Full Tracking
          </button>
        </div>
      </div>

      <form className="mt-6 bg-white border border-gray-200 rounded-2xl p-4 md:p-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Canteen *</label>
          <select name="canteenId" value={form.canteenId} onChange={onChange} className="w-full border rounded-xl px-3 py-2" required>
            <option value="">Select canteen</option>
            {canteens.map((canteen) => (
              <option key={canteen._id} value={canteen._id}>{canteen.name}</option>
            ))}
          </select>
          {errors.canteenId && <p className="text-xs text-red-500 mt-1">{errors.canteenId}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Package (optional)</label>
          <select
            name="packageId"
            value={form.packageId}
            onChange={onChange}
            className="w-full border rounded-xl px-3 py-2"
            disabled={!form.canteenId || loadingPackages}
          >
            <option value="">Custom quote</option>
            {packages.map((pkg) => (
              <option key={pkg._id} value={pkg._id}>{pkg.name} - LKR {Number(pkg.basePrice || 0).toLocaleString()}</option>
            ))}
          </select>
          {selectedPackage && (
            <p className="text-xs text-gray-500 mt-1">
              {selectedPackage.description || 'No description'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Event name *</label>
          <input name="eventName" value={form.eventName} onChange={onChange} className="w-full border rounded-xl px-3 py-2" required />
          {errors.eventName && <p className="text-xs text-red-500 mt-1">{errors.eventName}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date and time *</label>
            <input type="datetime-local" name="eventDateTime" value={form.eventDateTime} onChange={onChange} className="w-full border rounded-xl px-3 py-2" required />
            {errors.eventDateTime && <p className="text-xs text-red-500 mt-1">{errors.eventDateTime}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Headcount *</label>
            <input type="number" min="1" name="headcount" value={form.headcount} onChange={onChange} className="w-full border rounded-xl px-3 py-2" required />
            {errors.headcount && <p className="text-xs text-red-500 mt-1">{errors.headcount}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Venue *</label>
            <input name="venue" value={form.venue} onChange={onChange} className="w-full border rounded-xl px-3 py-2" required />
            {errors.venue && <p className="text-xs text-red-500 mt-1">{errors.venue}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Budget (LKR)</label>
            <input type="number" min="0" name="budget" value={form.budget} onChange={onChange} className="w-full border rounded-xl px-3 py-2" />
            {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Preferred payment method</label>
          <select
            name="preferredPaymentMethod"
            value={form.preferredPaymentMethod}
            onChange={onChange}
            className="w-full border rounded-xl px-3 py-2"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-700">Required food items</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRequestedItems((prev) => [...prev, { name: '', quantity: 1, unitPrice: 0, notes: '' }])}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Add Custom
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-[2fr_auto] gap-2">
            <select
              value={selectedMenuItemId}
              onChange={(e) => setSelectedMenuItemId(e.target.value)}
              className="border rounded-xl px-3 py-2"
              disabled={!form.canteenId || loadingMenuItems}
            >
              <option value="">Select existing menu item</option>
              {menuItems.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} - LKR {Number(item.price || 0).toLocaleString()}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const selected = menuItems.find((item) => item._id === selectedMenuItemId);
                if (!selected) {
                  toast.error('Select a menu item first.');
                  return;
                }
                setRequestedItems((prev) => ([
                  ...prev,
                  {
                    name: selected.name,
                    quantity: 1,
                    unitPrice: Number(selected.price || 0),
                    notes: '',
                  },
                ]));
                setSelectedMenuItemId('');
              }}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-orange-200 text-orange-700 hover:bg-orange-50"
              disabled={!form.canteenId || loadingMenuItems}
            >
              Add From Menu
            </button>
          </div>

          {requestedItems.map((item, idx) => (
            <div key={`item-${idx}`} className="grid md:grid-cols-[2fr_1fr_1fr_2fr_auto] gap-2">
              <input
                value={item.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setRequestedItems((prev) => prev.map((it, i) => i === idx ? { ...it, name: value } : it));
                }}
                placeholder="Food name"
                className="border rounded-xl px-3 py-2"
              />
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  setRequestedItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: value } : it));
                }}
                placeholder="Qty"
                className="border rounded-xl px-3 py-2"
              />
              <input
                type="number"
                min="0"
                value={item.unitPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  setRequestedItems((prev) => prev.map((it, i) => i === idx ? { ...it, unitPrice: value } : it));
                }}
                placeholder="Unit Price"
                className="border rounded-xl px-3 py-2"
              />
              <input
                value={item.notes}
                onChange={(e) => {
                  const value = e.target.value;
                  setRequestedItems((prev) => prev.map((it, i) => i === idx ? { ...it, notes: value } : it));
                }}
                placeholder="Notes (optional)"
                className="border rounded-xl px-3 py-2"
              />
              <button
                type="button"
                onClick={() => setRequestedItems((prev) => prev.filter((_, i) => i !== idx))}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                disabled={requestedItems.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          {errors.selectedItems && <p className="text-xs text-red-500 mt-1">{errors.selectedItems}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
          <textarea name="notes" value={form.notes} onChange={onChange} className="w-full border rounded-xl px-3 py-2 min-h-24" />
        </div>

        <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-60">
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};

export default EventCateringRequestPage;
