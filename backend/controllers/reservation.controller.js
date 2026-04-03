import Reservation from '../models/Reservation.model.js';
import Table from '../models/Table.model.js';

export const createReservation = async (req, res) => {
  try {
    const { canteenId, seatsBooked, reservationDate, timeSlot, endTime } = req.body;
    const userId = req.user.id;

    if (!canteenId || !seatsBooked || !reservationDate || !timeSlot) {
      return res.status(400).json({ message: 'canteenId, seatsBooked, reservationDate, and timeSlot are required' });
    }

    if (seatsBooked < 1) {
      return res.status(400).json({ message: 'seatsBooked must be at least 1' });
    }

    // Find available tables for this canteen with enough capacity
    const availableTables = await Table.find({
      canteenId,
      capacity: { $gte: seatsBooked },
    });

    if (availableTables.length === 0) {
      return res.status(400).json({ message: 'No tables available with sufficient capacity' });
    }

    // Check if any table is free for the requested timeSlot
    let bookedTable = null;
    for (const table of availableTables) {
      const existingReservation = await Reservation.findOne({
        tableId: table._id,
        reservationDate: new Date(reservationDate),
        timeSlot,
        status: { $ne: 'cancelled' },
      });

      if (!existingReservation) {
        bookedTable = table;
        break;
      }
    }

    if (!bookedTable) {
      return res.status(400).json({ message: 'No tables available for the selected time slot' });
    }

    // Create reservation
    const reservation = await Reservation.create({
      userId,
      canteenId,
      tableId: bookedTable._id,
      seatsBooked,
      reservationDate: new Date(reservationDate),
      timeSlot,
      endTime: endTime || '',
      status: 'confirmed',
    });

    return res.status(201).json(reservation);
  } catch (err) {
    console.error('createReservation error:', err);
    return res.status(500).json({ message: 'Could not create reservation', error: err.message });
  }
};

export const getMyReservations = async (req, res) => {
  try {
    const userId = req.user.id;

    const reservations = await Reservation.find({ userId })
      .populate('canteenId', 'name owner openHours')
      .populate('tableId', 'tableNumber capacity')
      .sort({ reservationDate: -1 });

    return res.json(reservations);
  } catch (err) {
    console.error('getMyReservations error:', err);
    return res.status(500).json({ message: 'Could not fetch reservations', error: err.message });
  }
};

export const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('userId', 'name email')
      .populate('canteenId', 'name owner')
      .populate('tableId', 'tableNumber capacity')
      .sort({ reservationDate: -1 });

    return res.json(reservations);
  } catch (err) {
    console.error('getAllReservations error:', err);
    return res.status(500).json({ message: 'Could not fetch reservations', error: err.message });
  }
};

export const getReservationsByCanteen = async (req, res) => {
  try {
    const { canteenId } = req.params;

    if (!canteenId) {
      return res.status(400).json({ message: 'canteenId is required' });
    }

    const reservations = await Reservation.find({ canteenId })
      .populate('userId', 'name email')
      .populate('tableId', 'tableNumber capacity')
      .sort({ reservationDate: -1 });

    return res.json(reservations);
  } catch (err) {
    console.error('getReservationsByCanteen error:', err);
    return res.status(500).json({ message: 'Could not fetch reservations', error: err.message });
  }
};

export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
    return res.json({ message: 'Reservation cancelled', reservation });
  } catch (err) {
    console.error('cancelReservation error:', err);
    return res.status(500).json({ message: 'Could not cancel reservation', error: err.message });
  }
};

export const getOccupiedSeats = async (req, res) => {
  try {
    const { canteenId, reservationDate, timeSlot } = req.query;

    if (!canteenId || !reservationDate || !timeSlot) {
      return res.status(400).json({ message: 'canteenId, reservationDate, and timeSlot are required' });
    }

    const occupiedReservations = await Reservation.find({
      canteenId,
      reservationDate: new Date(reservationDate),
      timeSlot,
      status: { $ne: 'cancelled' },
    })
      .populate('tableId', 'tableNumber capacity')
      .select('tableId seatsBooked');

    const occupiedSeats = occupiedReservations.length > 0
      ? occupiedReservations.reduce((sum, res) => sum + res.seatsBooked, 0)
      : 0;

    const totalCapacity = await Table.aggregate([
      { $match: { canteenId: require('mongoose').Types.ObjectId(canteenId) } },
      { $group: { _id: null, total: { $sum: '$capacity' } } },
    ]);

    return res.json({
      occupiedSeats,
      totalCapacity: totalCapacity[0]?.total || 0,
      reservations: occupiedReservations,
    });
  } catch (err) {
    console.error('getOccupiedSeats error:', err);
    return res.status(500).json({ message: 'Could not fetch occupied seats', error: err.message });
  }
};
