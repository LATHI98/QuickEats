import mongoose from 'mongoose';

const budgetHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: true
  },
  budgetAmount: {
    type: Number,
    required: true
  },
  totalSpent: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const BudgetHistory = mongoose.model('BudgetHistory', budgetHistorySchema);
export default BudgetHistory;
