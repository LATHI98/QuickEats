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
    cashVerificationCode: { type: String, default: null },
    cashReceivedAmount: { type: Number, default: null },
    cashChangeAmount: { type: Number, default: null },
    verificationCodeUsed: { type: String, default: null },
    rejectionReason: { type: String, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
  },
  { _id: false }
);

const orderActivitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorRole: { type: String, default: null },
    note: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    canteen: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
    groupSession: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupSession', default: null },
    items: { type: [orderItemSchema], required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
    },
    queueNumber: { type: Number, required: true },
    estimatedPickupTime: { type: Date, required: true },
    instantPickupRequested: { type: Boolean, default: false },
    pickupCode: { type: String, unique: true, sparse: true },  // short 6-char code shown to student
    qrCodeData: { type: String, default: null },                // base64 QR image generated from pickupCode
    payment: { type: paymentSchema, default: () => ({}) },
    activityLogs: { type: [orderActivitySchema], default: [] },
    priorityLevel: { type: Number, default: 0 }, // 0: normal, 1: skipped queue
    isPriorityClaimed: { type: Boolean, default: false },
    priorityClaimedAt: { type: Date, default: null },
    pickupVerified: { type: Boolean, default: false },
    pickupVerifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for efficient canteen+date queries
orderSchema.index({ canteen: 1, createdAt: -1 });
orderSchema.index({ student: 1, createdAt: -1 });
orderSchema.index({ canteen: 1, status: 1 });
// Note: pickupCode already has unique:true on the field, no separate index needed

const Order = mongoose.model('Order', orderSchema);
export default Order;
