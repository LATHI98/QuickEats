import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One budget settings per user
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly'],
    default: 'weekly'
  },
  currency: {
    type: String,
    default: 'RS'
  }
}, { timestamps: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
