import QRCode from 'qrcode';
import Order from '../models/Order.model.js';
import Cart from '../models/Cart.model.js';
import QueueSlot from '../models/QueueSlot.model.js';
import GroupSession from '../models/GroupSession.model.js';

const SLOT_INTERVAL_MINUTES = 10;
const MAX_ORDERS_PER_SLOT = 10;

// Generate a short 6-character alphanumeric pickup code (e.g. "QK82F1")
const generatePickupCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusable chars (0/O, 1/I)
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

// Helper: get or create next available queue slot for a canteen
async function assignQueueSlot(canteenId) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // 'YYYY-MM-DD'

  // Round up to next slot boundary
  const roundedMinutes = Math.ceil((now.getMinutes() + 1) / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
  let slotTime = new Date(now);
  slotTime.setMinutes(roundedMinutes, 0, 0);

  // Find slot with remaining capacity (try up to 48 slots = 8 hours)
  for (let i = 0; i < 48; i++) {
    const slotDateStr = slotTime.toISOString().split('T')[0];
    let slot = await QueueSlot.findOne({ canteen: canteenId, slotTime });

    if (!slot) {
      slot = await QueueSlot.create({
        canteen: canteenId,
        date: slotDateStr,
        slotTime,
        orderCount: 0,
        maxCapacity: MAX_ORDERS_PER_SLOT,
      });
    }

    if (slot.orderCount < slot.maxCapacity) {
      slot.orderCount += 1;
      await slot.save();
      return { slotTime, slot };
    }

    // Move to next slot
    slotTime = new Date(slotTime.getTime() + SLOT_INTERVAL_MINUTES * 60 * 1000);
  }

  throw new Error('No available queue slots for the next 8 hours');
}

