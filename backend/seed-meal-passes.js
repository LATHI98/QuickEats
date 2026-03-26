import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import MealPass from './models/MealPass.model.js';

await mongoose.connect(process.env.MONGODBURL);
console.log('Connected to MongoDB');

const demoPasses = [
  {
    name: 'Vegetable Rice',
    price: 'Rs. 450',
    discount: '100% Free with Pass',
    description: 'A healthy mix of fresh vegetables stir-fried with premium basmati rice and aromatic spices.',
    canteen: 'Main Canteen (A-Block)',
    category: 'lunch',
    tags: ['Veg', 'Healthy', 'Local'],
    image: '/images/meal-passes/vegrice.jpg'
  },
  {
    name: 'Fish Rice & Curry',
    price: 'Rs. 700',
    discount: '100% covered - Meal Pass',
    description: 'Traditional sour fish curry (Ambul Thiyal) served with white rice and coconut sambol.',
    canteen: 'B-Block Refreshments',
    category: 'lunch',
    tags: ['Seafood', 'Traditional', 'Spicy'],
    image: '/images/meal-passes/fish.png'
  },
  {
    name: 'Chicken Rice & Curry',
    price: 'Rs. 600',
    discount: '100% covered - Meal Pass',
    description: 'Authentic Sri Lankan rice served with a robust spicy chicken curry and gotukola sambol.',
    canteen: 'B-Block Refreshments',
    category: 'lunch',
    tags: ['Non-Veg', 'Spicy', 'Local'],
    image: '/images/meal-passes/chicken.jpg'
  },
  {
    name: 'Egg Rice',
    price: 'Rs. 550',
    discount: '100% covered - Meal Pass',
    description: 'Freshly wok-tossed egg fried rice served with aromatic chili paste.',
    canteen: 'Main Canteen (A-Block)',
    category: 'lunch',
    tags: ['Egg', 'Hot', 'Popular'],
    image: '/images/meal-passes/egg.png'
  },
  {
    name: 'Iced Milo',
    price: 'Rs. 250',
    discount: '100% covered',
    description: 'Refreshing chilled Milo drink.',
    canteen: 'University Cafe',
    category: 'beverages',
    tags: ['Cold', 'Sweet'],
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Milo_drink.jpg/640px-Milo_drink.jpg'
  }
];

await MealPass.deleteMany({});
await MealPass.insertMany(demoPasses);
console.log('Meal passes seeded with user specified images');

await mongoose.disconnect();
process.exit(0);
