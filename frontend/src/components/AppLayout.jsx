import React from 'react';
import Navbar from './Navbar';

const AppLayout = ({ children }) => {
  return (
    <div className="app">
      <Navbar />
      <main className="content">{children}</main>
    </div>
  );
};

export default AppLayout;
