import mongoose from 'mongoose';

const REQUEST_STATUSES = [
  'requested',
  'quoted',
  'approved',
  'in_prep',
  'ready',
  'delivered',
  'rejected',
];

const selectedItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    preferredMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'mixed'],
      default: 'cash',
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending',
    },
    amountPaid: { type: Number, default: 0, min: 0 },
    amountDue: { type: Number, default: 0, min: 0 },
    totalPayable: { type: Number, default: 0, min: 0 },
    planMode: {
      type: String,
      enum: ['none', 'full', 'installment'],
      default: 'none',
    },
    pendingAmount: { type: Number, default: 0, min: 0 },
    pendingPlan: {
      type: String,
      enum: ['none', 'full', 'half', 'three_quarter'],
      default: 'none',
    },
    pendingStatus: {
      type: String,
      enum: ['none', 'pending', 'rejected'],
      default: 'none',
    },
    pendingSubmittedAt: { type: Date, default: null },
    transactionRef: { type: String, default: '', trim: true },
    receiptFileUrl: { type: String, default: '', trim: true },
    receiptUploadedAt: { type: Date, default: null },
    receiptUploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    portalSessionId: { type: String, default: '', trim: true },
    portalPaymentIntentId: { type: String, default: '', trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedAt: { type: Date, default: null },
    notes: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const quoteSchema = new mongoose.Schema(
  {
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventCateringPackage', default: null },
    packageName: { type: String, default: '' },
    lineItems: { type: [selectedItemSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    fullPaymentDiscount: { type: Number, default: 0, min: 0 },
    installmentInterestRate: { type: Number, default: 0, min: 0 },
    totalQuoted: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'LKR' },
    validUntil: { type: Date, default: null },
    preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    preparedAt: { type: Date, default: null },
    studentConfirmedAt: { type: Date, default: null },
    notes: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorRole: { type: String, default: null },
    note: { type: String, default: '', trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const eventCateringRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    canteen: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
    eventName: { type: String, required: true, trim: true },
    eventDateTime: { type: Date, required: true },
    prepStartAt: { type: Date, default: null },
    headcount: { type: Number, required: true, min: 1 },
    venue: { type: String, required: true, trim: true },
    budget: { type: Number, default: null, min: 0 },
    notes: { type: String, default: '', trim: true },
    status: { type: String, enum: REQUEST_STATUSES, default: 'requested' },
    selectedItems: { type: [selectedItemSchema], default: [] },
    quote: { type: quoteSchema, default: () => ({}) },
    payment: { type: paymentSchema, default: () => ({}) },
    estimatedPrepMinutes: { type: Number, default: 120, min: 15 },
    capacitySlotKey: { type: String, default: '' },
    activityLogs: { type: [activityLogSchema], default: [] },
  },
  { timestamps: true }
);

eventCateringRequestSchema.index({ canteen: 1, eventDateTime: 1, status: 1 });
eventCateringRequestSchema.index({ requester: 1, createdAt: -1 });

const EventCateringRequest = mongoose.model('EventCateringRequest', eventCateringRequestSchema);

export { REQUEST_STATUSES };
export default EventCateringRequest;
