import Stripe from 'stripe';
import QRCode from 'qrcode';
import Order from '../models/Order.model.js';

const isAdminRole = (role) => ['admin', 'superAdmin'].includes(role);
const isElevatedOpsRole = (role) => ['admin', 'superAdmin', 'canteenManager', 'canteenStaff'].includes(role);

const appendActivity = (order, { action, actor = null, actorRole = null, note = '', metadata = null }) => {
  order.activityLogs.push({
    action,
    actor,
    actorRole,
    note,
    metadata,
    createdAt: new Date(),
  });
};

// Lazy Stripe client — initialized on first use so dotenv has time to load
let _stripe;
const getStripe = () => {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
};

const generatePickupCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const ensurePickupPass = async (order) => {
  if (order.pickupCode && order.qrCodeData) return;

  let pickupCode = order.pickupCode;
  if (!pickupCode) {
    let attempts = 0;
    do {
      pickupCode = generatePickupCode();
      attempts++;
      if (attempts > 10) throw new Error('Could not generate unique pickup code after 10 attempts');
    } while (await Order.exists({ pickupCode }));
  }

  const qrPayload = JSON.stringify({ orderId: order._id.toString(), pickupCode });
  const qrCodeData = await QRCode.toDataURL(qrPayload, {
    width: 220,
    margin: 1,
    color: { dark: '#4338ca', light: '#eef2ff' },
  });

  order.pickupCode = pickupCode;
  order.qrCodeData = qrCodeData;
};

const generateCashVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));
const CASH_CODE_REFRESH_MS = 30 * 1000;

const getCashCodeRefreshRemainingMs = (order) => {
  const issuedAt = order?.payment?.cashVerificationCodeIssuedAt ? new Date(order.payment.cashVerificationCodeIssuedAt).getTime() : 0;
  if (!issuedAt) return 0;
  return Math.max(0, CASH_CODE_REFRESH_MS - (Date.now() - issuedAt));
};

