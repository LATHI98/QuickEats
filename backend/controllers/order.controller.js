import Order from '../models/Order.model.js';
import Cart from '../models/Cart.model.js';
import QueueSlot from '../models/QueueSlot.model.js';
import GroupSession from '../models/GroupSession.model.js';
import { sendCancellationEmail } from '../services/email.service.js';

const SLOT_INTERVAL_MINUTES = 10;
const MAX_ORDERS_PER_SLOT = 10;

const isAdminRole = (role) => ['admin', 'superAdmin'].includes(role);
const isElevatedOpsRole = (role) => ['admin', 'superAdmin', 'canteenManager', 'canteenStaff'].includes(role);

const appendActivity = (order, { action, actor = null, actorRole = null, note = '', metadata = null }) => {
  order.activityLogs.push({
    action,
    actor,
    actorRole,
    note,
    metadata,
    createdAt: new Date(),
  });
};

// Helper: get or create next available queue slot for a canteen
async function assignQueueSlot(canteenId, preferredSlotTime = null) {
  const now = new Date();

  // If user picked a specific vibe/slot
  if (preferredSlotTime) {
    const slotTime = new Date(preferredSlotTime);
    const dateStr = slotTime.toISOString().split('T')[0];
    let slot = await QueueSlot.findOne({ canteen: canteenId, slotTime });
    if (!slot) {
      slot = await QueueSlot.create({
        canteen: canteenId,
        date: dateStr,
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
    // If preferred is full, fallback to auto-assign
  }

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
    const { groupSessionId, preferredSlotTime, instantPickup = false } = req.body || {};
    console.log(`Placing order. User: ${req.user._id}, PreferredSlot: ${preferredSlotTime}`);

    let cart = await Cart.findOne({ student: req.user._id });
    let session = null;
    let cartsToClear = [req.user._id];

    if (groupSessionId) {
      session = await GroupSession.findById(groupSessionId);
      if (!session) return res.status(404).json({ success: false, message: 'Group session not found' });
      if (session.status !== 'locked') return res.status(400).json({ success: false, message: 'Session must be locked to checkout' });

      const isMember = session.members.some(m => m.toString() === req.user._id.toString());
      if (!isMember) return res.status(403).json({ success: false, message: 'Not a member of this session' });

      if (session.paymentMode === 'pay_together') {
        if (session.creator.toString() !== req.user._id.toString()) {
          return res.status(403).json({ success: false, message: 'Only the session creator can place a pay_together order' });
        }

        // Merge all member carts
        const memberCarts = await Cart.find({ student: { $in: session.members }, canteen: session.canteen });
        const allItems = [];
        memberCarts.forEach(c => {
          // Convert to plain objects to avoid subdocument conflicts
          const items = c.items.map(item => ({
            menuItem: item.menuItem,
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity
          }));
          allItems.push(...items);
        });

        if (allItems.length === 0) {
          return res.status(400).json({ success: false, message: 'Group members have no items in their carts for this canteen' });
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

    const { submitGroup = false } = req.body;
    const isPaySeparately = session && session.paymentMode === 'pay_separately';
    const isCreator = session && session.creator.toString() === req.user._id.toString();

    // If it's a coordinated group submission (pay_separately + creator choice)
    if (submitGroup && isPaySeparately && isCreator) {
      const results = [];
      const members = session.members;
      
      // Calculate start queue number for the block
      let currentQueueNumber = await getNextQueueNumber(cart.canteen);
      const slotPreference = instantPickup ? new Date() : preferredSlotTime;
      const { slotTime } = await assignQueueSlot(cart.canteen, slotPreference);

      for (const memberId of members) {
        const memberCart = await Cart.findOne({ student: memberId, canteen: cart.canteen });
        if (!memberCart || !memberCart.items || memberCart.items.length === 0) continue;

        const memberTotal = memberCart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        
        const orderPayload = {
          student: memberId,
          canteen: cart.canteen,
          items: memberCart.items,
          totalPrice: memberTotal,
          queueNumber: currentQueueNumber++,
          estimatedPickupTime: slotTime,
          instantPickupRequested: !!instantPickup,
          status: 'pending',
          groupSession: session._id,
          activityLogs: [
            {
              action: 'order_placed',
              actor: req.user._id,
              actorRole: req.user.role,
              note: `Order placed via Coordinated Group Submission by ${req.user.name}`,
              metadata: { isGroupSubmission: true, creator: req.user._id },
              createdAt: new Date(),
            },
          ],
        };

        const newOrder = await Order.create(orderPayload);
        results.push(newOrder);
        await Cart.deleteOne({ _id: memberCart._id });
      }

      const creatorOrder = results.find(o => o.student.toString() === req.user._id.toString());
      return res.status(201).json({ 
        success: true, 
        message: `Placed ${results.length} orders for the group.`,
        data: creatorOrder || results[0],
        allOrders: results 
      });
    }

    // Standard ordering (Individual or Pay Together)
    const totalPrice = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    // Assign queue slot + number
    const slotPreference = instantPickup ? new Date() : preferredSlotTime;
    const { slotTime } = await assignQueueSlot(cart.canteen, slotPreference);
    const queueNumber = await getNextQueueNumber(cart.canteen);

    const orderPayload = {
      student: req.user._id,
      canteen: cart.canteen,
      items: cart.items, // These are now plain objects if from pay_together, or Mongoose subdocs if from single cart
      totalPrice,
      queueNumber,
      estimatedPickupTime: slotTime,
      instantPickupRequested: !!instantPickup,
      status: 'pending',
      priorityLevel: instantPickup ? 1 : 0,
      isPriorityClaimed: !!instantPickup,
      priorityClaimedAt: instantPickup ? new Date() : null,
      activityLogs: [
        {
          action: 'order_placed',
          actor: req.user._id,
          actorRole: req.user.role,
          note: instantPickup ? 'Order placed by student (instant pickup requested)' : 'Order placed by student',
          metadata: { totalPrice, itemCount: cart.items.length, instantPickup: !!instantPickup },
          createdAt: new Date(),
        },
      ],
    };
    if (session) orderPayload.groupSession = session._id;

    const order = await Order.create(orderPayload);
    console.log(`Order created: ${order._id}`);

    // Clear cart(s)
    await Cart.deleteMany({ student: { $in: cartsToClear } });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error while placing order' });
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
    appendActivity(order, {
      action: 'order_cancelled',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Order cancelled by student',
      metadata: { previousStatus: 'pending' },
    });
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
    const isElevated = isElevatedOpsRole(req.user.role);

    // Staff must use their assigned canteen; elevated roles must provide canteen context
    let canteenId;
    if (isElevated) {
      canteenId = req.query.canteen || null;
      if (!canteenId) {
        return res.status(400).json({
          success: false,
          code: 'CANTEEN_CONTEXT_REQUIRED',
          message: 'Please select a canteen context before loading orders.',
        });
      }
    } else {
      canteenId = req.user.canteen;
      if (!canteenId) {
        return res.status(403).json({
          success: false,
          code: 'STAFF_CANTEEN_NOT_ASSIGNED',
          message: 'No canteen is assigned to this staff account. Ask admin to assign a canteen.',
        });
      }
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
      .populate('activityLogs.actor', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/:orderId/status  { status, reason }
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const validTransitions = {
      pending: ['preparing', 'cancelled'],
      preparing: ['ready'],
      ready: ['completed'],
    };

    const order = await Order.findById(req.params.orderId).populate('student', 'email name studentId').populate('canteen', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isElevated = isElevatedOpsRole(req.user.role);

    // Enforce canteen ownership for non-elevated staff
    if (!isElevated && order.canteen._id.toString() !== req.user.canteen?.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this canteen' });
    }

    // Validate transition
    if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${order.status}' to '${status}'`,
      });
    }

    // Must be payment verified before preparing
    if (status === 'preparing' && order.payment.status !== 'verified') {
      return res.status(400).json({ success: false, message: 'Payment must be verified before preparing' });
    }

    const previousStatus = order.status;
    order.status = status;
    appendActivity(order, {
      action: 'order_status_updated',
      actor: req.user._id,
      actorRole: req.user.role,
      note: status === 'cancelled' 
        ? `Order cancelled by staff. Reason: ${reason || 'Not specified'}`
        : `Order status changed from ${previousStatus} to ${status}`,
      metadata: { previousStatus, newStatus: status, reason },
    });
    await order.save();

    // Notify student if cancelled
    if (status === 'cancelled' && order.student?.email) {
      // Async call, don't block response
      sendCancellationEmail(order.student.email, order, reason).catch(err => console.error('Email send failed:', err));
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/orders/:orderId/pickup-verify  (staff clicks on the matching order — no token needed)
export const verifyPickup = async (req, res) => {
  try {
    const { pickupCode, qrValidated } = req.body || {};
    const order = await Order.findById(req.params.orderId).populate('student', 'name studentId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const normalizedCode = String(pickupCode || '').trim().toUpperCase();
    if (!normalizedCode) {
      return res.status(400).json({ success: false, message: 'pickupCode is required for pickup verification' });
    }
    // qrValidated is now optional as per user feedback that visual check can be "useless"
    // The 6-digit code match is the primary security.
    if (!order.pickupCode || normalizedCode !== String(order.pickupCode).trim().toUpperCase()) {
      return res.status(400).json({ success: false, message: 'Pickup code does not match this order' });
    }

    const isElevated = isElevatedOpsRole(req.user.role);
    if (!isElevated && order.canteen.toString() !== req.user.canteen?.toString()) {
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
    appendActivity(order, {
      action: 'pickup_verified',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Pickup verified by staff',
      metadata: { verificationMethod: 'order_id', pickupCodeMatched: true, qrValidated: true },
    });
    await order.save();

    res.json({ success: true, message: 'Pickup confirmed', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/orders/pickup-by-code  { pickupCode }  (staff enters/scans 6-char code)
export const pickupByCode = async (req, res) => {
  try {
    const { pickupCode, qrValidated } = req.body;
    if (!pickupCode) return res.status(400).json({ success: false, message: 'pickupCode is required' });
    // qrValidated is now optional for code-based pickup

    const order = await Order.findOne({ pickupCode: pickupCode.toUpperCase().trim() })
      .populate('student', 'name studentId');

    if (!order) return res.status(404).json({ success: false, message: 'No order found with that code' });

    const isElevated = isElevatedOpsRole(req.user.role);
    if (!isElevated && order.canteen.toString() !== req.user.canteen?.toString()) {
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
    appendActivity(order, {
      action: 'pickup_verified',
      actor: req.user._id,
      actorRole: req.user.role,
      note: 'Pickup verified by code scan',
      metadata: { verificationMethod: 'pickup_code', pickupCode: order.pickupCode, qrValidated: true },
    });
    await order.save();

    res.json({ success: true, message: `Pickup confirmed for ${order.student?.name || 'student'}`, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

