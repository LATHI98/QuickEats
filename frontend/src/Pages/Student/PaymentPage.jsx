import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Banknote, CheckCircle, ArrowLeft, Lock, AlertCircle, Info } from 'lucide-react';
import { orderAPI, paymentAPI } from '../../services/api';
import { toast } from 'react-toastify';

// Lazy-load Stripe with the publishable key
const stripePublishableKey = String(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();
const isStripeConfigured = stripePublishableKey.length > 0;
const stripePromise = isStripeConfigured ? loadStripe(stripePublishableKey) : null;

// ─── Card Style ───────────────────────────────────────────────────────────────

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1f2937',
      fontFamily: '"Gilroy Medium", sans-serif',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

// ─── Stripe Card Form ─────────────────────────────────────────────────────────

const CardForm = ({ orderId, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!stripe || !elements) {
      toast.error('Card payment is not ready yet. Please wait a moment.');
      return;
    }
    if (!cardComplete) {
      // inline error shown below CardElement — no need for toast here
      return;
    }
    setProcessing(true);
    try {
      // 1. Create Payment Intent on backend
      const intentRes = await paymentAPI.createStripeIntent(orderId);
      const { clientSecret } = intentRes.data.data;

      // 2. Confirm card payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (error) {
        setCardError(error.message);
        toast.error(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment failed. Try again.';
      setCardError(msg);
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const showIncompleteError = submitAttempted && !cardComplete && !cardError;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label className="text-sm text-gray-500 mb-2 block font-medium">Card Details</label>
        <div
          className={`border rounded-xl px-4 py-3.5 focus-within:ring-2 transition-all ${
            (cardError || showIncompleteError)
              ? 'border-red-300 focus-within:ring-red-200 bg-red-50/30'
              : 'border-gray-200 focus-within:ring-orange-300 focus-within:border-orange-300'
          }`}
        >
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={(event) => {
              setCardComplete(!!event.complete);
              setCardError(event.error?.message || '');
              if (event.complete) setSubmitAttempted(false);
            }}
          />
        </div>

        {/* Inline error messages */}
        {cardError && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <AlertCircle size={11} /> {cardError}
          </p>
        )}
        {showIncompleteError && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <AlertCircle size={11} /> Please complete all card details before paying.
          </p>
        )}
      </div>

      {/* Card validity indicator */}
      {cardComplete && !cardError && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
          <CheckCircle size={13} /> Card details look good
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Lock size={12} /> Secured by Stripe — your card details are never stored on our servers
      </div>

      <button
        type="submit"
        disabled={!stripe || processing || !!cardError}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-['Gilroy_Heavy'] transition-colors text-sm"
      >
        {processing ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing Payment...
          </span>
        ) : (
          <>
            <CreditCard size={16} />
            Pay LKR {amount?.toLocaleString()}
          </>
        )}
      </button>
    </form>
  );
};

// ─── Cash Form (2-step confirmation) ─────────────────────────────────────────

