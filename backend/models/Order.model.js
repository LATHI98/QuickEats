import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },       // price snapshot at order time
    unitPrice: { type: Number, required: true },   // price snapshot at order time
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ['cash', 'stripe'], default: null },
    status: {
      type: String,
      enum: ['unpaid', 'pending_verification', 'verified', 'rejected'],
      default: 'unpaid',
    },
    stripePaymentIntentId: { type: String, default: null },
    stripeClientSecret: { type: String, default: null },
    rejectionReason: { type: String, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    canteen: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
    items: { type: [orderItemSchema], required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
    },
    queueNumber: { type: Number, required: true },
    estimatedPickupTime: { type: Date, required: true },
    qrToken: { type: String, required: true, unique: true },
    qrCode: { type: String, required: true },         // base64 data URL
    payment: { type: paymentSchema, default: () => ({}) },
    pickupVerified: { type: Boolean, default: false },
    pickupVerifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for efficient canteen+date queries
orderSchema.index({ canteen: 1, createdAt: -1 });
orderSchema.index({ student: 1, createdAt: -1 });
// Note: qrToken already has unique:true on the field, no separate index needed

const Order = mongoose.model('Order', orderSchema);
export default Order;
