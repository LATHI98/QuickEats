import Expense from '../models/Expense.model.js';
import Budget from '../models/Budget.model.js';
import { sendNotification } from '../services/socket.service.js';

export const createExpense = async (req, res) => {
  try {
    const { itemName, amount, date, category } = req.body;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Validation
    if (!itemName || itemName.trim().length < 2) {
      return res.status(400).json({ message: 'Item name must be at least 2 characters' });
    }
    
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const amountNum = Number(amount);

    const newExpense = new Expense({
      userId,
      itemName: itemName.trim(),
      amount: amountNum,
      date: date || new Date(),
      category: category || 'Other Expense'
    });

    await newExpense.save();

    // Check budget
    const budget = await Budget.findOne({ userId });
    if (budget && budget.amount > 0 && !budget.hasExceededNotificationSent) {
      const allExpenses = await Expense.find({ userId });
      const totalSpent = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      if (totalSpent > budget.amount) {
        await sendNotification(
          userId,
          'Budget Exceeded!',
          `Your total spending (${totalSpent} RS) has exceeded your budget (${budget.amount} RS).`,
          'budget_exceeded'
        );
        
        // Mark notification as sent
        budget.hasExceededNotificationSent = true;
        await budget.save();
      }
    }

    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyExpenses = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const expenses = await Expense.find({ userId }).sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    
    // Safety check - ensures user can only delete their own expenses
    const expense = await Expense.findOneAndDelete({ _id: id, userId });
    
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.status(200).json({ message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
