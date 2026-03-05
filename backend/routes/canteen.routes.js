import express from 'express';
import { getCanteens, getCanteen, getCanteenMenu } from '../controllers/canteen.controller.js';

const router = express.Router();

router.get('/', getCanteens);
router.get('/:id', getCanteen);
router.get('/:id/menu', getCanteenMenu);

export default router;
