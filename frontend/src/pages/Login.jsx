import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Form from '../components/Form';
import Button from '../components/Button';
import Card from '../components/Card';
import { apiPost } from '../services/api';
import './PageStyles.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname;

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setError('');
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await apiPost('/auth/login', formData);

      // Use AuthContext to persist and broadcast auth state
      login(data);

      // Redirect: honour the page they tried to visit first, then role default
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else if (data.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/farmer/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="page-header" style={{ textAlign: 'center' }}>
          <div className="login-brand-icon">🌱</div>
          <h1 className="page-title">Welcome Back</h1>
          <p className="page-subtitle">Sign in to your AgriFlow account</p>
        </div>

        <Card>
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <Form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="login-submit-btn"
            >
              Sign In
            </Button>
          </Form>

          <p className="login-register-link">
            Don&apos;t have an account?{' '}
            <Link to="/register">Create one</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Login;
