import express from 'express';
import { setBudget, getBudget } from '../controllers/budget.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, setBudget);
router.get('/my', protect, getBudget);

export default router;
