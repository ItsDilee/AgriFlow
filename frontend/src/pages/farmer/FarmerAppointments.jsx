import React from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import '../PageStyles.css';

const FarmerAppointments = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Appointments</h1>
        <p className="page-subtitle">View and manage your procurement appointments</p>
      </div>

      <div className="section-header">
        <div /> {/* spacer */}
        <Button variant="primary">Book New Appointment</Button>
      </div>

      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Upcoming Appointments</h3>
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p className="empty-state-title">No upcoming appointments</p>
          <p>Book your first procurement appointment to get started.</p>
        </div>
      </Card>

      <Card>
        <h3 style={{ marginBottom: '1rem' }}>Past Appointments</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Slot</th>
                <th>Commodity</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                  No past appointments found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default FarmerAppointments;
