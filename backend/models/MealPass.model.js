import mongoose from 'mongoose';

const mealPassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: String,
    required: true
  },
  discount: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  canteen: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['breakfast', 'lunch', 'snacks', 'beverages'],
    default: 'lunch'
  },
  tags: [{
    type: String
  }],
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const MealPass = mongoose.model('MealPass', mealPassSchema);

export default MealPass;
