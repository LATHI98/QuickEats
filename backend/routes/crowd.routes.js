import express from 'express';
import { createCrowdCount, getLatestCrowdCount } from '../controllers/crowd.controller.js';

const router = express.Router();

router.post('/', createCrowdCount);
router.get('/', getLatestCrowdCount);

export default router;
