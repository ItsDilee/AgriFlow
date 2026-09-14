import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status, label }) => {
  const getStatusClass = (status) => {
    const statusMap = {
      active: 'status-active',
      completed: 'status-completed',
      pending: 'status-pending',
      cancelled: 'status-cancelled',
      verified: 'status-verified',
      processing: 'status-processing',
      available: 'status-available',
      full: 'status-full',
      default: 'status-default'
    };
    return statusMap[status] || statusMap.default;
  };

  return (
    <span className={`status-badge ${getStatusClass(status)}`}>{label}</span>
  );
};

export default StatusBadge;
