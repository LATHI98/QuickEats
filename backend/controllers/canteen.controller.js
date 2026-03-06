import Canteen from '../models/Canteen.model.js';
import MenuItem from '../models/MenuItem.model.js';
import * as PredictionService from '../services/prediction.service.js';

// GET /api/canteens — list all open canteens
export const getCanteens = async (req, res) => {
  try {
    const canteens = await Canteen.find().sort({ name: 1 });

    // Enrich with queue predictions
    const enrichedCanteens = await Promise.all(
      canteens.map(async (c) => {
        const [waitTime, surge] = await Promise.all([
          PredictionService.predictWaitTime(c._id),
          PredictionService.predictSurge(c._id),
        ]);
        return {
          ...c.toObject(),
          currentWaitTime: waitTime,
          isSurge: surge.isSurge,
          surgeReason: surge.reason,
        };
      })
    );

    res.json({ success: true, data: enrichedCanteens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/canteens/:id — single canteen
export const getCanteen = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) return res.status(404).json({ success: false, message: 'Canteen not found' });
    res.json({ success: true, data: canteen });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/canteens/:id/menu — menu items for a canteen
export const getCanteenMenu = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { canteen: req.params.id, isAvailable: true };
    if (category) filter.category = category;
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
