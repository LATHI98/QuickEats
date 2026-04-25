import express from 'express';
import { setBudget, getBudget, archiveAndResetBudget, getBudgetHistory, deleteBudgetHistory } from '../controllers/budget.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, setBudget);
router.get('/my', protect, getBudget);
router.post('/archive', protect, archiveAndResetBudget);
router.get('/history', protect, getBudgetHistory);
router.delete('/history/:id', protect, deleteBudgetHistory);

export default router;

