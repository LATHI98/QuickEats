import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  quantity: Number,
  date: { type: Date, default: Date.now }
});

export default mongoose.model('Order', orderSchema);