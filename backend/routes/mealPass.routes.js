import express from 'express';
import { getMealPasses, createMealPass, updateMealPass, deleteMealPass } from '../controllers/mealPass.controller.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const upload = multer({ storage });

router.get('/', getMealPasses);
router.post('/', upload.single('image'), createMealPass);
router.put('/:id', upload.single('image'), updateMealPass);
router.delete('/:id', deleteMealPass);


export default router;
