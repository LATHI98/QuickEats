import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null },
  canteenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, default: null },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Review', reviewSchema);