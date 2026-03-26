import React, { useEffect, useState } from 'react';
import { ShoppingBag, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/order');
      setOrders(data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.foodId?.price || 0) * o.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-['Gilroy_Bold'] text-gray-900">Orders</h1>
          <p className="text-gray-400 font-['Gilroy_Medium'] mt-1">All incoming orders and their details.</p>
        </div>
        <button onClick={fetchOrders}
          className="flex items-center gap-2 border-2 border-gray-100 text-gray-500 px-5 py-3 rounded-2xl font-['Gilroy_Bold'] text-sm hover:bg-gray-50 transition-all">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, color: 'bg-orange-50 text-orange-600' },
          { label: 'Items Sold', value: orders.reduce((s, o) => s + o.quantity, 0), color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Revenue', value: `LKR ${totalRevenue.toFixed(2)}`, color: 'bg-green-50 text-green-600' },
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
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-300">
            <ShoppingBag size={48} />
            <p className="mt-4 font-['Gilroy_Bold'] text-gray-400">No orders yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {['#', 'Food Item', 'Category', 'Unit Price', 'Qty', 'Total', 'Date'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-['Gilroy_Bold'] text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => {
                const food = order.foodId;
                const total = (food?.price || 0) * order.quantity;
                return (
                  <tr key={order._id} className="border-b border-gray-50 last:border-0 hover:bg-orange-50/30 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-['Gilroy_Medium']">{idx + 1}</td>
                    <td className="px-6 py-4 font-['Gilroy_Bold'] text-gray-900">{food?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-['Gilroy_Bold']">{food?.category || '—'}</span>
                    </td>
                    <td className="px-6 py-4 font-['Gilroy_Medium'] text-gray-700">LKR {(food?.price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 font-['Gilroy_Bold'] text-gray-900">{order.quantity}</td>
                    <td className="px-6 py-4 font-['Gilroy_Bold'] text-green-600">LKR {total.toFixed(2)}</td>
                    <td className="px-6 py-4 font-['Gilroy_Medium'] text-gray-400 text-xs">
                      {new Date(order.date).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
