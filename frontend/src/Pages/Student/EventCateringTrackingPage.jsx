import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { eventCateringAPI } from '../../services/api';
import config from '../../config/config';

const toAssetUrl = (path = '') => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${config.API_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const statusColors = {
  requested: 'bg-slate-100 text-slate-700',
  quoted: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  in_prep: 'bg-orange-100 text-orange-700',
  ready: 'bg-amber-100 text-amber-700',
  delivered: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusGuidance = {
  requested: 'Request submitted. Awaiting canteen quote.',
  quoted: 'Quote is ready. Review and approve, then proceed with payment.',
  approved: 'Quote approved. Complete payment to allow prep.',
  in_prep: 'Canteen is preparing your event order.',
  ready: 'Order is ready for delivery/dispatch.',
  delivered: 'Event catering has been delivered.',
  rejected: 'Request was rejected. Review notes and submit a revised request.',
};

const EventCateringTrackingPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await eventCateringAPI.getMyRequests();
      setRequests(res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load catering requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmQuote = async (requestId) => {
    try {
      await eventCateringAPI.confirmQuote(requestId);
      toast.success('Quote approved. Canteen will start preparation workflow.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm quote');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">My Catering Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Track quotes, approvals, and fulfillment progress.</p>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold hover:bg-gray-50">Refresh</button>
      </div>

      {loading ? (
        <div className="bg-white border rounded-2xl p-6 text-gray-500">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white border rounded-2xl p-6 text-gray-500">No catering requests found.</div>
      ) : (
        <div className="space-y-3">
          {requests.map((requestDoc) => (
            <div key={requestDoc._id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{requestDoc.eventName}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(requestDoc.eventDateTime).toLocaleString()} · {requestDoc.venue} · {requestDoc.headcount} pax
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{requestDoc.canteen?.name || 'Canteen'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[requestDoc.status] || 'bg-gray-100 text-gray-700'}`}>
                  {requestDoc.status}
                </span>
              </div>

              <div className="mt-3 text-sm text-gray-700">
                <p className="text-xs text-gray-500 mb-1">{statusGuidance[requestDoc.status] || 'Status update available.'}</p>
                <p>
                  Quote: <span className="font-semibold">LKR {Number(requestDoc.quote?.totalQuoted || 0).toLocaleString()}</span>
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Breakdown: Subtotal LKR {Number(requestDoc.quote?.subtotal || 0).toLocaleString()} ·
                  Service fee LKR {Number(requestDoc.quote?.serviceFee || 0).toLocaleString()} ·
                  Discount LKR {Number(requestDoc.quote?.discount || 0).toLocaleString()}
                </p>
                <p className="mt-1">
                  Payment: <span className="font-semibold">{requestDoc.payment?.status || 'pending'}</span>
                  {' '}· Method: <span className="font-semibold">{requestDoc.payment?.preferredMethod || 'cash'}</span>
                  {' '}· Paid: LKR <span className="font-semibold">{Number(requestDoc.payment?.amountPaid || 0).toLocaleString()}</span>
                  {' '}· Due: LKR <span className="font-semibold">{Number(requestDoc.payment?.amountDue || 0).toLocaleString()}</span>
                </p>
                {requestDoc.payment?.receiptFileUrl && (
                  <p className="text-xs mt-1">
                    Receipt uploaded: <a href={toAssetUrl(requestDoc.payment.receiptFileUrl)} target="_blank" rel="noreferrer" className="text-orange-600 underline">View</a>
                  </p>
                )}
                {requestDoc.quote?.validUntil && (
                  <p className="text-xs text-gray-500">Valid until: {new Date(requestDoc.quote.validUntil).toLocaleString()}</p>
                )}
              </div>

              {requestDoc.status === 'quoted' && (
                <button
                  onClick={() => confirmQuote(requestDoc._id)}
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
                >
                  Approve Quote
                </button>
              )}

              {['quoted', 'approved', 'in_prep', 'ready'].includes(requestDoc.status) && requestDoc.payment?.status !== 'paid' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/dashboard/event-catering/payment/${requestDoc._id}`)}
                    className="px-4 py-2 rounded-xl border border-emerald-300 text-emerald-700 text-sm font-bold hover:bg-emerald-50"
                  >
                    Upload Payment Receipt
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventCateringTrackingPage;
