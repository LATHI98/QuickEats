import express from 'express';
import Staff from '../models/Staff.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const staff = await Staff.create(req.body);
  res.json(staff);
});

router.get('/', async (req, res) => {
  const staff = await Staff.find();
  res.json(staff);
});

router.put('/:id', async (req, res) => {
  const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(staff);
});

router.delete('/:id', async (req, res) => {
  await Staff.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

export default router;