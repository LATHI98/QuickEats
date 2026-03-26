import express from 'express';
import Food from '../models/Food.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const food = await Food.create(req.body);
  res.json(food);
});

router.get('/', async (req, res) => {
  const foods = await Food.find();
  res.json(foods);
});

router.put('/:id', async (req, res) => {
  const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(food);
});

router.delete('/:id', async (req, res) => {
  await Food.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// PATCH /api/food/:id/restock  — add stock to an existing item
router.patch('/:id/restock', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Amount must be a positive number' });
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food not found' });
    food.stock += Number(amount);
    food.available = food.stock > 0;
    food.restockedAt = new Date();
    await food.save();
    res.json(food);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/popular/top', async (req, res) => {
  const foods = await Food.find().sort({ ordersCount: -1 }).limit(5);
  res.json(foods);
});

export default router;