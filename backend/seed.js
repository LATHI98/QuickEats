import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import User from './models/User.model.js';

await mongoose.connect(process.env.MONGODBURL);
console.log('Connected to MongoDB');

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
    username: 'admin',
    email: 'admin@quickeats.com',
    password: 'admin123',
    role: 'superAdmin',
    isActive: true,
    isVerified: true,
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
    username: 'student',
    email: 'student@quickeats.com',
    password: 'student123',
    role: 'student',
    studentId: 'STU001',
    isActive: true,
    isVerified: true,
  });
  console.log('Student created: student@quickeats.com / student123');
}

await mongoose.disconnect();
process.exit(0);

