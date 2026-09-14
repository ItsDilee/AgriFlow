import React from 'react';
import './Spinner.css';

const Spinner = ({ size = 'md', message = 'Loading...' }) => {
  return (
    <div className="spinner-container">
      <div className={`spinner spinner-${size}`}></div>
      <p className="spinner-text">{message}</p>
    </div>
  );
};

export default Spinner;