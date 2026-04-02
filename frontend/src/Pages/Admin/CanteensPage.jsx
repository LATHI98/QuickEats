import React, { useEffect, useState } from 'react';
import { Store, PlusCircle, Edit3, Trash2, ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const initialForm = {
  id: null,
  name: '',
  owner: '',
  email: '',
  canteenPassword: '',
  ratings: 0,
  photo: '',
  description: '',
  openHours: '',
};

const AdminCanteensPage = () => {
  const [canteens, setCanteens] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchCanteens = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/canteens');
      setCanteens(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load canteens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanteens();
  }, []);

  const validateForm = () => {
    if (!form.name.trim() || form.name.trim().length > 15) {
      return 'Canteen name is required and max 15 characters';
    }
    if (!form.owner.trim() || form.owner.trim().length > 15) {
      return 'Owner name is required and max 15 characters';
    }
    if (!form.email.trim() || !/^.+@gmail\.com$/.test(form.email.trim())) {
      return 'Email must be a valid @gmail.com address';
    }
    if (!isEditing && !form.canteenPassword.trim()) {
      return 'Canteen password is required';
    }
    if (form.ratings < 0 || form.ratings > 5) {
      return 'Ratings must be between 0 and 5';
    }
    return null;
  };

  const resetForm = () => {
    setForm(initialForm);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      toast.warn(error);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        owner: form.owner.trim(),
        email: form.email.trim().toLowerCase(),
        canteenPassword: form.canteenPassword.trim(),
        ratings: Number(form.ratings),
        photo: form.photo.trim(),
        description: form.description.trim(),
        openHours: form.openHours.trim(),
      };

      if (isEditing && !payload.canteenPassword) {
        delete payload.canteenPassword;
      }

      if (isEditing) {
        await api.put(`/api/canteens/${form.id}`, payload);
        toast.success('Canteen updated successfully');
      } else {
        await api.post('/api/canteens', payload);
        toast.success('Canteen added successfully');
      }

      fetchCanteens();
      resetForm();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save canteen');
    }
  };

  const handleEdit = (canteen) => {
    setIsEditing(true);
    setForm({
      id: canteen._id,
      name: canteen.name || '',
      owner: canteen.owner || '',
      email: canteen.email || '',
      canteenPassword: '',
      ratings: canteen.ratings || 0,
      photo: canteen.photo || '',
      description: canteen.description || '',
      openHours: canteen.openHours || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this canteen?')) return;
    try {
      await api.delete(`/api/canteens/${id}`);
      toast.success('Canteen deleted');
      fetchCanteens();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete canteen');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((s) => ({ ...s, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-['Gilroy_Bold'] text-gray-900">Canteen Management</h1>
          <p className="text-sm text-gray-500">Admin can add/update/delete canteens that students can view.</p>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <Store size={18} />
          <span>{canteens.length} canteen(s) loaded</span>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <label className="block text-sm font-['Gilroy_Bold'] text-gray-700 mb-1">Canteen Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            type="text"
            maxLength={15}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
            placeholder="Name (max 15 chars)"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-['Gilroy_Bold'] text-gray-700 mb-1">Owner Name</label>
          <input
            value={form.owner}
            onChange={(e) => setForm((s) => ({ ...s, owner: e.target.value }))}
            type="text"
            maxLength={15}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
            placeholder="Owner (max 15 chars)"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-['Gilroy_Bold'] text-gray-700 mb-1">Email</label>
          <input
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            type="email"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
            placeholder="example@gmail.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-['Gilroy_Bold'] text-gray-700 mb-1">Canteen Password</label>
          <input
            value={form.canteenPassword}
            onChange={(e) => setForm((s) => ({ ...s, canteenPassword: e.target.value }))}
            type="password"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
            placeholder={isEditing ? 'Leave blank to keep current password' : 'Set canteen access password'}
          />
        </div>

        <div>
          <label className="block text-sm font-['Gilroy_Bold'] text-gray-700 mb-1">Open Hours</label>
          <input
            value={form.openHours}
            onChange={(e) => setForm((s) => ({ ...s, openHours: e.target.value }))}
            type="text"
            maxLength={50}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
            placeholder="Example: 8:00 AM - 8:00 PM"
          />
        </div>

        <div>
          <label className="block text-sm font-['Gilroy_Bold'] text-gray-700 mb-1">Rating</label>
          <input
            value={form.ratings}
            onChange={(e) => setForm((s) => ({ ...s, ratings: e.target.value }))}
            type="number"
            min={0}
            max={5}
            step={0.1}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-['Gilroy_Bold'] text-gray-700 mb-1">Photo URL</label>
          <input
            value={form.photo}
            onChange={(e) => setForm((s) => ({ ...s, photo: e.target.value }))}
            type="url"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
            placeholder="https://example.com/image.jpg"
          />
          <div className="flex items-center gap-3 pt-2">
            <input type="file" accept="image/*" onChange={handleFileUpload} className="text-sm text-gray-500" />
            <ImageIcon size={16} className="text-gray-400" />
            <span className="text-xs text-gray-400">Or upload to use Base64 string</span>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-['Gilroy_Bold'] text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
            placeholder="Short description"
          />
        </div>

        <div className="md:col-span-2 text-right">
          {isEditing && (
            <button type="button" onClick={resetForm} className="px-5 py-2 mr-3 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200">
              Cancel
            </button>
          )}
          <button type="submit" className="px-6 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 flex items-center gap-2">
            <PlusCircle size={16} /> {isEditing ? 'Update Canteen' : 'Add Canteen'}
          </button>
        </div>
      </form>

      <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-xl font-['Gilroy_Bold'] text-gray-900 mb-4">Canteen List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-gray-500 uppercase text-xs border-b border-gray-100">
              <tr>
                <th className="px-3 py-2">Photo</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Open Hours</th>
                <th className="px-3 py-2">Rating</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="px-3 py-4">Loading...</td></tr>
              ) : canteens.length === 0 ? (
                <tr><td colSpan="8" className="px-3 py-4">No canteens found.</td></tr>
              ) : (
                canteens.map((canteen) => (
                  <tr key={canteen._id} className="border-b border-gray-100 hover:bg-gray-50 transition-all">
                    <td className="px-3 py-2">
                      {canteen.photo ? (
                        <img src={canteen.photo} alt={canteen.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">N/A</div>
                      )}
                    </td>
                    <td className="px-3 py-2">{canteen.name}</td>
                    <td className="px-3 py-2">{canteen.owner}</td>
                    <td className="px-3 py-2">{canteen.email}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{canteen.openHours || 'N/A'}</td>
                    <td className="px-3 py-2">{canteen.ratings}</td>
                    <td className="px-3 py-2 line-clamp-2 max-w-xs">{canteen.description}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button onClick={() => handleEdit(canteen)} className="px-2 py-1 mr-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(canteen._id)} className="px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminCanteensPage;
