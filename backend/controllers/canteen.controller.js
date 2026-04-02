import Canteen from '../models/Canteen.model.js';

const buildCanteenFromBody = (body) => ({
  name: body.name?.trim(),
  owner: body.owner?.trim(),
  email: body.email?.trim().toLowerCase(),
  ratings: Number(body.ratings ?? 0),
  photo: body.photo?.trim() ?? '',
  description: body.description?.trim() ?? '',
  openHours: body.openHours?.trim() ?? '',
});

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

    const canteen = await Canteen.create(payload);
    return res.status(201).json(canteen);
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
    return res.json(canteen);
  } catch (err) {
    console.error('getCanteenById error:', err);
    return res.status(500).json({ message: 'Could not fetch canteen', error: err.message });
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

    const canteen = await Canteen.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!canteen) return res.status(404).json({ message: 'Canteen not found' });
    return res.json(canteen);
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
