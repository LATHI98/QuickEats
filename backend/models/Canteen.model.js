import mongoose from 'mongoose';

// Stub model — owned by Canteen Management team member.
// Minimal fields defined here so Order/Cart/Queue can reference it.
const canteenSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, default: '' },
    isOpen: { type: Boolean, default: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const Canteen = mongoose.model('Canteen', canteenSchema);
export default Canteen;
