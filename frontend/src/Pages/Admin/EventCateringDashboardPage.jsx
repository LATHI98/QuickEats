import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { canteenAPI, eventCateringAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config/config';

const toAssetUrl = (path = '') => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${config.API_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const nextStatusByCurrent = {
  requested: ['quoted', 'rejected'],
  quoted: ['approved', 'rejected'],
  approved: ['in_prep', 'rejected'],
  in_prep: ['ready'],
  ready: ['delivered'],
};

const EventCateringDashboardPage = () => {
  const {
    user,
    selectedCanteenId,
    setSelectedCanteen,
    clearSelectedCanteen,
  } = useAuth();
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [quoteDrafts, setQuoteDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [canteenOptions, setCanteenOptions] = useState([]);
  const [canteenLoading, setCanteenLoading] = useState(false);

  const role = String(user?.role || '');
  const canManageCatering = role === 'canteenStaff';
  const canTrackAllCanteens = role === 'admin' || role === 'superAdmin';

  const assignedCanteenId = typeof user?.canteen === 'object' ? user?.canteen?._id : user?.canteen;
  const activeCanteenId = selectedCanteenId || assignedCanteenId || '';

  useEffect(() => {
    const loadCanteens = async () => {
      if (!canTrackAllCanteens) return;
      try {
        setCanteenLoading(true);
        const res = await canteenAPI.getAll();
        const payload = res.data;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.canteens)
              ? payload.canteens
              : [];
        setCanteenOptions(list);
      } catch (_err) {
        toast.error('Failed to load canteens for filtering');
      } finally {
        setCanteenLoading(false);
      }
    };

    loadCanteens();
  }, [canTrackAllCanteens]);

  const loadRequests = useCallback(async () => {
    if (!canTrackAllCanteens && !activeCanteenId) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = {};
      if (!canTrackAllCanteens) {
        params.canteen = activeCanteenId;
      } else if (activeCanteenId) {
        params.canteen = activeCanteenId;
      }
      if (statusFilter) params.status = statusFilter;
      const res = await eventCateringAPI.getCanteenRequests(params);
      const data = res.data?.data || [];
      setRequests(data);

      const draftSeed = {};
      data.forEach((item) => {
        draftSeed[item._id] = {
          subtotal: item.quote?.subtotal || item.quote?.totalQuoted || '',
          serviceFee: item.quote?.serviceFee || 0,
          discount: item.quote?.discount || 0,
          notes: item.quote?.notes || '',
          paymentStatus: item.payment?.status || 'pending',
        };
      });
      setQuoteDrafts(draftSeed);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load catering queue');
    } finally {
      setLoading(false);
    }
  }, [activeCanteenId, canTrackAllCanteens, statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const setDraft = (id, patch) => {
    setQuoteDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const submitQuote = async (requestDoc) => {
    const draft = quoteDrafts[requestDoc._id] || {};
    const subtotal = Number(draft.subtotal || 0);
    const serviceFee = Number(draft.serviceFee || 0);
    const discount = Number(draft.discount || 0);
    const total = subtotal + serviceFee - discount;

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      toast.error('Enter a valid quote subtotal.');
      return;
    }
    if (!Number.isFinite(serviceFee) || serviceFee < 0 || !Number.isFinite(discount) || discount < 0) {
      toast.error('Service fee and discount must be non-negative.');
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      toast.error('Final quote must be greater than 0 after discount.');
      return;
    }

    try {
      await eventCateringAPI.updateQuote(requestDoc._id, {
        lineItems: [{ name: 'Catering Service Quote', quantity: 1, unitPrice: subtotal }],
        serviceFee,
        discount,
        notes: draft.notes || '',
      });
      toast.success('Quote updated.');
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update quote');
    }
  };

  const updateStatus = async (requestDoc, status) => {
    try {
      await eventCateringAPI.updateStatus(requestDoc._id, status);
      toast.success(`Status moved to ${status}.`);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const updatePayment = async (requestDoc) => {
    const draft = quoteDrafts[requestDoc._id] || {};
    const selectedStatus = String(draft.paymentStatus || 'pending');

    try {
      await eventCateringAPI.updatePayment(requestDoc._id, {
        status: selectedStatus,
      });
      toast.success('Payment updated.');
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment');
    }
  };

  const verifyStudentSubmission = async (requestDoc, action = 'approve') => {
    try {
      await eventCateringAPI.verifyPaymentSubmission(requestDoc._id, { action });
      toast.success(action === 'approve' ? 'Student submitted payment verified.' : 'Student submitted payment rejected.');
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify student payment proof');
    }
  };

  const canteenLabel = useMemo(() => {
    if (canTrackAllCanteens && !activeCanteenId) return 'Admin view: tracking requests across all canteens';
    if (canTrackAllCanteens && activeCanteenId) return 'Admin view: filtered by selected canteen';
    if (activeCanteenId) return 'Active canteen selected';
    return 'Select a canteen to manage requests';
  }, [activeCanteenId, canTrackAllCanteens]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Event Catering Queue</h1>
          <p className="text-sm text-gray-500 mt-1">{canteenLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {canTrackAllCanteens && (
            <select
              value={selectedCanteenId || ''}
              onChange={(e) => {
                const chosenId = e.target.value;
                if (!chosenId) {
                  clearSelectedCanteen();
                  return;
                }
                const chosen = canteenOptions.find((c) => String(c?._id) === String(chosenId));
                if (chosen) {
                  setSelectedCanteen({ _id: chosen._id, name: chosen.name });
                }
              }}
              className="border rounded-xl px-3 py-2 text-sm"
              disabled={canteenLoading}
            >
              <option value="">All canteens</option>
              {canteenOptions.map((canteen) => (
                <option key={canteen._id} value={canteen._id}>{canteen.name}</option>
              ))}
            </select>
          )}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="requested">requested</option>
            <option value="quoted">quoted</option>
            <option value="approved">approved</option>
            <option value="in_prep">in_prep</option>
            <option value="ready">ready</option>
            <option value="delivered">delivered</option>
            <option value="rejected">rejected</option>
          </select>
          <button onClick={loadRequests} className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border rounded-2xl p-6 text-gray-500">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white border rounded-2xl p-6 text-gray-500">No requests in queue.</div>
      ) : (
        <div className="space-y-3">
          {requests.map((requestDoc) => {
            const next = nextStatusByCurrent[requestDoc.status] || [];
            const draft = quoteDrafts[requestDoc._id] || {};
            const quotedTotal = Number(requestDoc.quote?.totalQuoted || 0);
            const draftSubtotal = Number(draft.subtotal || 0);
            const draftServiceFee = Number(draft.serviceFee || 0);
            const draftDiscount = Number(draft.discount || 0);
            const draftQuoteTotal = Math.max(0, draftSubtotal + draftServiceFee - draftDiscount);
            const hasQuoteData = Number(requestDoc.quote?.totalQuoted || 0) > 0 || ['requested', 'quoted'].includes(requestDoc.status);
            const pendingPlan = String(requestDoc.payment?.pendingPlan || 'none');
            const pendingAmount = Number(requestDoc.payment?.pendingAmount || 0);
            const expectedByPendingPlan = pendingPlan === 'full'
              ? Math.max(0, quotedTotal - Number(requestDoc.payment?.amountPaid || 0))
              : pendingPlan === 'half'
                ? Math.max(0, Math.round(quotedTotal / 2) - Number(requestDoc.payment?.amountPaid || 0))
                : pendingPlan === 'three_quarter'
                  ? Math.max(0, Math.round(quotedTotal * 0.75) - Number(requestDoc.payment?.amountPaid || 0))
                  : 0;

            return (
              <div key={requestDoc._id} className="bg-white border border-gray-200 rounded-2xl p-4">
                {(() => {
                  const totalPayable = Number(requestDoc.payment?.totalPayable || requestDoc.quote?.totalQuoted || 0);
                  const amountPaid = Number(requestDoc.payment?.amountPaid || 0);
                  const progressPct = totalPayable > 0 ? Math.min(100, Math.round((amountPaid / totalPayable) * 100)) : 0;
                  if (totalPayable <= 0 && amountPaid <= 0 && requestDoc.payment?.pendingStatus !== 'pending') return null;
                  return (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span className="font-semibold">Payment Progress</span>
                        <span>{progressPct}% · LKR {amountPaid.toLocaleString()} / LKR {totalPayable.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  );
                })()}

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{requestDoc.eventName}</h2>
                    <p className="text-sm text-gray-500">
                      {new Date(requestDoc.eventDateTime).toLocaleString()} · {requestDoc.venue} · {requestDoc.headcount} pax
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Requester: {requestDoc.requester?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Canteen: {requestDoc.canteen?.name || 'Unassigned'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{requestDoc.status}</span>
                </div>

                <div className="mt-3 text-sm text-gray-700">
                  <p>Current quote: <span className="font-semibold">LKR {Number(requestDoc.quote?.totalQuoted || 0).toLocaleString()}</span></p>
                  {hasQuoteData && (
                    <>
                      <p className="mt-1 text-xs text-gray-600">
                        Breakdown: Subtotal LKR {Number(requestDoc.quote?.subtotal || 0).toLocaleString()} ·
                        Service fee LKR {Number(requestDoc.quote?.serviceFee || 0).toLocaleString()} ·
                        Discount LKR {Number(requestDoc.quote?.discount || 0).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        Installment amounts: Half LKR {Math.round(quotedTotal / 2).toLocaleString()} · Three-quarter LKR {Math.round(quotedTotal * 0.75).toLocaleString()}
                      </p>
                    </>
                  )}
                  <p className="mt-1">Payment: <span className="font-semibold">{requestDoc.payment?.status || 'pending'}</span> · Paid LKR {Number(requestDoc.payment?.amountPaid || 0).toLocaleString()} · Due LKR {Number(requestDoc.payment?.amountDue || 0).toLocaleString()}</p>
                  {requestDoc.payment?.pendingStatus === 'pending' && (
                    <p className="mt-1 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-2 py-1 inline-block">
                      Pending student proof: LKR {Number(requestDoc.payment?.pendingAmount || 0).toLocaleString()} ({pendingPlan}) waiting for verification
                    </p>
                  )}
                  {requestDoc.payment?.pendingStatus === 'pending' && (
                    <p className="mt-1 text-xs text-gray-600">
                      Expected by selected plan now: LKR {Number(expectedByPendingPlan || 0).toLocaleString()} · Submitted: LKR {pendingAmount.toLocaleString()}
                    </p>
                  )}
                  {requestDoc.payment?.receiptFileUrl && (
                    <p className="mt-1 text-xs">
                      Receipt proof: <a href={toAssetUrl(requestDoc.payment.receiptFileUrl)} target="_blank" rel="noreferrer" className="text-orange-600 underline">View uploaded receipt</a>
                    </p>
                  )}
                </div>

                {canManageCatering && requestDoc.payment?.pendingStatus === 'pending' && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => verifyStudentSubmission(requestDoc, 'approve')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                    >
                      Approve Submitted Amount
                    </button>
                    <button
                      type="button"
                      onClick={() => verifyStudentSubmission(requestDoc, 'reject')}
                      className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-bold hover:bg-red-50"
                    >
                      Reject Submitted Amount
                    </button>
                  </div>
                )}

                {!!requestDoc.selectedItems?.length && (
                  <div className="mt-3 border border-gray-200 rounded-xl p-3 bg-gray-50">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Requested food items</p>
                    <div className="space-y-1">
                      {requestDoc.selectedItems.map((item, idx) => (
                        <p key={`${requestDoc._id}-item-${idx}`} className="text-sm text-gray-700">
                          {item.name} x {item.quantity}{item.notes ? ` (${item.notes})` : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {canManageCatering && ['requested', 'quoted'].includes(requestDoc.status) && (
                  <div className="mt-3 border border-blue-100 bg-blue-50/40 rounded-xl p-3 space-y-3">
                    <p className="text-xs font-extrabold text-blue-700 uppercase tracking-wide">Quote Builder (Quoting Stage)</p>

                    <div className="grid md:grid-cols-3 gap-2">
                      <label className="text-xs text-gray-600">
                        <span className="block mb-1 font-semibold">Subtotal</span>
                        <input
                          type="number"
                          min="0"
                          value={draft.subtotal}
                          onChange={(e) => setDraft(requestDoc._id, { subtotal: e.target.value })}
                          className="border rounded-xl px-3 py-2 text-sm w-full"
                        />
                      </label>
                      <label className="text-xs text-gray-600">
                        <span className="block mb-1 font-semibold">Service Fee</span>
                        <input
                          type="number"
                          min="0"
                          value={draft.serviceFee}
                          onChange={(e) => setDraft(requestDoc._id, { serviceFee: e.target.value })}
                          className="border rounded-xl px-3 py-2 text-sm w-full"
                        />
                      </label>
                      <label className="text-xs text-gray-600">
                        <span className="block mb-1 font-semibold">Quote Discount</span>
                        <input
                          type="number"
                          min="0"
                          value={draft.discount}
                          onChange={(e) => setDraft(requestDoc._id, { discount: e.target.value })}
                          className="border rounded-xl px-3 py-2 text-sm w-full"
                        />
                      </label>
                    </div>

                    <div className="grid md:grid-cols-3 gap-2 text-xs">
                      <div className="border border-gray-200 rounded-lg p-2 bg-white">
                        <p className="text-gray-500">Final Quote Total</p>
                        <p className="font-extrabold text-gray-800">LKR {draftQuoteTotal.toLocaleString()}</p>
                      </div>
                      <div className="border border-emerald-200 rounded-lg p-2 bg-emerald-50">
                        <p className="text-emerald-700">Half Installment</p>
                        <p className="font-extrabold text-emerald-800">LKR {Math.round(draftQuoteTotal / 2).toLocaleString()}</p>
                      </div>
                      <div className="border border-orange-200 rounded-lg p-2 bg-orange-50">
                        <p className="text-orange-700">Three-Quarter Installment</p>
                        <p className="font-extrabold text-orange-800">LKR {Math.round(draftQuoteTotal * 0.75).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-[1fr_auto] gap-2">
                      <input
                        value={draft.notes}
                        onChange={(e) => setDraft(requestDoc._id, { notes: e.target.value })}
                        placeholder="Quote notes"
                        className="border rounded-xl px-3 py-2 text-sm"
                      />
                      <button onClick={() => submitQuote(requestDoc)} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">Save Quote</button>
                    </div>
                  </div>
                )}

                {canManageCatering ? (
                  <>
                    <div className="mt-3 grid md:grid-cols-[1fr_auto] gap-2">
                      <select
                        value={draft.paymentStatus}
                        onChange={(e) => setDraft(requestDoc._id, { paymentStatus: e.target.value })}
                        className="border rounded-xl px-3 py-2 text-sm"
                      >
                        <option value="pending">pending</option>
                        <option value="partial">partial</option>
                        <option value="paid">paid</option>
                        <option value="refunded">refunded</option>
                      </select>
                      <button onClick={() => updatePayment(requestDoc)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">Save Payment</button>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      Choose the payment status from the dropdown only after verifying the submitted receipt amount.
                    </p>

                    {next.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {next.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(requestDoc, s)}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-bold hover:bg-gray-50"
                          >
                            Mark {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    Admin tracking: use canteen selection to filter this queue, or clear canteen selection to monitor all event-catering requests.
                  </p>
                )}

                {!!requestDoc.activityLogs?.length && (
                  <div className="mt-3 border border-gray-200 rounded-xl p-3 bg-gray-50">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Recent activity</p>
                    <div className="space-y-1">
                      {requestDoc.activityLogs.slice(-5).reverse().map((log, idx) => (
                        <p key={`${requestDoc._id}-activity-${idx}`} className="text-xs text-gray-700">
                          {new Date(log.createdAt).toLocaleString()} · {log.actor?.name || 'System'} · {log.action}
                          {log.notes ? ` (${log.notes})` : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventCateringDashboardPage;
