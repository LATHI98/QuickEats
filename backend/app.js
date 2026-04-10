import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import foodRoutes from './routes/foodRoutes.js'
import legacyOrderRoutes from './routes/OrderRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import staffRoutes from './routes/StaffRoutes.js'

const __dirname = dirname(fileURLToPath(import.meta.url));
const localEnvPath = join(__dirname, '.env');
const rootEnvPath = join(__dirname, '..', '.env');
dotenv.config({ path: existsSync(localEnvPath) ? localEnvPath : rootEnvPath });

// Ensure uploads directory exists
const uploadDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

import authRoutes from './routes/auth.routes.js';
import User from './models/User.model.js';
import Canteen from './models/Canteen.model.js';
import MenuItem from './models/MenuItem.model.js';
import canteenRoutes from './routes/canteen.routes.js';
import cartRoutes from './routes/cart.routes.js';
import modernOrderRoutes from './routes/order.routes.js';
import groupSessionRoutes from './routes/groupSession.routes.js';
import queueRoutes from './routes/queue.routes.js';
import tableRoutes from './routes/table.routes.js';
import reservationRoutes from './routes/reservation.routes.js';
import eventCateringRoutes from './routes/eventCatering.routes.js';
import supportRoutes from './routes/support.routes.js';
import { stripeWebhook } from './controllers/payment.controller.js';

import mealPassRoutes from './routes/mealPass.routes.js';
import purchasedPassRoutes from './routes/purchasedPass.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import expenseRoutes from './routes/expense.routes.js';





const app = express();

const explicitAllowedOrigins = [process.env.CORS_ORIGIN].filter(Boolean);
const isLocalDevOrigin = (origin) => /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (explicitAllowedOrigins.includes(origin) || isLocalDevOrigin(origin)) return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

// Stripe webhook MUST use raw body — register before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

