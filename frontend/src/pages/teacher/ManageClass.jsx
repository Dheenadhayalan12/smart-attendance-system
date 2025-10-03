import { useState, useEffect } from 'react';
import { getClasses, createClass, deleteClass, getClass } from '../../services/classes';
import { createSession, getSessionsByClass, endSession } from '../../services/sessions';
import ClassCard from '../../components/class/ClassCard';
import CreateClassForm from '../../components/class/CreateClassForm';
import CreateSessionForm from '../../components/session/CreateSessionForm';
import SessionCard from '../../components/session/SessionCard';

const ManageClass = () => {
  const [classes, setClasses] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await getClasses();
      if (response.success) {
        setClasses(response.data || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (classData) => {
    try {
      const response = await createClass(classData);
      if (response.success) {
        setShowCreateForm(false);
        loadClasses();
      }
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const handleDeleteClass = async (classId) => {
    try {
      const response = await deleteClass(classId);
      if (response.success) {
        loadClasses();
      }
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  if (selectedClass) {
    return (
      <div>
        <button
          onClick={() => setSelectedClass(null)}
          className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800"
        >
          ← Back to Classes
        </button>
        <ClassDetail classId={selectedClass} />
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading classes...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Classes</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Class
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6">
          <CreateClassForm
            onSubmit={handleCreateClass}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <ClassCard
            key={classItem.classId}
            classData={classItem}
            onClick={() => setSelectedClass(classItem.classId)}
            onDelete={handleDeleteClass}
          />
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No classes found. Create your first class to get started.
        </div>
      )}
    </div>
  );
};

const ClassDetail = ({ classId }) => {
  const [classData, setClassData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    try {
      const [classResponse, sessionsResponse] = await Promise.all([
        getClass(classId),
        getSessionsByClass(classId)
      ]);
      
      if (classResponse.success) {
        setClassData(classResponse.data);
      }
      if (sessionsResponse.success) {
        setSessions(sessionsResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading class data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (sessionData) => {
    try {
      const payload = {
        classId,
        sessionName: sessionData.sessionName,
        duration: parseInt(sessionData.duration),
        description: sessionData.description
      };
      const response = await createSession(payload);
      if (response.success) {
        setShowCreateSession(false);
        loadClassData();
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleEndSession = async (sessionId, isAutoEnd = false) => {
    try {
      const response = await endSession(sessionId);
      if (response.success) {
        if (!isAutoEnd) {
          // Only show message for manual end
          console.log('Session ended successfully');
        }
        loadClassData(); // Refresh sessions
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading class details...</div>;
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Class Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Subject:</span>
            <p className="text-gray-900">{classData?.subject || 'Loading...'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Roll Range:</span>
            <p className="text-gray-900">{classData?.rollNumberRange || 'Loading...'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Department:</span>
            <p className="text-gray-900">{classData?.department || 'N/A'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Total Sessions:</span>
            <p className="text-gray-900">{classData?.totalSessions || 0}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium">Sessions</h4>
        <button
          onClick={() => setShowCreateSession(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Create New Session
        </button>
      </div>

      {showCreateSession && (
        <div className="mb-6">
          <CreateSessionForm
            onSubmit={handleCreateSession}
            onCancel={() => setShowCreateSession(false)}
            sessionNumber={(sessions.length || 0) + 1}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No sessions found. Create your first session to get started.
          </div>
        ) : (
          sessions.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              onEndSession={handleEndSession}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ManageClass;