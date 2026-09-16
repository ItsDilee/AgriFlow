import React from 'react';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import '../PageStyles.css';

const FarmerDashboard = () => {
  const user = JSON.parse(localStorage.getItem('agriflow_user') || '{}');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          Welcome, {user.name || 'Farmer'} 👋
        </h1>
        <p className="page-subtitle">Here's an overview of your farm activity</p>
      </div>

      <div className="grid grid-3">
        <Card>
          <p className="stat-label">Upcoming Appointments</p>
          <p className="stat-value">0</p>
          <StatusBadge status="pending" label="No Bookings" />
        </Card>
        <Card>
          <p className="stat-label">Queue Position</p>
          <p className="stat-value">—</p>
          <StatusBadge status="default" label="Not in Queue" />
        </Card>
        <Card>
          <p className="stat-label">Account Status</p>
          <p className="stat-value" style={{ fontSize: '1.2rem' }}>Active</p>
          <StatusBadge status="active" label="Verified" />
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginTop: '1.5rem' }}>
        <Card>
          <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Button variant="primary">Book Appointment</Button>
            <Button variant="outline">Join Queue</Button>
            <Button variant="ghost">View My Profile</Button>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-title">No recent activity</p>
            <p>Your appointment and queue history will appear here.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FarmerDashboard;
