import QueueSlot from '../models/QueueSlot.model.js';
import Order from '../models/Order.model.js';
import CanteenQueue from '../models/CanteenQueue.model.js';

const SLOT_INTERVAL_MINUTES = 10;
const SLOTS_TO_SHOW = 12; // show next 2 hours of slots

// Helper: get today's date string
const todayStr = () => new Date().toISOString().split('T')[0];

// Helper: get or create a CanteenQueue record for today
async function getQueueRecord(canteenId) {
  const date = todayStr();
  return CanteenQueue.findOneAndUpdate(
    { canteen: canteenId, date },
    { $setOnInsert: { nowServing: 0 } },
    { new: true, upsert: true }
  );
}

// GET /api/queue/:canteenId/slots
export const getAvailableSlots = async (req, res) => {
  try {
    const { canteenId } = req.params;
    const now = new Date();

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
        isFull: orderCount >= maxCapacity,
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

    const [activeOrders, queueRecord] = await Promise.all([
      Order.find({
        canteen: canteenId,
        createdAt: { $gte: today, $lt: tomorrow },
        status: { $in: ['pending', 'preparing', 'ready'] },
      })
        .select('queueNumber status estimatedPickupTime student totalPrice createdAt')
        .populate('student', 'name studentId')
        .sort({ queueNumber: 1 }),
      getQueueRecord(canteenId),
    ]);

    const grouped = {
      pending: activeOrders.filter(o => o.status === 'pending'),
      preparing: activeOrders.filter(o => o.status === 'preparing'),
      ready: activeOrders.filter(o => o.status === 'ready'),
    };

    // Find the next queue number after nowServing that is still active
    const nowServing = queueRecord.nowServing;
    const nextInQueue = activeOrders.find(o => o.queueNumber > nowServing && o.status === 'pending');

    // Wait time & surge based on pending + preparing count
    const activeCountForWait = grouped.pending.length + grouped.preparing.length;
    const estimatedWaitTime = activeCountForWait * 3;
    const surgeAlert = activeCountForWait >= 10;

    res.json({
      success: true,
      data: {
        nowServing,
        nextQueueNumber: nextInQueue?.queueNumber || null,
        totalActive: activeOrders.length,
        estimatedWaitTime,
        surgeAlert,
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
      return res.json({ success: true, data: { queueNumber: order.queueNumber, status: order.status, ordersAhead: 0, estimatedWaitTimeMinutes: 0 } });
    }

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
        estimatedWaitTimeMinutes: ordersAhead * 3,
        estimatedPickupTime: order.estimatedPickupTime,
        status: order.status,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/queue/:canteenId/serving  { currentlyServing }
// Staff manually sets "now serving" to a specific number
export const setNowServing = async (req, res) => {
  try {
    const { canteenId } = req.params;
    const { currentlyServing } = req.body;

    if (currentlyServing === undefined || currentlyServing < 0) {
      return res.status(400).json({ success: false, message: 'currentlyServing must be a non-negative number' });
    }

    const isAdmin = ['admin', 'superAdmin'].includes(req.user.role);
    if (!isAdmin && req.user.canteen?.toString() !== canteenId) {
      return res.status(403).json({ success: false, message: 'Not authorized for this canteen' });
    }

    const date = todayStr();
    const record = await CanteenQueue.findOneAndUpdate(
      { canteen: canteenId, date },
      { nowServing: Number(currentlyServing) },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: { canteenId, nowServing: record.nowServing } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/queue/:canteenId/call-next
// Automatically advances "now serving" to the next pending queue number
export const callNext = async (req, res) => {
  try {
    const { canteenId } = req.params;

    const isAdmin = ['admin', 'superAdmin'].includes(req.user.role);
    if (!isAdmin && req.user.canteen?.toString() !== canteenId) {
      return res.status(403).json({ success: false, message: 'Not authorized for this canteen' });
    }

    const date = todayStr();
    const record = await getQueueRecord(canteenId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Find the next pending order after the current nowServing
    const nextOrder = await Order.findOne({
      canteen: canteenId,
      queueNumber: { $gt: record.nowServing },
      status: 'pending',
      createdAt: { $gte: today, $lt: tomorrow },
    }).sort({ queueNumber: 1 });

    if (!nextOrder) {
      return res.status(404).json({ success: false, message: 'No pending orders in queue' });
    }

    const updated = await CanteenQueue.findOneAndUpdate(
      { canteen: canteenId, date },
      { nowServing: nextOrder.queueNumber },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: { nowServing: updated.nowServing, student: nextOrder.student },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
