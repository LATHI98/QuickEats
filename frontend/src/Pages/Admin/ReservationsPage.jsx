import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, Trash2, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AdminReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/reservations/admin/all');
      setReservations(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;

    try {
      await api.delete(`/api/reservations/${id}`);
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not cancel reservation');
    }
  };

  const filteredReservations = reservations.filter((res) => {
    if (filter === 'confirmed') return res.status === 'confirmed';
    if (filter === 'cancelled') return res.status === 'cancelled';
    return true;
  });

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter((r) => r.status === 'confirmed').length,
    cancelled: reservations.filter((r) => r.status === 'cancelled').length,
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-['Gilroy_Bold'] text-gray-900">Reservation Management</h1>
          <p className="text-sm text-gray-500">Monitor and manage all seat reservations</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-['Gilroy_Bold'] uppercase">Total Reservations</p>
          <p className="text-3xl font-['Gilroy_Heavy'] text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-2xl border border-green-100 p-4">
          <p className="text-xs text-green-600 font-['Gilroy_Bold'] uppercase">Confirmed</p>
          <p className="text-3xl font-['Gilroy_Heavy'] text-green-700">{stats.confirmed}</p>
        </div>
        <div className="bg-red-50 rounded-2xl border border-red-100 p-4">
          <p className="text-xs text-red-600 font-['Gilroy_Bold'] uppercase">Cancelled</p>
          <p className="text-3xl font-['Gilroy_Heavy'] text-red-700">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-['Gilroy_Bold'] transition-all ${
            filter === 'all'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={`px-4 py-2 rounded-lg font-['Gilroy_Bold'] transition-all ${
            filter === 'confirmed'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Confirmed
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-lg font-['Gilroy_Bold'] transition-all ${
            filter === 'cancelled'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* Reservations Table */}
      <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No reservations</div>
        ) : (
          <table className="w-full min-w-max text-left text-sm">
            <thead className="text-gray-500 uppercase text-xs border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Canteen</th>
                <th className="px-4 py-3">Table</th>
                <th className="px-4 py-3">Seats</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time Slot</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((res) => (
                <tr key={res._id} className="border-b border-gray-100 hover:bg-gray-50 transition-all">
                  <td className="px-4 py-3">
                    <div className="text-gray-900 font-['Gilroy_Bold']">{res.userId?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{res.userId?.email}</div>
                  </td>
                  <td className="px-4 py-3">{res.canteenId?.name || 'N/A'}</td>
                  <td className="px-4 py-3 font-['Gilroy_Bold']">Table {res.tableId?.tableNumber || 'N/A'}</td>
                  <td className="px-4 py-3">{res.seatsBooked}</td>
                  <td className="px-4 py-3">{new Date(res.reservationDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{res.timeSlot}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-['Gilroy_Bold'] ${
                        res.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {res.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {res.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancelReservation(res._id)}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default AdminReservationsPage;
