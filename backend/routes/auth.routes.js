import express from 'express';
import { login, getMe, createUser } from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/create-user', protect, authorize('superAdmin'), createUser);

export default router;
