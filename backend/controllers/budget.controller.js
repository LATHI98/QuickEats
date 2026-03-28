import Budget from '../models/Budget.model.js';
import BudgetHistory from '../models/BudgetHistory.model.js';
import Expense from '../models/Expense.model.js';

export const setBudget = async (req, res) => {
  try {
    const { amount, period } = req.body;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Validation
    const amountNum = Number(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: 'Budget amount must be a positive number' });
    }

    if (!['weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ message: 'Invalid budget period' });
    }

    const budget = await Budget.findOneAndUpdate(
      { userId },
      { amount: amountNum, period },
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

export const archiveAndResetBudget = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // 1. Get current budget data
    const budget = await Budget.findOne({ userId });
    if (!budget) return res.status(404).json({ message: 'Budget settings not found' });

    // 2. Get current expenses to sum up
    const expenses = await Expense.find({ userId });
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // 3. Decide on a start date (last reset or first expense?)
    // For now we'll just use the budget's updated time as a proxy or just the current window.
    // Let's use the oldest expense date as startDate or just createdAt if no expenses.
    const startDate = expenses.length > 0 
      ? new Date(Math.min(...expenses.map(e => new Date(e.date).getTime())))
      : budget.updatedAt;

    // 4. Record to History
    const history = new BudgetHistory({
      userId,
      period: budget.period,
      budgetAmount: budget.amount,
      totalSpent: totalSpent,
      startDate: startDate,
      endDate: new Date()
    });
    await history.save();

    // 5. Clear current expenses for this user
    await Expense.deleteMany({ userId });

    // 6. Reset budget amount to 0
    budget.amount = 0;
    await budget.save();

    res.status(200).json({ message: 'Budget archived and reset successfully', history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBudgetHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const history = await BudgetHistory.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBudgetHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const history = await BudgetHistory.findOneAndDelete({ _id: id, userId });
    if (!history) return res.status(404).json({ message: 'History entry not found' });

    res.status(200).json({ message: 'History entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

