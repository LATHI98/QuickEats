import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GroupSession from './models/GroupSession.model.js';
import Order from './models/Order.model.js';

dotenv.config();
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/QuickEats')
    .then(async () => {
        console.log('Connected. Fetching recent sessions:');
        const sessions = await GroupSession.find().sort({ createdAt: -1 }).limit(3);
        console.log(JSON.stringify(sessions, null, 2));

        console.log('\nFetching recent orders:');
        const orders = await Order.find().sort({ createdAt: -1 }).limit(3);
        console.log(JSON.stringify(orders, null, 2));

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
