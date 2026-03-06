import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
    getActiveSession,
    createSession,
    joinSession,
    getSession,
    lockSession,
} from '../controllers/groupSession.controller.js';

const router = express.Router();

// All group session routes require student auth
router.use(protect);
router.use(authorize('student'));

router.get('/my/active', getActiveSession);
router.post('/', createSession);
router.post('/join', joinSession);
router.get('/:id', getSession);
router.patch('/:id/lock', lockSession);

export default router;