const issueCashVerificationCode = (order) => {
  const previous = String(order.payment.cashVerificationCode || '').trim();
  let nextCode = generateCashVerificationCode();
  let attempts = 0;
  while (nextCode === previous && attempts < 5) {
    nextCode = generateCashVerificationCode();
    attempts += 1;
  }

  order.payment.cashVerificationCode = nextCode;
  order.payment.cashVerificationCodeIssuedAt = new Date();
  return nextCode;
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
    appendActivity(order, {
      action: 'payment_submitted',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Stripe payment initiated by student',
      metadata: { method: 'stripe', paymentIntentId: paymentIntent.id },
    });
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
      await ensurePickupPass(order);
      if (order.status === 'pending') {
        if (order.instantPickupRequested) {
          order.status = 'ready';
          order.estimatedPickupTime = new Date();
        } else {
          order.status = 'preparing';
        }
      }
      appendActivity(order, {
        action: 'payment_verified',
        actor: null,
        actorRole: 'system',
        note: order.instantPickupRequested
          ? 'Stripe webhook confirmed payment; order marked ready for instant pickup'
          : 'Stripe webhook confirmed payment',
        metadata: { method: 'stripe', paymentIntentId: intent.id, instantPickup: !!order.instantPickupRequested },
      });
      await order.save();
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const order = await Order.findOne({ 'payment.stripePaymentIntentId': intent.id });
    if (order) {
      order.payment.status = 'unpaid';
      appendActivity(order, {
        action: 'payment_failed',
        actor: null,
        actorRole: 'system',
        note: 'Stripe payment failed',
        metadata: { method: 'stripe', paymentIntentId: intent.id },
      });
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
    issueCashVerificationCode(order);
    order.payment.rejectionReason = null;
    appendActivity(order, {
      action: 'payment_submitted',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Cash payment submitted by student for verification',
      metadata: { method: 'cash', verificationCodeIssued: true },
    });
    await order.save();

    res.json({ success: true, message: 'Cash payment submitted. Awaiting staff verification.', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/orders/:orderId/payment/cash/regenerate
export const regenerateCashVerificationCode = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, student: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.payment.method !== 'cash') {
      return res.status(400).json({ success: false, message: 'Cash verification code is only available for cash payments' });
    }
    if (order.payment.status !== 'pending_verification') {
      return res.status(400).json({ success: false, message: 'Payment is not pending verification' });
    }

    const remainingMs = getCashCodeRefreshRemainingMs(order);
    if (remainingMs > 0) {
      return res.status(429).json({
        success: false,
        code: 'CASH_CODE_REFRESH_TOO_EARLY',
        message: `Please wait ${Math.ceil(remainingMs / 1000)} seconds before requesting a new code`,
        data: {
          remainingSeconds: Math.ceil(remainingMs / 1000),
          cashVerificationCode: order.payment.cashVerificationCode,
        },
      });
    }

    issueCashVerificationCode(order);
    appendActivity(order, {
      action: 'cash_verification_code_regenerated',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Student requested a new cash verification code',
      metadata: { refreshWindowSeconds: 30 },
    });
    await order.save();

    return res.json({
      success: true,
      message: 'New verification code generated',
      data: {
        payment: order.payment,
        refreshAvailableInSeconds: 30,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/:orderId/payment
export const getPaymentStatus = async (req, res) => {
  try {
    const filter = { _id: req.params.orderId };

    // Students can only view their own
    if (req.user.role === 'student') filter.student = req.user._id;

    const order = await Order.findOne(filter).select('payment totalPrice status canteen');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isElevated = isElevatedOpsRole(req.user.role);
    if (!isElevated && req.user.role !== 'student' && order.canteen.toString() !== req.user.canteen?.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this canteen' });
    }

    res.json({ success: true, data: order.payment, totalPrice: order.totalPrice, orderStatus: order.status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/:orderId/payment/verify  (cash — staff)
export const verifyPayment = async (req, res) => {
  try {
    const { amountReceived, verificationCode } = req.body || {};
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!isElevatedOpsRole(req.user.role) && order.canteen.toString() !== req.user.canteen?.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this canteen' });
    }
    if (order.payment.status !== 'pending_verification') {
      return res.status(400).json({ success: false, message: 'Payment is not pending verification' });
    }
    if (order.payment.method !== 'cash') {
      return res.status(400).json({
        success: false,
        message: 'Only cash payments can be manually verified by staff',
      });
    }
    if (['cancelled', 'completed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot verify payment for an order in '${order.status}' state`,
      });
    }

    const parsedAmountReceived = Number(amountReceived);
    if (!Number.isFinite(parsedAmountReceived) || parsedAmountReceived <= 0) {
      return res.status(400).json({
        success: false,
        message: 'amountReceived is required and must be a positive number',
      });
    }
    if (parsedAmountReceived < order.totalPrice) {
      return res.status(400).json({
        success: false,
        message: `Received cash is insufficient. Minimum required is LKR ${order.totalPrice}`,
      });
    }

    const normalizedVerificationCode = String(verificationCode || '').trim();
    if (!normalizedVerificationCode) {
      return res.status(400).json({
        success: false,
        message: 'verificationCode is required for cash verification',
      });
    }
    if (normalizedVerificationCode !== String(order.payment.cashVerificationCode || '').trim()) {
      return res.status(400).json({
        success: false,
        code: 'PAYMENT_VERIFICATION_CODE_MISMATCH',
        message: 'Payment verification code does not match',
        data: {
          cashVerificationCodeIssuedAt: order.payment.cashVerificationCodeIssuedAt || null,
          remainingRefreshSeconds: Math.ceil(getCashCodeRefreshRemainingMs(order) / 1000),
        },
      });
    }

    const changeAmount = Math.round((parsedAmountReceived - order.totalPrice) * 100) / 100;

    order.payment.status = 'verified';
    order.payment.verifiedBy = req.user._id;
    order.payment.verifiedAt = new Date();
    await ensurePickupPass(order);
    order.payment.cashReceivedAmount = parsedAmountReceived;
    order.payment.cashChangeAmount = changeAmount;
    order.payment.verificationCodeUsed = normalizedVerificationCode;
    order.payment.cashVerificationCode = null;
    order.payment.cashVerificationCodeIssuedAt = null;
    if (order.status === 'pending') {
      if (order.instantPickupRequested) {
        order.status = 'ready';
        order.estimatedPickupTime = new Date();
      } else {
        order.status = 'preparing';
      }
    }
    appendActivity(order, {
      action: 'payment_verified',
      actor: req.user._id,
      actorRole: req.user.role,
      note: order.instantPickupRequested
        ? 'Cash payment verified by canteen staff; order marked ready for instant pickup'
        : 'Cash payment verified by canteen staff',
      metadata: {
        method: order.payment.method || 'cash',
        amountReceived: parsedAmountReceived,
        changeAmount,
        paymentVerificationCodeMatched: true,
        instantPickup: !!order.instantPickupRequested,
      },
    });
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

    if (!isElevatedOpsRole(req.user.role) && order.canteen.toString() !== req.user.canteen?.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this canteen' });
    }
    if (order.payment.status !== 'pending_verification') {
      return res.status(400).json({ success: false, message: 'Payment is not pending verification' });
    }
    if (order.payment.method !== 'cash') {
      return res.status(400).json({
        success: false,
        message: 'Only cash payments can be manually rejected by staff',
      });
    }

    order.payment.status = 'rejected';
    order.payment.rejectionReason = reason || 'No reason provided';
    order.payment.cashVerificationCode = null;
    order.payment.cashVerificationCodeIssuedAt = null;
    appendActivity(order, {
      action: 'payment_rejected',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Payment rejected by canteen staff',
      metadata: { reason: order.payment.rejectionReason, method: order.payment.method || 'cash' },
    });
    await order.save();

    res.json({ success: true, message: 'Payment rejected', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
