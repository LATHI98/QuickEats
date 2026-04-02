import express from 'express';
import {
  createCanteen,
  getCanteens,
  getCanteenById,
  updateCanteen,
  deleteCanteen,
} from '../controllers/canteen.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public for student dashboard
router.get('/', getCanteens);
router.get('/:id', getCanteenById);

// Admin canteen management
router.post('/', protect, authorize('superAdmin', 'admin'), createCanteen);
router.put('/:id', protect, authorize('superAdmin', 'admin'), updateCanteen);
router.delete('/:id', protect, authorize('superAdmin', 'admin'), deleteCanteen);

export default router;
