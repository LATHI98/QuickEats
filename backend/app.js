import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import authRoutes from './routes/auth.routes.js';
import User from './models/User.model.js';

const app = express();

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function seedDatabase() {
  // Super Admin
  const existingAdmin = await User.findOne({ email: 'admin@quickeats.com' });
  if (existingAdmin) {
    existingAdmin.password = 'admin123';
    existingAdmin.isActive = true;
    await existingAdmin.save();
    console.log('Super admin updated: admin@quickeats.com / admin123');
  } else {
    await User.create({
      name: 'Super Admin',
      email: 'admin@quickeats.com',
      password: 'admin123',
      role: 'superAdmin',
      isActive: true,
    });
    console.log('Super admin created: admin@quickeats.com / admin123');
  }

  // Student
  const existingStudent = await User.findOne({ email: 'student@quickeats.com' });
  if (existingStudent) {
    existingStudent.password = 'student123';
    existingStudent.isActive = true;
    await existingStudent.save();
    console.log('Student updated: student@quickeats.com / student123');
  } else {
    await User.create({
      name: 'Test Student',
      email: 'student@quickeats.com',
      password: 'student123',
      role: 'student',
      studentId: 'STU001',
      isActive: true,
    });
    console.log('Student created: student@quickeats.com / student123');
  }
}

mongoose.connect(process.env.MONGODBURL)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedDatabase();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
