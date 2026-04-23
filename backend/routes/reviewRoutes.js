import express from 'express';
import Review from '../models/Review.js';
import Canteen from '../models/Canteen.model.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { rating, comment, canteenId } = req.body;
    if (!rating && !comment?.trim()) {
      return res.status(400).json({ message: 'Must provide either a rating or a comment' });
    }

    const review = await Review.create(req.body);
    
    // Automatically update Canteen rating if it's a canteen review AND rating is provided
    if (canteenId && rating) {
      const allReviews = await Review.find({ canteenId, rating: { $ne: null } });
      if (allReviews.length > 0) {
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await Canteen.findByIdAndUpdate(canteenId, { ratings: Number(avg.toFixed(1)) });
      }
    }
    
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ 
      message: 'Failed to create review', 
      error: error.message 
    });
  }
});

router.get('/', async (req, res) => {
  const reviews = await Review.find().populate('foodId canteenId userId', 'name name name').sort({ createdAt: -1 });
  res.json(reviews);
});

router.get('/food/:foodId', async (req, res) => {
  const reviews = await Review.find({ foodId: req.params.foodId }).populate('userId', 'name').sort({ createdAt: -1 });
  res.json(reviews);
});

router.get('/canteen/:canteenId', async (req, res) => {
  const reviews = await Review.find({ canteenId: req.params.canteenId }).populate('userId', 'name').sort({ createdAt: -1 });
  res.json(reviews);
});

router.delete('/:id', async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

export default router;
