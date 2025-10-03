import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import TeacherLayout from '../../components/layout/TeacherLayout';
import Dashboard from './Dashboard';
import ManageClass from './ManageClass';
import Students from './Students';

const TeacherMain = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/teacher/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'manage-class':
        return <ManageClass />;
      case 'student':
        return <Students />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TeacherLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </TeacherLayout>
  );
};

export default TeacherMain;