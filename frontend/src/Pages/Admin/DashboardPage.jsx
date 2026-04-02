import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Store,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  DollarSign,
  Activity,
  Plus,
  Eye,
  Settings,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserCheck,
  ChefHat,
  Grid3x3
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCanteens: 0,
    totalReservations: 0,
    totalRevenue: 0,
    activeUsers: 0,
    todayReservations: 0,
    pendingOrders: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch canteens count
      const canteensRes = await api.get('/canteens');
      const canteensCount = canteensRes.data.length;

      // Mock data for now - replace with real API calls when available
      setStats({
        totalCanteens: canteensCount,
        totalReservations: 247,
        totalRevenue: 15420,
        activeUsers: 892,
        todayReservations: 23,
        pendingOrders: 8
      });

      // Mock recent activity
      setRecentActivity([
        {
          id: 1,
          type: 'reservation',
          message: 'New reservation at Main Canteen',
          time: '2 minutes ago',
          status: 'success'
        },
        {
          id: 2,
          type: 'order',
          message: 'Order #1234 completed',
          time: '15 minutes ago',
          status: 'success'
        },
        {
          id: 3,
          type: 'user',
          message: 'New student registered',
          time: '1 hour ago',
          status: 'info'
        },
        {
          id: 4,
          type: 'reservation',
          message: 'Reservation cancelled at Tech Canteen',
          time: '2 hours ago',
          status: 'warning'
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color, bgColor }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-['Gilroy_Medium'] text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-['Gilroy_Bold'] text-gray-900 mb-2">{value}</p>
          {change && (
            <div className="flex items-center space-x-1">
              <TrendingUp size={14} className="text-green-500" />
              <span className="text-sm font-['Gilroy_Medium'] text-green-600">{change}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, onClick, color, bgColor }) => (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 text-left group"
    >
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-['Gilroy_Bold'] text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 font-['Gilroy_Medium']">{description}</p>
        </div>
      </div>
    </button>
  );

  const ActivityItem = ({ activity }) => {
    const getStatusIcon = (status) => {
      switch (status) {
        case 'success':
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'warning':
          return <AlertCircle className="w-4 h-4 text-yellow-500" />;
        case 'error':
          return <XCircle className="w-4 h-4 text-red-500" />;
        default:
          return <Activity className="w-4 h-4 text-blue-500" />;
      }
    };

    return (
      <div className="flex items-center space-x-3 py-3">
        <div className="flex-shrink-0">
          {getStatusIcon(activity.status)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-['Gilroy_Medium'] text-gray-900 truncate">
            {activity.message}
          </p>
          <p className="text-xs text-gray-500 font-['Gilroy_Medium']">
            {activity.time}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-['Gilroy_Bold'] text-gray-900 tracking-tight">
            Welcome back, {user?.name || 'Admin'} 👋
          </h1>
          <p className="text-lg text-gray-600 font-['Gilroy_Medium'] mt-2">
            Here's what's happening with your canteen management system today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 font-['Gilroy_Medium'] hover:bg-gray-50 transition-colors">
            <Settings className="w-4 h-4 inline mr-2" />
            Settings
          </button>
          <button className="px-6 py-2 bg-orange-600 text-white rounded-xl font-['Gilroy_Bold'] hover:bg-orange-700 transition-colors">
            <Plus className="w-4 h-4 inline mr-2" />
            Quick Add
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Canteens"
          value={stats.totalCanteens}
          change="+12% from last month"
          icon={Store}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Total Reservations"
          value={stats.totalReservations}
          change="+8% from last week"
          icon={Calendar}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Revenue Today"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change="+15% from yesterday"
          icon={DollarSign}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          change="+5% from last week"
          icon={Users}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reservation Trends Chart Placeholder */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-['Gilroy_Bold'] text-gray-900">Reservation Trends</h3>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 font-['Gilroy_Medium']">Last 7 days</span>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-['Gilroy_Medium']">Chart visualization coming soon</p>
                <p className="text-sm text-gray-400 mt-1">Integration with charting library planned</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-['Gilroy_Bold'] text-gray-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickActionCard
                title="Add New Canteen"
                description="Create a new canteen location"
                icon={Plus}
                onClick={() => toast.info('Navigate to canteen creation')}
                color="text-blue-600"
                bgColor="bg-blue-50"
              />
              <QuickActionCard
                title="View Reservations"
                description="Check today's reservations"
                icon={Calendar}
                onClick={() => toast.info('Navigate to reservations')}
                color="text-green-600"
                bgColor="bg-green-50"
              />
              <QuickActionCard
                title="Manage Tables"
                description="Update table configurations"
                icon={Grid3x3}
                onClick={() => toast.info('Navigate to tables management')}
                color="text-purple-600"
                bgColor="bg-purple-50"
              />
              <QuickActionCard
                title="View Reports"
                description="Generate system reports"
                icon={BarChart3}
                onClick={() => toast.info('Navigate to reports')}
                color="text-orange-600"
                bgColor="bg-orange-50"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* System Status */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-['Gilroy_Bold'] text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-['Gilroy_Medium'] text-gray-600">API Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-['Gilroy_Medium']">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-['Gilroy_Medium'] text-gray-600">Database</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-['Gilroy_Medium']">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-['Gilroy_Medium'] text-gray-600">Reservations</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-yellow-600 font-['Gilroy_Medium']">{stats.pendingOrders} pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-['Gilroy_Bold'] text-gray-900">Recent Activity</h3>
              <button className="text-sm text-orange-600 font-['Gilroy_Medium'] hover:text-orange-700">
                View all
              </button>
            </div>
            <div className="space-y-1">
              {recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>

          {/* Today's Summary */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-['Gilroy_Bold'] text-gray-900">Today's Summary</h3>
                <p className="text-sm text-gray-600 font-['Gilroy_Medium']">Quick overview</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-['Gilroy_Medium']">Reservations</span>
                <span className="font-['Gilroy_Bold'] text-gray-900">{stats.todayReservations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-['Gilroy_Medium']">Revenue</span>
                <span className="font-['Gilroy_Bold'] text-gray-900">$2,340</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-['Gilroy_Medium']">New Users</span>
                <span className="font-['Gilroy_Bold'] text-gray-900">12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
