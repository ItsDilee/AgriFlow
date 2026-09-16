import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { apiGet } from '../services/api';
import './PageStyles.css';

const Dashboard = () => {
  const [apiStatus, setApiStatus] = useState(null); // null | 'connected' | 'offline'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/status')
      .then((data) => {
        setApiStatus(data.db === 'connected' ? 'connected' : 'degraded');
      })
      .catch(() => {
        setApiStatus('offline');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">AgriFlow Dashboard</h1>
        <p className="page-subtitle">Agricultural Procurement &amp; Queue Management</p>
      </div>

      {/* Backend connectivity banner */}
      <div className="dashboard-status-bar">
        <span className="status-label">System Status:</span>
        {loading ? (
          <StatusBadge status="processing" label="Checking…" />
        ) : apiStatus === 'connected' ? (
          <StatusBadge status="active" label="Backend Connected" />
        ) : apiStatus === 'degraded' ? (
          <StatusBadge status="pending" label="DB Disconnected" />
        ) : (
          <StatusBadge status="cancelled" label="Backend Offline" />
        )}
      </div>

      {/* Stat overview — placeholder until real data endpoints land */}
      <div className="grid grid-3" style={{ marginTop: '1.5rem' }}>
        <Card>
          <p className="stat-label">Appointments</p>
          <p className="stat-value">—</p>
          <StatusBadge status="pending" label="Coming Soon" />
        </Card>
        <Card>
          <p className="stat-label">Queue Length</p>
          <p className="stat-value">—</p>
          <StatusBadge status="pending" label="Coming Soon" />
        </Card>
        <Card>
          <p className="stat-label">Procurements</p>
          <p className="stat-value">—</p>
          <StatusBadge status="pending" label="Coming Soon" />
        </Card>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Card>
          <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button variant="primary">Book Appointment</Button>
            <Button variant="outline">View Queue</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
