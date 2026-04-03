import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Plus, Pencil, Trash2, X, CheckCircle, XCircle, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { canteenAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EMPTY_FORM = {
  name: '',
  category: '',
  price: '',
  description: '',
  isAvailable: true,
  image: '',
};

const MenuPage = () => {
  const navigate = useNavigate();
  const { selectedCanteenId, selectedCanteenName } = useAuth();
  const fileInputRef = useRef(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const normalizeMenuItems = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const fetchMenuItems = async () => {
    if (!selectedCanteenId) {
      setMenuItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data } = await canteenAPI.getMenu(selectedCanteenId);
      setMenuItems(normalizeMenuItems(data));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCanteenId]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (menuItem) => {
    setEditing(menuItem);
    setForm({
      name: menuItem.name || '',
      category: menuItem.category || '',
      price: menuItem.price ?? '',
      description: menuItem.description || '',
      isAvailable: menuItem.isAvailable !== false,
      image: menuItem.image || '',
    });
    setShowModal(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Convert to data URL for preview and storage
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setForm((prev) => ({ ...prev, image: dataUrl }));
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!selectedCanteenId) {
      toast.error('Select a canteen first');
      navigate('/admin/select-canteen');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      isAvailable: !!form.isAvailable,
      image: form.image,
    };

    if (!payload.name) {
      toast.error('Item name is required');
      return;
    }
    if (!Number.isFinite(payload.price) || payload.price < 0) {
      toast.error('Item price must be a valid number');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const { data } = await api.put(`/api/canteens/${selectedCanteenId}/menu/${editing._id}`, payload);
        setMenuItems((prev) => prev.map((item) => (item._id === editing._id ? data.data : item)));
        toast.success('Menu item updated');
      } else {
        const { data } = await api.post(`/api/canteens/${selectedCanteenId}/menu`, payload);
        setMenuItems((prev) => [...prev, data.data]);
        toast.success('Menu item added');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!selectedCanteenId) return;
    try {
      await api.delete(`/api/canteens/${selectedCanteenId}/menu/${id}`);
      setMenuItems((prev) => prev.filter((item) => item._id !== id));
      toast.success('Item deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    }
  };

  if (!selectedCanteenId) {
    return <Navigate to="/admin/select-canteen" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-400 font-medium mt-1">
            Manage menu items for {selectedCanteenName || 'the selected canteen'}.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: menuItems.length, color: 'bg-orange-50 text-orange-600' },
          { label: 'Available', value: menuItems.filter((item) => item.isAvailable !== false).length, color: 'bg-green-50 text-green-600' },
          { label: 'Unavailable', value: menuItems.filter((item) => item.isAvailable === false).length, color: 'bg-red-50 text-red-600' },
          { label: 'Canteen', value: selectedCanteenName || 'Selected', color: 'bg-blue-50 text-blue-600' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl p-5 ${stat.color.split(' ')[0]} border border-gray-100`}>
            <p className="text-sm font-medium text-gray-400">{stat.label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-300">
            <UtensilsCrossed size={48} />
            <p className="mt-4 font-bold text-gray-400">No items yet — add one!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {['Name', 'Category', 'Price', 'Description', 'Status', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => (
                <tr key={item._id} className="border-b border-gray-50 last:border-0 hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <span className="font-bold text-gray-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold">
                      {item.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">LKR {Number(item.price || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 font-medium text-gray-500 max-w-xs truncate">
                    {item.description || 'No description'}
                  </td>
                  <td className="px-6 py-4">
                    {item.isAvailable !== false ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                        <CheckCircle size={14} /> Available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-xs font-bold">
                        <XCircle size={14} /> Unavailable
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="p-2 rounded-xl hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setDeleteId(item._id)} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-8 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit Item' : 'Add Menu Item'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                <X size={20} />
              </button>
            </div>

            {/* Form Content - Scrollable */}
            <form id="menuForm" onSubmit={handleSave} className="space-y-4 overflow-y-auto flex-1 p-8">
              {[
                { label: 'Name', key: 'name', type: 'text', placeholder: 'e.g. Nasi Lemak' },
                { label: 'Category', key: 'category', type: 'text', placeholder: 'e.g. Main Course' },
                { label: 'Price (LKR)', key: 'price', type: 'number', placeholder: '0.00', min: 0, step: '0.01' },
                { label: 'Description', key: 'description', type: 'text', placeholder: 'Short description' },
              ].map(({ label, key, ...inputProps }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                  <input
                    {...inputProps}
                    value={form[key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    required={key !== 'description'}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-orange-500 focus:bg-white outline-none font-medium transition-all"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Image</label>

                {form.image && (
                  <div className="mb-4 rounded-2xl border-2 border-orange-200 bg-orange-50 p-3 overflow-hidden">
                    <img src={form.image} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                  </div>
                )}

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 flex-1 px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl text-orange-600 font-bold text-sm hover:bg-orange-100 transition-all"
                  >
                    <Upload size={16} />
                    Browse Files
                  </button>
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                      className="px-4 py-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 font-bold text-sm hover:bg-red-100 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 font-medium">OR paste image URL:</p>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={form.image}
                    onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-orange-500 focus:bg-white outline-none font-medium transition-all text-sm"
                  />
                  <p className="text-[9px] text-gray-400">Paste URL from Unsplash.com, Imgur.com, or any image hosting service</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, isAvailable: !prev.isAvailable }))}
                  className={`w-12 h-6 rounded-full transition-colors ${form.isAvailable ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <span className={`block w-5 h-5 bg-white rounded-full shadow mx-0.5 transition-transform ${form.isAvailable ? 'translate-x-6' : ''}`} />
                </button>
                <span className="text-sm font-medium text-gray-600">Available</span>
              </div>
            </form>

            {/* Footer - Fixed at Bottom */}
            <div className="flex gap-3 p-8 border-t border-gray-100 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-100 font-bold text-gray-500 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="menuForm"
                disabled={saving}
                className="flex-1 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Item?</h3>
            <p className="text-gray-400 font-medium text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-100 font-bold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
