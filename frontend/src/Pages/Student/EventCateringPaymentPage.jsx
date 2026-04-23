import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { eventCateringAPI } from '../../services/api';
import config from '../../config/config';

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_NOTE_LENGTH = 500;
const VALID_RECEIPT_METHODS = ['bank_transfer', 'cash', 'card', 'mixed'];
const VALID_RECEIPT_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
const PAYMENT_PLAN_OPTIONS = ['full', 'half', 'three_quarter'];

const validateTransactionRef = (value) => /^[A-Za-z0-9\-_\/]{4,64}$/.test(value);
const roundCurrency = (value) => Math.max(0, Math.round(Number(value || 0) * 100) / 100);

const toAssetUrl = (path = '') => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${config.API_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const EventCateringPaymentPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [requestDoc, setRequestDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptRef, setReceiptRef] = useState('');
  const [receiptMethod, setReceiptMethod] = useState('bank_transfer');
  const [receiptNote, setReceiptNote] = useState('');
  const [paymentPlan, setPaymentPlan] = useState('full');
  const [paidAmount, setPaidAmount] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const res = await eventCateringAPI.getMyRequestById(requestId);
      const data = res.data?.data || null;
      setRequestDoc(data);
      if (data?.payment?.preferredMethod) {
        setReceiptMethod(data.payment.preferredMethod);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load catering payment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [requestId]);

  const validateReceiptForm = () => {
    const errors = {};

    const normalizedPaidAmount = Number(paidAmount || 0);

    if (!PAYMENT_PLAN_OPTIONS.includes(paymentPlan)) {
      errors.paymentPlan = 'Please select a valid payment plan.';
    }
    if (!Number.isFinite(normalizedPaidAmount) || normalizedPaidAmount <= 0) {
      errors.paidAmount = 'Enter a valid payment amount greater than 0.';
    } else if (normalizedPaidAmount > selectedPlanTarget) {
      errors.paidAmount = 'Paid amount cannot exceed the selected plan target.';
    }

    if (!receiptFile) {
      errors.receiptFile = 'Please select a receipt file first.';
    } else {
      if (!VALID_RECEIPT_TYPES.includes(receiptFile.type)) {
        errors.receiptFile = 'Only PNG, JPG, WEBP, and PDF files are allowed.';
      }
      if (receiptFile.size > MAX_RECEIPT_SIZE_BYTES) {
        errors.receiptFile = 'Receipt file must be 5MB or smaller.';
      }
    }

    if (!VALID_RECEIPT_METHODS.includes(receiptMethod)) {
      errors.receiptMethod = 'Please select a valid payment method.';
    }

    if (['bank_transfer', 'card'].includes(receiptMethod) && !receiptRef.trim()) {
      errors.receiptRef = 'Transaction reference is required for selected payment method.';
    }

    if (receiptRef.trim() && !validateTransactionRef(receiptRef.trim())) {
      errors.receiptRef = 'Use 4-64 chars with letters, numbers, -, _, or /.';
    }

    if (receiptNote.trim().length > MAX_NOTE_LENGTH) {
      errors.receiptNote = `Notes must be ${MAX_NOTE_LENGTH} characters or less.`;
    }

    return errors;
  };

  const uploadReceipt = async () => {
    if (!canUploadReceipt) {
      toast.info('Payment updates are locked for this request status.');
      return;
    }

    const errors = validateReceiptForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please correct highlighted fields before uploading.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('receipt', receiptFile);
      formData.append('transactionRef', receiptRef);
      formData.append('method', receiptMethod);
      formData.append('notes', receiptNote);
      formData.append('paymentPlan', paymentPlan);
      formData.append('paidAmount', String(Number(paidAmount || 0)));
      await eventCateringAPI.uploadReceipt(requestId, formData);
      toast.success('Receipt uploaded. Staff can now verify your payment.');
      setReceiptFile(null);
      setReceiptRef('');
      setReceiptNote('');
      setPaymentPlan('full');
      setPaidAmount('');
      setFormErrors({});
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const quoteTotal = useMemo(() => Number(requestDoc?.quote?.totalQuoted || 0), [requestDoc]);
  const amountDue = useMemo(() => Number(requestDoc?.payment?.amountDue || 0), [requestDoc]);
  const paymentStatus = requestDoc?.payment?.status || 'pending';
  const requestStatus = requestDoc?.status || 'requested';
  const isPaymentComplete = paymentStatus === 'paid' || amountDue <= 0;
  const isRequestClosed = ['delivered', 'rejected'].includes(requestStatus);
  const canUploadReceipt = !isPaymentComplete && !isRequestClosed;

  const quotedTotal = Number(requestDoc?.quote?.totalQuoted || 0);
  const totalPayable = Number(requestDoc?.payment?.totalPayable || quotedTotal || 0);
  const amountPaid = Number(requestDoc?.payment?.amountPaid || 0);
  const progressPct = totalPayable > 0 ? Math.min(100, Math.round((amountPaid / totalPayable) * 100)) : 0;
  const selectedPlanTarget = useMemo(() => {
    if (!requestDoc) return 0;
    if (paymentPlan === 'full') return roundCurrency(quotedTotal);
    if (paymentPlan === 'half') return roundCurrency(quotedTotal / 2);
    return roundCurrency(quotedTotal * 0.75);
  }, [requestDoc, paymentPlan, quotedTotal]);

  useEffect(() => {
    if (!requestDoc) return;
    if (selectedPlanTarget <= 0) {
      setPaidAmount('');
      return;
    }
    setPaidAmount(String(selectedPlanTarget));
  }, [paymentPlan, requestDoc, selectedPlanTarget]);

  const onReceiptFileChange = (file) => {
    setReceiptFile(file || null);
    setFormErrors((prev) => ({ ...prev, receiptFile: '' }));
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6 text-gray-500">Loading payment details...</div>;
  }

  if (!requestDoc) {
    return <div className="max-w-4xl mx-auto p-6 text-gray-500">Request not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="relative overflow-hidden bg-white border border-orange-100 rounded-2xl p-5 md:p-6">
        <div className="absolute -top-14 -right-14 h-40 w-40 rounded-full bg-orange-100/70 blur-3xl" />
        <div className="absolute -bottom-14 -left-14 h-40 w-40 rounded-full bg-amber-100/70 blur-3xl" />
        <div className="relative">
          <h1 className="text-2xl font-extrabold text-gray-900">Catering Payment</h1>
          <p className="text-sm text-gray-500 mt-1">{requestDoc.eventName} · {new Date(requestDoc.eventDateTime).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">
            Request status: <span className="font-bold text-gray-700">{requestStatus}</span>
          </p>
        </div>

        <div className="relative mt-4 grid md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-gray-500">Quote total</p>
            <p className="font-extrabold text-gray-900">LKR {quoteTotal.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-gray-500">Payment status</p>
            <p className="font-extrabold text-gray-900">{paymentStatus}</p>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-gray-500">Amount paid</p>
            <p className="font-extrabold text-gray-900">LKR {Number(requestDoc.payment?.amountPaid || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-gray-500">Amount due</p>
            <p className="font-extrabold text-gray-900">LKR {amountDue.toLocaleString()}</p>
          </div>
        </div>

        <div className="relative mt-3 text-xs text-gray-600 space-y-1">
          <p>
            Final quote total LKR {quotedTotal.toLocaleString()} is the full payment amount.
          </p>
          <p className="font-semibold text-emerald-700">
            Installments are fixed at half or three-quarter of the final quote amount.
          </p>
          <p className="font-semibold text-orange-700">
            Half plan = LKR {Math.round(quotedTotal / 2).toLocaleString()} · Three-quarter plan = LKR {Math.round(quotedTotal * 0.75).toLocaleString()}.
          </p>
          <p>
            Selected plan target: LKR {selectedPlanTarget.toLocaleString()} · Progress {progressPct}%
          </p>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="relative mt-3 text-xs text-gray-600">
          <p>
            Quote breakdown: Subtotal LKR {Number(requestDoc.quote?.subtotal || 0).toLocaleString()} ·
            Service fee LKR {Number(requestDoc.quote?.serviceFee || 0).toLocaleString()} ·
            Discount LKR {Number(requestDoc.quote?.discount || 0).toLocaleString()}
          </p>
        </div>

        {isPaymentComplete && (
          <p className="relative mt-4 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            Payment is already completed for this request. No further payment action is required.
          </p>
        )}

        {isRequestClosed && !isPaymentComplete && (
          <p className="relative mt-4 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            This request is {requestStatus}. Payment updates are currently locked.
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <h2 className="text-lg font-extrabold text-gray-900">Upload Payment Receipt</h2>
        <p className="text-sm text-gray-500">Upload payment proof for staff verification. Payment gateway is disabled for this flow.</p>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Payment plan</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPaymentPlan('full')}
              disabled={!canUploadReceipt}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${paymentPlan === 'full' ? 'bg-orange-600 border-orange-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Full Payment
            </button>
            <button
              type="button"
              onClick={() => setPaymentPlan('half')}
              disabled={!canUploadReceipt}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${paymentPlan === 'half' ? 'bg-orange-600 border-orange-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Half Payment
            </button>
            <button
              type="button"
              onClick={() => setPaymentPlan('three_quarter')}
              disabled={!canUploadReceipt}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${paymentPlan === 'three_quarter' ? 'bg-orange-600 border-orange-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Three Quarter Payment
            </button>
          </div>
          {formErrors.paymentPlan && <p className="text-xs text-red-500 mt-1">{formErrors.paymentPlan}</p>}
        </div>

        <div className="text-xs rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600">
          <p>
            Plan preview: {paymentPlan === 'full'
              ? `You are paying the full quote total of LKR ${quotedTotal.toLocaleString()}.`
              : paymentPlan === 'half'
                ? `You are paying half of the final quote total: LKR ${Math.round(quotedTotal / 2).toLocaleString()}.`
                : `You are paying three-quarter of the final quote total: LKR ${Math.round(quotedTotal * 0.75).toLocaleString()}.`}
          </p>
        </div>

        <div>
          <input
            type="number"
            min="0"
            max={Math.max(0, selectedPlanTarget)}
            step="0.01"
            value={paidAmount}
            onChange={(e) => {
              setPaidAmount(e.target.value);
              setFormErrors((prev) => ({ ...prev, paidAmount: '' }));
            }}
            placeholder="Paid amount"
            className="border rounded-xl px-3 py-2 w-full"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">
            Current due: LKR {amountDue.toLocaleString()} · Selected target: LKR {selectedPlanTarget.toLocaleString()}
          </p>
          {formErrors.paidAmount && <p className="text-xs text-red-500 mt-1">{formErrors.paidAmount}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <select
              value={receiptMethod}
              onChange={(e) => {
                setReceiptMethod(e.target.value);
                setFormErrors((prev) => ({ ...prev, receiptMethod: '' }));
              }}
              className="border rounded-xl px-3 py-2 w-full"
              disabled={!canUploadReceipt}
            >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mixed">Mixed</option>
            </select>
            {formErrors.receiptMethod && <p className="text-xs text-red-500 mt-1">{formErrors.receiptMethod}</p>}
          </div>
          <div>
            <input
              value={receiptRef}
              onChange={(e) => {
                setReceiptRef(e.target.value);
                setFormErrors((prev) => ({ ...prev, receiptRef: '' }));
              }}
              placeholder="Transaction reference"
              className="border rounded-xl px-3 py-2 w-full"
              disabled={!canUploadReceipt}
            />
            {formErrors.receiptRef && <p className="text-xs text-red-500 mt-1">{formErrors.receiptRef}</p>}
          </div>
        </div>

        <div>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => onReceiptFileChange(e.target.files?.[0] || null)}
            className="border rounded-xl px-3 py-2 w-full"
            disabled={!canUploadReceipt}
          />
          <p className="text-xs text-gray-500 mt-1">Accepted formats: PNG, JPG, WEBP, PDF. Max size 5MB.</p>
          {formErrors.receiptFile && <p className="text-xs text-red-500 mt-1">{formErrors.receiptFile}</p>}
        </div>

        <div>
          <textarea
            value={receiptNote}
            onChange={(e) => {
              setReceiptNote(e.target.value);
              setFormErrors((prev) => ({ ...prev, receiptNote: '' }));
            }}
            placeholder="Notes (optional)"
            className="border rounded-xl px-3 py-2 w-full min-h-24"
            disabled={!canUploadReceipt}
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">Optional notes for canteen verification.</p>
            <p className="text-xs text-gray-400">{receiptNote.length}/{MAX_NOTE_LENGTH}</p>
          </div>
          {formErrors.receiptNote && <p className="text-xs text-red-500 mt-1">{formErrors.receiptNote}</p>}
        </div>

        <button
          onClick={uploadReceipt}
          disabled={uploading || !canUploadReceipt}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Receipt'}
        </button>

        {requestDoc.payment?.receiptFileUrl && (
          <p className="text-sm text-gray-600">
            Current uploaded receipt: <a href={toAssetUrl(requestDoc.payment.receiptFileUrl)} target="_blank" rel="noreferrer" className="text-orange-600 underline">View File</a>
          </p>
        )}
      </div>

      <button onClick={() => navigate('/dashboard/event-catering/tracking')} className="text-sm font-semibold text-gray-600 hover:text-gray-900">
        Back to Catering Tracking
      </button>
    </div>
  );
};

export default EventCateringPaymentPage;
