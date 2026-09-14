import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import './styles/theme.css';

const App = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

export default App;