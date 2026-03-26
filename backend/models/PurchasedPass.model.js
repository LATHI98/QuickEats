import mongoose from 'mongoose';

const purchasedPassSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mealPassId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPass',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  studentId: {
    type: String,
    required: true
  },
  mealName: {
    type: String,
    required: true
  },
  canteen: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    enum: ['week', 'month'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cash'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

const PurchasedPass = mongoose.model('PurchasedPass', purchasedPassSchema);

export default PurchasedPass;
