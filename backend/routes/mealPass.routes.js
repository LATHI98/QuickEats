import express from 'express';
import { getMealPasses, createMealPass, updateMealPass, deleteMealPass } from '../controllers/mealPass.controller.js';

const router = express.Router();

router.get('/', getMealPasses);
router.post('/', createMealPass);
router.put('/:id', updateMealPass);
router.delete('/:id', deleteMealPass);

export default router;
