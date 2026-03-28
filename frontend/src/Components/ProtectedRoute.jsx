import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles, requireCanteenSelection = false }) => {
  const { user, loading, selectedCanteenId } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-defaultRed rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-gilroyRegular">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their correct dashboard, not back to login
    if (user.role === 'student' || user.role === 'universityStaff') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/admin/select-canteen" replace />;
  }

  if (requireCanteenSelection && !selectedCanteenId) {
    return <Navigate to="/admin/select-canteen" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
