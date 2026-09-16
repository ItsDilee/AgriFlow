import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon">🌱</span>
          <span className="brand-text">AgriFlow</span>
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>
            About
          </Link>

          {/* Farmer nav */}
          {token && role === 'farmer' && (
            <>
              <Link to="/farmer/dashboard" className={`nav-link ${isActive('/farmer/dashboard') ? 'active' : ''}`}>
                My Dashboard
              </Link>
              <Link to="/farmer/centres" className={`nav-link ${isActive('/farmer/centres') ? 'active' : ''}`}>
                Centres
              </Link>
              <Link to="/farmer/appointments" className={`nav-link ${isActive('/farmer/appointments') ? 'active' : ''}`}>
                Appointments
              </Link>
              <Link to="/farmer/profile" className={`nav-link ${isActive('/farmer/profile') ? 'active' : ''}`}>
                Profile
              </Link>
            </>
          )}

          {/* Admin nav */}
          {token && role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link to="/admin/centres" className={`nav-link ${isActive('/admin/centres') ? 'active' : ''}`}>
                Centres
              </Link>
              <Link to="/admin/farmers" className={`nav-link ${isActive('/admin/farmers') ? 'active' : ''}`}>
                Farmers
              </Link>
              <Link to="/admin/users" className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}>
                Users
              </Link>
            </>
          )}

          {/* Auth actions */}
          {token ? (
            <div className="navbar-user">
              <span className="navbar-username">{user?.name || 'User'}</span>
              <button className="nav-link nav-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className={`nav-link nav-link-cta ${isActive('/login') ? 'active' : ''}`}>
              Sign In
            </Link>
          )}
        </div>

        {/* Hamburger button (mobile) */}
        <button
          className={`hamburger ${menuOpen ? 'hamburger-open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mobile-menu" role="menu">
          <Link to="/" className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={closeMenu}>
            Home
          </Link>
          <Link to="/about" className={`mobile-nav-link ${isActive('/about') ? 'active' : ''}`} onClick={closeMenu}>
            About
          </Link>

          {token && role === 'farmer' && (
            <>
              <Link to="/farmer/dashboard" className={`mobile-nav-link ${isActive('/farmer/dashboard') ? 'active' : ''}`} onClick={closeMenu}>
                My Dashboard
              </Link>
              <Link to="/farmer/centres" className={`mobile-nav-link ${isActive('/farmer/centres') ? 'active' : ''}`} onClick={closeMenu}>
                Centres
              </Link>
              <Link to="/farmer/appointments" className={`mobile-nav-link ${isActive('/farmer/appointments') ? 'active' : ''}`} onClick={closeMenu}>
                Appointments
              </Link>
              <Link to="/farmer/profile" className={`mobile-nav-link ${isActive('/farmer/profile') ? 'active' : ''}`} onClick={closeMenu}>
                Profile
              </Link>
            </>
          )}

          {token && role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className={`mobile-nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`} onClick={closeMenu}>
                Dashboard
              </Link>
              <Link to="/admin/centres" className={`mobile-nav-link ${isActive('/admin/centres') ? 'active' : ''}`} onClick={closeMenu}>
                Centres
              </Link>
              <Link to="/admin/farmers" className={`mobile-nav-link ${isActive('/admin/farmers') ? 'active' : ''}`} onClick={closeMenu}>
                Farmers
              </Link>
              <Link to="/admin/users" className={`mobile-nav-link ${isActive('/admin/users') ? 'active' : ''}`} onClick={closeMenu}>
                Users
              </Link>
            </>
          )}

          {token ? (
            <button className="mobile-nav-link mobile-logout" onClick={handleLogout}>
              Logout ({user?.name || 'User'})
            </button>
          ) : (
            <Link to="/login" className={`mobile-nav-link mobile-nav-cta ${isActive('/login') ? 'active' : ''}`} onClick={closeMenu}>
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
