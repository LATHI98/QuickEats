import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import LoginPage from './Pages/Auth/LoginPage';
import ProtectedRoute from './Components/ProtectedRoute';
import StudentLayout from './Components/Layout/StudentLayout';
import AdminLayout from './Components/Layout/AdminLayout';

// Student pages
import StudentDashboard from './Pages/Student/DashboardPage';
import StudentCanteens from './Pages/Student/CanteensPage';
import StudentOrders from './Pages/Student/OrdersPage';
import ProfilePage from './Pages/Student/ProfilePage';

// Admin pages
import AdminDashboard from './Pages/Admin/DashboardPage';
import AdminCanteens from './Pages/Admin/CanteensPage';
import MenuPage from './Pages/Admin/MenuPage';
import AdminOrders from './Pages/Admin/OrdersPage';
import UsersPage from './Pages/Admin/UsersPage';
import SettingsPage from './Pages/Admin/SettingsPage';

function App() {
  return (
    <>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Student routes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/dashboard" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="canteens" element={<StudentCanteens />} />
            <Route path="orders" element={<StudentOrders />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['canteenManager', 'superAdmin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="canteens" element={<AdminCanteens />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
