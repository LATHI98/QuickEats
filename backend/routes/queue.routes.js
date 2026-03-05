import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { getAvailableSlots, getQueueStatus, getMyQueuePosition, setNowServing } from '../controllers/queue.controller.js';

const router = express.Router();

// Students + Staff can view slots and status
router.get('/:canteenId/slots', protect, authorize('student', 'canteenStaff', 'canteenManager', 'superAdmin'), getAvailableSlots);
router.get('/:canteenId/status', protect, authorize('student', 'canteenStaff', 'canteenManager', 'superAdmin'), getQueueStatus);

// Students: my queue position
router.get('/:canteenId/my-position/:orderId', protect, authorize('student'), getMyQueuePosition);

// Staff: set "now serving" number
router.patch('/:canteenId/serving', protect, authorize('canteenStaff', 'canteenManager'), setNowServing);

export default router;
