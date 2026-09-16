import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Form from '../components/Form';
import Button from '../components/Button';
import Card from '../components/Card';
import { apiPost } from '../services/api';
import './PageStyles.css';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'farmer',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setError('');
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setIsLoading(true);
    try {
      // Register the account
      await apiPost('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      // Auto-login after registration
      const loginData = await apiPost('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      login(loginData);

      // Redirect based on role
      if (loginData.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/farmer/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="page-header" style={{ textAlign: 'center' }}>
          <div className="login-brand-icon">🌱</div>
          <h1 className="page-title">Create Account</h1>
          <p className="page-subtitle">Join AgriFlow as a farmer or admin</p>
        </div>

        <Card>
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <Form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Your full name"
                value={formData.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
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
              <label className="form-label" htmlFor="role">Account Type</label>
              <select
                id="role"
                name="role"
                className="form-select"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="farmer">Farmer</option>
                <option value="admin">Admin / Operator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="login-submit-btn"
            >
              Create Account
            </Button>
          </Form>

          <p className="login-register-link">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Register;
