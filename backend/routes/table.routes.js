import express from 'express';
import {
  createTable,
  getTablesByCanteen,
  updateTable,
  deleteTable,
} from '../controllers/table.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Admin table management
router.post('/', protect, authorize('superAdmin', 'admin'), createTable);
router.put('/:id', protect, authorize('superAdmin', 'admin'), updateTable);
router.delete('/:id', protect, authorize('superAdmin', 'admin'), deleteTable);

// Public read access
router.get('/canteen/:canteenId', getTablesByCanteen);

export default router;