// Helper: get next queue number for a canteen on today
async function getNextQueueNumber(canteenId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const count = await Order.countDocuments({
    canteen: canteenId,
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  return count + 1;
}

// POST /api/orders
export const placeOrder = async (req, res) => {
  try {
    const { groupSessionId } = req.body || {};

    let cart = await Cart.findOne({ student: req.user._id });
    let session = null;
    let cartsToClear = [req.user._id];

    if (groupSessionId) {
      session = await GroupSession.findById(groupSessionId);
      if (!session) return res.status(404).json({ success: false, message: 'Group session not found' });
      if (session.status !== 'locked') return res.status(400).json({ success: false, message: 'Session must be locked to checkout' });
      if (!session.members.includes(req.user._id)) return res.status(403).json({ success: false, message: 'Not a member of this session' });

      if (session.paymentMode === 'pay_together') {
        if (session.creator.toString() !== req.user._id.toString()) {
          return res.status(403).json({ success: false, message: 'Only the session creator can place a pay_together order' });
        }

        // Merge all member carts
        const memberCarts = await Cart.find({ student: { $in: session.members }, canteen: session.canteen });
        const allItems = [];
        memberCarts.forEach(c => allItems.push(...c.items));

        if (allItems.length === 0) {
          return res.status(400).json({ success: false, message: 'Group carts are empty' });
        }

        cart = {
          student: req.user._id,
          canteen: session.canteen,
          items: allItems,
        };
        cartsToClear = session.members;
      }
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    const totalPrice = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    // Assign queue slot + number
    const { slotTime } = await assignQueueSlot(cart.canteen);
    const queueNumber = await getNextQueueNumber(cart.canteen);

    // Generate short pickup code (retry if collision)
    let pickupCode;
    let attempts = 0;
    do {
      pickupCode = generatePickupCode();
      attempts++;
      if (attempts > 10) throw new Error('Could not generate unique pickup code');
    } while (await Order.exists({ pickupCode }));

    // Generate QR image from the short pickup code
    const qrCodeData = await QRCode.toDataURL(pickupCode, {
      width: 220,
      margin: 1,
      color: { dark: '#4338ca', light: '#eef2ff' }, // indigo on indigo-50
    });

    const orderPayload = {
      student: req.user._id,
      canteen: cart.canteen,
      items: cart.items,
      totalPrice,
      queueNumber,
      estimatedPickupTime: slotTime,
      pickupCode,
      qrCodeData,
    };
    if (session) orderPayload.groupSession = session._id;

    const order = await Order.create(orderPayload);

    // Clear cart(s)
    await Cart.deleteMany({ student: { $in: cartsToClear } });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/:orderId/cancel
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, student: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled' });
    }
    if (order.payment.status !== 'unpaid') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a paid order' });
    }

    order.status = 'cancelled';
    await order.save();

    // Free up the queue slot
    await QueueSlot.findOneAndUpdate(
      { canteen: order.canteen, slotTime: order.estimatedPickupTime },
      { $inc: { orderCount: -1 } }
    );

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/my  ?status=&date=YYYY-MM-DD
export const getMyOrders = async (req, res) => {
  try {
    const filter = { student: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) {
      const start = new Date(req.query.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.query.date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(filter)
      .populate('canteen', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/my/:orderId
export const getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, student: req.user._id })
      .populate('canteen', 'name');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/canteen  ?status=&date=&canteen=  (canteen staff / admin)
export const getCanteenOrders = async (req, res) => {
  try {
    const isAdmin = ['admin', 'superAdmin'].includes(req.user.role);

    // Staff must use their assigned canteen; admins can optionally filter by canteen param
    let canteenId;
    if (isAdmin) {
      canteenId = req.query.canteen || null; // optional for admin
    } else {
      canteenId = req.user.canteen;
      if (!canteenId) return res.status(400).json({ success: false, message: 'No canteen assigned to your account' });
    }

    const filter = {};
    if (canteenId) filter.canteen = canteenId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) {
      const start = new Date(req.query.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.query.date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(filter)
      .populate('student', 'name studentId email')
      .populate('canteen', 'name')
      .populate('groupSession', 'shareCode paymentMode')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/:orderId/status  { status }
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validTransitions = {
      preparing: 'ready',
      ready: 'completed',
    };

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Enforce canteen ownership
    if (order.canteen.toString() !== req.user.canteen?.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this canteen' });
    }

    // Validate transition
    if (validTransitions[order.status] !== status) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${order.status}' to '${status}'`,
      });
    }

    // Must be payment verified before preparing (staff can't advance if not paid)
    if (order.status === 'pending' && order.payment.status !== 'verified') {
      return res.status(400).json({ success: false, message: 'Payment must be verified before preparing' });
    }

    order.status = status;
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/orders/:orderId/pickup-verify  (staff clicks on the matching order — no token needed)
export const verifyPickup = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('student', 'name studentId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isAdmin = ['admin', 'superAdmin'].includes(req.user.role);
    if (!isAdmin && order.canteen.toString() !== req.user.canteen?.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this canteen' });
    }
    if (order.pickupVerified) {
      return res.status(400).json({ success: false, message: 'Order already picked up' });
    }
    if (order.status !== 'ready') {
      return res.status(400).json({ success: false, message: 'Order is not ready for pickup yet' });
    }

    order.pickupVerified = true;
    order.pickupVerifiedAt = new Date();
    order.status = 'completed';
    await order.save();

    res.json({ success: true, message: 'Pickup confirmed', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/orders/pickup-by-code  { pickupCode }  (staff enters/scans 6-char code)
export const pickupByCode = async (req, res) => {
  try {
    const { pickupCode } = req.body;
    if (!pickupCode) return res.status(400).json({ success: false, message: 'pickupCode is required' });

    const order = await Order.findOne({ pickupCode: pickupCode.toUpperCase().trim() })
      .populate('student', 'name studentId');

    if (!order) return res.status(404).json({ success: false, message: 'No order found with that code' });

    const isAdmin = ['admin', 'superAdmin'].includes(req.user.role);
    if (!isAdmin && order.canteen.toString() !== req.user.canteen?.toString()) {
      return res.status(403).json({ success: false, message: 'This order belongs to a different canteen' });
    }
    if (order.status !== 'ready') {
      return res.status(400).json({ success: false, message: `Order is currently '${order.status}' — it must be 'ready' before pickup` });
    }
    if (order.pickupVerified) {
      return res.status(400).json({ success: false, message: 'This order has already been picked up' });
    }

    order.pickupVerified = true;
    order.pickupVerifiedAt = new Date();
    order.status = 'completed';
    await order.save();

    res.json({ success: true, message: `Pickup confirmed for ${order.student?.name || 'student'}`, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

