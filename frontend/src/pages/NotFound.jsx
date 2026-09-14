import React from 'react';
import Button from '../components/Button';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="page-container">
      <div className="empty-state">
        <div className="empty-state-icon">404</div>
        <h2 className="empty-state-title">Page not found</h2>
        <p>The page you are looking for does not exist.</p>
        <div style={{ marginTop: '1.5rem' }}>
          <Button variant="primary" as="a" href="/">
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;