import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { getSystemConfig, updateSystemConfig } from '../controllers/system.controller.js';

const router = express.Router();

router.get('/config', protect, authorize('admin', 'superAdmin'), getSystemConfig);
router.patch('/config', protect, authorize('admin', 'superAdmin'), updateSystemConfig);

export default router;
