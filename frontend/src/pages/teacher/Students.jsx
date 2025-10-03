import { useState, useEffect } from 'react';
import { getClasses } from '../../services/classes';

const Students = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await getClasses();
      if (response.success) {
        const classData = response.data || [];
        setClasses(classData);
        if (classData.length > 0) {
          setSelectedClass(classData[0].classId);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!selectedClass) return;
    
    try {
      // Get students and sessions for the class
      const token = localStorage.getItem('teacherToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [studentsResponse, sessionsResponse] = await Promise.all([
        fetch(`http://localhost:3000/local/classes/${selectedClass}/students`, { headers }),
        fetch(`http://localhost:3000/local/classes/${selectedClass}/sessions`, { headers })
      ]);
      
      const studentsData = await studentsResponse.json();
      const sessionsData = await sessionsResponse.json();
      
      if (studentsData.success) {
        const students = studentsData.data || [];
        const totalSessions = sessionsData.success ? (sessionsData.data || []).length : 0;
        
        // Add total sessions count to each student
        const studentsWithSessions = students.map(student => {
          console.log('Student:', student.name, 'Total Sessions:', totalSessions);
          return {
            ...student,
            totalSessions
          };
        });
        
        setStudents(studentsWithSessions);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const getAttendancePercentage = (student) => {
    const attendanceCount = student.attendanceCount || 0;
    const totalSessions = student.totalSessions || attendanceCount; // Use attendance count if total sessions is 0
    if (totalSessions === 0) return 0;
    return Math.round((attendanceCount / totalSessions) * 100);
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Classes Found</h3>
        <p className="text-gray-600">Create a class first to view students</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Students</h2>

      {/* Class Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Class
        </label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {classes.map((classItem) => (
            <option key={classItem.classId} value={classItem.classId}>
              {classItem.subject} ({classItem.rollNumberRange})
            </option>
          ))}
        </select>
      </div>

      {/* Students Grid */}
      {students.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Students Yet</h3>
          <p className="text-gray-600">Students will appear here after they attend their first session</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <div key={student.studentId || student.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              {/* Student Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {student.name || `Student ${student.rollNumber}`}
                  </h4>
                  <p className="text-gray-600 text-sm">Roll: {student.rollNumber}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getAttendanceColor(getAttendancePercentage(student))}`}>
                  {getAttendancePercentage(student)}%
                </div>
              </div>

              {/* Attendance Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Present</span>
                  <span className="font-medium text-gray-900">{student.attendanceCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Sessions</span>
                  <span className="font-medium text-gray-900">{student.totalSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Attended</span>
                  <span className="font-medium text-gray-900">
                    {student.registeredAt ? new Date(student.registeredAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Attendance Progress</span>
                  <span>{getAttendancePercentage(student)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      getAttendancePercentage(student) >= 80 ? 'bg-green-500' :
                      getAttendancePercentage(student) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${getAttendancePercentage(student)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Students;