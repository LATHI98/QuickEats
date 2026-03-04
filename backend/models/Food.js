import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  stock: Number,
  available: Boolean,
  ordersCount: { type: Number, default: 0 },
  restockedAt: { type: Date, default: null }
});

export default mongoose.model('Food', foodSchema);