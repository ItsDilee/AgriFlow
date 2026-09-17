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
import FarmerBookAppointment from './pages/farmer/FarmerBookAppointment';

// Admin area
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFarmers from './pages/admin/AdminFarmers';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCentres from './pages/admin/AdminCentres';

// Farmer — centres
import FarmerCentres from './pages/farmer/FarmerCentres';

// Phase 6 — queue
import FarmerQueue from './pages/farmer/FarmerQueue';
import AdminQueue from './pages/admin/AdminQueue';
import FarmerProcurement from './pages/farmer/FarmerProcurement';
import FarmerPayment from './pages/farmer/FarmerPayment';
import FarmerNotifications from './pages/farmer/FarmerNotifications';
import AdminProcurement from './pages/admin/AdminProcurement';
import AdminPayment from './pages/admin/AdminPayment';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminReports from './pages/admin/AdminReports';

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
              path="/farmer/appointments/book"
              element={
                <ProtectedRoute role="farmer">
                  <FarmerBookAppointment />
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
            <Route
              path="/farmer/queue"
              element={
                <ProtectedRoute role="farmer">
                  <FarmerQueue />
                </ProtectedRoute>
              }
            />

            <Route
              path="/farmer/procurement"
              element={
                <ProtectedRoute role="farmer">
                  <FarmerProcurement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/payment"
              element={
                <ProtectedRoute role="farmer">
                  <FarmerPayment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/notifications"
              element={
                <ProtectedRoute role="farmer">
                  <FarmerNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/procurements"
              element={
                <ProtectedRoute role="admin">
                  <AdminProcurement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute role="admin">
                  <AdminPayment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute role="admin">
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute role="admin">
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />
              element={
                <ProtectedRoute role="admin">
                  <AdminNotifications />
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
            <Route
              path="/admin/queue"
              element={
                <ProtectedRoute role="admin">
                  <AdminQueue />
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
