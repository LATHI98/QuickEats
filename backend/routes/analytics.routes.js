import express from 'express';
import Order from '../models/Order.model.js';
import Canteen from '../models/Canteen.model.js';
import Review from '../models/Review.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/admin-summary', protect, authorize('superAdmin', 'admin'), async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({ status: { $ne: 'cancelled' } });
    const canteens = await Canteen.find();
    const reviews = await Review.find();
    
    // Total Revenue
    const revenueData = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // Orders per Canteen
    const ordersPerCanteen = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$canteen', count: { $sum: 1 } } }
    ]);

    // Popular Items
    const popularItems = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', count: { $sum: '$items.quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Rating distribution
    const ratings = await Canteen.find({}, 'name ratings');

    res.json({
      totalOrders,
      totalRevenue,
      canteenCount: canteens.length,
      reviewCount: reviews.length,
      ordersPerCanteen,
      popularItems,
      ratings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

export default router;
