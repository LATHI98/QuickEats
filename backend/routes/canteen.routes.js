import express from 'express';
import {
  createCanteen,
  getCanteens,
  getCanteenById,
  verifyCanteenPassword,
  getCanteenMenu,
  createCanteenMenuItem,
  updateCanteenMenuItem,
  deleteCanteenMenuItem,
  updateCanteen,
  deleteCanteen,
  updateCanteenSettings,
} from '../controllers/canteen.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public for student dashboard
router.get('/', getCanteens);
router.get('/:id', getCanteenById);
router.post('/:id/verify-password', protect, authorize('canteenStaff', 'canteenManager'), verifyCanteenPassword);
router.get('/:id/menu', getCanteenMenu);
router.post('/:id/menu', protect, authorize('superAdmin', 'admin', 'canteenManager', 'canteenStaff'), createCanteenMenuItem);
router.put('/:id/menu/:menuItemId', protect, authorize('superAdmin', 'admin', 'canteenManager', 'canteenStaff'), updateCanteenMenuItem);
router.delete('/:id/menu/:menuItemId', protect, authorize('superAdmin', 'admin', 'canteenManager', 'canteenStaff'), deleteCanteenMenuItem);

// Admin canteen management
router.post('/', protect, authorize('superAdmin', 'admin'), createCanteen);
router.put('/:id', protect, authorize('superAdmin', 'admin'), updateCanteen);
router.delete('/:id', protect, authorize('superAdmin', 'admin'), deleteCanteen);

// Canteen manager can update operational fields of their assigned canteen
router.patch('/:id/settings', protect, authorize('canteenManager', 'admin', 'superAdmin'), updateCanteenSettings);

export default router;
