import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  canteenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
    required: true,
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true,
  },
  seatsBooked: {
    type: Number,
    required: true,
    min: 1,
  },
  reservationDate: {
    type: Date,
    required: true,
  },
  timeSlot: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'confirmed',
  },
}, {
  timestamps: true,
});

const Reservation = mongoose.model('Reservation', reservationSchema);
export default Reservation;
