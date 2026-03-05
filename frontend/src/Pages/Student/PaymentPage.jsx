import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Banknote, CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import { orderAPI, paymentAPI } from '../../services/api';
import { toast } from 'react-toastify';

// Lazy-load Stripe with the publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
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
        toast.error(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm text-gray-500 mb-2 block">Card Details</label>
        <div className="border border-gray-200 rounded-xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-orange-300 focus-within:border-orange-300 transition-all">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Lock size={12} /> Secured by Stripe
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-['Gilroy_Heavy'] transition-colors text-sm"
      >
        {processing ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
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

// ─── Cash Form ────────────────────────────────────────────────────────────────

const CashForm = ({ orderId, amount, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await paymentAPI.submitCash(orderId);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

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
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-['Gilroy_Heavy'] transition-colors text-sm"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Submitting...
          </span>
        ) : (
          <>
            <Banknote size={16} />
            Submit Cash Payment · LKR {amount?.toLocaleString()}
          </>
        )}
      </button>
    </div>
  );
};

// ─── Success Screen ───────────────────────────────────────────────────────────

const SuccessScreen = ({ method, navigate }) => (
  <div className="text-center py-10">
    <div className="w-20 h-20 bg-green-50 rounded-[30px] flex items-center justify-center mx-auto mb-5 text-green-500">
      <CheckCircle size={40} />
    </div>
    <h2 className="text-2xl font-['Gilroy_Heavy'] text-gray-900 mb-2">
      {method === 'card' ? 'Payment Successful!' : 'Cash Payment Submitted!'}
    </h2>
    <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
      {method === 'card'
        ? 'Your payment was processed. Your order is now being prepared.'
        : 'Head to the counter to pay in cash. Staff will verify and start your order.'}
    </p>
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
  const [success, setSuccess] = useState(null); // 'card' | 'cash'

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await orderAPI.getMyOrderById(orderId);
        const o = res.data.data;
        // If already paid, redirect back
        if (o.payment?.status === 'verified' || o.payment?.status === 'pending_verification') {
          toast.info('Payment already submitted for this order');
          navigate('/dashboard/orders');
          return;
        }
        setOrder(o);
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

  if (success) return (
    <div className="max-w-md mx-auto py-8 px-4">
      <SuccessScreen method={success} navigate={navigate} />
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
      <p className="text-gray-400 text-sm mb-6">Choose how you'd like to pay</p>

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
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'cash' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          <Banknote size={15} /> Cash
        </button>
        <button
          onClick={() => setTab('card')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'card' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          <CreditCard size={15} /> Card
        </button>
      </div>

      {/* Tab content */}
      {tab === 'cash' ? (
        <CashForm
          orderId={orderId}
          amount={order?.totalPrice}
          onSuccess={() => setSuccess('cash')}
        />
      ) : (
        <Elements stripe={stripePromise}>
          <CardForm
            orderId={orderId}
            amount={order?.totalPrice}
            onSuccess={() => setSuccess('card')}
          />
        </Elements>
      )}
    </div>
  );
};

export default PaymentPage;
