import Order from '../models/Order.model.js';
import Cart from '../models/Cart.model.js';
import QueueSlot from '../models/QueueSlot.model.js';
import GroupSession from '../models/GroupSession.model.js';
import MenuItem from '../models/MenuItem.model.js';
import { sendCancellationEmail } from '../services/email.service.js';

const SLOT_INTERVAL_MINUTES = 10;
const MAX_ORDERS_PER_SLOT = 10;

const isAdminRole = (role) => ['admin', 'superAdmin'].includes(role);
const isElevatedOpsRole = (role) => ['admin', 'superAdmin', 'canteenManager'].includes(role);

const localDateStr = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const resolveRequestCanteenId = (req) => {
  const bodyCanteenId = req.body?.canteenId;
  const queryCanteenId = req.query?.canteen;
  const userCanteenId = req.user?.canteen ? req.user.canteen.toString() : '';
  return bodyCanteenId || queryCanteenId || userCanteenId || '';
};

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

const getItemCanteenId = (item) => {
  if (!item) return null;
  if (item.canteen && typeof item.canteen === 'object' && item.canteen._id) return item.canteen._id.toString();
  if (item.canteen) return item.canteen.toString();
  if (item.menuItem && typeof item.menuItem === 'object' && item.menuItem.canteen) {
    const menuCanteen = item.menuItem.canteen;
    if (typeof menuCanteen === 'object' && menuCanteen._id) return menuCanteen._id.toString();
    return menuCanteen.toString();
  }
  return null;
};

const filterItemsByCanteen = (items = [], canteenId) => {
  const target = canteenId ? canteenId.toString() : null;
  return items.filter((item) => getItemCanteenId(item) === target);
};

const removeItemsByCanteen = (items = [], canteenId) => {
  const target = canteenId ? canteenId.toString() : null;
  return items.filter((item) => getItemCanteenId(item) !== target);
};

const hydrateCartItemCanteens = async (cart) => {
  if (!cart?.items?.length) return;

  const missing = cart.items.filter((item) => !getItemCanteenId(item));
  if (!missing.length) return;

  const menuItemIds = [...new Set(missing.map((item) => item.menuItem?.toString()).filter(Boolean))];
  if (!menuItemIds.length) return;

  const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } }).select('_id canteen');
  const menuMap = new Map(menuItems.map((item) => [item._id.toString(), item.canteen?.toString() || null]));

  let changed = false;
  for (const item of cart.items) {
    if (getItemCanteenId(item)) continue;
    const resolved = menuMap.get(item.menuItem?.toString()) || null;
    if (resolved) {
      item.canteen = resolved;
      changed = true;
    }
  }

  if (changed) {
    await cart.save();
  }
};