async function seedDatabase() {
  const dummyCanteenPhotos = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=700&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=700&fit=crop',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&h=700&fit=crop',
    'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=1200&h=700&fit=crop',
  ];

  const resolveUniqueUsername = async (baseUsername, excludeUserId = null) => {
    let candidate = baseUsername;
    let suffix = 1;

    while (true) {
      const conflict = await User.findOne({
        username: candidate,
        ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
      });
      if (!conflict) return candidate;
      candidate = `${baseUsername}${suffix}`;
      suffix += 1;
    }
  };

  const normalizeCanteenSeed = (canteen, index) => {
    const fallbackName = 'Main Canteen';
    const fallbackOwner = 'Quick Eats';
    const fallbackEmail = `canteen${index + 1}@gmail.com`;

    const normalizedName = typeof canteen.name === 'string' && /^[A-Za-z ]+$/.test(canteen.name.trim()) && canteen.name.trim().length <= 15
      ? canteen.name.trim()
      : fallbackName;
    const normalizedOwner = typeof canteen.owner === 'string' && /^[A-Za-z ]+$/.test(canteen.owner.trim()) && canteen.owner.trim().length <= 15
      ? canteen.owner.trim()
      : fallbackOwner;
    const normalizedEmail = typeof canteen.email === 'string' && /^.+@gmail\.com$/.test(canteen.email.trim().toLowerCase())
      ? canteen.email.trim().toLowerCase()
      : fallbackEmail;

    canteen.name = normalizedName;
    canteen.owner = normalizedOwner;
    canteen.email = normalizedEmail;
    canteen.description = canteen.description?.trim() || 'Default canteen for development';
    canteen.openHours = canteen.openHours?.trim() || '08:00 AM - 08:00 PM';
    canteen.photo = canteen.photo?.trim() || dummyCanteenPhotos[index % dummyCanteenPhotos.length];
    return canteen;
  };

  const upsertSeedUser = async ({ name, username, email, password, role, studentId = null, canteen = null }) => {
    const existingUser = await User.findOne({ email });
    const safeUsername = await resolveUniqueUsername(username, existingUser?._id || null);

    if (existingUser) {
      existingUser.name = name;
      existingUser.username = safeUsername;
      existingUser.password = password;
      existingUser.role = role;
      existingUser.studentId = studentId;
      existingUser.canteen = canteen;
      existingUser.isActive = true;
      existingUser.isVerified = true;
      await existingUser.save();
      console.log(`${role} updated: ${email} / ${password} (username: ${safeUsername})`);
      return;
    }

    await User.create({
      name,
      username: safeUsername,
      email,
      password,
      role,
      studentId,
      canteen,
      isActive: true,
      isVerified: true,
    });
    console.log(`${role} created: ${email} / ${password} (username: ${safeUsername})`);
  };

  let canteens = await Canteen.find();
  if (canteens.length === 0) {
    const defaultCanteen = await Canteen.create({
      name: 'Main Canteen',
      owner: 'Quick Eats',
      email: 'maincanteen@gmail.com',
      ratings: 4.2,
      description: 'Default canteen for development',
      openHours: '08:00 AM - 08:00 PM',
      accessPasswordHash: await bcrypt.hash('canteen123', 12),
    });
    canteens = [defaultCanteen];
    console.log('Created default canteen for seed users');
  }

  for (const [index, canteen] of canteens.entries()) {
    normalizeCanteenSeed(canteen, index);
    try {
      await canteen.save();
    } catch (err) {
      console.warn(`Skipping canteen seed repair for ${canteen._id}:`, err.message);
    }
  }

  const canteensWithoutPhotos = await Canteen.find({ photo: { $in: ['', null] } });
  for (let i = 0; i < canteensWithoutPhotos.length; i++) {
    canteensWithoutPhotos[i].photo = dummyCanteenPhotos[i % dummyCanteenPhotos.length];
    await canteensWithoutPhotos[i].save();
  }
  if (canteensWithoutPhotos.length > 0) {
    console.log(`Backfilled photos for ${canteensWithoutPhotos.length} canteens`);
  }

  const canteensWithPasswordField = await Canteen.find().select('+accessPasswordHash');
  for (const canteen of canteensWithPasswordField) {
    if (canteen.accessPasswordHash) continue;
    canteen.accessPasswordHash = await bcrypt.hash('canteen123', 12);
    await canteen.save();
    console.log(`Backfilled password for canteen: ${canteen.name}`);
  }

  const staffCanteenId = canteens[0]?._id || null;

  await upsertSeedUser({
    name: 'Admin User',
    username: 'admin',
    email: 'admin@quickeats.com',
    password: 'admin123',
    role: 'admin',
  });

  await upsertSeedUser({
    name: 'Canteen Staff',
    username: 'staff',
    email: 'staff@quickeats.com',
    password: 'staff123',
    role: 'canteenStaff',
    canteen: staffCanteenId,
  });

  await upsertSeedUser({
    name: 'Test Student',
    username: 'student',
    email: 'student@quickeats.com',
    password: 'student123',
    role: 'student',
    studentId: 'STU001',
  });

  const starterMenuItems = [
    { name: 'Rice and Curry', category: 'Main Course', price: 250, description: 'Daily chef special plate', isAvailable: true, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop' },
    { name: 'Chicken Rice', category: 'Main Course', price: 380, description: 'Fragrant rice with grilled chicken', isAvailable: true, image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop' },
    { name: 'Veg Fried Rice', category: 'Main Course', price: 320, description: 'Stir-fried rice with vegetables', isAvailable: true, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop' },
    { name: 'Seafood Kottu', category: 'Main Course', price: 490, description: 'Hot chopped kottu with seafood mix', isAvailable: true, image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&h=300&fit=crop' },
    { name: 'Paneer Noodles', category: 'Main Course', price: 410, description: 'Wok-fried noodles with paneer and vegetables', isAvailable: true, image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop' },
    { name: 'Chicken Submarine', category: 'Snacks', price: 300, description: 'Toasted sub with spicy chicken filling', isAvailable: true, image: 'https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?w=400&h=300&fit=crop' },
    { name: 'Fruit Falooda', category: 'Dessert', price: 240, description: 'Milk dessert with fruits and jelly', isAvailable: true, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop' },
    { name: 'Iced Tea', category: 'Beverage', price: 120, description: 'Chilled tea with lemon', isAvailable: true, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop' },
  ];

  const dummyImages = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1609501676725-7186f017a4b8?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
  ];

  for (const canteen of canteens) {
    const existingCount = await MenuItem.countDocuments({ canteen: canteen._id });
    if (existingCount > 0) continue;

    const menuItems = starterMenuItems.map((item) => ({
      ...item,
      canteen: canteen._id,
    }));
    await MenuItem.insertMany(menuItems);
    console.log(`Seeded starter menu items for ${canteen.name}`);
  }

  const itemsWithoutImage = await MenuItem.find({ image: { $in: ['', null] } });
  for (let i = 0; i < itemsWithoutImage.length; i++) {
    itemsWithoutImage[i].image = dummyImages[i % dummyImages.length];
    await itemsWithoutImage[i].save();
  }
  if (itemsWithoutImage.length > 0) {
    console.log(`Backfilled images for ${itemsWithoutImage.length} menu items`);
  }

  const vegFriedRiceItems = await MenuItem.find({
    name: { $regex: /^veg\s+fried\s+rice$/i },
  });
  for (const item of vegFriedRiceItems) {
    item.image = 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop';
    await item.save();
  }
  if (vegFriedRiceItems.length > 0) {
    console.log(`Updated image for ${vegFriedRiceItems.length} Veg Fried Rice item(s)`);
  }
}

// Register all routes
app.use('/api/auth', authRoutes);
app.use('/api/meal-passes', mealPassRoutes);
app.use('/api/purchased-passes', purchasedPassRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/order', legacyOrderRoutes);
app.use('/api/orders', modernOrderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/canteens', canteenRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/group-sessions', groupSessionRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/event-catering', eventCateringRoutes);
app.use('/api/support', supportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

mongoose.connect(process.env.MONGODBURL)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedDatabase();
  })
  .catch(err => console.error('MongoDB connection error:', err));

