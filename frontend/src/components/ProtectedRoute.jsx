import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — reads auth state from AuthContext.
 * - No token   → redirect to /login (preserving the intended path)
 * - Wrong role → redirect to /unauthorized
 * - Correct    → render children
 *
 * Usage:
 *   <ProtectedRoute role="farmer"><FarmerDashboard /></ProtectedRoute>
 *   <ProtectedRoute>  ← any authenticated user
 */
const ProtectedRoute = ({ children, role }) => {
  const location = useLocation();
  const { token, role: userRole } = useAuth();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
