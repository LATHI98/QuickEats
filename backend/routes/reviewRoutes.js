import express from 'express';
import Review from '../models/Review.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const review = await Review.create(req.body);
  res.json(review);
});

router.get('/:foodId', async (req, res) => {
  const reviews = await Review.find({ foodId: req.params.foodId });
  res.json(reviews);
});

export default router;