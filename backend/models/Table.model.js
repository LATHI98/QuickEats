import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
    required: true,
  },
  tableNumber: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
}, {
  timestamps: true,
});

// Compound index to ensure unique table number per canteen
tableSchema.index({ canteenId: 1, tableNumber: 1 }, { unique: true });

const Table = mongoose.model('Table', tableSchema);
export default Table;
