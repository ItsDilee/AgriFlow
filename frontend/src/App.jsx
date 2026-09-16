import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

// Farmer area
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerProfile from './pages/farmer/FarmerProfile';
import FarmerAppointments from './pages/farmer/FarmerAppointments';

// Admin area
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFarmers from './pages/admin/AdminFarmers';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCentres from './pages/admin/AdminCentres';

// Farmer — centres
import FarmerCentres from './pages/farmer/FarmerCentres';

import './styles/theme.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Farmer area */}
            <Route
              path="/farmer/dashboard"
              element={
                <ProtectedRoute role="farmer">
                  <FarmerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/profile"
              element={
                <ProtectedRoute role="farmer">
                  <FarmerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/appointments"
              element={
                <ProtectedRoute role="farmer">
                  <FarmerAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/centres"
              element={
                <ProtectedRoute role="farmer">
                  <FarmerCentres />
                </ProtectedRoute>
              }
            />

            {/* Admin area */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/farmers"
              element={
                <ProtectedRoute role="admin">
                  <AdminFarmers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/centres"
              element={
                <ProtectedRoute role="admin">
                  <AdminCentres />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute role="admin">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
};

export default App;
