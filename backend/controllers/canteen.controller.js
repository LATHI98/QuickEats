import Canteen from '../models/Canteen.model.js';
import MenuItem from '../models/MenuItem.model.js';
import bcrypt from 'bcryptjs';

const normalizeOptionalString = (value, { lowerCase = false } = {}) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return lowerCase ? trimmed.toLowerCase() : trimmed;
};

const normalizeOptionalNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildCanteenFromBody = (body) => ({
  name: normalizeOptionalString(body.name),
  owner: normalizeOptionalString(body.owner),
  email: normalizeOptionalString(body.email, { lowerCase: true }),
  ratings: normalizeOptionalNumber(body.ratings),
  photo: normalizeOptionalString(body.photo),
  description: normalizeOptionalString(body.description),
  openHours: normalizeOptionalString(body.openHours),
  canteenPassword: normalizeOptionalString(body.canteenPassword),
});

const stripPasswordHash = (canteenDoc) => {
  if (!canteenDoc) return canteenDoc;
  const plain = canteenDoc.toObject ? canteenDoc.toObject() : { ...canteenDoc };
  delete plain.accessPasswordHash;
  return plain;
};

const hashPassword = async (password) => bcrypt.hash(password, 12);

export const createCanteen = async (req, res) => {
  try {
    const payload = buildCanteenFromBody(req.body);

    if (!payload.name || payload.name.length > 15) {
      return res.status(400).json({ message: 'Canteen name required (max 15 chars)' });
    }

    if (!payload.owner || payload.owner.length > 15) {
      return res.status(400).json({ message: 'Owner name required (max 15 chars)' });
    }

    if (!payload.email || !/^.+@gmail\.com$/.test(payload.email)) {
      return res.status(400).json({ message: 'Email must end with @gmail.com' });
    }

    if (!payload.canteenPassword) {
      return res.status(400).json({ message: 'Canteen password is required' });
    }

    const canteen = await Canteen.create({
      name: payload.name,
      owner: payload.owner,
      email: payload.email,
      ratings: Number.isFinite(payload.ratings) ? payload.ratings : 0,
      photo: payload.photo ?? '',
      description: payload.description ?? '',
      openHours: payload.openHours ?? '',
      accessPasswordHash: await hashPassword(payload.canteenPassword),
    });
    return res.status(201).json(stripPasswordHash(canteen));
  } catch (err) {
    console.error('createCanteen error:', err);
    return res.status(500).json({ message: 'Could not create canteen', error: err.message });
  }
};

export const getCanteens = async (req, res) => {
  try {
    const canteens = await Canteen.find().sort({ createdAt: -1 });
    return res.json(canteens);
  } catch (err) {
    console.error('getCanteens error:', err);
    return res.status(500).json({ message: 'Could not fetch canteens', error: err.message });
  }
};

export const getCanteenById = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });
    return res.json(stripPasswordHash(canteen));
  } catch (err) {
    console.error('getCanteenById error:', err);
    return res.status(500).json({ message: 'Could not fetch canteen', error: err.message });
  }
};

export const verifyCanteenPassword = async (req, res) => {
  try {
    const { canteenPassword } = req.body;
    if (!canteenPassword) {
      return res.status(400).json({ message: 'Canteen password is required' });
    }

    const canteen = await Canteen.findById(req.params.id).select('+accessPasswordHash');
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });

    if (!canteen.accessPasswordHash) {
      return res.status(400).json({ message: 'Canteen password is not configured' });
    }

    const isMatch = await bcrypt.compare(canteenPassword, canteen.accessPasswordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid canteen password' });
    }

    return res.json({ success: true, data: stripPasswordHash(canteen) });
  } catch (err) {
    console.error('verifyCanteenPassword error:', err);
    return res.status(500).json({ message: 'Could not verify canteen password', error: err.message });
  }
};

export const getCanteenMenu = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });

    const menuItems = await MenuItem.find({ canteen: req.params.id })
      .sort({ createdAt: -1 })
      .populate('canteen', 'name');

    return res.json({
      success: true,
      data: menuItems,
    });
  } catch (err) {
    console.error('getCanteenMenu error:', err);
    return res.status(500).json({ message: 'Could not fetch canteen menu', error: err.message });
  }
};

const buildMenuItemFromBody = (body) => ({
  name: body.name?.trim(),
  category: body.category?.trim() ?? '',
  price: Number(body.price),
  canteen: body.canteen || undefined,
  description: body.description?.trim() ?? '',
  isAvailable: body.isAvailable === undefined ? true : body.isAvailable === true || body.isAvailable === 'true',
  image: body.image?.trim() ?? '',
});

