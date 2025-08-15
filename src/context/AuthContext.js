import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Demo-Benutzer
  const demoUsers = [
    {
      id: 1,
      name: 'Max Müller',
      email: 'max.mueller@winterdienst.de',
      role: 'worker', // worker, supervisor, admin
      password: 'demo123'
    },
    {
      id: 2,
      name: 'Anna Schmidt',
      email: 'anna.schmidt@winterdienst.de',
      role: 'worker',
      password: 'demo123'
    },
    {
      id: 3,
      name: 'Peter Wagner',
      email: 'peter.wagner@winterdienst.de',
      role: 'worker',
      password: 'demo123'
    },
    {
      id: 4,
      name: 'Chef Manager',
      email: 'chef@winterdienst.de',
      role: 'admin',
      password: 'admin123'
    },
    {
      id: 5,
      name: 'Team Leader',
      email: 'supervisor@winterdienst.de',
      role: 'supervisor',
      password: 'super123'
    }
  ];

  const login = async (email, password) => {
    try {
      // Try API login first
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // API login successful
        setCurrentUser(data.data.user);
        setIsAuthenticated(true);
        setAuthToken(data.data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.data.user));
        localStorage.setItem('authToken', data.data.token);
        return { success: true, user: data.data.user };
      } else {
        // API login failed, try demo users as fallback
        const user = demoUsers.find(u => u.email === email && u.password === password);
        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('currentUser', JSON.stringify(user));
          return { success: true, user };
        }
        return { success: false, error: data.error || 'Ungültige Anmeldedaten' };
      }
    } catch (error) {
      // Network error, try demo users as fallback
      console.error('Login API error, trying demo login:', error);
      const user = demoUsers.find(u => u.email === email && u.password === password);
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false, error: 'Verbindungsfehler. Bitte versuchen Sie es erneut.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        setCurrentUser(data.data.user);
        setIsAuthenticated(true);
        setAuthToken(data.data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.data.user));
        localStorage.setItem('authToken', data.data.token);
        return { success: true, user: data.data.user };
      } else {
        return { success: false, error: data.error || 'Registrierung fehlgeschlagen' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Verbindungsfehler. Bitte versuchen Sie es erneut.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  };

  // Beim App-Start prüfen ob User eingeloggt
  const initAuth = async () => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      const savedToken = localStorage.getItem('authToken');
      
      if (savedUser && savedToken) {
        // Validate token with server
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        });

        if (response.ok) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          setIsAuthenticated(true);
          setAuthToken(savedToken);
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('currentUser');
          localStorage.removeItem('authToken');
        }
      } else if (savedUser) {
        // Demo user without token
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth validation error:', error);
      // If validation fails, keep demo login if available
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Berechtigungen prüfen
  const canViewAllData = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  };

  const canViewWorkerData = (workerName) => {
    if (canViewAllData()) return true;
    return currentUser?.name === workerName;
  };

  const canManageRoutes = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  };

  const value = {
    currentUser,
    isAuthenticated,
    authToken,
    isLoading,
    login,
    register,
    logout,
    initAuth,
    canViewAllData,
    canViewWorkerData,
    canManageRoutes,
    demoUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};