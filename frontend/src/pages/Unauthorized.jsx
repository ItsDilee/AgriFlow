import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const Unauthorized = () => {
  return (
    <div className="page-container">
      <div className="empty-state">
        <div className="empty-state-icon">🔒</div>
        <h2 className="empty-state-title">Access Denied</h2>
        <p>You don&apos;t have permission to view this page.</p>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" as={Link} onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Link to="/">
            <Button variant="outline">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
