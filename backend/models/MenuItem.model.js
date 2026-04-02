import mongoose from 'mongoose';

// Stub model — owned by Menu Management team member.
// Only minimal fields defined here so Order/Cart can reference it.
const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    canteen: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
    isAvailable: { type: Boolean, default: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
