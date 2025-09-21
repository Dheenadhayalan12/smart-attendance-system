import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app startup
    const initializeAuth = async () => {
      const token = authService.getToken();
      const userData = authService.getCurrentUser();

      if (token && userData) {
        try {
          setUser(userData);
          // Set the token in axios headers
          authService.setAuthToken(token);
        } catch (error) {
          console.error("Error initializing auth:", error);
          authService.logout();
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);

      // Backend returns: { success: true, data: { token, teacherId, name, email } }
      const { data } = response;
      const { token, teacherId, name, email: userEmail } = data;

      const teacher = { teacherId, name, email: userEmail };

      // Store token and user data using authService
      authService.setToken(token);
      authService.setCurrentUser(teacher);

      setUser(teacher);
      toast.success(`Welcome back, ${teacher.name}!`, {
        icon: "👋",
        style: {
          background: "#10b981",
          color: "#ffffff",
        },
      });
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      toast.error(errorMessage, {
        icon: "❌",
      });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await authService.register(name, email, password);

      // Backend returns: { success: true, data: { token, teacherId, name, email } }
      const { data } = response;
      const { token, teacherId, name: userName, email: userEmail } = data;

      const teacher = { teacherId, name: userName, email: userEmail };

      // Store token and user data using authService
      authService.setToken(token);
      authService.setCurrentUser(teacher);

      setUser(teacher);
      toast.success(`Welcome to Smart Attendance, ${teacher.name}!`, {
        icon: "🎉",
        style: {
          background: "#10b981",
          color: "#ffffff",
        },
      });
      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      toast.error(errorMessage, {
        icon: "❌",
      });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast.success("Logged out successfully", {
      icon: "👋",
      style: {
        background: "#6b7280",
        color: "#ffffff",
      },
    });
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