// Helper: get or create next available queue slot for a canteen
async function assignQueueSlot(canteenId, preferredSlotTime = null) {
  const now = new Date();

  // If user picked a specific vibe/slot
  if (preferredSlotTime) {
    const slotTime = new Date(preferredSlotTime);
    const dateStr = localDateStr(slotTime);
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

  const dateStr = localDateStr(now); // 'YYYY-MM-DD'

  // Round up to next slot boundary
  const roundedMinutes = Math.ceil((now.getMinutes() + 1) / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
  let slotTime = new Date(now);
  slotTime.setMinutes(roundedMinutes, 0, 0);

  // Find slot with remaining capacity (try up to 48 slots = 8 hours)
  for (let i = 0; i < 48; i++) {
    const slotDateStr = localDateStr(slotTime);
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
    if (cart) await hydrateCartItemCanteens(cart);
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

        // Merge all member carts for this session canteen
        const memberCarts = await Cart.find({ student: { $in: session.members } });
        const allItems = [];
        for (const c of memberCarts) {
          await hydrateCartItemCanteens(c);

          // Convert to plain objects to avoid subdocument conflicts
          const sessionItems = filterItemsByCanteen(c.items, session.canteen);
          const items = sessionItems.map(item => ({
            menuItem: item.menuItem,
            canteen: session.canteen,
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity
          }));
          allItems.push(...items);
        }

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
      const sessionCanteenId = session.canteen.toString();
      let currentQueueNumber = await getNextQueueNumber(sessionCanteenId);
      const slotPreference = instantPickup ? new Date() : preferredSlotTime;
      const { slotTime } = await assignQueueSlot(sessionCanteenId, slotPreference);

      for (const memberId of members) {
        const memberCart = await Cart.findOne({ student: memberId });
        if (!memberCart || !memberCart.items || memberCart.items.length === 0) continue;

        await hydrateCartItemCanteens(memberCart);

        const memberItems = filterItemsByCanteen(memberCart.items, sessionCanteenId);
        if (memberItems.length === 0) continue;

        const memberTotal = memberItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        
        const orderPayload = {
          student: memberId,
          canteen: sessionCanteenId,
          items: memberItems,
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

        memberCart.items = removeItemsByCanteen(memberCart.items, sessionCanteenId);
        if (memberCart.items.length === 0) {
          await Cart.deleteOne({ _id: memberCart._id });
        } else {
          await memberCart.save();
        }
      }

      const creatorOrder = results.find(o => o.student.toString() === req.user._id.toString());
      return res.status(201).json({ 
        success: true, 
        message: `Placed ${results.length} orders for the group.`,
        data: creatorOrder || results[0],
        allOrders: results 
      });
    }

    // Standard ordering (individual checkout from one canteen at a time)
    const requestedCanteenId = req.body?.canteenId || null;
    const targetCanteenId = session
      ? session.canteen.toString()
      : (requestedCanteenId || getItemCanteenId(cart.items?.[0]));

    if (!targetCanteenId) {
      return res.status(400).json({ success: false, message: 'No canteen selected for checkout' });
    }

    let orderItems = filterItemsByCanteen(cart.items, targetCanteenId);

    // Backward-compatibility fallback for legacy cart items without canteen metadata
    if (!orderItems.length) {
      const unknownCanteenItems = (cart.items || []).filter((item) => !getItemCanteenId(item));
      if (unknownCanteenItems.length) {
        for (const item of unknownCanteenItems) {
          item.canteen = targetCanteenId;
        }
        if (typeof cart.save === 'function') {
          await cart.save();
        }
        orderItems = unknownCanteenItems;
      }
    }

    // Fallback for stale canteen tags: resolve from selected payload items
    if (!orderItems.length && requestedCanteenId && Array.isArray(req.body?.items)) {
      const requestedMenuIds = new Set(
        req.body.items
          .map((item) => item?.menuItem)
          .filter(Boolean)
          .map((id) => id.toString())
      );

      if (requestedMenuIds.size > 0) {
        const matchedItems = (cart.items || []).filter((item) => requestedMenuIds.has(item.menuItem?.toString()));

        if (matchedItems.length) {
          for (const item of matchedItems) {
            if (!getItemCanteenId(item)) {
              item.canteen = targetCanteenId;
            }
          }
          if (typeof cart.save === 'function') {
            await cart.save();
          }
          orderItems = matchedItems;
        }
      }
    }

    if (!orderItems.length) {
      return res.status(400).json({ success: false, message: 'No cart items found for the selected canteen' });
    }

    const totalPrice = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    // Assign queue slot + number
    const slotPreference = instantPickup ? new Date() : preferredSlotTime;
    const { slotTime } = await assignQueueSlot(targetCanteenId, slotPreference);
    const queueNumber = await getNextQueueNumber(targetCanteenId);

    const orderPayload = {
      student: req.user._id,
      canteen: targetCanteenId,
      items: orderItems,
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
          metadata: { totalPrice, itemCount: orderItems.length, instantPickup: !!instantPickup },
          createdAt: new Date(),
        },
      ],
    };
    if (session) orderPayload.groupSession = session._id;

    const order = await Order.create(orderPayload);
    console.log(`Order created: ${order._id}`);

    // Remove checked-out canteen items from cart(s)
    if (cartsToClear.length > 1) {
      await Cart.deleteMany({ student: { $in: cartsToClear } });
    } else {
      cart.items = removeItemsByCanteen(cart.items, targetCanteenId);
      if (!cart.items.length) {
        await Cart.deleteOne({ _id: cart._id });
      } else {
        await cart.save();
      }
    }

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
    const isGlobalViewer = isAdminRole(req.user.role);

    // Staff must use their assigned canteen; admins can optionally view all canteens.
    let canteenId;
    if (isElevated) {
      canteenId = req.query.canteen || null;
      if (!canteenId && !isGlobalViewer) {
        return res.status(400).json({
          success: false,
          code: 'CANTEEN_CONTEXT_REQUIRED',
          message: 'Please select a canteen context before loading orders.',
        });
      }
    } else {
      const assignedCanteenId = req.user.canteen ? req.user.canteen.toString() : '';
      const requestedCanteenId = req.query.canteen || '';

      // For non-elevated staff, always lock listing to assigned canteen when available.
      // This avoids stale UI context accidentally hiding newly placed orders.
      canteenId = assignedCanteenId || requestedCanteenId || null;

      if (!canteenId) {
        return res.status(403).json({
          success: false,
          code: 'STAFF_CANTEEN_NOT_ASSIGNED',
          message: 'No canteen is assigned to this staff account. Ask admin to assign a canteen.',
        });
      }

      if (assignedCanteenId) {
        canteenId = assignedCanteenId;
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
      .populate('payment.verifiedBy', 'name email role')
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
    const { status, reason, canteenId: bodyCanteenId } = req.body;
    const validTransitions = {
      pending: ['preparing', 'cancelled'],
      preparing: ['ready'],
      ready: ['completed'],
    };

    const order = await Order.findById(req.params.orderId).populate('student', 'email name studentId').populate('canteen', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isElevated = isElevatedOpsRole(req.user.role);
    const orderCanteenId = order.canteen?._id?.toString() || order.canteen?.toString();
    const assignedCanteenId = req.user?.canteen?.toString() || '';
    const requestCanteenId = bodyCanteenId || resolveRequestCanteenId(req) || '';
    const actorCanteenId = assignedCanteenId || requestCanteenId;

    // Enforce canteen ownership for non-elevated staff
    if (!isElevated && (!actorCanteenId || orderCanteenId !== actorCanteenId)) {
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
    const requestCanteenId = resolveRequestCanteenId(req);
    const orderCanteenId = order.canteen.toString();

    if (!isElevated) {
      if (!requestCanteenId) {
        return res.status(403).json({ success: false, message: 'Please select a canteen context before confirming delivery' });
      }
      if (requestCanteenId !== orderCanteenId) {
        return res.status(403).json({ success: false, message: 'Not authorized for this canteen' });
      }
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
    const requestCanteenId = resolveRequestCanteenId(req);
    const orderCanteenId = order.canteen.toString();

    if (!isElevated) {
      if (!requestCanteenId) {
        return res.status(403).json({ success: false, message: 'Please select a canteen context before confirming delivery' });
      }
      if (requestCanteenId !== orderCanteenId) {
        return res.status(403).json({ success: false, message: 'This order belongs to a different canteen' });
      }
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

