import mongoose from 'mongoose';

// Singleton document — always key: 'global'
const systemConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  announcement: { type: String, trim: true, default: '' },
  announcementActive: { type: Boolean, default: false },
  allowRegistration: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('SystemConfig', systemConfigSchema);
