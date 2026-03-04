import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

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

// Student pages
import StudentDashboard from './Pages/Student/DashboardPage';
import StudentCanteens from './Pages/Student/CanteensPage';
import StudentOrders from './Pages/Student/OrdersPage';
import ProfilePage from './Pages/Student/ProfilePage';
import ReservationsPage from './Pages/Student/ReservationsPage';
import MealPassPage from './Pages/Student/MealPassPage';
import MealBudgetPage from './Pages/Student/MealBudgetPage';

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
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin/Staff routes */}
        <Route element={<ProtectedRoute allowedRoles={['canteenStaff', 'admin', 'canteenManager', 'superAdmin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="canteens" element={<AdminCanteens />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
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
