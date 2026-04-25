import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  name: String,
  role: String,
  contact: String
});

export default mongoose.model('Staff', staffSchema);