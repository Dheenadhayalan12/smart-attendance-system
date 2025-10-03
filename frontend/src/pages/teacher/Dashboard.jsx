import { useState, useEffect } from 'react';
import { 
  AcademicCapIcon, 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { getClasses } from '../../services/classes';
import { getSessionsByClass } from '../../services/sessions';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalSessions: 0,
    totalStudents: 0,
    avgAttendance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await getClasses();
      if (response.success) {
        const classes = response.data || [];
        
        let totalSessions = 0;
        let activeSessions = 0;
        let totalStudents = 0;
        let totalAttendance = 0;
        let sessionCount = 0;
        
        // Calculate stats from all classes
        for (const classItem of classes) {
          // Get sessions for each class
          try {
            const sessionsResponse = await getSessionsByClass(classItem.classId);
            if (sessionsResponse.success) {
              const sessions = sessionsResponse.data || [];
              totalSessions += sessions.length;
              
              sessions.forEach(session => {
                if (session.isActive) activeSessions++;
                if (session.attendanceCount) {
                  totalAttendance += session.attendanceCount;
                  sessionCount++;
                }
              });
            }
          } catch (err) {
            console.error('Error fetching sessions for class:', classItem.classId);
          }
          
          // Calculate students from roll range
          if (classItem.rollNumberRange) {
            const [start, end] = classItem.rollNumberRange.split('-');
            totalStudents += (parseInt(end) - parseInt(start) + 1);
          }
        }
        
        const avgAttendance = sessionCount > 0 ? Math.round((totalAttendance / sessionCount) * 100) / 100 : 0;
        
        setStats({
          totalClasses: classes.length,
          totalSessions: activeSessions, // Show active sessions instead of total
          totalStudents,
          avgAttendance
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Classes', value: stats.totalClasses, icon: AcademicCapIcon },
    { label: 'Active Sessions', value: stats.totalSessions, icon: ClipboardDocumentListIcon },
    { label: 'Total Students', value: stats.totalStudents, icon: UserGroupIcon },
    { label: 'Avg Attendance', value: `${stats.avgAttendance}%`, icon: ChartBarIcon }
  ];

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6 text-center">
            <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;