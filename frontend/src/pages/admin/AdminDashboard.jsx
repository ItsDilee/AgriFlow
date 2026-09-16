import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { apiGet } from '../../services/api';
import '../PageStyles.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ farmers: 0, loading: true, error: null });
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    apiGet('/status')
      .then((data) => setApiStatus(data.db === 'connected' ? 'connected' : 'degraded'))
      .catch(() => setApiStatus('offline'));

    apiGet('/farmers')
      .then((data) => setStats({ farmers: data.count ?? 0, loading: false, error: null }))
      .catch((err) => setStats({ farmers: 0, loading: false, error: err.message }));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">System-wide overview and management controls</p>
      </div>

      {/* System status */}
      <div className="dashboard-status-bar" style={{ marginBottom: '1.5rem' }}>
        <span className="status-label">System Status:</span>
        {apiStatus === 'connected' ? (
          <StatusBadge status="active" label="All Systems Operational" />
        ) : apiStatus === 'degraded' ? (
          <StatusBadge status="pending" label="DB Disconnected" />
        ) : apiStatus === 'offline' ? (
          <StatusBadge status="cancelled" label="Backend Offline" />
        ) : (
          <StatusBadge status="processing" label="Checking…" />
        )}
      </div>

      <div className="grid grid-3">
        <Card>
          <p className="stat-label">Registered Farmers</p>
          <p className="stat-value">{stats.loading ? '…' : stats.farmers}</p>
          <StatusBadge status="active" label="Total" />
        </Card>
        <Card>
          <p className="stat-label">Active Appointments</p>
          <p className="stat-value">—</p>
          <StatusBadge status="pending" label="Coming Soon" />
        </Card>
        <Card>
          <p className="stat-label">Queue Depth</p>
          <p className="stat-value">—</p>
          <StatusBadge status="pending" label="Coming Soon" />
        </Card>
      </div>

      {stats.error && (
        <div className="alert alert-error" style={{ marginTop: '1.5rem' }}>
          Could not load farmer stats: {stats.error}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
