import React, { useEffect, useState } from 'react';
import { Users, Plus, Pencil, Trash2, X, Phone, Briefcase } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const EMPTY_FORM = { name: '', role: '', contact: '' };

const UsersPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/staff');
      setStaff(data);
    } catch {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, role: s.role, contact: s.contact }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const { data } = await api.put(`/api/staff/${editing._id}`, form);
        setStaff(prev => prev.map(s => s._id === editing._id ? data : s));
        toast.success('Staff updated');
      } else {
        const { data } = await api.post('/api/staff', form);
        setStaff(prev => [...prev, data]);
        toast.success('Staff added');
      }
      setShowModal(false);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/staff/${id}`);
      setStaff(prev => prev.filter(s => s._id !== id));
      toast.success('Staff removed');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const ROLE_COLORS = {
    chef: 'bg-orange-50 text-orange-600',
    cashier: 'bg-blue-50 text-blue-600',
    manager: 'bg-purple-50 text-purple-600',
    cleaner: 'bg-green-50 text-green-600',
  };
  const roleColor = (role) => ROLE_COLORS[role?.toLowerCase()] || 'bg-gray-50 text-gray-500';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-400 font-medium mt-1">Manage canteen staff, roles and contact info.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-orange-700 transition-all shadow-lg shadow-orange-100">
          <Plus size={18} /> Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Staff', value: staff.length, color: 'bg-orange-50 text-orange-600' },
          { label: 'Unique Roles', value: new Set(staff.map(s => s.role)).size, color: 'bg-purple-50 text-purple-600' },
          { label: 'With Contact', value: staff.filter(s => s.contact).length, color: 'bg-green-50 text-green-600' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl p-5 ${stat.color.split(' ')[0]} border border-gray-100`}>
            <p className="text-sm font-medium text-gray-400">{stat.label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-300">
            <Users size={48} />
            <p className="mt-4 font-bold text-gray-400">No staff yet — add one!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {['#', 'Name', 'Role', 'Contact', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((s, idx) => (
                <tr key={s._id} className="border-b border-gray-50 last:border-0 hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-4 text-gray-400 font-medium">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 font-extrabold text-sm">
                        {s.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="font-bold text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${roleColor(s.role)}`}>
                      <Briefcase size={10} className="inline mr-1" />{s.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-gray-500 font-medium">
                      <Phone size={13} />{s.contact || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="p-2 rounded-xl hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => setDeleteId(s._id)} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit Staff' : 'Add Staff'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {[
                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Ahmad Firdaus' },
                { label: 'Role', key: 'role', type: 'text', placeholder: 'e.g. Chef, Cashier' },
                { label: 'Contact', key: 'contact', type: 'text', placeholder: 'e.g. 012-3456789' },
              ].map(({ label, key, ...inputProps }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                  <input {...inputProps} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-orange-500 focus:bg-white outline-none font-medium transition-all" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-100 font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Staff'}
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Staff?</h3>
            <p className="text-gray-400 font-medium text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-2xl border-2 border-gray-100 font-bold text-gray-500">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
