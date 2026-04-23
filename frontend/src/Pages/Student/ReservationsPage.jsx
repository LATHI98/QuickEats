import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, Store, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const ReservationsPage = () => {
  const [canteens, setCanteens] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    canteenId: '',
    seatsBooked: 1,
    reservationDate: '',
    timeSlot: '',
  });

  const timeSlots = [
    '8:00 AM - 9:00 AM',
    '9:00 AM - 10:00 AM',
    '12:00 PM - 1:00 PM',
    '1:00 PM - 2:00 PM',
    '6:00 PM - 7:00 PM',
    '7:00 PM - 8:00 PM',
  ];

  // Fetch canteens and reservations on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [canteensRes, reservationsRes] = await Promise.all([
          api.get('/api/canteens'),
          api.get('/api/reservations/my-reservations'),
        ]);
        setCanteens(canteensRes.data);
        setReservations(reservationsRes.data);
      } catch (err) {
        toast.error('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form submission
  const handleSubmitReservation = async (e) => {
    e.preventDefault();

    if (!formData.canteenId || !formData.reservationDate || !formData.timeSlot) {
      toast.warn('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/reservations', {
        canteenId: formData.canteenId,
        seatsBooked: parseInt(formData.seatsBooked),
        reservationDate: formData.reservationDate,
        timeSlot: formData.timeSlot,
      });

      toast.success('Reservation created successfully!');

      // Reset form and refresh reservations
      setFormData({
        canteenId: '',
        seatsBooked: 1,
        reservationDate: '',
        timeSlot: '',
      });

      const res = await api.get('/api/reservations/my-reservations');
      setReservations(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel reservation
  const handleCancelReservation = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;

    try {
      await api.put(`/api/reservations/${id}/cancel`);
      toast.success('Reservation cancelled');

      const res = await api.get('/api/reservations/my-reservations');
      setReservations(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not cancel reservation');
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Meal Reservations</h1>
        <p className="text-sm text-gray-500">Book your table at your favorite canteen</p>
      </header>

      {/* Booking Form */}
      <form onSubmit={handleSubmitReservation} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gray-900">New Reservation</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Canteen Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Canteen</label>
            <select
              value={formData.canteenId}
              onChange={(e) => setFormData((s) => ({ ...s, canteenId: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:border-orange-400"
              required
            >
              <option value="">-- Choose a canteen --</option>
              {canteens.map((canteen) => (
                <option key={canteen._id} value={canteen._id}>
                  {canteen.name} - {canteen.owner}
                </option>
              ))}
            </select>
          </div>

          {/* Seats */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Number of Seats</label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.seatsBooked}
              onChange={(e) => setFormData((s) => ({ ...s, seatsBooked: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:border-orange-400"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Reservation Date</label>
            <input
              type="date"
              min={minDate}
              value={formData.reservationDate}
              onChange={(e) => setFormData((s) => ({ ...s, reservationDate: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:border-orange-400"
              required
            />
          </div>

          {/* Time Slot */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Time Slot</label>
            <select
              value={formData.timeSlot}
              onChange={(e) => setFormData((s) => ({ ...s, timeSlot: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:border-orange-400"
              required
            >
              <option value="">-- Choose time slot --</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-right">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-bold transition-all disabled:opacity-50"
          >
            {submitting ? 'Booking...' : 'Book Table'}
          </button>
        </div>
      </form>

      {/* My Reservations */}
      <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">My Reservations</h2>

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center text-gray-500">No reservations yet</div>
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => (
              <div key={res._id} className="border border-gray-100 rounded-2xl p-4 hover:border-orange-200 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Store size={18} className="text-orange-600" />
                      <h3 className="font-bold text-gray-900">
                        {res.canteenId?.name || 'Canteen'}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        res.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {res.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        {new Date(res.reservationDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} />
                        {res.timeSlot}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users size={16} />
                        {res.seatsBooked} seats
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-bold">Table {res.tableId?.tableNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {res.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancelReservation(res._id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ReservationsPage;