export const createCanteenMenuItem = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });

    const payload = buildMenuItemFromBody({ ...req.body, canteen: req.params.id });
    if (!payload.name) return res.status(400).json({ message: 'Item name is required' });
    if (!Number.isFinite(payload.price) || payload.price < 0) return res.status(400).json({ message: 'Item price must be a valid number' });

    const menuItem = await MenuItem.create(payload);
    return res.status(201).json({ success: true, data: menuItem });
  } catch (err) {
    console.error('createCanteenMenuItem error:', err);
    return res.status(500).json({ message: 'Could not create menu item', error: err.message });
  }
};

export const updateCanteenMenuItem = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });

    const existing = await MenuItem.findOne({ _id: req.params.menuItemId, canteen: req.params.id });
    if (!existing) return res.status(404).json({ message: 'Menu item not found' });

    const payload = buildMenuItemFromBody({ ...req.body, canteen: req.params.id });
    if (payload.name !== undefined && !payload.name) return res.status(400).json({ message: 'Item name is required' });
    if (payload.price !== undefined && !Number.isFinite(payload.price)) return res.status(400).json({ message: 'Item price must be a valid number' });

    if (payload.name) existing.name = payload.name;
    if (payload.category !== undefined) existing.category = payload.category;
    if (Number.isFinite(payload.price)) existing.price = payload.price;
    if (payload.description !== undefined) existing.description = payload.description;
    if (req.body.isAvailable !== undefined) existing.isAvailable = payload.isAvailable;
    if (payload.image !== undefined) existing.image = payload.image;

    await existing.save();
    return res.json({ success: true, data: existing });
  } catch (err) {
    console.error('updateCanteenMenuItem error:', err);
    return res.status(500).json({ message: 'Could not update menu item', error: err.message });
  }
};

export const deleteCanteenMenuItem = async (req, res) => {
  try {
    const deleted = await MenuItem.findOneAndDelete({ _id: req.params.menuItemId, canteen: req.params.id });
    if (!deleted) return res.status(404).json({ message: 'Menu item not found' });
    return res.json({ success: true, message: 'Menu item deleted' });
  } catch (err) {
    console.error('deleteCanteenMenuItem error:', err);
    return res.status(500).json({ message: 'Could not delete menu item', error: err.message });
  }
};

export const updateCanteen = async (req, res) => {
  try {
    const payload = buildCanteenFromBody(req.body);

    if (payload.name && payload.name.length > 15) {
      return res.status(400).json({ message: 'Canteen name must be max 15 chars' });
    }
    if (payload.owner && payload.owner.length > 15) {
      return res.status(400).json({ message: 'Owner name must be max 15 chars' });
    }
    if (payload.email && !/^.+@gmail\.com$/.test(payload.email)) {
      return res.status(400).json({ message: 'Email must end with @gmail.com' });
    }

    const canteen = await Canteen.findById(req.params.id).select('+accessPasswordHash');
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });

    if (payload.name) canteen.name = payload.name;
    if (payload.owner) canteen.owner = payload.owner;
    if (payload.email) canteen.email = payload.email;
    if (Number.isFinite(payload.ratings)) canteen.ratings = payload.ratings;
    if (payload.photo !== undefined) canteen.photo = payload.photo;
    if (payload.description !== undefined) canteen.description = payload.description;
    if (payload.openHours !== undefined) canteen.openHours = payload.openHours;

    if (payload.canteenPassword) {
      canteen.accessPasswordHash = await hashPassword(payload.canteenPassword);
    }

    await canteen.save();
    return res.json(stripPasswordHash(canteen));
  } catch (err) {
    console.error('updateCanteen error:', err);
    return res.status(500).json({ message: 'Could not update canteen', error: err.message });
  }
};

export const deleteCanteen = async (req, res) => {
  try {
    const canteen = await Canteen.findByIdAndDelete(req.params.id);
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });
    return res.json({ message: 'Canteen deleted' });
  } catch (err) {
    console.error('deleteCanteen error:', err);
    return res.status(500).json({ message: 'Could not delete canteen', error: err.message });
  }
};

// PATCH /:id/settings — canteenManager updates their own canteen's operational fields
export const updateCanteenSettings = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });

    if (req.user.role === 'canteenManager') {
      const assignedId = String(req.user.canteen?._id || req.user.canteen || '');
      if (assignedId !== String(canteen._id)) {
        return res.status(403).json({ message: 'You can only update your assigned canteen' });
      }
    }

    const { openHours, description, notice, isOpen } = req.body;
    if (openHours !== undefined) canteen.openHours = String(openHours).trim();
    if (description !== undefined) canteen.description = String(description).trim();
    if (notice !== undefined) canteen.notice = String(notice).trim();
    if (isOpen !== undefined) canteen.isOpen = Boolean(isOpen);

    await canteen.save();
    return res.json({ success: true, canteen: stripPasswordHash(canteen) });
  } catch (err) {
    console.error('updateCanteenSettings error:', err);
    return res.status(500).json({ message: 'Could not update canteen settings' });
  }
};
