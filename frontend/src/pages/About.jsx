import React from 'react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import './../pages/PageStyles.css';

const About = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">About AgriFlow</h1>
      <p className="page-subtitle">Real-Time Agricultural Procurement & Queue Management Platform</p>

      <div className="grid grid-2" style={{ marginTop: '2rem' }}>
        <Card>
          <h3>Capacity-aware scheduling</h3>
          <p>Smart appointment slots with capacity tracking.</p>
          <StatusBadge status="active" label="Planned" />
        </Card>
        <Card>
          <h3>Concurrency-safe booking</h3>
          <p>Atomic operations prevent double bookings.</p>
          <StatusBadge status="verified" label="Core Feature" />
        </Card>
        <Card>
          <h3>Real-time queue</h3>
          <p>Live queue updates via WebSockets.</p>
          <StatusBadge status="processing" label="Planned" />
        </Card>
        <Card>
          <h3>Audit logging</h3>
          <p>Full traceability of all transactions.</p>
          <StatusBadge status="pending" label="Planned" />
        </Card>
      </div>
    </div>
  );
};

export default About;