import mongoose from 'mongoose';

// Stores the persistent "now serving" number per canteen per day
const canteenQueueSchema = new mongoose.Schema(
    {
        canteen: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
        date: { type: String, required: true }, // 'YYYY-MM-DD'
        nowServing: { type: Number, default: 0 },
    },
    { timestamps: true }
);

canteenQueueSchema.index({ canteen: 1, date: 1 }, { unique: true });

const CanteenQueue = mongoose.model('CanteenQueue', canteenQueueSchema);
export default CanteenQueue;
