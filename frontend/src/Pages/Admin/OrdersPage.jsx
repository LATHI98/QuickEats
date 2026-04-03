import React, { useState, useEffect, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ShoppingBag, LayoutList, BarChart2, RefreshCw, CheckCircle, ChefHat, Package, XCircle, Banknote, QrCode, ChevronDown, Wallet, TrendingUp, Clock, AlertCircle, ChevronRight, Users, CreditCard, X } from 'lucide-react';
import { orderAPI, paymentAPI, queueAPI, canteenAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
const PICKUP_CODE_REGEX = /^[A-Z2-9]{6}$/;
const VERIFICATION_CODE_REGEX = /^\d{6}$/;
const CURRENCY_INPUT_REGEX = /^\d+(\.\d{1,2})?$/;
const MAX_CASH_RECEIVED = 5000;
const ORDER_POLL_INTERVAL_MS = 5000;

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', next: ['preparing', 'cancelled'] },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-700', next: ['ready', 'cancelled'] },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-700', next: ['completed'] },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-600', next: [] },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-500', next: [] },
};

const PAYMENT_STATUS = {
  unpaid: { label: 'Unpaid', color: 'text-gray-400', bg: 'bg-gray-100' },
  pending_verification: { label: 'Verify Cash', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  verified: { label: 'Paid', color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-500', bg: 'bg-red-100' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
  );
};

// ─── Order Detail Modal (Admin) ──────────────────────────────────────────────

const OrderDetailModal = ({ order, onClose, onStatusChange, onVerifyCash, onRejectCash, canManagePayments, userRole }) => {
  if (!order) return null;

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const paymentCfg = PAYMENT_STATUS[order.payment?.status] || PAYMENT_STATUS.unpaid;
  const isStaff = ['canteenStaff', 'canteenManager'].includes(userRole);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Queue #{order.queueNumber}</h2>
            <p className="text-xs text-gray-400 mt-1 font-medium">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
              <span className="text-sm font-extrabold text-gray-600">Order Status</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
              <span className="text-sm font-extrabold text-gray-600">Payment Status</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${paymentCfg.bg} ${paymentCfg.color}`}>
                {paymentCfg.label}
              </span>
            </div>
          </div>

          {/* Student Info */}
          <div className="space-y-2">
            <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Student</p>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
              <p className="font-extrabold text-gray-900">{order.student?.name || 'Unknown'}</p>
              <p className="text-xs text-gray-500 mt-1">{order.student?.email || order.student?.studentId || '—'}</p>
            </div>
          </div>

          {/* Pickup Code (if ready) */}
          {order.status === 'ready' && order.pickupCode && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
              <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider mb-2">Pickup Code</p>
              <p className="text-4xl tracking-[0.25em] font-extrabold text-indigo-700">{order.pickupCode}</p>
            </div>
          )}

          {/* Order Items */}
          <div className="space-y-2">
            <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Items ({order.items?.length})</p>
            <div className="space-y-2 bg-gray-50 rounded-2xl p-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-600">{item.name} × {item.quantity}</span>
                  <span className="font-extrabold text-gray-900">
                    LKR {(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-extrabold">
                <span className="text-gray-600">Total</span>
                <span className="text-orange-600">LKR {order.totalPrice?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          {order.activityLogs?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Activity History</p>
              <div className="space-y-2 bg-gray-50 rounded-2xl p-4 max-h-40 overflow-y-auto">
                {[...order.activityLogs].reverse().map((log, idx) => (
                  <div key={idx} className="text-xs border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                    <p className="text-gray-700 font-medium">{log.note || log.action}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {log.actor?.name || (log.actorRole === 'system' ? 'System' : 'Unknown')} · {log.actorRole || 'unknown'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-gray-100">
            {/* Status change buttons */}
            {cfg.next.length > 0 && (
              <div className="space-y-2">
                {cfg.next
                  .filter(next => {
                    if (order.status === 'ready' && next === 'completed' && canManagePayments) {
                      return false;
                    }
                    return next !== 'cancelled';
                  })
                  .map(next => (
                    <button
                      key={next}
                      onClick={() => {
                        onStatusChange(order._id, next);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-extrabold transition-colors"
                    >
                      {next === 'preparing' && <ChefHat size={16} />}
                      {next === 'ready' && <Package size={16} />}
                      {next === 'completed' && <CheckCircle size={16} />}
                      Mark {STATUS_CONFIG[next]?.label}
                    </button>
                  ))}
              </div>
            )}

            {/* Cancel button */}
            {cfg.next.includes('cancelled') && (
              <button
                onClick={() => {
                  onStatusChange(order._id, 'cancelled');
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-200 text-red-500 hover:bg-red-50 rounded-2xl text-sm font-extrabold transition-colors"
              >
                <XCircle size={16} /> Cancel Order
              </button>
            )}

            {/* Verify Cash (staff only) */}
            {canManagePayments && order.payment?.status === 'pending_verification' && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onVerifyCash(order);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-sm font-extrabold transition-colors"
                >
                  <Banknote size={16} /> Verify Cash Payment
                </button>
                <button
                  onClick={() => {
                    onRejectCash(order);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-200 text-red-500 hover:bg-red-50 rounded-2xl text-sm font-extrabold transition-colors"
                >
                  <XCircle size={16} /> Reject Payment
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-extrabold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CashVerificationModal = ({ order, form, errors, submitting, onChange, onClose, onSubmit }) => {
  if (!order) return null;

  const amountRaw = String(form.amountReceived || '').trim();
  const amount = Number(amountRaw);
  const orderTotal = order.totalPrice || 0;
  const isAmountFormatValid = amountRaw === '' ? false : CURRENCY_INPUT_REGEX.test(amountRaw);
  const isAmountNumeric = Number.isFinite(amount) && amount > 0;
  const isAmountSufficient = isAmountNumeric && amount >= orderTotal;
  const isAmountExceeded = isAmountNumeric && amount > MAX_CASH_RECEIVED;
  const change = isAmountSufficient && !isAmountExceeded ? Math.round((amount - orderTotal) * 100) / 100 : 0;
  const codeStr = String(form.verificationCode || '');
  const isVerificationCodeValid = VERIFICATION_CODE_REGEX.test(codeStr.trim());
  const canSubmit = !submitting && isAmountSufficient && !isAmountExceeded && isVerificationCodeValid;

  // Live inline messages (not form-submit errors)
  const amountLiveWarning =
    amountRaw !== '' && isAmountFormatValid && isAmountNumeric && !isAmountSufficient
      ? `Amount must be at least LKR ${orderTotal.toLocaleString()}`
      : amountRaw !== '' && isAmountFormatValid && isAmountNumeric && isAmountExceeded
      ? `Maximum cash received allowed is LKR ${MAX_CASH_RECEIVED.toLocaleString()}`
      : amountRaw !== '' && !isAmountFormatValid
      ? 'Enter a valid number (e.g. 500 or 1250.50)'
      : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white border border-gray-100 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-extrabold">Cash Verification</p>
            <h3 className="text-xl font-extrabold text-gray-900 mt-1">Queue #{order.queueNumber}</h3>
            <p className="text-xs text-gray-500 mt-1">Confirm received amount and enter the student's 6-digit verification code.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Order total */}
        <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Student</p>
            <p className="text-sm font-extrabold text-gray-700">{order.student?.name || 'Unknown'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Order Total</p>
            <p className="text-xl font-extrabold text-orange-600">LKR {orderTotal.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Amount field */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 font-extrabold mb-2">Amount Received (LKR)</label>
            <input
              value={form.amountReceived}
              onChange={(e) => onChange('amountReceived', e.target.value)}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={`Min. ${orderTotal.toLocaleString()}`}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
                errors.amountReceived || amountLiveWarning
                  ? 'border-red-300 focus:ring-red-200 bg-red-50/30'
                  : isAmountSufficient
                  ? 'border-green-300 focus:ring-green-200 bg-green-50/30'
                  : 'border-gray-200 focus:ring-orange-200'
              }`}
            />
            {/* Live warning takes priority over form error */}
            {(amountLiveWarning || errors.amountReceived) && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> {amountLiveWarning || errors.amountReceived}
              </p>
            )}
            {isAmountSufficient && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle size={11} /> Amount is sufficient
              </p>
            )}
          </div>

          {/* Verification code field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-widest text-gray-500 font-extrabold">Verification Code</label>
              <span className={`text-xs font-extrabold ${codeStr.length === 6 ? 'text-green-600' : 'text-gray-400'}`}>
                {codeStr.length}/6 digits
              </span>
            </div>
            <input
              value={form.verificationCode}
              onChange={(e) => onChange('verificationCode', e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 482913"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm tracking-[0.3em] focus:outline-none focus:ring-2 transition-colors ${
                errors.verificationCode
                  ? 'border-red-300 focus:ring-red-200'
                  : isVerificationCodeValid
                  ? 'border-green-300 focus:ring-green-200 bg-green-50/30'
                  : 'border-gray-200 focus:ring-orange-200'
              }`}
            />
            {errors.verificationCode && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> {errors.verificationCode}
              </p>
            )}
            {isVerificationCodeValid && !errors.verificationCode && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle size={11} /> Code is complete
              </p>
            )}
          </div>

          {/* Change calculator */}
          <div className={`rounded-xl border px-3 py-2.5 flex items-center justify-between ${
            isAmountSufficient ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'
          }`}>
            <p className="text-xs text-gray-500">Change to Return</p>
            <p className={`text-base font-extrabold ${isAmountSufficient ? 'text-emerald-700' : 'text-gray-400'}`}>
              {isAmountSufficient ? `LKR ${change.toLocaleString()}` : '—'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-extrabold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 text-sm font-extrabold text-white transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : 'Confirm Cash Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PickupVerificationModal = ({ order, form, onChange, submitting, onClose, onSubmit, onOpenScanner }) => {
  if (!order) return null;
  const expectedCode = String(order.pickupCode || '').trim().toUpperCase();
  const inputCode = String(form.pickupCode || '').trim().toUpperCase();
  const hasExpectedCode = !!expectedCode;
  const isCodeFormatValid = PICKUP_CODE_REGEX.test(inputCode);
  const isCodeMatch = hasExpectedCode && inputCode === expectedCode;
  const isCodeMismatch = isCodeFormatValid && hasExpectedCode && inputCode !== expectedCode;
  const canSubmit = !submitting && isCodeFormatValid && isCodeMatch;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white border border-gray-100 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-extrabold">Pickup Verification</p>
            <h3 className="text-xl font-extrabold text-gray-900 mt-1">Queue #{order.queueNumber}</h3>
            <p className="text-xs text-gray-500 mt-1">Match the student's code and QR before marking as delivered.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* No pickup code guard */}
        {!hasExpectedCode ? (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 mb-4 flex items-start gap-2">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-extrabold text-amber-700">No Pickup Code Generated</p>
              <p className="text-xs text-amber-600 mt-0.5">This order doesn't have a pickup code yet. Payment must be verified before delivery can proceed.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-3 mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-extrabold">Expected Pickup Code</p>
              <p className="text-2xl tracking-[0.2em] font-extrabold text-indigo-700 mt-0.5">{order.pickupCode}</p>
            </div>
            <p className="text-[10px] text-indigo-300 italic text-right max-w-[80px] leading-tight">Match with student's code</p>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs uppercase tracking-widest text-gray-500 font-extrabold">Enter 6-Digit Pickup Code</label>
            <button 
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-extrabold hover:bg-indigo-100 transition-colors"
            >
              <QrCode size={14} /> Scan Instead
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={form.pickupCode}
              onChange={(e) => onChange({ pickupCode: e.target.value.toUpperCase() })}
              placeholder="E.G. A1B2C3"
              maxLength={6}
              className={`w-full text-3xl font-mono tracking-[0.5em] text-center rounded-2xl border-2 px-4 py-4 focus:outline-none transition-all ${
                isCodeMatch ? 'border-green-400 bg-green-50 text-green-700' : 
                isCodeMismatch ? 'border-red-400 bg-red-50 text-red-700' : 
                'border-gray-100 bg-gray-50 focus:border-indigo-300'
              }`}
            />
            {isCodeMatch && <div className="absolute top-1/2 -translate-y-1/2 right-4 text-green-500"><CheckCircle size={24} /></div>}
            {isCodeMismatch && <div className="absolute top-1/2 -translate-y-1/2 right-4 text-red-500"><XCircle size={24} /></div>}
          </div>

          {/* Indicators */}
          <div className="mt-3 flex items-center justify-between">
            <p className={`text-xs ${isCodeMatch ? 'text-green-600' : isCodeMismatch ? 'text-red-500' : 'text-gray-400'}`}>
              {isCodeMatch ? 'Code match confirmed!' : isCodeMismatch ? 'Code does not match' : 'Expected: ' + expectedCode}
            </p>
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{inputCode.length}/6 digits</span>
          </div>
        </div>

        <div className="p-6 pt-0">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed py-4 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Completing...
              </span>
            ) : (
              <>
                <CheckCircle size={18} /> Confirm Order Delivery
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Confirm Cancel (Admin) Modal ─────────────────────────────────────────────

const ConfirmCancelAdminModal = ({ order, reason, onChange, submitting, onClose, onSubmit }) => {
  if (!order) return null;
  const MIN_REASON_LEN = 5;
  const MAX_REASON_LEN = 200;
  const trimmed = (reason || '').trim();
  const isReasonValid = trimmed.length >= MIN_REASON_LEN;
  const canSubmit = !submitting && isReasonValid;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white border border-gray-100 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-red-400 font-extrabold">Cancel Order</p>
            <h3 className="text-xl font-extrabold text-gray-900 mt-1">Queue #{order.queueNumber}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 mb-5 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 leading-relaxed">
            Cancelling this order will notify the student. <strong>This action is permanent.</strong>
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-widest text-gray-500 font-extrabold">Reason for Cancellation</label>
            <span className={`text-xs ${
              trimmed.length > MAX_REASON_LEN ? 'text-red-500' : trimmed.length >= MIN_REASON_LEN ? 'text-green-600' : 'text-gray-400'
            } font-extrabold`}>
              {reason.length}/{MAX_REASON_LEN}
            </span>
          </div>
          <textarea
            value={reason}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. Items are out of stock. Please place a different order."
            maxLength={MAX_REASON_LEN}
            rows={3}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 transition-colors ${
              !isReasonValid && trimmed.length > 0 ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-red-200'
            }`}
          />
          {!isReasonValid && trimmed.length > 0 && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={11} /> Reason must be at least {MIN_REASON_LEN} characters
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-extrabold text-gray-600 hover:bg-gray-50 transition-colors">
            Back
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 text-sm font-extrabold text-white transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Cancelling...
              </span>
            ) : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Reject Payment Modal ─────────────────────────────────────────────────────

const RejectPaymentModal = ({ order, reason, onChange, submitting, onClose, onSubmit }) => {
  if (!order) return null;
  const MIN_REASON_LEN = 5;
  const MAX_REASON_LEN = 200;
  const trimmed = (reason || '').trim();
  const isReasonValid = trimmed.length >= MIN_REASON_LEN;
  const canSubmit = !submitting && isReasonValid;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white border border-gray-100 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-red-400 font-extrabold">Reject Payment</p>
            <h3 className="text-xl font-extrabold text-gray-900 mt-1">Queue #{order.queueNumber}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 mb-5 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 leading-relaxed">
            Rejecting will mark the payment as <strong>Rejected</strong> and notify the student to resubmit. The order will NOT be cancelled.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-widest text-gray-500 font-extrabold">Rejection Reason</label>
            <span className={`text-xs ${
              trimmed.length > MAX_REASON_LEN ? 'text-red-500' : trimmed.length >= MIN_REASON_LEN ? 'text-green-600' : 'text-gray-400'
            } font-extrabold`}>
              {reason.length}/{MAX_REASON_LEN}
            </span>
          </div>
          <textarea
            value={reason}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. Verification code provided was incorrect. Please resubmit with the correct code shown in the app."
            maxLength={MAX_REASON_LEN}
            rows={3}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 transition-colors ${
              !isReasonValid && trimmed.length > 0 ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-red-200'
            }`}
          />
          {!isReasonValid && trimmed.length > 0 && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle size={11} /> Reason must be at least {MIN_REASON_LEN} characters
            </p>
          )}
          {!isReasonValid && trimmed.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">Please provide a brief reason for rejection.</p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-extrabold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 text-sm font-extrabold text-white transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Rejecting...
              </span>
            ) : 'Reject Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};


// ─── QR Scanner Modal ─────────────────────────────────────────────────────────

const QRScannerModal = ({ onClose, onScanSuccess }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    });

    scanner.render((decodedText) => {
      // Assuming QR contains exactly the 6-char pickup code
      onScanSuccess(decodedText.trim().toUpperCase());
      scanner.clear();
      onClose();
    }, (error) => {
      // Handle scanning errors silently
    });

    return () => {
      scanner.clear().catch(err => console.warn("Failed to clear scanner", err));
    };
  }, [onClose, onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-extrabold text-gray-900">Scan Order QR</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <div className="p-6">
          <div id="reader" className="overflow-hidden rounded-2xl border-2 border-dashed border-gray-200" />
          <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
            Align the student's <strong>Order QR Code</strong> within the frame to automatically verify their pickup.
          </p>
        </div>
        <div className="p-4 bg-gray-50 flex justify-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-sm font-extrabold text-gray-600 hover:text-gray-900"
          >
            Cancel Scanning
          </button>
        </div>
      </div>
    </div>
  );
};


