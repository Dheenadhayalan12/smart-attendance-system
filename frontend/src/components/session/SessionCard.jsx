import { useState, useEffect } from 'react';

const SessionCard = ({ session, onEndSession }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!session.isActive) return;

    const updateTimer = () => {
      const now = new Date();
      const endTime = new Date(session.endTime);
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        setIsExpired(true);
        // Auto-end session if expired
        if (session.isActive) {
          onEndSession(session.sessionId, true); // true indicates auto-end
        }
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session, onEndSession]);

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      onEndSession(session.sessionId, false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h6 className="font-medium text-gray-900">{session.sessionName}</h6>
          <p className="text-sm text-gray-500">
            Created: {new Date(session.createdAt).toLocaleString()}
          </p>
          {session.description && (
            <p className="text-sm text-gray-600 mt-1">{session.description}</p>
          )}
          <p className="text-xs text-gray-400">
            Duration: {session.duration} minutes
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          session.isActive && !isExpired
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {session.isActive && !isExpired ? 'Active' : 'Ended'}
        </span>
      </div>

      {session.isActive && !isExpired && (
        <div className="mb-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Time remaining:</span>
            <span className="font-mono text-blue-600">{timeRemaining}</span>
          </div>
          <div className="mt-2">
            <button
              onClick={handleEndSession}
              className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <div>Attendance: {session.attendanceCount || 0} students</div>
        {session.qrCode && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                modal.innerHTML = `
                  <div class="bg-white p-6 rounded-lg max-w-sm">
                    <h3 class="text-lg font-semibold mb-4">QR Code</h3>
                    <img src="${session.qrCode}" alt="QR Code" class="w-full mb-4">
                    <div class="flex gap-2">
                      <button onclick="navigator.clipboard.writeText('${session.attendanceUrl}').then(() => alert('Link copied!'))" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded">Copy Link</button>
                      <button onclick="this.closest('.fixed').remove()" class="flex-1 px-4 py-2 bg-gray-600 text-white rounded">Close</button>
                    </div>
                  </div>
                `;
                document.body.appendChild(modal);
              }}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View QR Code
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(session.attendanceUrl).then(() => {
                  alert('Link copied to clipboard!');
                });
              }}
              className="text-green-600 hover:text-green-800 underline"
            >
              Copy Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionCard;