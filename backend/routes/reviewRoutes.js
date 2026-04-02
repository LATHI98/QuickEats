import express from 'express';
import Review from '../models/Review.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const review = await Review.create(req.body);
  res.json(review);
});

router.get('/', async (req, res) => {
  const reviews = await Review.find().populate('foodId').sort({ createdAt: -1 });
  res.json(reviews);
});

router.get('/food/:foodId', async (req, res) => {
  const reviews = await Review.find({ foodId: req.params.foodId }).sort({ createdAt: -1 });
  res.json(reviews);
});

router.delete('/:id', async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

export default router;
