import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixIndexes() {
  try {
    if (!process.env.MONGODBURL) {
      throw new Error('MONGODBURL not found in .env');
    }

    await mongoose.connect(process.env.MONGODBURL);
    console.log('Connected to MongoDB');

    const ordersCollection = mongoose.connection.collection('orders');

    // 1. Drop the problematic index
    try {
      await ordersCollection.dropIndex('pickupCode_1');
      console.log('Dropped index pickupCode_1 from orders collection');
    } catch (e) {
      console.log('Index pickupCode_1 not found or already dropped:', e.message);
    }

    // 2. Re-create the index as sparse and unique
    await ordersCollection.createIndex({ pickupCode: 1 }, { unique: true, sparse: true });
    console.log('Successfully created sparse unique index on pickupCode');

    // 3. Optional: Verify existing documents don't have multiple nulls (though dropIndex should have allowed it)
    const nullCount = await ordersCollection.countDocuments({ pickupCode: null });
    console.log(`Found ${nullCount} documents with pickupCode: null (these are now allowed to co-exist)`);

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Fix indexes error:', err);
    process.exit(1);
  }
}

fixIndexes();
