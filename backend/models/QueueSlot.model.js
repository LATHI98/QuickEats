import mongoose from 'mongoose';

const queueSlotSchema = new mongoose.Schema(
  {
    canteen: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
    date: { type: String, required: true },     // 'YYYY-MM-DD'
    slotTime: { type: Date, required: true },   // exact slot datetime
    orderCount: { type: Number, default: 0 },
    maxCapacity: { type: Number, default: 10 },
  },
  { timestamps: true }
);

// Unique slot per canteen per time
queueSlotSchema.index({ canteen: 1, slotTime: 1 }, { unique: true });
queueSlotSchema.index({ canteen: 1, date: 1 });

const QueueSlot = mongoose.model('QueueSlot', queueSlotSchema);
export default QueueSlot;
