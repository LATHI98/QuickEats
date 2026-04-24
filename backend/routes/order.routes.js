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
  pickupByCode,
  getStaleOrders,
  bulkCancelOrders,
  deleteCancelledOrders,
} from '../controllers/order.controller.js';
import {
  createStripeIntent,
  submitCashPayment,
  regenerateCashVerificationCode,
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

// ── Staff + Admin: Order Status Management ───────────────────────────────────
router.get('/canteen', protect, authorize('canteenStaff', 'canteenManager', 'admin', 'superAdmin'), getCanteenOrders);
router.get('/canteen/stale', protect, authorize('canteenStaff', 'canteenManager', 'admin', 'superAdmin'), getStaleOrders);
router.post('/canteen/bulk-cancel', protect, authorize('canteenStaff', 'canteenManager', 'admin', 'superAdmin'), bulkCancelOrders);
router.delete('/canteen/cancelled', protect, authorize('admin', 'superAdmin'), deleteCancelledOrders);
router.patch('/:orderId/status', protect, authorize('canteenStaff', 'canteenManager', 'admin', 'superAdmin'), updateOrderStatus);
router.post('/:orderId/pickup-verify', protect, authorize('canteenStaff', 'canteenManager', 'admin', 'superAdmin'), verifyPickup);
router.post('/pickup-by-code', protect, authorize('canteenStaff', 'canteenManager', 'admin', 'superAdmin'), pickupByCode);

// ── Payment: Stripe ───────────────────────────────────────────────────────────
router.post('/:orderId/payment/stripe/create-intent', protect, authorize('student'), createStripeIntent);

// ── Payment: Cash ─────────────────────────────────────────────────────────────
router.post('/:orderId/payment/cash', protect, authorize('student'), submitCashPayment);
router.post('/:orderId/payment/cash/regenerate', protect, authorize('student'), regenerateCashVerificationCode);
router.patch('/:orderId/payment/verify', protect, authorize('canteenStaff', 'canteenManager'), verifyPayment);
router.patch('/:orderId/payment/reject', protect, authorize('canteenStaff', 'canteenManager'), rejectPayment);

// ── Payment: Shared ───────────────────────────────────────────────────────────
router.get('/:orderId/payment', protect, authorize('student', 'canteenStaff', 'canteenManager', 'admin', 'superAdmin'), getPaymentStatus);

export default router;
