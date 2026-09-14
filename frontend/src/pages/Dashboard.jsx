import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import './../pages/PageStyles.css';

const Dashboard = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">AgriFlow Dashboard</h1>
        <p className="page-subtitle">Agricultural Procurement & Queue Management</p>
      </div>

      <div className="grid grid-3">
        <Card>
          <h3>Appointments</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>12</p>
          <StatusBadge status="active" label="Open" />
        </Card>
        <Card>
          <h3>Queue Length</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>5</p>
          <StatusBadge status="processing" label="Waiting" />
        </Card>
        <Card>
          <h3>Procurements</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>3</p>
          <StatusBadge status="completed" label="Done" />
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