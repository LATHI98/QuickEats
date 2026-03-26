import express from 'express';
import { createExpense, getMyExpenses, deleteExpense } from '../controllers/expense.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createExpense);
router.get('/my', protect, getMyExpenses);
router.delete('/:id', protect, deleteExpense);

export default router;
