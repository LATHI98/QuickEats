import express from 'express';
import {
  createTable,
  getTablesByCanteen,
  updateTable,
  deleteTable,
} from '../controllers/table.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Table management
router.post('/', protect, authorize('superAdmin', 'admin', 'canteenManager', 'canteenStaff'), createTable);
router.put('/:id', protect, authorize('superAdmin', 'admin', 'canteenManager', 'canteenStaff'), updateTable);
router.delete('/:id', protect, authorize('superAdmin', 'admin', 'canteenManager', 'canteenStaff'), deleteTable);

// Public read access
router.get('/canteen/:canteenId', getTablesByCanteen);

export default router;
