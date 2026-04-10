import mongoose from 'mongoose';

const packageItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantityPerHead: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: 'portion', trim: true },
    notes: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const eventCateringPackageSchema = new mongoose.Schema(
  {
    canteen: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    minHeadcount: { type: Number, default: 1, min: 1 },
    maxHeadcount: { type: Number, default: null },
    basePrice: { type: Number, required: true, min: 0 },
    estimatedPrepMinutes: { type: Number, default: 120, min: 15 },
    items: { type: [packageItemSchema], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

eventCateringPackageSchema.index({ canteen: 1, isActive: 1, name: 1 });

const EventCateringPackage = mongoose.model('EventCateringPackage', eventCateringPackageSchema);
export default EventCateringPackage;
