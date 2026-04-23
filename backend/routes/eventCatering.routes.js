import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  createEventCateringRequest,
  getMyEventCateringRequests,
  getMyEventCateringRequestById,
  confirmCateringQuote,
  getCanteenEventCateringRequests,
  updateCateringQuote,
  updateEventCateringStatus,
  updateEventCateringPayment,
  createEventCateringPaymentPortal,
  confirmEventCateringPaymentPortal,
  createEventCateringStripeIntent,
  confirmEventCateringStripePayment,
  uploadEventCateringPaymentReceipt,
  verifyEventCateringPaymentSubmission,
  createCateringPackage,
  getCateringPackages,
  updateCateringPackage,
} from '../controllers/eventCatering.controller.js';

const router = express.Router();

const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => {
    const dotIndex = file.originalname.lastIndexOf('.');
    const ext = dotIndex >= 0 ? file.originalname.slice(dotIndex) : '';
    cb(null, `catering-receipt-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const receiptUpload = multer({
  storage: receiptStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'image/webp'];
    if (!allowedMime.includes(file.mimetype)) {
      return cb(new Error('Only PNG, JPG, WEBP, and PDF files are allowed'));
    }
    cb(null, true);
  },
});

// Student request + tracking
router.post('/requests', protect, authorize('student', 'universityStaff'), createEventCateringRequest);
router.get('/requests/my', protect, authorize('student', 'universityStaff'), getMyEventCateringRequests);
router.get('/requests/my/:requestId', protect, authorize('student', 'universityStaff'), getMyEventCateringRequestById);
router.post('/requests/:requestId/confirm-quote', protect, authorize('student', 'universityStaff'), confirmCateringQuote);
router.post('/requests/:requestId/payment/portal', protect, authorize('student', 'universityStaff'), createEventCateringPaymentPortal);
router.post('/requests/:requestId/payment/portal/confirm', protect, authorize('student', 'universityStaff'), confirmEventCateringPaymentPortal);
router.post('/requests/:requestId/payment/stripe/create-intent', protect, authorize('student', 'universityStaff'), createEventCateringStripeIntent);
router.post('/requests/:requestId/payment/stripe/confirm', protect, authorize('student', 'universityStaff'), confirmEventCateringStripePayment);
router.post('/requests/:requestId/payment/receipt', protect, authorize('student', 'universityStaff'), receiptUpload.single('receipt'), uploadEventCateringPaymentReceipt);

// Staff/Admin workflow queue
router.get('/requests/canteen', protect, authorize('canteenStaff', 'canteenManager', 'admin', 'superAdmin'), getCanteenEventCateringRequests);
router.patch('/requests/:requestId/quote', protect, authorize('canteenStaff'), updateCateringQuote);
router.patch('/requests/:requestId/status', protect, authorize('canteenStaff'), updateEventCateringStatus);
router.patch('/requests/:requestId/payment', protect, authorize('canteenStaff'), updateEventCateringPayment);
router.patch('/requests/:requestId/payment/verify', protect, authorize('canteenStaff'), verifyEventCateringPaymentSubmission);

// Package management
router.get('/packages', protect, authorize('student', 'universityStaff', 'canteenStaff', 'canteenManager', 'admin', 'superAdmin'), getCateringPackages);
router.post('/packages', protect, authorize('canteenStaff', 'canteenManager', 'admin', 'superAdmin'), createCateringPackage);
router.patch('/packages/:packageId', protect, authorize('canteenStaff', 'canteenManager', 'admin', 'superAdmin'), updateCateringPackage);

export default router;
