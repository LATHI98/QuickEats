import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import authRoutes from './routes/auth.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import queueRoutes from './routes/queue.routes.js';
import canteenRoutes from './routes/canteen.routes.js';
import groupSessionRoutes from './routes/groupSession.routes.js';
import { stripeWebhook } from './controllers/payment.controller.js';
import User from './models/User.model.js';
import Canteen from './models/Canteen.model.js';
import MenuItem from './models/MenuItem.model.js';

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

// Stripe webhook MUST use raw body — register before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function seedDatabase() {
  // Super Admin
  const existingAdmin = await User.findOne({ email: 'admin@quickeats.com' });
  if (existingAdmin) {
    existingAdmin.password = 'admin123';
    existingAdmin.isActive = true;
    existingAdmin.role = 'admin';
    await existingAdmin.save();
    console.log('Super admin updated: admin@quickeats.com / admin123');
  } else {
    await User.create({
      name: 'Super Admin',
      username: 'superadmin',
      email: 'admin@quickeats.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
    });
    console.log('Super admin created: admin@quickeats.com / admin123');
  }

  // Student
  const existingStudent = await User.findOne({ email: 'student@quickeats.com' });
  if (existingStudent) {
    existingStudent.password = 'student123';
    existingStudent.isActive = true;
    if (!existingStudent.username) existingStudent.username = 'teststudent';
    await existingStudent.save();
    console.log('Student updated: student@quickeats.com / student123');
  } else {
    await User.create({
      name: 'Test Student',
      username: 'teststudent',
      email: 'student@quickeats.com',
      password: 'student123',
      role: 'student',
      studentId: 'STU001',
      isActive: true,
    });
    console.log('Student created: student@quickeats.com / student123');
  }

  // Test Canteen
  let canteen = await Canteen.findOne({ name: 'Main Canteen' });
  if (!canteen) {
    canteen = await Canteen.create({
      name: 'Main Canteen',
      location: 'Block A, Ground Floor',
      isOpen: true,
    });
    console.log(`Test canteen created: ${canteen._id}`);
  } else {
    console.log(`Test canteen exists: ${canteen._id}`);
  }

  // Canteen Staff
  const existingStaff = await User.findOne({ email: 'staff@quickeats.com' });
  if (existingStaff) {
    existingStaff.password = 'staff123';
    existingStaff.isActive = true;
    existingStaff.canteen = canteen._id;
    if (!existingStaff.username) existingStaff.username = 'teststaff';
    await existingStaff.save();
    console.log('Canteen staff updated: staff@quickeats.com / staff123');
  } else {
    await User.create({
      name: 'Test Staff',
      username: 'teststaff',
      email: 'staff@quickeats.com',
      password: 'staff123',
      role: 'canteenStaff',
      canteen: canteen._id,
      isActive: true,
    });
    console.log('Canteen staff created: staff@quickeats.com / staff123');
  }

  // Test Menu Items
  const menuItems = [
    { name: 'Rice & Curry', price: 250, description: 'Traditional Sri Lankan rice and curry', category: 'Main Course' },
    { name: 'Fried Rice', price: 300, description: 'Egg fried rice with vegetables', category: 'Main Course' },
    { name: 'Kottu Roti', price: 350, description: 'Classic kottu with egg and vegetables', category: 'Main Course' },
    { name: 'Veggie Burger', price: 200, description: 'Grilled veggie patty burger', category: 'Snacks' },
    { name: 'Fruit Juice', price: 120, description: 'Fresh seasonal fruit juice', category: 'Beverages' },
  ];

  for (const item of menuItems) {
    const exists = await MenuItem.findOne({ name: item.name, canteen: canteen._id });
    if (!exists) {
      await MenuItem.create({ ...item, canteen: canteen._id, isAvailable: true });
      console.log(`Menu item created: ${item.name} (LKR ${item.price})`);
    }
  }
  console.log('--- Seed complete ---');
  console.log(`Canteen ID (use in Postman): ${canteen._id}`);
}

mongoose.connect(process.env.MONGODBURL)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedDatabase();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/canteens', canteenRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/group-sessions', groupSessionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
