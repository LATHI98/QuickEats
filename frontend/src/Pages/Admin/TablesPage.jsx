import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const TablesManagementPage = () => {
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState('');
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    tableNumber: '',
    capacity: 2,
  });

  useEffect(() => {
    fetchCanteens();
  }, []);

  const fetchCanteens = async () => {
    try {
      const { data } = await api.get('/api/canteens');
      setCanteens(data);
    } catch (err) {
      toast.error('Failed to load canteens');
    }
  };

  const fetchTables = async (canteenId) => {
    if (!canteenId) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/api/tables/canteen/${canteenId}`);
      setTables(data);
    } catch (err) {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleCanteenChange = (canteenId) => {
    setSelectedCanteen(canteenId);
    setFormData({ id: null, tableNumber: '', capacity: 2 });
    setIsEditing(false);
    fetchTables(canteenId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tableNumber || !formData.capacity) {
      toast.warn('Fill all fields');
      return;
    }

    if (formData.capacity < 1) {
      toast.warn('Capacity must be at least 1');
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/api/tables/${formData.id}`, {
          tableNumber: formData.tableNumber,
          capacity: parseInt(formData.capacity),
        });
        toast.success('Table updated');
      } else {
        await api.post('/api/tables', {
          canteenId: selectedCanteen,
          tableNumber: parseInt(formData.tableNumber),
          capacity: parseInt(formData.capacity),
        });
        toast.success('Table created');
      }

      fetchTables(selectedCanteen);
      setFormData({ id: null, tableNumber: '', capacity: 2 });
      setIsEditing(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error saving table');
    }
  };

  const handleEdit = (table) => {
    setIsEditing(true);
    setFormData({
      id: table._id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table?')) return;

    try {
      await api.delete(`/api/tables/${id}`);
      toast.success('Table deleted');
      fetchTables(selectedCanteen);
    } catch (err) {
      toast.error('Failed to delete table');
    }
  };

  const resetForm = () => {
    setFormData({ id: null, tableNumber: '', capacity: 2 });
    setIsEditing(false);
  };

  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8">
      <header>
        <h1 className="text-3xl font-['Gilroy_Bold'] text-gray-900">Tables Management</h1>
        <p className="text-sm text-gray-500">Set up and manage seating capacity for each canteen</p>
      </header>

      {/* Canteen Selection */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <label className="block text-sm font-['Gilroy_Bold'] text-gray-700 mb-2">Select Canteen</label>
        <select
          value={selectedCanteen}
          onChange={(e) => handleCanteenChange(e.target.value)}
          className="w-full md:w-96 rounded-xl border border-gray-200 px-4 py-2 outline-none focus:border-orange-400"
        >
          <option value="">-- Choose a canteen --</option>
          {canteens.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCanteen && (
        <>
          {/* Add/Edit Table Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-['Gilroy_Bold'] text-gray-900">
              {isEditing ? 'Edit Table' : 'Add New Table'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-['Gilroy_Bold'] text-gray-700 mb-1">Table Number</label>
                <input
                  value={formData.tableNumber}
                  onChange={(e) => setFormData((s) => ({ ...s, tableNumber: e.target.value }))}
                  type="number"
                  min="1"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
                  placeholder="1, 2, 3..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-['Gilroy_Bold'] text-gray-700 mb-1">Seat Capacity</label>
                <input
                  value={formData.capacity}
                  onChange={(e) => setFormData((s) => ({ ...s, capacity: e.target.value }))}
                  type="number"
                  min="1"
                  max="20"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
                  required
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-['Gilroy_Bold']"
                >
                  <Plus size={16} className="inline mr-1" /> {isEditing ? 'Update' : 'Create'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Tables Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4">
              <p className="text-xs text-orange-600 font-['Gilroy_Bold'] uppercase">Total Tables</p>
              <p className="text-3xl font-['Gilroy_Heavy'] text-orange-700">{tables.length}</p>
            </div>
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
              <p className="text-xs text-blue-600 font-['Gilroy_Bold'] uppercase">Total Capacity</p>
              <p className="text-3xl font-['Gilroy_Heavy'] text-blue-700">{totalCapacity}</p>
            </div>
          </div>

          {/* Tables List */}
          <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-['Gilroy_Bold'] text-gray-900 mb-4">Tables</h2>

            {loading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : tables.length === 0 ? (
              <div className="text-center text-gray-500">No tables for this canteen yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-gray-500 uppercase text-xs border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">Table Number</th>
                      <th className="px-4 py-3">Capacity</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((table) => (
                      <tr key={table._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-['Gilroy_Bold']">Table {table.tableNumber}</td>
                        <td className="px-4 py-3 flex items-center gap-1">
                          <Users size={16} /> {table.capacity} seats
                        </td>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(table)}
                            className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(table._id)}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default TablesManagementPage;
