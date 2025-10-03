import { useState, useEffect } from 'react';
import { isTeacherAuthenticated, getTeacherToken, removeTeacherToken } from '../services/storage';
import { teacherLogin } from '../services/teacher';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isTeacherAuthenticated();
      const currentToken = getTeacherToken();
      
      setIsAuthenticated(authenticated);
      setToken(currentToken);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await teacherLogin(credentials);
      
      if (response.success) {
        setIsAuthenticated(true);
        setToken(response.data.token);
        return { success: true, data: response.data };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeTeacherToken();
    setIsAuthenticated(false);
    setToken(null);
  };

  return {
    isAuthenticated,
    loading,
    token,
    login,
    logout
  };
};