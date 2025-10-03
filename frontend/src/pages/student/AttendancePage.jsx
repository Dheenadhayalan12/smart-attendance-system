import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AttendancePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [sessionInfo, setSessionInfo] = useState(null);
  const [rollNumber, setRollNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }
    fetchSessionInfo();
  }, [sessionId]);

  const fetchSessionInfo = async () => {
    try {
      const response = await fetch(`http://localhost:3000/local/api/student/session/${sessionId}`);
      const data = await response.json();
      if (data.success) {
        setSessionInfo(data.data);
      } else {
        setError(data.message || 'Failed to load session information');
      }
    } catch (err) {
      setError('Failed to load session information');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      setError('');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !stream) {
      setError('Camera not ready');
      return;
    }
    
    // Wait a bit for video to be ready
    setTimeout(() => {
      canvas.width = 640;
      canvas.height = 480;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 640, 480);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      setError('');
    }, 100);
  };

  const validateRollNumber = (roll) => {
    if (!sessionInfo?.rollNumberRange) return true;
    const [start, end] = sessionInfo.rollNumberRange.split('-');
    const rollNum = parseInt(roll);
    return rollNum >= parseInt(start) && rollNum <= parseInt(end);
  };

  const handleSubmitAttendance = async () => {
    if (!rollNumber || !capturedImage) {
      setError('Please provide roll number and capture your photo');
      return;
    }

    if (!validateRollNumber(rollNumber)) {
      setError(`Roll number must be between ${sessionInfo.rollNumberRange}`);
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const payload = {
        sessionId,
        rollNumber,
        studentName,
        faceImage: capturedImage.split(',')[1] // Remove data:image/jpeg;base64, prefix
      };
      
      console.log('Sending payload:', { ...payload, faceImage: 'base64_data...' });
      
      const response = await fetch('http://localhost:3000/local/api/student/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.success) {
        setSuccess(`Attendance marked successfully! ${data.data.isNewStudent ? '(New student registered)' : '(Face verified)'}`);
        setRollNumber('');
        setStudentName('');
        setCapturedImage(null);
        stopCamera();
      } else {
        setError(data.message || 'Failed to submit attendance');
      }
    } catch (err) {
      setError('Failed to submit attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !sessionInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Session Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">📚 Mark Attendance</h1>
          {sessionInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Subject:</span>
                <p className="text-gray-900">{sessionInfo.subject}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Session:</span>
                <p className="text-gray-900">{sessionInfo.sessionName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Roll Range:</span>
                <p className="text-gray-900">{sessionInfo.rollNumberRange}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Valid Until:</span>
                <p className="text-gray-900">
                  {new Date(sessionInfo.validUntil).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">✅ {success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Roll Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number *
              </label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Enter your roll number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Student Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name (Optional for new students)
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Camera */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                📸 Capture Your Photo *
              </label>
              
              <div className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={startCamera}
                    disabled={!!stream}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {stream ? '✅ Camera Active' : '📹 Start Camera'}
                  </button>
                  
                  <button
                    onClick={capturePhoto}
                    disabled={!stream}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    📷 Capture Photo
                  </button>
                  
                  <button
                    onClick={stopCamera}
                    disabled={!stream}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                  >
                    ⏹️ Stop Camera
                  </button>
                </div>

                {stream && (
                  <div className="text-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '320px', height: '240px', border: '2px solid #3b82f6' }}
                    />
                    <p className="text-sm text-green-600 mt-2">📹 Camera is active</p>
                  </div>
                )}

                {capturedImage && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">📸 Captured Photo:</p>
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-48 h-48 object-cover rounded-lg border mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmitAttendance}
              disabled={isSubmitting || !rollNumber || !capturedImage}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium text-lg"
            >
              {isSubmitting ? '⏳ Submitting...' : '✅ Mark Attendance'}
            </button>

            <div className="text-center text-xs text-gray-500">
              🔒 Your photo is processed securely using face recognition technology
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default AttendancePage;