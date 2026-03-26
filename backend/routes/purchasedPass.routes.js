import express from 'express';
import { createPurchase, getMyPasses, getAllPendingPasses, getAllPurchasedPasses, approvePass, rejectPass, deletePass } from '../controllers/purchasedPass.controller.js';

import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createPurchase);
router.get('/my', protect, getMyPasses);
router.get('/pending', protect, getAllPendingPasses);
router.get('/all', protect, getAllPurchasedPasses);
router.put('/approve/:id', protect, approvePass);
router.put('/reject/:id', protect, rejectPass);


router.delete('/:id', protect, deletePass);

export default router;
