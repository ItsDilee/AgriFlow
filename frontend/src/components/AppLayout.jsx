import React from 'react';
import Navbar from './components/Navbar';
import './styles/theme.css';

const AppLayout = ({ children }) => {
  return (
    <div className="app">
      <Navbar />
      <main className="content">{children}</main>
    </div>
  );
};

export default AppLayout;