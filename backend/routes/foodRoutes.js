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

router.get('/popular/top', async (req, res) => {
  const foods = await Food.find().sort({ ordersCount: -1 }).limit(5);
  res.json(foods);
});

export default router;