const CashForm = ({ orderId, amount, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('review'); // 'review' | 'confirm'

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await paymentAPI.submitCash(orderId);
      onSuccess(res);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
      setStep('review');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'confirm') {
    return (
      <div className="space-y-5">
        {/* Confirmation box */}
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Banknote size={24} className="text-orange-600" />
          </div>
          <p className="text-base font-['Gilroy_Heavy'] text-gray-900 mb-1">Confirm Cash Payment?</p>
          <p className="text-2xl font-['Gilroy_Heavy'] text-orange-600 mb-2">LKR {amount?.toLocaleString()}</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            By confirming, you agree to bring <strong>LKR {amount?.toLocaleString()}</strong> to the canteen counter.
            Staff will verify your payment before preparing your order.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setStep('review')}
            disabled={submitting}
            className="py-3 rounded-xl border border-gray-200 text-gray-600 font-['Gilroy_Heavy'] text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-['Gilroy_Heavy'] text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              'Yes, Submit'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 leading-relaxed">
        <p className="font-['Gilroy_Heavy'] mb-1">How cash payment works</p>
        <ol className="list-decimal list-inside space-y-1 text-amber-600">
          <li>Tap the button below to submit your cash payment intent</li>
          <li>Go to the canteen counter and pay <strong>LKR {amount?.toLocaleString()}</strong> in cash</li>
          <li>The canteen staff will verify and confirm your payment</li>
          <li>Your order will move to <strong>Preparing</strong> once verified</li>
        </ol>
      </div>

      {/* Amount display */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">Amount to Bring</span>
        <span className="text-lg font-['Gilroy_Heavy'] text-gray-900">LKR {amount?.toLocaleString()}</span>
      </div>

      <button
        onClick={() => setStep('confirm')}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-['Gilroy_Heavy'] transition-colors text-sm"
      >
        <Banknote size={16} />
        Submit Cash Payment · LKR {amount?.toLocaleString()}
      </button>
    </div>
  );
};

// ─── Success Screen ───────────────────────────────────────────────────────────

const SuccessScreen = ({ method, navigate, verificationCode, checkingStatus, onCheckStatus, instantPickup }) => (
  <div className="text-center py-10">
    <div className="w-20 h-20 bg-green-50 rounded-[30px] flex items-center justify-center mx-auto mb-5 text-green-500">
      <CheckCircle size={40} />
    </div>
    <h2 className="text-2xl font-['Gilroy_Heavy'] text-gray-900 mb-2">
      {method === 'card'
        ? 'Payment Confirmed!'
        : method === 'card_pending'
          ? 'Payment Received — Confirming'
          : 'Cash Payment Submitted!'}
    </h2>
    <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
      {method === 'card'
        ? (instantPickup
          ? 'Your payment is verified. Your order is in instant pickup mode — proceed to the counter now.'
          : 'Your payment is verified and your order is now being prepared.')
        : method === 'card_pending'
          ? 'Your bank confirmed payment, but the app is still waiting for server confirmation. This usually takes a few seconds.'
          : (instantPickup
            ? 'Head to the counter now, show your verification code, and complete instant pickup once staff confirms payment.'
            : 'Head to the counter to pay in cash. Show the code below to staff so they can verify and start your order.')}
    </p>

    {method === 'cash' && verificationCode && (
      <div className="mb-6 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 text-center">
        <p className="text-[10px] uppercase tracking-widest text-orange-500 font-['Gilroy_Heavy'] mb-1">Cash Verification Code</p>
        <p className="text-4xl tracking-[0.18em] text-orange-700 font-['Gilroy_Heavy'] mt-1">{verificationCode}</p>
        <p className="text-xs text-orange-600 mt-3 leading-relaxed">
          Show this 6-digit code to canteen staff to verify your cash payment. Do not share it with others.
        </p>
      </div>
    )}

    {(method === 'cash' || method === 'card_pending') && (
      <button
        onClick={onCheckStatus}
        disabled={checkingStatus}
        className="mb-3 px-6 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-['Gilroy_Heavy'] text-gray-700 disabled:opacity-50"
      >
        {checkingStatus ? 'Checking...' : 'Check Verification Status'}
      </button>
    )}

    <br />
    <button
      onClick={() => navigate(instantPickup ? '/dashboard/order-tracking' : '/dashboard/orders')}
      className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-['Gilroy_Heavy'] transition-colors text-sm"
    >
      {instantPickup ? 'Track Instant Pickup' : 'View My Orders'}
    </button>
  </div>
);

// ─── Already Paid Screen ──────────────────────────────────────────────────────

const AlreadyPaidScreen = ({ order, navigate }) => (
  <div className="text-center py-10">
    <div className="w-20 h-20 bg-green-50 rounded-[30px] flex items-center justify-center mx-auto mb-5 text-green-500">
      <CheckCircle size={40} />
    </div>
    <h2 className="text-2xl font-['Gilroy_Heavy'] text-gray-900 mb-2">Already Paid</h2>
    <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
      Payment for order <strong>#{order?.queueNumber}</strong> has already been verified.
      Your order status is <span className="font-['Gilroy_Heavy'] text-gray-700 capitalize">{order?.status}</span>.
    </p>
    <div className="rounded-2xl bg-green-50 border border-green-100 px-4 py-3 mb-8 text-left">
      <p className="text-xs text-green-600 font-['Gilroy_Heavy'] uppercase tracking-widest mb-2">Payment Summary</p>
      {order?.items?.map((item, i) => (
        <div key={i} className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{item.name} × {item.quantity}</span>
          <span className="text-gray-700">LKR {(item.unitPrice * item.quantity).toLocaleString()}</span>
        </div>
      ))}
      <div className="flex justify-between text-sm font-['Gilroy_Heavy'] mt-2 pt-2 border-t border-green-100">
        <span>Total Paid</span>
        <span className="text-green-700">LKR {order?.totalPrice?.toLocaleString()}</span>
      </div>
    </div>
    <button
      onClick={() => navigate('/dashboard/orders')}
      className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-['Gilroy_Heavy'] transition-colors text-sm"
    >
      View My Orders
    </button>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('cash'); // 'cash' | 'card'
  const [success, setSuccess] = useState(null); // 'card' | 'card_pending' | 'cash'
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [cashVerificationCode, setCashVerificationCode] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const paymentStatus = order?.payment?.status || 'unpaid';
  const isPayableState = ['unpaid', 'rejected'].includes(paymentStatus);

  const waitForPaymentVerification = async () => {
    for (let i = 0; i < 8; i++) {
      const statusRes = await paymentAPI.getPaymentStatus(orderId);
      const p = statusRes.data?.data;
      if (p?.status === 'verified') return true;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return false;
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await orderAPI.getMyOrderById(orderId);
        const o = res.data.data;
        setOrder(o);
        const ps = o.payment?.status || 'unpaid';

        if (ps === 'verified') {
          setAlreadyPaid(true);
          return;
        }
        if (ps === 'pending_verification') {
          setCashVerificationCode(o.payment?.cashVerificationCode || '');
          setSuccess(o.payment?.method === 'stripe' ? 'card_pending' : 'cash');
          return;
        }
        if (!['unpaid', 'rejected'].includes(ps)) {
          setStatusMessage('This order is not available for payment at the moment.');
        }
        if (o.payment?.status === 'rejected') {
          setStatusMessage('Your previous payment was rejected. Please resubmit your payment.');
        }
      } catch {
        toast.error('Order not found');
        navigate('/dashboard/orders');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [orderId, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const checkVerificationStatus = async () => {
    setCheckingStatus(true);
    try {
      const statusRes = await paymentAPI.getPaymentStatus(orderId);
      const payment = statusRes.data?.data;
      if (payment?.status === 'verified') {
        toast.success('Payment verified by canteen staff.');
        setSuccess('card');
      } else if (payment?.status === 'rejected') {
        toast.error('Payment was rejected. Please resubmit payment.');
        setSuccess(null);
        setAlreadyPaid(false);
      } else {
        setCashVerificationCode(payment?.cashVerificationCode || cashVerificationCode);
        toast.info('Payment is still pending verification by staff.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check payment status');
    } finally {
      setCheckingStatus(false);
    }
  };

  if (alreadyPaid) return (
    <div className="max-w-md mx-auto py-8 px-4">
      <AlreadyPaidScreen order={order} navigate={navigate} />
    </div>
  );

  if (success) return (
    <div className="max-w-md mx-auto py-8 px-4">
      <SuccessScreen
        method={success}
        navigate={navigate}
        verificationCode={cashVerificationCode}
        checkingStatus={checkingStatus}
        onCheckStatus={checkVerificationStatus}
        instantPickup={!!order?.instantPickupRequested}
      />
    </div>
  );

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-3xl font-['Gilroy_Heavy'] text-gray-900 mb-1">Payment</h1>
      <p className="text-gray-400 text-sm mb-6">Choose how you'd like to pay for order #{order?.queueNumber}</p>

      {/* Status/rejection message */}
      {statusMessage && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
          <Info size={15} className="shrink-0 mt-0.5" />
          {statusMessage}
        </div>
      )}

      {!isStripeConfigured && (
        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 flex items-start gap-2">
          <Info size={13} className="shrink-0 mt-0.5" />
          Card payments are temporarily unavailable. Use cash payment while Stripe is being configured.
        </div>
      )}

      {/* Order summary card */}
      <div className="bg-orange-50 rounded-2xl p-4 mb-6">
        <p className="text-xs text-gray-500 mb-2 font-medium">Order Summary</p>
        {order?.items?.map((item, i) => (
          <div key={i} className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{item.name} × {item.quantity}</span>
            <span className="text-gray-700">LKR {(item.unitPrice * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-['Gilroy_Heavy'] mt-2 pt-2 border-t border-orange-100">
          <span>Total</span>
          <span className="text-orange-600">LKR {order?.totalPrice?.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment method tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setTab('cash')}
          disabled={!isPayableState}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'cash' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          <Banknote size={15} /> Cash
        </button>
        <button
          onClick={() => setTab('card')}
          disabled={!isStripeConfigured || !isPayableState}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'card' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <CreditCard size={15} /> Card
          {!isStripeConfigured && <span className="text-[9px] text-gray-400 ml-0.5">(Unavailable)</span>}
        </button>
      </div>

      {/* Tab content */}
      {!isPayableState ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Payment cannot be submitted while order payment status is <span className="font-['Gilroy_Heavy']">{paymentStatus}</span>.
        </div>
      ) : tab === 'cash' ? (
        <CashForm
          orderId={orderId}
          amount={order?.totalPrice}
          onSuccess={(response) => {
            const code = response?.data?.data?.payment?.cashVerificationCode || '';
            setCashVerificationCode(code);
            setSuccess('cash');
          }}
        />
      ) : (
        isStripeConfigured && stripePromise ? (
          <Elements stripe={stripePromise}>
            <CardForm
              orderId={orderId}
              amount={order?.totalPrice}
              onSuccess={async () => {
                try {
                  const verified = await waitForPaymentVerification();
                  setSuccess(verified ? 'card' : 'card_pending');
                  if (!verified) toast.info('Payment is submitted. Waiting for final confirmation from server.');
                } catch {
                  setSuccess('card_pending');
                  toast.info('Payment is submitted. Waiting for final confirmation from server.');
                }
              }}
            />
          </Elements>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Card payment is unavailable. Please use cash payment for this order.
          </div>
        )
      )}
    </div>
  );
};

export default PaymentPage;
