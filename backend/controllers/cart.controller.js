import Cart from '../models/Cart.model.js';
import MenuItem from '../models/MenuItem.model.js';

const getCanteenMetaFromItem = (item) => {
  const canteenDoc = item?.canteen || item?.menuItem?.canteen || null;
  if (!canteenDoc) return { id: null, name: 'Unknown Canteen' };

  if (typeof canteenDoc === 'object' && canteenDoc._id) {
    return { id: canteenDoc._id.toString(), name: canteenDoc.name || 'Canteen' };
  }

  return { id: canteenDoc.toString(), name: 'Canteen' };
};

const buildGroupedCarts = (items = []) => {
  const groupsMap = new Map();

  for (const item of items) {
    const canteenMeta = getCanteenMetaFromItem(item);
    const key = canteenMeta.id || 'unknown';

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        canteen: canteenMeta.id ? { _id: canteenMeta.id, name: canteenMeta.name } : null,
        items: [],
        totalPrice: 0,
      });
    }

    const group = groupsMap.get(key);
    group.items.push(item);
    group.totalPrice += (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
  }

  return Array.from(groupsMap.values());
};

// GET /api/cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ student: req.user._id })
      .populate('items.menuItem', 'name price isAvailable canteen')
      .populate('items.canteen', 'name')
      .populate('canteen', 'name');

    if (!cart) {
      return res.json({ success: true, data: { items: [], totalPrice: 0, canteen: null, groups: [] } });
    }

    const groups = buildGroupedCarts(cart.items || []);
    const primaryCanteen = groups[0]?.canteen || cart.canteen || null;

    res.json({
      success: true,
      data: {
        ...cart.toObject(),
        canteen: primaryCanteen,
        groups,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/cart/items  { menuItemId, quantity }
export const addItem = async (req, res) => {
  try {
    const { menuItemId, quantity } = req.body;
    if (!menuItemId || !quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'menuItemId and quantity (>=1) are required' });
    }

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) return res.status(404).json({ success: false, message: 'Menu item not found' });
    if (!menuItem.isAvailable) return res.status(400).json({ success: false, message: 'Item is currently unavailable' });

    let cart = await Cart.findOne({ student: req.user._id });

    if (cart) {
      const existingIdx = cart.items.findIndex(i => i.menuItem.toString() === menuItemId);
      if (existingIdx > -1) {
        cart.items[existingIdx].quantity += Number(quantity);
        if (!cart.items[existingIdx].canteen) {
          cart.items[existingIdx].canteen = menuItem.canteen;
        }
      } else {
        cart.items.push({
          menuItem: menuItemId,
          canteen: menuItem.canteen,
          name: menuItem.name,
          unitPrice: menuItem.price,
          quantity: Number(quantity),
        });
      }
    } else {
      cart = new Cart({
        student: req.user._id,
        canteen: menuItem.canteen,
        items: [{
          menuItem: menuItemId,
          canteen: menuItem.canteen,
          name: menuItem.name,
          unitPrice: menuItem.price,
          quantity: Number(quantity),
        }],
      });
    }

    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/cart/items/:menuItemId  { quantity }
export const updateItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { menuItemId } = req.params;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ success: false, message: 'quantity must be >= 0' });
    }

    const cart = await Cart.findOne({ student: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const idx = cart.items.findIndex(i => i.menuItem.toString() === menuItemId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Item not in cart' });

    if (Number(quantity) === 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = Number(quantity);
    }

    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/cart/items/:menuItemId
export const removeItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const cart = await Cart.findOne({ student: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(i => i.menuItem.toString() !== menuItemId);

    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/cart
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ student: req.user._id });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
