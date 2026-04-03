import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { getAvailableSlots, getQueueStatus, getMyQueuePosition, setNowServing, callNext, claimPriority, getRecommendedSlots } from '../controllers/queue.controller.js';

const router = express.Router();

// Students + Staff can view slots and status
router.get('/:canteenId/slots', protect, authorize('student', 'canteenStaff', 'canteenManager', 'admin', 'superAdmin'), getAvailableSlots);
router.get('/:canteenId/status', protect, authorize('student', 'canteenStaff', 'canteenManager', 'admin', 'superAdmin'), getQueueStatus);

// Students: my queue position and claim priority
router.get('/:canteenId/my-position/:orderId', protect, authorize('student'), getMyQueuePosition);
router.patch('/claim-priority/:orderId', protect, authorize('student'), claimPriority);

// Recommended slots for student
router.get('/:canteenId/recommended-slots', protect, authorize('student'), getRecommendedSlots);

// Staff: set "now serving" number manually
router.patch('/:canteenId/serving', protect, authorize('canteenStaff', 'canteenManager', 'admin', 'superAdmin'), setNowServing);

// Staff: auto-call the next pending order
router.patch('/:canteenId/call-next', protect, authorize('canteenStaff', 'canteenManager', 'admin', 'superAdmin'), callNext);

export default router;
