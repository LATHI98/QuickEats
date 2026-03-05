import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  placeOrder,
  cancelOrder,
  getMyOrders,
  getMyOrderById,
  getCanteenOrders,
  updateOrderStatus,
  verifyPickup,
} from '../controllers/order.controller.js';
import {
  createStripeIntent,
  submitCashPayment,
  getPaymentStatus,
  verifyPayment,
  rejectPayment,
} from '../controllers/payment.controller.js';

const router = express.Router();

// ── Student: Order Placement ──────────────────────────────────────────────────
router.post('/', protect, authorize('student'), placeOrder);
router.patch('/:orderId/cancel', protect, authorize('student'), cancelOrder);

// ── Student: Order Status Tracking ───────────────────────────────────────────
router.get('/my', protect, authorize('student'), getMyOrders);
router.get('/my/:orderId', protect, authorize('student'), getMyOrderById);

// ── Staff: Order Status Management ───────────────────────────────────────────
router.get('/canteen', protect, authorize('canteenStaff', 'canteenManager', 'superAdmin'), getCanteenOrders);
router.patch('/:orderId/status', protect, authorize('canteenStaff', 'canteenManager'), updateOrderStatus);
router.post('/:orderId/pickup-verify', protect, authorize('canteenStaff', 'canteenManager'), verifyPickup);

// ── Payment: Stripe ───────────────────────────────────────────────────────────
router.post('/:orderId/payment/stripe/create-intent', protect, authorize('student'), createStripeIntent);

// ── Payment: Cash ─────────────────────────────────────────────────────────────
router.post('/:orderId/payment/cash', protect, authorize('student'), submitCashPayment);
router.patch('/:orderId/payment/verify', protect, authorize('canteenStaff', 'canteenManager'), verifyPayment);
router.patch('/:orderId/payment/reject', protect, authorize('canteenStaff', 'canteenManager'), rejectPayment);

// ── Payment: Shared ───────────────────────────────────────────────────────────
router.get('/:orderId/payment', protect, authorize('student', 'canteenStaff', 'canteenManager'), getPaymentStatus);

export default router;
