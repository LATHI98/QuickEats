import React, { useEffect, useState } from 'react';
import { UtensilsCrossed, Plus, Pencil, Trash2, X, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const EMPTY_FORM = { name: '', category: '', price: '', stock: '', available: true };

const MenuPage = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // food object being edited
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/food');
      setFoods(data);
    } catch {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFoods(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (food) => {
    setEditing(food);
    setForm({ name: food.name, category: food.category, price: food.price, stock: food.stock, available: food.available });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (editing) {
        const { data } = await api.put(`/api/food/${editing._id}`, payload);
        setFoods(prev => prev.map(f => f._id === editing._id ? data : f));
        toast.success('Menu item updated');
      } else {
        const { data } = await api.post('/api/food', payload);
        setFoods(prev => [...prev, data]);
        toast.success('Menu item added');
      }
      setShowModal(false);
    } catch {
      toast.error('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/food/${id}`);
      setFoods(prev => prev.filter(f => f._id !== id));
      toast.success('Item deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-['Gilroy_Bold'] text-gray-900">Menu Items</h1>
          <p className="text-gray-400 font-['Gilroy_Medium'] mt-1">Manage food items, pricing and availability.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-2xl font-['Gilroy_Bold'] text-sm hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: foods.length, color: 'bg-orange-50 text-orange-600' },
          { label: 'Available', value: foods.filter(f => f.available).length, color: 'bg-green-50 text-green-600' },
          { label: 'Out of Stock', value: foods.filter(f => !f.available).length, color: 'bg-red-50 text-red-600' },
          { label: 'Total Orders', value: foods.reduce((s, f) => s + (f.ordersCount || 0), 0), color: 'bg-blue-50 text-blue-600' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl p-5 ${stat.color.split(' ')[0]} border border-gray-100`}>
            <p className="text-sm font-['Gilroy_Medium'] text-gray-400">{stat.label}</p>
            <p className={`text-3xl font-['Gilroy_Heavy'] mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : foods.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-300">
            <UtensilsCrossed size={48} />
            <p className="mt-4 font-['Gilroy_Bold'] text-gray-400">No items yet — add one!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {['Name', 'Category', 'Price', 'Stock', 'Orders', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-['Gilroy_Bold'] text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {foods.map(food => (
                <tr key={food._id} className="border-b border-gray-50 last:border-0 hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-4 font-['Gilroy_Bold'] text-gray-900">{food.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-['Gilroy_Bold']">{food.category}</span>
                  </td>
                  <td className="px-6 py-4 font-['Gilroy_Medium'] text-gray-700">LKR {Number(food.price).toFixed(2)}</td>
                  <td className="px-6 py-4 font-['Gilroy_Medium'] text-gray-700">{food.stock}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-blue-600 font-['Gilroy_Bold'] text-xs">
                      <TrendingUp size={12} /> {food.ordersCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {food.available
                      ? <span className="flex items-center gap-1 text-green-600 text-xs font-['Gilroy_Bold']"><CheckCircle size={14} /> Available</span>
                      : <span className="flex items-center gap-1 text-red-500 text-xs font-['Gilroy_Bold']"><XCircle size={14} /> Out of Stock</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(food)} className="p-2 rounded-xl hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setDeleteId(food._id)} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-['Gilroy_Bold'] text-gray-900">{editing ? 'Edit Item' : 'Add Menu Item'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {[
                { label: 'Name', key: 'name', type: 'text', placeholder: 'e.g. Nasi Lemak' },
                { label: 'Category', key: 'category', type: 'text', placeholder: 'e.g. Main Course' },
                { label: 'Price (LKR)', key: 'price', type: 'number', placeholder: '0.00', min: 0, step: '0.01' },
                { label: 'Stock', key: 'stock', type: 'number', placeholder: '0', min: 0 },
              ].map(({ label, key, ...inputProps }) => (
                <div key={key}>
                  <label className="block text-xs font-['Gilroy_Bold'] text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                  <input
                    {...inputProps}
                    value={form[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-orange-500 focus:bg-white outline-none font-['Gilroy_Medium'] transition-all"
                  />
                </div>
              ))}
              <div className="flex items-center gap-3 pt-1">
                <button type="button" onClick={() => setForm(p => ({ ...p, available: !p.available }))}
                  className={`w-12 h-6 rounded-full transition-colors ${form.available ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <span className={`block w-5 h-5 bg-white rounded-full shadow mx-0.5 transition-transform ${form.available ? 'translate-x-6' : ''}`} />
                </button>
                <span className="text-sm font-['Gilroy_Medium'] text-gray-600">Available</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-100 font-['Gilroy_Bold'] text-gray-500 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-2xl font-['Gilroy_Bold'] hover:bg-orange-700 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-['Gilroy_Bold'] text-gray-900 mb-2">Delete Item?</h3>
            <p className="text-gray-400 font-['Gilroy_Medium'] text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-2xl border-2 border-gray-100 font-['Gilroy_Bold'] text-gray-500 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-['Gilroy_Bold'] hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
