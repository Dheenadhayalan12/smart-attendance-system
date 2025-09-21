import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";

// Import pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Classes from "./pages/Classes";
import Students from "./pages/Students";
import Sessions from "./pages/Sessions";
import AttendanceMonitor from "./pages/AttendanceMonitor";
import Reports from "./pages/Reports";
import StudentMobile from "./pages/StudentMobile";
import LandingPage from "./pages/LandingPage";

// Import components
import Layout from "./components/Layout";
import LoadingSpinner from "./components/LoadingSpinner";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes"
        element={
          <ProtectedRoute>
            <Classes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <Students />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sessions"
        element={
          <ProtectedRoute>
            <Sessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitor"
        element={
          <ProtectedRoute>
            <AttendanceMonitor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route path="/student" element={<StudentMobile />} />
      <Route path="/home" element={<LandingPage />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 font-inter">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1f2937",
                color: "#f9fafb",
                borderRadius: "12px",
                padding: "16px",
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#f9fafb",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#f9fafb",
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
