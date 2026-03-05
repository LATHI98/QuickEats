import Stripe from 'stripe';
import Order from '../models/Order.model.js';

// Lazy Stripe client — initialized on first use so dotenv has time to load
let _stripe;
const getStripe = () => {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
};

// POST /api/orders/:orderId/payment/stripe/create-intent
export const createStripeIntent = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, student: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot pay for a cancelled order' });
    }
    if (order.payment.status === 'verified') {
      return res.status(400).json({ success: false, message: 'Order already paid' });
    }

    // Create or reuse existing PaymentIntent
    let paymentIntent;
    if (order.payment.stripePaymentIntentId) {
      paymentIntent = await getStripe().paymentIntents.retrieve(order.payment.stripePaymentIntentId);
    } else {
      paymentIntent = await getStripe().paymentIntents.create({
        amount: Math.round(order.totalPrice * 100), // Stripe uses cents/smallest unit
        currency: process.env.STRIPE_CURRENCY || 'lkr',
        metadata: {
          orderId: order._id.toString(),
          studentId: req.user._id.toString(),
        },
      });
    }

    order.payment.method = 'stripe';
    order.payment.status = 'pending_verification';
    order.payment.stripePaymentIntentId = paymentIntent.id;
    order.payment.stripeClientSecret = paymentIntent.client_secret;
    await order.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/stripe/webhook  (called by Stripe — raw body required)
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const order = await Order.findOne({ 'payment.stripePaymentIntentId': intent.id });
    if (order) {
      order.payment.status = 'verified';
      order.payment.verifiedAt = new Date();
      if (order.status === 'pending') order.status = 'preparing';
      await order.save();
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const order = await Order.findOne({ 'payment.stripePaymentIntentId': intent.id });
    if (order) {
      order.payment.status = 'unpaid';
      await order.save();
    }
  }

  res.json({ received: true });
};

// POST /api/orders/:orderId/payment/cash
export const submitCashPayment = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, student: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot pay for a cancelled order' });
    }
    if (order.payment.status === 'verified') {
      return res.status(400).json({ success: false, message: 'Order already paid' });
    }

    order.payment.method = 'cash';
    order.payment.status = 'pending_verification';
    await order.save();

    res.json({ success: true, message: 'Cash payment submitted. Awaiting staff verification.', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/:orderId/payment
export const getPaymentStatus = async (req, res) => {
  try {
    const filter = { _id: req.params.orderId };

    // Students can only view their own
    if (req.user.role === 'student') filter.student = req.user._id;

    const order = await Order.findOne(filter).select('payment totalPrice status');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, data: order.payment, totalPrice: order.totalPrice, orderStatus: order.status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/:orderId/payment/verify  (cash — staff)
export const verifyPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.canteen.toString() !== req.user.canteen?.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this canteen' });
    }
    if (order.payment.status !== 'pending_verification') {
      return res.status(400).json({ success: false, message: 'Payment is not pending verification' });
    }

    order.payment.status = 'verified';
    order.payment.verifiedBy = req.user._id;
    order.payment.verifiedAt = new Date();
    if (order.status === 'pending') order.status = 'preparing';
    await order.save();

    res.json({ success: true, message: 'Payment verified', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/:orderId/payment/reject  { reason }  (cash — staff)
export const rejectPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.canteen.toString() !== req.user.canteen?.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this canteen' });
    }
    if (order.payment.status !== 'pending_verification') {
      return res.status(400).json({ success: false, message: 'Payment is not pending verification' });
    }

    order.payment.status = 'rejected';
    order.payment.rejectionReason = reason || 'No reason provided';
    await order.save();

    res.json({ success: true, message: 'Payment rejected', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
