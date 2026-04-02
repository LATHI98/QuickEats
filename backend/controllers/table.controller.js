import Table from '../models/Table.model.js';

export const createTable = async (req, res) => {
  try {
    const { canteenId, tableNumber, capacity } = req.body;

    if (!canteenId || !tableNumber || !capacity) {
      return res.status(400).json({ message: 'canteenId, tableNumber, and capacity are required' });
    }

    if (capacity < 1) {
      return res.status(400).json({ message: 'Capacity must be at least 1' });
    }

    const table = await Table.create({ canteenId, tableNumber, capacity });
    return res.status(201).json(table);
  } catch (err) {
    console.error('createTable error:', err);
    return res.status(500).json({ message: 'Could not create table', error: err.message });
  }
};

export const getTablesByCanteen = async (req, res) => {
  try {
    const { canteenId } = req.params;

    if (!canteenId) {
      return res.status(400).json({ message: 'canteenId is required' });
    }

    const tables = await Table.find({ canteenId }).sort({ tableNumber: 1 });
    return res.json(tables);
  } catch (err) {
    console.error('getTablesByCanteen error:', err);
    return res.status(500).json({ message: 'Could not fetch tables', error: err.message });
  }
};

export const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNumber, capacity } = req.body;

    if (capacity && capacity < 1) {
      return res.status(400).json({ message: 'Capacity must be at least 1' });
    }

    const table = await Table.findByIdAndUpdate(
      id,
      { tableNumber, capacity },
      { new: true, runValidators: true }
    );

    if (!table) return res.status(404).json({ message: 'Table not found' });
    return res.json(table);
  } catch (err) {
    console.error('updateTable error:', err);
    return res.status(500).json({ message: 'Could not update table', error: err.message });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findByIdAndDelete(id);
    if (!table) return res.status(404).json({ message: 'Table not found' });
    return res.json({ message: 'Table deleted' });
  } catch (err) {
    console.error('deleteTable error:', err);
    return res.status(500).json({ message: 'Could not delete table', error: err.message });
  }
};
