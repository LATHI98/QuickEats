import mongoose from 'mongoose';

const SUPPORT_CATEGORIES = [
  'order_issue',
  'payment_issue',
  'canteen_issue',
  'reservation_issue',
  'account_issue',
  'feature_request',
  'general',
];

const SUPPORT_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const SUPPORT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const SUPPORT_SOURCES = ['manual', 'chatbot', 'email'];

const supportActivitySchema = new mongoose.Schema(
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

const supportTicketSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    canteen: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: SUPPORT_CATEGORIES, default: 'general' },
    priority: { type: String, enum: SUPPORT_PRIORITIES, default: 'medium' },
    status: { type: String, enum: SUPPORT_STATUSES, default: 'open' },
    source: { type: String, enum: SUPPORT_SOURCES, default: 'manual' },
    attachments: { type: [String], default: [] },
    chatSummary: { type: String, default: '', trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
    lastMessageAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    activityLogs: { type: [supportActivitySchema], default: [] },
  },
  { timestamps: true }
);

supportTicketSchema.index({ requester: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: 1, updatedAt: -1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export { SUPPORT_CATEGORIES, SUPPORT_STATUSES, SUPPORT_PRIORITIES, SUPPORT_SOURCES };
export default SupportTicket;
