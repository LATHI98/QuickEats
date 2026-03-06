import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.model.js';
import User from '../models/User.model.js';
import Canteen from '../models/Canteen.model.js';

dotenv.config({ path: './.env' });

const seed = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODBURL);
        console.log('Connected!');

        // 1. Get or create a sample user and canteen
        let student = await User.findOne({ role: 'student' });
        if (!student) {
            student = await User.create({
                name: 'Test Student',
                email: 'student@test.com',
                password: 'password123', // actually should be hashed but this is just for ID ref
                role: 'student',
                studentId: 'ST12345'
            });
        }

        let canteen = await Canteen.findOne();
        if (!canteen) {
            canteen = await Canteen.create({
                name: 'Main Canteen',
                location: 'Building A',
                isOpen: true
            });
        }

        console.log(`Using Canteen: ${canteen.name} (${canteen._id})`);

        // 2. Seed Historical Data (last 7 days)
        // We want to create ~20 orders per day to establish a trend
        console.log('Seeding historical orders...');
        const now = new Date();
        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i);

            // Create orders throughout the day, especially around lunch time (12:00)
            for (let j = 0; j < 25; j++) {
                const orderDate = new Date(date);
                orderDate.setHours(11 + Math.floor(j / 5), (j % 5) * 10, 0); // Spaced apart

                const prepTimeMins = 5 + Math.random() * 10;
                const readyDate = new Date(orderDate.getTime() + prepTimeMins * 60000);

                await Order.create({
                    student: student._id,
                    canteen: canteen._id,
                    items: [{ menuItem: new mongoose.Types.ObjectId(), name: 'Test Food', unitPrice: 100, quantity: 1 }],
                    totalPrice: 100,
                    status: 'completed',
                    queueNumber: j + 1,
                    estimatedPickupTime: readyDate,
                    createdAt: orderDate,
                    updatedAt: readyDate
                });
            }
        }

        // 3. Seed Current Active Orders (to trigger Real-time Surge)
        console.log('Seeding current active orders (to trigger surge)...');
        for (let k = 0; k < 15; k++) {
            await Order.create({
                student: student._id,
                canteen: canteen._id,
                items: [{ menuItem: new mongoose.Types.ObjectId(), name: 'Current Food', unitPrice: 150, quantity: 2 }],
                totalPrice: 300,
                status: 'pending',
                queueNumber: 100 + k,
                estimatedPickupTime: new Date(Date.now() + 20 * 60000),
                createdAt: new Date()
            });
        }

        console.log('✅ Seeding complete! You can now check the Dashboard/Canteens page for Surge alerts.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seed();
