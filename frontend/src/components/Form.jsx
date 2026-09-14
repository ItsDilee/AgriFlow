import React from 'react';
import './Form.css';

const Form = ({ children, className = '', ...props }) => {
  return (
    <form className={`agri-form ${className}`} {...props}>
      {children}
    </form>
  );
};

export default Form;