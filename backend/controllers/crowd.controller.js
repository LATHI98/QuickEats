import CrowdCount from '../models/CrowdCount.model.js';

// POST /api/crowd
export const createCrowdCount = async (req, res) => {
  try {
    const { count, timestamp, canteenId } = req.body;

    // Validate incoming people count to avoid storing invalid values.
    if (!Number.isInteger(count) || count < 0) {
      return res.status(400).json({ message: 'count must be a non-negative integer' });
    }

    const crowdCount = await CrowdCount.create({
      count,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      canteen: canteenId || null,
    });

    return res.status(201).json({
      message: 'Crowd count saved',
      data: crowdCount,
    });
  } catch (error) {
    console.error('createCrowdCount error:', error);
    return res.status(500).json({ message: 'Failed to save crowd count' });
  }
};

// GET /api/crowd
export const getLatestCrowdCount = async (req, res) => {
  try {
    const { canteenId } = req.query;
    
    // Return the most recent crowd reading.
    const query = {};
    if (canteenId) {
      query.canteen = canteenId;
    }
    let latest = await CrowdCount.findOne(query).sort({ timestamp: -1 });

    // If no specific canteen data is found, fallback to the absolute latest camera reading
    // This ensures the real-time camera feed still shows up if the python script hasn't specified a canteen.
    if (!latest) {
      latest = await CrowdCount.findOne().sort({ timestamp: -1 });
    }

    if (!latest) {
      return res.json({ count: 0, timestamp: null, status: 'Low' });
    }

    return res.json(latest);
  } catch (error) {
    console.error('getLatestCrowdCount error:', error);
    return res.status(500).json({ message: 'Failed to fetch latest crowd count' });
  }
};
