import express from 'express';
import {
  createReservation,
  getMyReservations,
  getAllReservations,
  getReservationsByCanteen,
  cancelReservation,
  getOccupiedSeats,
} from '../controllers/reservation.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Student reservations
router.post('/', protect, authorize('student'), createReservation);
router.get('/my-reservations', protect, authorize('student'), getMyReservations);
router.put('/:id/cancel', protect, authorize('student'), cancelReservation);

// Public info
router.get('/occupied-seats', getOccupiedSeats);

// Admin/staff access
router.get('/admin/all', protect, authorize('superAdmin', 'admin', 'canteenManager', 'canteenStaff'), getAllReservations);
router.get('/admin/canteen/:canteenId', protect, authorize('superAdmin', 'admin', 'canteenManager', 'canteenStaff'), getReservationsByCanteen);
router.delete('/:id', protect, authorize('superAdmin', 'admin', 'canteenManager', 'canteenStaff'), cancelReservation);

export default router;
