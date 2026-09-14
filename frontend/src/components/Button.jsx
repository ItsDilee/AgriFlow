import React from 'react';
import './Button.css';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  isLoading = false,
  onClick,
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${isLoading ? 'btn-loading' : ''} ${className}`}
      {...props}
    >
      {isLoading && <span className="btn-spinner"></span>}
      <span className="btn-content">{children}</span>
    </button>
  );
};

export default Button;
