// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  role: string;
  token: string;
  employeeId?: number | string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, role: string, name: string, employeeId?: number | string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const employeeId = localStorage.getItem('employeeId');

    if (token && role && name) {
      setUser({ token, role, name, employeeId: employeeId || undefined });
    }
  }, []);

  const login = (token: string, role: string, name: string, employeeId?: number | string) => {
    const userData = { token, role, name, employeeId };
    setUser(userData);
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    if (employeeId) {
      localStorage.setItem('employeeId', String(employeeId));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('employeeId');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
