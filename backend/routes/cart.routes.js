import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { getCart, addItem, updateItem, removeItem, clearCart } from '../controllers/cart.controller.js';

const router = express.Router();

router.use(protect, authorize('student'));

router.get('/', getCart);
router.post('/items', addItem);
router.put('/items/:menuItemId', updateItem);
router.delete('/items/:menuItemId', removeItem);
router.delete('/', clearCart);

export default router;
