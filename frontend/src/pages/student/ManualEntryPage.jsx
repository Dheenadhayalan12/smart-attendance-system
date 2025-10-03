import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ManualEntryPage = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sessionId.trim()) {
      navigate(`/attendance?sessionId=${sessionId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🔢 Manual Entry
          </h1>
          
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✏️</span>
            </div>
            <p className="text-gray-600">
              Enter the session ID provided by your teacher
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session ID *
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter session ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Ask your teacher for the session ID
              </p>
            </div>
            
            <button
              type="submit"
              disabled={!sessionId.trim()}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              Continue to Attendance
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => navigate('/scan')}
              className="block w-full text-sm text-blue-600 hover:text-blue-800"
            >
              📱 Try QR Scanner instead
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualEntryPage;