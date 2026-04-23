import mongoose from 'mongoose';

const crowdCountSchema = new mongoose.Schema(
  {
    count: {
      type: Number,
      required: true,
      min: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    canteen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Canteen',
      default: null,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

const CrowdCount = mongoose.model('CrowdCount', crowdCountSchema);

export default CrowdCount;
