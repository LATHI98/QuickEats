import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const dropStaleIndexes = async () => {
    try {
        const mongoUri = process.env.MONGODBURL || 'mongodb://localhost:27017/QuickEats';
        console.log(`Connecting to ${mongoUri}`);
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const ordersExists = collections.some(col => col.name === 'orders');

        if (ordersExists) {
            const orders = db.collection('orders');
            const indexes = await orders.indexes();
            console.log('Current indexes on orders:', indexes.map(i => i.name));

            if (indexes.some(i => i.name === 'qrToken_1')) {
                console.log('Dropping qrToken_1 index...');
                await orders.dropIndex('qrToken_1');
                console.log('Dropped qrToken_1 index successfully.');
            } else {
                console.log('qrToken_1 index not found.');
            }
        } else {
            console.log('Orders collection does not exist.');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (err) {
        console.error('Error dropping index:', err);
        process.exit(1);
    }
};

dropStaleIndexes();
