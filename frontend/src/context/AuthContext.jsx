import React, { createContext, useContext, useState, useEffect } from 'react';

// Helper: safely parse localStorage
const getStoredAuth = () => {
  const token = localStorage.getItem('agriflow_token');
  const role = localStorage.getItem('agriflow_role');
  const userString = localStorage.getItem('agriflow_user');
  let user = null;
  try {
    user = userString ? JSON.parse(userString) : null;
  } catch (e) {
    console.warn('Failed to parse stored user object:', e);
  }
  return { token, role, user };
};

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => getStoredAuth());

  const login = (data) => {
    const { token, user } = data;
    const role = user?.role;
    localStorage.setItem('agriflow_token', token);
    localStorage.setItem('agriflow_role', role);
    localStorage.setItem('agriflow_user', JSON.stringify(user));
    setAuth({ token, role, user });
  };

  const logout = () => {
    localStorage.removeItem('agriflow_token');
    localStorage.removeItem('agriflow_role');
    localStorage.removeItem('agriflow_user');
    setAuth({ token: null, role: null, user: null });
  };

  const updateUser = (updates) => {
    const newUser = { ...auth.user, ...updates };
    localStorage.setItem('agriflow_user', JSON.stringify(newUser));
    setAuth((prev) => ({ ...prev, user: newUser }));
  };

  const isAuthenticated = !!auth.token;

  useEffect(() => {
    // If localStorage changes externally (e.g., another tab) we sync
    const syncAuth = () => setAuth(getStoredAuth());
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: auth.user,
        token: auth.token,
        role: auth.role,
        isAuthenticated,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