// ─── Order Card ───────────────────────────────────────────────────────────────

const OrderCard = ({ order, onStatusChange, onVerifyCash, onRejectCash, onVerifyPickup, canManagePayments, userRole, onViewDetails }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const paymentCfg = PAYMENT_STATUS[order.payment?.status] || PAYMENT_STATUS.unpaid;

  return (
    <div
      onClick={() => onViewDetails(order)}
      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-lg hover:border-orange-200 transition-all"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-gray-900">Queue #{order.queueNumber}</span>
            <StatusBadge status={order.status} />
            {/* Payment status badge */}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${paymentCfg.bg} ${paymentCfg.color}`}>
              {paymentCfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {order.student?.name || 'Student'} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {/* Canteen name (for admin seeing all canteens) */}
          {order.canteen?.name && (
            <p className="text-xs text-gray-400">{order.canteen.name}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-extrabold text-orange-600">LKR {order.totalPrice?.toLocaleString()}</p>
          {/* Group vs Individual badge */}
          {order.groupSession ? (
            <span className="flex items-center justify-end gap-1 text-[10px] font-extrabold text-blue-600 mt-0.5">
              <Users size={10} />
              Group · {order.groupSession.paymentMode === 'pay_together' ? 'Creator Pays' : 'Split'}
            </span>
          ) : (
            <span className="flex items-center justify-end gap-1 text-[10px] font-extrabold text-gray-400 mt-0.5">
              <CreditCard size={10} /> Individual
            </span>
          )}
        </div>
      </div>

      {/* Items toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-3"
      >
        {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
        <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="space-y-1 mb-3 pl-2 border-l-2 border-orange-100">
          {order.items?.map((item, i) => (
            <p key={i} className="text-xs text-gray-600">{item.name} × {item.quantity} — LKR {(item.unitPrice * item.quantity).toLocaleString()}</p>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Status advance buttons */}
        {cfg.next
          .filter(next => {
            // For staff: Force them to use the "Mark Delivered" modal for ready→completed
            // For admin: Allow direct completion
            if (order.status === 'ready' && next === 'completed' && canManagePayments) {
              return false; // Staff must use Mark Delivered button
            }
            return next !== 'cancelled';
          })
          .map(next => (
            <button
              key={next}
              onClick={() => onStatusChange(order._id, next)}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors"
            >
              {next === 'preparing' && <ChefHat size={12} />}
              {next === 'ready' && <Package size={12} />}
              {next === 'completed' && <CheckCircle size={12} />}
              Mark {STATUS_CONFIG[next]?.label}
            </button>
          ))}
        {/* Cancel */}
        {cfg.next.includes('cancelled') && (
          <button
            onClick={() => onStatusChange(order._id, 'cancelled')}
            className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
          >
            <XCircle size={12} /> Cancel
          </button>
        )}
        {/* Verify Cash (staff/manager only) */}
        {canManagePayments && order.payment?.status === 'pending_verification' && (
          <>
            <button
              onClick={() => onVerifyCash(order)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Banknote size={12} /> Verify Cash
            </button>
            <button
              onClick={() => onRejectCash(order)}
              className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
            >
              <XCircle size={12} /> Reject
            </button>
          </>
        )}
        {/* QR Pickup verify (staff/manager only) */}
        {canManagePayments && order.status === 'ready' && (
          <button
            onClick={() => onVerifyPickup(order)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-extrabold transition-colors"
          >
            <CheckCircle size={12} /> Mark Delivered
          </button>
        )}
      </div>

      {/* Pickup Code — shown when order is ready */}
      {order.status === 'ready' && order.pickupCode && (
        <div className="mt-3 flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
          <QrCode size={16} className="text-indigo-400 shrink-0" />
          <div>
            <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wide">Student Pickup Code</p>
            <p className="text-2xl font-extrabold text-indigo-700 tracking-widest">{order.pickupCode}</p>
          </div>
          <p className="ml-auto text-[10px] text-indigo-300 italic">Match with student's code to confirm</p>
        </div>
      )}

      {/* Activity timeline (admin visibility requirement) */}
      {!!order.activityLogs?.length && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-extrabold mb-2">Activity</p>
          <div className="space-y-1.5 max-h-32 overflow-auto pr-1">
            {[...order.activityLogs].slice(-6).reverse().map((log, idx) => (
              <div key={`${log.createdAt || idx}-${idx}`} className="text-xs text-gray-500 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-gray-600 truncate">
                    {log.note || log.action}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {log.actor?.name || (log.actorRole === 'system' ? 'System' : 'Unknown')} · {log.actorRole || 'unknown'}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                  {new Date(log.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// ─── Queue Board Tab ──────────────────────────────────────────────────────────

const REFRESH_INTERVAL = 30; // seconds

const QueueBoard = ({ canteenIdProp, isAdmin }) => {
  const [canteenId, setCanteenId] = useState(canteenIdProp || '');
  const [canteens, setCanteens] = useState([]);
  const [slots, setSlots] = useState([]);
  const [nowServingInput, setNowServingInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [calling, setCalling] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [queueData, setQueueData] = useState(null);

  // For admin: load canteen list so they can pick one
  useEffect(() => {
    if (isAdmin) {
      canteenAPI.getAll().then(r => {
        const list = r.data.data || [];
        setCanteens(list);
        if (!canteenId && list.length > 0) setCanteenId(list[0]._id);
      }).catch(() => { });
    }
  }, [isAdmin]);

  const fetchQueue = useCallback(async (showLoader = false) => {
    if (!canteenId) return;
    if (showLoader) setLoading(true);
    try {
      const [statusRes, slotsRes] = await Promise.all([
        queueAPI.getStatus(canteenId),
        queueAPI.getSlots(canteenId),
      ]);
      setQueueData(statusRes.data.data);
      setSlots(slotsRes.data.data || []);
      setCountdown(REFRESH_INTERVAL);
    } catch {
      toast.error('Failed to load queue data');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [canteenId]);

  useEffect(() => { fetchQueue(true); }, [fetchQueue]);

  // Auto-refresh with countdown
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { fetchQueue(false); return REFRESH_INTERVAL; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [fetchQueue]);

  const handleSetNowServing = async (e) => {
    e.preventDefault();
    if (!nowServingInput) return;
    try {
      await queueAPI.setNowServing(canteenId, Number(nowServingInput));
      toast.success(`Now serving #${nowServingInput}`);
      setNowServingInput('');
      fetchQueue(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleCallNext = async () => {
    setCalling(true);
    try {
      const res = await queueAPI.callNext(canteenId);
      toast.success(`Calling Queue #${res.data.data.nowServing}!`);
      fetchQueue(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No pending orders to call');
    } finally {
      setCalling(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const grouped = queueData?.grouped || {};
  const activeStatuses = ['pending', 'preparing', 'ready'];
  const totalActive = queueData?.totalActive || 0;

  return (
    <div className="space-y-5">

      {/* Admin-only: Canteen Picker */}
      {isAdmin && (
        <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
          <BarChart2 size={16} className="text-orange-500" />
          <label className="text-sm font-extrabold text-gray-700 whitespace-nowrap">Viewing Canteen:</label>
          <select
            value={canteenId}
            onChange={e => setCanteenId(e.target.value)}
            className="flex-1 border-0 bg-transparent text-sm text-gray-600 focus:outline-none focus:ring-0 font-medium cursor-pointer"
          >
            {canteens.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {!canteenId ? (
        <div className="text-center py-16 text-gray-400 text-sm">Select a canteen to view the queue board.</div>
      ) : loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Now Serving Hero Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Now serving display */}
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Now Serving</p>
                  <p className="text-6xl font-extrabold text-orange-600 leading-none">
                    {queueData?.nowServing ? `#${queueData.nowServing}` : '—'}
                  </p>
                </div>
                {queueData?.nextQueueNumber && (
                  <div className="border-l pl-6">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Up Next</p>
                    <p className="text-3xl font-extrabold text-gray-400">#{queueData.nextQueueNumber}</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-3 w-full sm:w-auto">
                <button
                  onClick={handleCallNext}
                  disabled={calling || totalActive === 0}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-extrabold text-sm transition-colors"
                >
                  {calling ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  Call Next
                </button>
                <form onSubmit={handleSetNowServing} className="flex gap-2">
                  <input
                    type="number" min={1}
                    value={nowServingInput}
                    onChange={e => setNowServingInput(e.target.value)}
                    placeholder="Set # manually"
                    className="flex-1 w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <button type="submit" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-extrabold transition-colors">Set</button>
                </form>
              </div>
            </div>

            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs text-gray-400">Auto-refreshing in <span className="font-extrabold text-gray-600">{countdown}s</span></p>
              <button onClick={() => fetchQueue(false)} className="ml-auto text-xs text-orange-500 hover:underline font-extrabold">Refresh now</button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {activeStatuses.map(s => {
              const cfg = STATUS_CONFIG[s];
              const count = (grouped[s] || []).length;
              return (
                <div key={s} className={`rounded-2xl border p-3 text-center ${cfg.color}`}>
                  <p className="text-2xl font-extrabold">{count}</p>
                  <p className="text-xs font-extrabold opacity-75 mt-0.5">{cfg.label}</p>
                </div>
              );
            })}
          </div>

          {/* Active Orders Board */}
          {activeStatuses.map(status => {
            const list = grouped[status] || [];
            if (list.length === 0) return null;
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-xs text-gray-400">{list.length} order{list.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {list.map(o => (
                    <div key={o._id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cfg.color} bg-white`}>
                      <span className="text-xl font-extrabold">#{o.queueNumber}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-gray-900 truncate">{o.student?.name || 'Student'}</p>
                        <p className="text-xs text-gray-400">{new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {totalActive === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} className="text-green-400" />
              </div>
              All caught up! No active orders in the queue.
            </div>
          )}

          {/* Time Slots Capacity */}
          {slots.length > 0 && (
            <div>
              <p className="text-sm font-extrabold text-gray-700 mb-3">Upcoming Pickup Slots</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {slots.slice(0, 12).map((slot, i) => {
                  const pct = Math.round((slot.orderCount / slot.maxCapacity) * 100);
                  return (
                    <div key={i} className={`rounded-xl p-2.5 text-center border ${slot.isFull ? 'border-red-200 bg-red-50' : pct >= 70 ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100 bg-white'}`}>
                      <p className="font-extrabold text-gray-700 text-xs">
                        {new Date(slot.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className={`text-[10px] mt-0.5 font-extrabold ${slot.isFull ? 'text-red-500' : pct >= 70 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {slot.orderCount}/{slot.maxCapacity}
                        {slot.isFull && ' FULL'}
                      </p>
                      <div className="w-full h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${slot.isFull ? 'bg-red-400' : pct >= 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};




// ─── Billing Board Tab ────────────────────────────────────────────────────────

const BillingBoard = ({ canteenId }) => {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payFilter, setPayFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchBilling = useCallback(async (silent = false) => {
    if (!canteenId) {
      setAllOrders([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const params = {};
      if (date) params.date = date;
      params.canteen = canteenId;
      const res = await orderAPI.getCanteenOrders(params);
      setAllOrders(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load billing data');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [date, canteenId]);

  useEffect(() => { fetchBilling(); }, [fetchBilling]);

  // Derived stats
  const stats = allOrders.reduce((acc, o) => {
    const ps = o.payment?.status || 'unpaid';
    const amt = o.totalPrice || 0;
    if (ps === 'verified') { acc.collected += amt; acc.collectedCount += 1; }
    else if (ps === 'pending_verification') { acc.awaitingVerification += amt; acc.awaitingCount += 1; }
    else if (ps === 'unpaid') { acc.unpaid += amt; acc.unpaidCount += 1; }
    else if (ps === 'rejected') { acc.rejected += amt; acc.rejectedCount += 1; }
    return acc;
  }, { collected: 0, collectedCount: 0, awaitingVerification: 0, awaitingCount: 0, unpaid: 0, unpaidCount: 0, rejected: 0, rejectedCount: 0 });

  const filtered = payFilter ? allOrders.filter(o => (o.payment?.status || 'unpaid') === payFilter) : allOrders;

  const PAY_FILTERS = [
    { value: '', label: 'All' },
    { value: 'verified', label: 'Paid' },
    { value: 'pending_verification', label: 'Awaiting' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'rejected', label: 'Rejected' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Controls: Date Picker + Refresh */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <button
          onClick={() => fetchBilling(true)}
          className={`mt-5 p-2 rounded-full hover:bg-gray-100 transition-colors ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp size={20} className="text-green-600" />}
          label="Collected"
          amount={stats.collected}
          count={stats.collectedCount}
          color="bg-green-50 border-green-100"
          amtColor="text-green-700"
        />
        <StatCard
          icon={<Clock size={20} className="text-yellow-600" />}
          label="Awaiting Verification"
          amount={stats.awaitingVerification}
          count={stats.awaitingCount}
          color="bg-yellow-50 border-yellow-100"
          amtColor="text-yellow-700"
        />
        <StatCard
          icon={<Wallet size={20} className="text-gray-500" />}
          label="Unpaid"
          amount={stats.unpaid}
          count={stats.unpaidCount}
          color="bg-gray-50 border-gray-100"
          amtColor="text-gray-600"
        />
        <StatCard
          icon={<AlertCircle size={20} className="text-red-500" />}
          label="Rejected"
          amount={stats.rejected}
          count={stats.rejectedCount}
          color="bg-red-50 border-red-100"
          amtColor="text-red-600"
        />
      </div>

      {/* Payment Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {PAY_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setPayFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${payFilter === f.value ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Billing Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No orders matching this filter.</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Order Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(order => {
                const ps = order.payment?.status || 'unpaid';
                const pCfg = PAYMENT_STATUS[ps] || PAYMENT_STATUS.unpaid;
                const sCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-extrabold text-gray-700">#{order.queueNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-gray-800 leading-tight">{order.student?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{order.student?.studentId || order.student?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sCfg.color}`}>{sCfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <PayBadge ps={ps} label={pCfg.label} />
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-orange-600">LKR {order.totalPrice?.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-100">
                <td colSpan={5} className="px-4 py-3 text-xs font-extrabold text-gray-500 uppercase">Total Shown</td>
                <td className="px-4 py-3 text-right font-extrabold text-gray-900">
                  LKR {filtered.reduce((s, o) => s + (o.totalPrice || 0), 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, amount, count, color, amtColor }) => (
  <div className={`rounded-2xl border p-4 ${color}`}>
    <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">{label}</span></div>
    <p className={`text-xl font-extrabold ${amtColor}`}>LKR {amount.toLocaleString()}</p>
    <p className="text-xs text-gray-400 mt-0.5">{count} order{count !== 1 ? 's' : ''}</p>
  </div>
);

const PAY_BADGE_STYLES = {
  verified: 'bg-green-100 text-green-700',
  pending_verification: 'bg-yellow-100 text-yellow-700',
  unpaid: 'bg-gray-100 text-gray-500',
  rejected: 'bg-red-100 text-red-600',
};

const PayBadge = ({ ps, label }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PAY_BADGE_STYLES[ps] || 'bg-gray-100 text-gray-500'}`}>{label}</span>
);



const AdminOrdersPage = () => {
  const { user, selectedCanteenId, selectedCanteenName } = useAuth();
  const assignedCanteenId = typeof user?.canteen === 'object' ? user?.canteen?._id : user?.canteen;
  const isAdmin = user?.role === 'admin';
  const [localCanteenId, setLocalCanteenId] = useState(selectedCanteenId || assignedCanteenId || '');
  const [canteens, setCanteens] = useState([]);
  const canteenId = localCanteenId;
  const canManagePayments = ['canteenStaff', 'canteenManager'].includes(user?.role);

  const [tab, setTab] = useState('orders'); // 'orders' | 'queue' | 'billing'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canteenLoading, setCanteenLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [verificationOrder, setVerificationOrder] = useState(null);
  const [verificationForm, setVerificationForm] = useState({ amountReceived: '', verificationCode: '' });
  const [verificationErrors, setVerificationErrors] = useState({});
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);
  const [pickupOrder, setPickupOrder] = useState(null);
  const [pickupForm, setPickupForm] = useState({ pickupCode: '' });
  const [pickupErrors, setPickupErrors] = useState({});
  const [pickupSubmitting, setPickupSubmitting] = useState(false);
  const [rejectOrder, setRejectOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [adminCancelOrder, setAdminCancelOrder] = useState(null);
  const [adminCancelReason, setAdminCancelReason] = useState('');
  const [adminCancelSubmitting, setAdminCancelSubmitting] = useState(false);
  const [codeInputTouched, setCodeInputTouched] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  // Load canteens for admin only - trigger on mount
  useEffect(() => {
    if (isAdmin) {
      setCanteenLoading(true);
      const loadCanteens = async () => {
        try {
          const response = await canteenAPI.getAll();
          const list = response?.data?.data || response?.data || [];
          const canteenList = Array.isArray(list) ? list : [];
          setCanteens(canteenList);
        } catch (err) {
          console.error('Failed to load canteens:', err);
          setCanteens([]);
          toast.error('Failed to load canteens');
        } finally {
          setCanteenLoading(false);
        }
      };
      loadCanteens();
    } else {
      setCanteenLoading(false);
    }
  }, [isAdmin]);

  // Fetch orders when canteen is selected
  useEffect(() => {
    if (isAdmin && canteenId) {
      fetchOrders();
    }
  }, [canteenId, isAdmin]);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!canteenId) {
      setOrders([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params = {};
      params.canteen = canteenId;
      if (statusFilter) params.status = statusFilter;
      const res = await orderAPI.getCanteenOrders(params);
      setOrders(res.data.data || []);
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, canteenId]);

  useEffect(() => { if (tab === 'orders') fetchOrders(); }, [fetchOrders, tab]);
  useEffect(() => {
    if (tab !== 'orders') return;

    const handleWindowFocus = () => fetchOrders(true);
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchOrders(true);
    };

    const interval = setInterval(() => fetchOrders(true), ORDER_POLL_INTERVAL_MS);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchOrders, tab]);

  const handleStatusChange = async (orderId, status) => {
    // If cancelling, open the specialized modal first
    if (status === 'cancelled') {
        const orderToCancel = orders.find(o => o._id === orderId);
        setAdminCancelOrder(orderToCancel);
        setAdminCancelReason('');
        return;
    }
    try {
      await orderAPI.updateOrderStatus(orderId, status);
      toast.success(`Order marked as ${status}`);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleConfirmAdminCancel = async () => {
    if (!adminCancelOrder) return;
    setAdminCancelSubmitting(true);
    try {
        await orderAPI.updateOrderStatus(adminCancelOrder._id, 'cancelled', adminCancelReason);
        toast.success('Order cancelled and student notified.');
        setAdminCancelOrder(null);
        fetchOrders(true);
    } catch (err) {
        toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
        setAdminCancelSubmitting(false);
    }
  };

  const handleOpenVerifyCash = (order) => {
    setVerificationOrder(order);
    setVerificationForm({
      amountReceived: String(order.totalPrice || ''),
      verificationCode: '',
    });
    setVerificationErrors({});
  };

  const handleVerificationInputChange = (field, value) => {
    if (field === 'amountReceived') {
      const normalized = value.replace(/,/g, '').trim();
      if (normalized === '') {
        setVerificationForm((prev) => ({ ...prev, amountReceived: '' }));
        setVerificationErrors((prev) => ({ ...prev, amountReceived: '' }));
        return;
      }
      if (!/^\d*(\.\d{0,2})?$/.test(normalized)) return;
      setVerificationForm((prev) => ({ ...prev, amountReceived: normalized }));
      setVerificationErrors((prev) => ({ ...prev, amountReceived: '' }));
      return;
    }

    if (field === 'verificationCode') {
      const sanitizedCode = String(value || '').replace(/\D/g, '').slice(0, 6);
      setVerificationForm((prev) => ({ ...prev, verificationCode: sanitizedCode }));
      setVerificationErrors((prev) => ({ ...prev, verificationCode: '' }));
      return;
    }

    setVerificationForm((prev) => ({ ...prev, [field]: value }));
    setVerificationErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleConfirmVerifyCash = async () => {
    if (!verificationOrder) return;

    const nextErrors = {};
    const amountRaw = String(verificationForm.amountReceived || '').trim();
    const amountReceived = Number(amountRaw);
    const verificationCode = String(verificationForm.verificationCode || '').trim();
    const minAmount = Number(verificationOrder.totalPrice || 0);
    const maxReasonableAmount = Math.max(minAmount + 5000, minAmount * 5);

    if (!CURRENCY_INPUT_REGEX.test(amountRaw) || !Number.isFinite(amountReceived) || amountReceived <= 0) {
      nextErrors.amountReceived = 'Enter a valid amount with up to 2 decimals';
    } else if (amountReceived < minAmount) {
      nextErrors.amountReceived = `Amount must be at least LKR ${minAmount.toLocaleString()}`;
    } else if (amountReceived > maxReasonableAmount) {
      nextErrors.amountReceived = 'Amount looks too high. Please re-check before confirming';
    }

    if (!VERIFICATION_CODE_REGEX.test(verificationCode)) {
      nextErrors.verificationCode = 'Enter the 6-digit verification code';
    }

    if (Object.keys(nextErrors).length > 0) {
      setVerificationErrors(nextErrors);
      return;
    }

    setVerificationSubmitting(true);
    try {
      await paymentAPI.verifyPayment(verificationOrder._id, { amountReceived, verificationCode });
      const change = Math.max(0, amountReceived - (verificationOrder.totalPrice || 0));
      toast.success(`Cash payment verified${change > 0 ? ` · Change LKR ${change.toLocaleString()}` : ''}`);
      setVerificationOrder(null);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerificationSubmitting(false);
    }
  };

  const handleRejectCash = (order) => {
    setRejectOrder(order);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectOrder) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 5) {
      toast.error('Please provide a rejection reason (at least 5 characters)');
      return;
    }
    setRejectSubmitting(true);
    try {
      await paymentAPI.rejectPayment(rejectOrder._id, trimmed);
      toast.success('Payment rejected — student will be notified to resubmit.');
      setRejectOrder(null);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleOpenPickupVerify = (order) => {
    setPickupOrder(order);
    setPickupForm({ pickupCode: '' });
    setPickupErrors({});
  };

  const handleConfirmPickup = async () => {
    if (!pickupOrder) return;
    setPickupSubmitting(true);
    try {
      await orderAPI.verifyPickup(pickupOrder._id, { 
        pickupCode: pickupForm.pickupCode,
        canteenId,
        qrValidated: true // Backend still logs it for activity, but doesn't require it as a hurdle
      });
      toast.success('Order delivered!');
      setPickupOrder(null);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setPickupSubmitting(false);
    }
  };

  const handlePickupByCode = async (codeToSubmit = null) => {
    const code = (codeToSubmit || codeInput).trim().toUpperCase();
    if (!PICKUP_CODE_REGEX.test(code)) {
        if (!codeToSubmit) toast.warn('Please enter a valid 6-character code');
        return;
    }
    setCodeVerifying(true);
    try {
      await orderAPI.pickupByCode(code, true, canteenId);
      toast.success('Transfer complete! Order marked as delivered.');
      setCodeInput('');
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Pickup verification failed');
    } finally {
      setCodeVerifying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Orders Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isAdmin ? 'Select a canteen to view and manage orders' : 'Manage incoming orders and queue'}
          </p>
        </div>
        {tab === 'orders' && canteenId && (
          <button
            onClick={() => fetchOrders(true)}
            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Canteen Selector - Show prominently for Admin */}
      {isAdmin && (
        <div className="mb-8">
          {canteenLoading ? (
            <div className="bg-gradient-to-r from-orange-50 to-white border-2 border-orange-100 rounded-2xl px-6 py-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                <div>
                  <p className="font-extrabold text-gray-900">Loading canteens...</p>
                  <p className="text-sm text-gray-400">Fetching available canteens</p>
                </div>
              </div>
            </div>
          ) : canteens.length === 0 ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-6 py-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-red-900">No Canteens Found</p>
                  <p className="text-sm text-red-700 mt-0.5">You don't have access to any canteens. Please contact an administrator.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-orange-50 to-white border-2 border-orange-200 rounded-2xl px-6 py-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <BarChart2 size={20} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-extrabold text-orange-700 uppercase tracking-wider mb-2">📍 Select Canteen</label>
                  <select
                    value={localCanteenId}
                    onChange={(e) => setLocalCanteenId(e.target.value)}
                    className="w-full bg-white border-2 border-orange-300 px-4 py-3 rounded-xl text-base text-gray-900 font-extrabold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer hover:border-orange-400 transition-colors"
                  >
                    <option value="">-- Select a canteen to continue --</option>
                    {canteens.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message when no canteen is selected */}
      {isAdmin && !canteenId && canteens.length > 0 && (
        <div className="mb-8 bg-blue-50 border-2 border-blue-200 rounded-2xl px-6 py-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-blue-900">Start by Selecting a Canteen</p>
              <p className="text-sm text-blue-700 mt-0.5">Choose a canteen from the dropdown above to view orders, billing data, and manage the queue in real-time.</p>
            </div>
          </div>
        </div>
      )}

      {/* Only show tabs and content if canteen is selected or if not admin */}
      {(canteenId || !isAdmin) && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
            <button
              onClick={() => setTab('orders')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'orders' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <LayoutList size={14} /> Orders
        </button>
        <button
          onClick={() => setTab('billing')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'billing' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Wallet size={14} /> Billing
        </button>
        <button
          onClick={() => setTab('queue')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'queue' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <BarChart2 size={14} /> Queue Board
        </button>
      </div>

      {tab === 'queue' ? (
        <QueueBoard canteenIdProp={canteenId} isAdmin={false} />
      ) : tab === 'billing' ? (
        <BillingBoard canteenId={canteenId} />
      ) : (
        <>
          {!canteenId && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Select a canteen to enable order management
            </div>
          )}

          {/* Pickup Code Entry Bar */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 mb-5">
            <form onSubmit={(e) => { e.preventDefault(); handlePickupByCode(); }} className="flex items-center gap-3">
              <QrCode size={18} className="text-indigo-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <input
                  value={codeInput}
                  onChange={e => {
                    setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                    setCodeInputTouched(true);
                  }}
                  placeholder="Enter pickup code (e.g. QK82F1)"
                  maxLength={6}
                  autoComplete="off"
                  className="w-full bg-transparent text-sm font-extrabold text-indigo-700 placeholder-indigo-300 focus:outline-none tracking-widest uppercase"
                />
              </div>
              <span className={`text-[11px] font-extrabold whitespace-nowrap ${
                codeInput.length === 6 ? 'text-indigo-600' : 'text-indigo-300'
              }`}>
                {codeInput.length}/6
              </span>
              <button
                type="button"
                onClick={() => setQrScannerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap"
              >
                <QrCode size={13} /> Scan QR
              </button>
              <button
                type="submit"
                disabled={codeVerifying || !PICKUP_CODE_REGEX.test(codeInput.trim().toUpperCase())}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap"
              >
                {codeVerifying ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={13} />}
                Confirm Delivery
              </button>
            </form>
            {/* Inline validation hints */}
            {codeInputTouched && codeInput.length > 0 && codeInput.length < 6 && (
              <p className="text-[11px] text-indigo-400 mt-1.5 pl-7">Enter all 6 characters of the pickup code</p>
            )}
          </div>

          {/* Status filters */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {[{ value: '', label: 'All' }, ...ORDER_STATUSES.map(s => ({ value: s, label: STATUS_CONFIG[s].label }))].map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === f.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-orange-50 rounded-[24px] flex items-center justify-center mx-auto mb-4 text-orange-400">
                <ShoppingBag size={32} />
              </div>
              <p className="text-gray-400 font-medium">No orders found</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {orders.map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  onVerifyCash={handleOpenVerifyCash}
                  onRejectCash={handleRejectCash}
                  onVerifyPickup={handleOpenPickupVerify}
                  canManagePayments={canManagePayments}
                  userRole={user?.role}
                  onViewDetails={setSelectedOrder}
                />
              ))}
            </div>
          )}
        </>
      )}

      {qrScannerOpen && (
        <QRScannerModal
          onClose={() => setQrScannerOpen(false)}
          onScanSuccess={(code) => handlePickupByCode(code)}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onVerifyCash={handleOpenVerifyCash}
          onRejectCash={handleRejectCash}
          canManagePayments={canManagePayments}
          userRole={user?.role}
        />
      )}

      <CashVerificationModal
        order={verificationOrder}
        form={verificationForm}
        errors={verificationErrors}
        submitting={verificationSubmitting}
        onChange={handleVerificationInputChange}
        onClose={() => setVerificationOrder(null)}
        onSubmit={handleConfirmVerifyCash}
      />

      <PickupVerificationModal
        order={pickupOrder}
        form={pickupForm}
        onChange={(updates) => setPickupForm({ ...pickupForm, ...updates })}
        submitting={pickupSubmitting}
        onClose={() => setPickupOrder(null)}
        onSubmit={handleConfirmPickup}
        onOpenScanner={() => setQrScannerOpen(true)}
      />

      <RejectPaymentModal
        order={rejectOrder}
        reason={rejectReason}
        onChange={setRejectReason}
        submitting={rejectSubmitting}
        onClose={() => setRejectOrder(null)}
        onSubmit={handleConfirmReject}
      />

      <ConfirmCancelAdminModal
        order={adminCancelOrder}
        reason={adminCancelReason}
        onChange={setAdminCancelReason}
        submitting={adminCancelSubmitting}
        onClose={() => setAdminCancelOrder(null)}
        onSubmit={handleConfirmAdminCancel}
      />
        </>
      )}
    </div>
  );
};

export default AdminOrdersPage;
