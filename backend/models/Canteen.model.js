import mongoose from 'mongoose';

const canteenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 15,
    match: [/^[A-Za-z ]+$/, 'Name must contain only alphabetic characters and spaces'],
  },
  owner: {
    type: String,
    required: true,
    trim: true,
    maxlength: 15,
    match: [/^[A-Za-z ]+$/, 'Owner name must contain only alphabetic characters and spaces'],
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (value) => /^.+@gmail\.com$/.test(value),
      message: 'Email must end with @gmail.com',
    },
  },
  ratings: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  photo: {
    type: String,
    trim: true,
    default: '',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  openHours: {
    type: String,
    trim: true,
    default: '',
  },
  accessPasswordHash: {
    type: String,
    select: false,
    default: '',
  },
  isOpen: { type: Boolean, default: true },
  notice: { type: String, trim: true, default: '' },
}, {
  timestamps: true,
});

const Canteen = mongoose.model('Canteen', canteenSchema);
export default Canteen;
