import SystemConfig from '../models/SystemConfig.model.js';

const getOrCreateConfig = () =>
  SystemConfig.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global' } },
    { new: true, upsert: true }
  );

export const getSystemConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    return res.json({ success: true, config });
  } catch (err) {
    console.error('getSystemConfig error:', err);
    return res.status(500).json({ message: 'Could not load system config' });
  }
};

export const updateSystemConfig = async (req, res) => {
  try {
    const { announcement, announcementActive, allowRegistration } = req.body;
    const updates = {};

    if (announcement !== undefined) updates.announcement = String(announcement).trim();
    if (announcementActive !== undefined) updates.announcementActive = Boolean(announcementActive);
    if (allowRegistration !== undefined) updates.allowRegistration = Boolean(allowRegistration);

    const config = await SystemConfig.findOneAndUpdate(
      { key: 'global' },
      { $set: updates },
      { new: true, upsert: true }
    );
    return res.json({ success: true, config });
  } catch (err) {
    console.error('updateSystemConfig error:', err);
    return res.status(500).json({ message: 'Could not update system config' });
  }
};
