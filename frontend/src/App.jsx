import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useAuth } from './contexts/AuthContext';

import HomePage from './Pages/HomePage';
import LoginPage from './Pages/Auth/LoginPage';
import RegisterPage from './Pages/Auth/RegisterPage';
import ForgotPassword from './Pages/Auth/ForgotPassword';
import ResetPassword from './Pages/Auth/ResetPassword';
import ProtectedRoute from './Components/ProtectedRoute';
import StudentLayout from './Components/Layout/StudentLayout';
import AdminLayout from './Components/Layout/AdminLayout';

// Admin pages
import AdminDashboard from './Pages/Admin/DashboardPage';
import AdminCanteens from './Pages/Admin/CanteensPage';
import AdminMenu from './Pages/Admin/MenuPage';
import AdminOrders from './Pages/Admin/OrdersPage';
import AdminUsers from './Pages/Admin/UsersPage';
import AdminSettings from './Pages/Admin/SettingsPage';
import StaffDashboardPage from './Pages/Admin/StaffDashboardPage';
import AdminReservations from './Pages/Admin/ReservationsPage';
import TablesManagement from './Pages/Admin/TablesPage';
import SelectCanteenPage from './Pages/Admin/SelectCanteenPage';
import SupportCenterPage from './Pages/SupportCenterPage';

// Canteen Staff pages
import CanteenStaffDashboard from './Pages/CanteenStaff/DashboardPage';
import MealPassStaffPage from './Pages/CanteenStaff/MealPassPage';

// Student pages
import StudentDashboard from './Pages/Student/DashboardPage';
import StudentCanteens from './Pages/Student/CanteensPage';
import StudentOrders from './Pages/Student/OrdersPage';
import ProfilePage from './Pages/Student/ProfilePage';
import StudentSettings from './Pages/Student/SettingsPage';
import ReservationsPage from './Pages/Student/ReservationsPage';
import MealPassPage from './Pages/Student/MealPassPage';
import MealBudgetPage from './Pages/Student/MealBudgetPage';
import HealthMealPlanPage from './Pages/Student/HealthMealPlanPage';
import GroupOrderHub from './Pages/Student/GroupOrderHub';
import EventCateringRequestPage from './Pages/Student/EventCateringRequestPage';
import EventCateringTrackingPage from './Pages/Student/EventCateringTrackingPage';
import EventCateringPaymentPage from './Pages/Student/EventCateringPaymentPage';
import EventCateringDashboardPage from './Pages/Admin/EventCateringDashboardPage';

const AdminDashboardSelector = () => {
  const { user } = useAuth();
  if (user?.role === 'canteenStaff') return <CanteenStaffDashboard />;
  return <AdminDashboard />;
};

function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Student routes */}
        <Route element={<ProtectedRoute allowedRoles={['student', 'universityStaff']} />}>
          <Route path="/dashboard" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="canteens" element={<StudentCanteens />} />
            <Route path="orders" element={<StudentOrders />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="meal-pass" element={<MealPassPage />} />
            <Route path="budget" element={<MealBudgetPage />} />
            <Route path="meal-plan" element={<HealthMealPlanPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<StudentSettings />} />
            <Route path="group-order" element={<GroupOrderHub />} />
            <Route path="event-catering" element={<EventCateringRequestPage />} />
            <Route path="event-catering/tracking" element={<EventCateringTrackingPage />} />
            <Route path="event-catering/payment/:requestId" element={<EventCateringPaymentPage />} />
            <Route path="help" element={<SupportCenterPage />} />
          </Route>
        </Route>

        {/* Admin/Staff routes */}
        <Route element={<ProtectedRoute allowedRoles={['canteenStaff', 'admin', 'canteenManager', 'superAdmin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardSelector />} />
            <Route path="canteens" element={<AdminCanteens />} />
            <Route path="tables" element={<TablesManagement />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="reservations" element={<AdminReservations />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="staff" element={<StaffDashboardPage />} />
            <Route path="meal-pass" element={<MealPassStaffPage />} />
            <Route path="event-catering" element={<EventCateringDashboardPage />} />
            <Route path="help" element={<SupportCenterPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
