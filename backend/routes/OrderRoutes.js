import express from 'express';
import Order from '../models/Order.js';
import Food from '../models/Food.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { foodId, quantity } = req.body;

  const food = await Food.findById(foodId);

  if (food.stock < quantity) {
    return res.status(400).json({ message: 'Out of stock' });
  }

  food.stock -= quantity;
  food.ordersCount += quantity;
  food.available = food.stock > 0;
  await food.save();

  const order = await Order.create({ foodId, quantity });
  res.json(order);
});

router.get('/', async (req, res) => {
  const orders = await Order.find().populate('foodId');
  res.json(orders);
});

export default router;