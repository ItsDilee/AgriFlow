import React from 'react';
import Button from './Button';
import './ErrorState.css';

const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => {
  return (
    <div className="error-state" role="alert">
      <div className="error-state-icon">!</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {onRetry && <Button variant="outline" onClick={onRetry}>Try Again</Button>}
    </div>
  );
};

export default ErrorState;