import Budget from '../models/Budget.model.js';

export const setBudget = async (req, res) => {
  try {
    const { amount, period } = req.body;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const budget = await Budget.findOneAndUpdate(
      { userId },
      { amount: Number(amount), period },
      { new: true, upsert: true }
    );

    res.status(200).json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBudget = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const budget = await Budget.findOne({ userId });
    
    if (!budget) {
      // Return a default empty budget object instead of 404
      return res.status(200).json({ amount: 0, period: 'weekly' });
    }

    res.status(200).json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
