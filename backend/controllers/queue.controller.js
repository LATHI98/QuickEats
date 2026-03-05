import QueueSlot from '../models/QueueSlot.model.js';
import Order from '../models/Order.model.js';

const SLOT_INTERVAL_MINUTES = 10;
const SLOTS_TO_SHOW = 12; // show next 2 hours of slots

// In-memory "now serving" counter per canteen (resets on server restart)
// For persistence, this could be stored in DB or Redis
const nowServingMap = {};

// GET /api/queue/:canteenId/slots
export const getAvailableSlots = async (req, res) => {
  try {
    const { canteenId } = req.params;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const slots = [];
    const roundedMinutes = Math.ceil((now.getMinutes() + 1) / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
    let slotTime = new Date(now);
    slotTime.setMinutes(roundedMinutes, 0, 0);

    for (let i = 0; i < SLOTS_TO_SHOW; i++) {
      const existing = await QueueSlot.findOne({ canteen: canteenId, slotTime });
      const orderCount = existing ? existing.orderCount : 0;
      const maxCapacity = existing ? existing.maxCapacity : 10;

      slots.push({
        slotTime,
        orderCount,
        maxCapacity,
        remaining: maxCapacity - orderCount,
        available: orderCount < maxCapacity,
      });

      slotTime = new Date(slotTime.getTime() + SLOT_INTERVAL_MINUTES * 60 * 1000);
    }

    res.json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/queue/:canteenId/status
export const getQueueStatus = async (req, res) => {
  try {
    const { canteenId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const activeOrders = await Order.find({
      canteen: canteenId,
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $in: ['pending', 'preparing', 'ready'] },
    })
      .select('queueNumber status estimatedPickupTime student totalPrice')
      .populate('student', 'name studentId')
      .sort({ queueNumber: 1 });

    const grouped = {
      pending: activeOrders.filter(o => o.status === 'pending'),
      preparing: activeOrders.filter(o => o.status === 'preparing'),
      ready: activeOrders.filter(o => o.status === 'ready'),
    };

    const nowServing = nowServingMap[canteenId] || 0;

    res.json({
      success: true,
      data: {
        nowServing,
        totalActive: activeOrders.length,
        grouped,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/queue/:canteenId/my-position/:orderId
export const getMyQueuePosition = async (req, res) => {
  try {
    const { canteenId, orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, student: req.user._id, canteen: canteenId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (['completed', 'cancelled'].includes(order.status)) {
      return res.json({ success: true, data: { queueNumber: order.queueNumber, status: order.status, ordersAhead: 0 } });
    }

    // Count orders with same/earlier queue number that are still active (pending/preparing)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const ordersAhead = await Order.countDocuments({
      canteen: canteenId,
      queueNumber: { $lt: order.queueNumber },
      status: { $in: ['pending', 'preparing'] },
      createdAt: { $gte: today, $lt: tomorrow },
    });

    res.json({
      success: true,
      data: {
        queueNumber: order.queueNumber,
        ordersAhead,
        estimatedPickupTime: order.estimatedPickupTime,
        status: order.status,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/queue/:canteenId/serving  { currentlyServing }
export const setNowServing = async (req, res) => {
  try {
    const { canteenId } = req.params;
    const { currentlyServing } = req.body;

    if (currentlyServing === undefined || currentlyServing < 0) {
      return res.status(400).json({ success: false, message: 'currentlyServing must be a non-negative number' });
    }

    // Enforce canteen ownership
    if (req.user.canteen?.toString() !== canteenId) {
      return res.status(403).json({ success: false, message: 'Not authorized for this canteen' });
    }

    nowServingMap[canteenId] = Number(currentlyServing);

    res.json({ success: true, data: { canteenId, currentlyServing: nowServingMap[canteenId] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
