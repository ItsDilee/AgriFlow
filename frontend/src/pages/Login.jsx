import React from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import './../pages/PageStyles.css';

const Login = () => {
  return (
    <div className="page-container">
      <div className="page-card">
        <h1 className="page-title">Welcome Back</h1>
        <p className="page-subtitle">Sign in to AgriFlow</p>
        <Card>
          <p>Login form placeholder.</p>
          <Button>Sign In</Button>
        </Card>
      </div>
    </div>
  );
};

export default Login;