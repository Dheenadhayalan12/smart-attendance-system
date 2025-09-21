import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  QrCodeIcon,
  PlayIcon,
  StopIcon,
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import QRCode from "qrcode";
import toast from "react-hot-toast";

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [qrCodeData, setQrCodeData] = useState("");
  const qrCanvasRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    classId: "",
    title: "",
    duration: 60,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const mockClasses = [
      { id: 1, name: "Computer Science 101", subject: "Computer Science" },
      { id: 2, name: "Data Structures", subject: "Computer Science" },
      { id: 3, name: "Web Development", subject: "Computer Science" },
    ];

    const mockSessions = [
      {
        id: 1,
        title: "Morning Lecture",
        classId: 1,
        className: "Computer Science 101",
        status: "active",
        startTime: "2024-09-21T09:00:00",
        duration: 60,
        attendanceCount: 18,
        totalStudents: 25,
        qrCode: "session_1_qr_code_12345",
      },
      {
        id: 2,
        title: "Lab Session",
        classId: 2,
        className: "Data Structures",
        status: "completed",
        startTime: "2024-09-20T14:00:00",
        endTime: "2024-09-20T15:30:00",
        duration: 90,
        attendanceCount: 15,
        totalStudents: 18,
        qrCode: "session_2_qr_code_67890",
      },
      {
        id: 3,
        title: "Project Review",
        classId: 3,
        className: "Web Development",
        status: "scheduled",
        startTime: "2024-09-22T11:00:00",
        duration: 120,
        attendanceCount: 0,
        totalStudents: 30,
      },
    ];

    // Simulate API call
    setTimeout(() => {
      setClasses(mockClasses);
      setSessions(mockSessions);
      setLoading(false);
    }, 1000);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.classId) {
      newErrors.classId = "Please select a class";
    }
    if (!formData.title.trim()) {
      newErrors.title = "Session title is required";
    }
    if (!formData.duration || formData.duration < 15) {
      newErrors.duration = "Duration must be at least 15 minutes";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const selectedClass = classes.find(
        (c) => c.id === parseInt(formData.classId)
      );
      const newSession = {
        id: Date.now(),
        title: formData.title,
        classId: parseInt(formData.classId),
        className: selectedClass.name,
        status: "scheduled",
        startTime: new Date().toISOString(),
        duration: parseInt(formData.duration),
        attendanceCount: 0,
        totalStudents: 25, // This would come from the class data
        qrCode: `session_${Date.now()}_qr_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      };

      setSessions((prev) => [newSession, ...prev]);
      toast.success("Session created successfully!");
      setShowCreateModal(false);
      resetForm();
    } catch {
      toast.error("Error creating session. Please try again.");
    }
  };

  const handleStartSession = async (sessionId) => {
    try {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                status: "active",
                startTime: new Date().toISOString(),
              }
            : session
        )
      );
      toast.success("Session started successfully!");
    } catch {
      toast.error("Error starting session.");
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                status: "completed",
                endTime: new Date().toISOString(),
              }
            : session
        )
      );
      toast.success("Session ended successfully!");
    } catch {
      toast.error("Error ending session.");
    }
  };

  const handleShowQR = async (session) => {
    setSelectedSession(session);

    // Generate QR code
    try {
      const qrData = {
        sessionId: session.id,
        classId: session.classId,
        timestamp: Date.now(),
        code: session.qrCode,
      };

      const qrString = JSON.stringify(qrData);
      setQrCodeData(qrString);

      if (qrCanvasRef.current) {
        await QRCode.toCanvas(qrCanvasRef.current, qrString, {
          width: 300,
          margin: 2,
          color: {
            dark: "#1f2937",
            light: "#ffffff",
          },
        });
      }

      setShowQRModal(true);
    } catch {
      toast.error("Error generating QR code.");
    }
  };

  const resetForm = () => {
    setFormData({
      classId: "",
      title: "",
      duration: 60,
    });
    setErrors({});
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateTimeRemaining = (startTime, duration) => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    const now = new Date();
    const remaining = end - now;

    if (remaining <= 0) return "Session ended";

    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Attendance Sessions
          </h1>
          <p className="text-gray-600">
            Create and manage attendance sessions for your classes
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Session
        </motion.button>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No sessions yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first attendance session
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Your First Session
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {session.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          session.status
                        )}`}
                      >
                        {session.status.charAt(0).toUpperCase() +
                          session.status.slice(1)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {session.className}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDateTime(session.startTime)}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {session.duration} minutes
                      </div>
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {session.attendanceCount}/{session.totalStudents}{" "}
                        present
                      </div>
                      {session.status === "active" && (
                        <div className="flex items-center text-green-600">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {calculateTimeRemaining(
                            session.startTime,
                            session.duration
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 lg:mt-0 lg:ml-6">
                    <div className="flex flex-wrap gap-2">
                      {session.status === "scheduled" && (
                        <button
                          onClick={() => handleStartSession(session.id)}
                          className="inline-flex items-center px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <PlayIcon className="h-4 w-4 mr-2" />
                          Start Session
                        </button>
                      )}

                      {session.status === "active" && (
                        <>
                          <button
                            onClick={() => handleShowQR(session)}
                            className="inline-flex items-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <QrCodeIcon className="h-4 w-4 mr-2" />
                            Show QR
                          </button>
                          <button
                            onClick={() => handleEndSession(session.id)}
                            className="inline-flex items-center px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <StopIcon className="h-4 w-4 mr-2" />
                            End Session
                          </button>
                        </>
                      )}

                      <button className="inline-flex items-center px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Attendance Progress</span>
                    <span>
                      {Math.round(
                        (session.attendanceCount / session.totalStudents) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (session.attendanceCount / session.totalStudents) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Session Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-xl shadow-xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Create New Session
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Class *
                    </label>
                    <div className="relative">
                      <select
                        name="classId"
                        value={formData.classId}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none ${
                          errors.classId ? "border-red-300" : "border-gray-300"
                        }`}
                      >
                        <option value="">Choose a class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                    {errors.classId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.classId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.title ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="e.g., Morning Lecture, Lab Session"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="15"
                      max="300"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.duration ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="60"
                    />
                    {errors.duration && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.duration}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Session
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-xl shadow-xl max-w-md w-full"
            >
              <div className="p-6 text-center">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Attendance QR Code
                  </h3>
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {selectedSession.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedSession.className}
                  </p>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <canvas ref={qrCanvasRef} />
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-6">
                  <p>Students can scan this QR code to mark their attendance</p>
                  <p className="mt-2 font-medium">
                    Session ends in:{" "}
                    {calculateTimeRemaining(
                      selectedSession.startTime,
                      selectedSession.duration
                    )}
                  </p>
                </div>

                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sessions;
