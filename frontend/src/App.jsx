import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TeacherMain from './pages/teacher/TeacherMain';
import AttendancePage from './pages/student/AttendancePage';
import QRScannerPage from './pages/student/QRScannerPage';
import ManualEntryPage from './pages/student/ManualEntryPage';

const HomeRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/teacher" replace /> : <Navigate to="/teacher/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Student Routes */}
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/scan" element={<QRScannerPage />} />
        <Route path="/manual" element={<ManualEntryPage />} />
        
        {/* Teacher Routes */}
        <Route path="/teacher/login" element={<Login />} />
        <Route path="/teacher/signup" element={<Signup />} />
        <Route path="/teacher/*" element={<TeacherMain />} />
        
        {/* Legacy Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Home Route */}
        <Route path="/" element={<HomeRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;