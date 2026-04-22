import mongoose from 'mongoose';

const supportTicketMessageSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    attachments: { type: [String], default: [] },
    isInternal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

supportTicketMessageSchema.index({ ticket: 1, createdAt: 1 });

const SupportTicketMessage = mongoose.model('SupportTicketMessage', supportTicketMessageSchema);

export default SupportTicketMessage;
