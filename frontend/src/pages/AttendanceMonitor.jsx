import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  EyeIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { classService } from "../services/classService";
import { sessionService } from "../services/sessionService";
import { reportService } from "../services/reportService";

const AttendanceMonitor = () => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0,
  });

  // Load real sessions from backend
  useEffect(() => {
    loadActiveSessions();
  }, []);

  const loadActiveSessions = async () => {
    try {
      setLoading(true);
      console.log("Loading active sessions...");

      // Get all classes first
      const classesResponse = await classService.getClasses();
      if (classesResponse.success && Array.isArray(classesResponse.data)) {
        const allSessions = [];

        // For each class, get its sessions
        for (const classItem of classesResponse.data) {
          try {
            const sessionsResponse = await sessionService.getSessionsByClass(
              classItem.classId
            );
            if (
              sessionsResponse.success &&
              Array.isArray(sessionsResponse.sessions)
            ) {
              const classSessions = sessionsResponse.sessions.map(
                (session) => ({
                  sessionId: session.sessionId,
                  subject: classItem.subject,
                  className: classItem.subject,
                  classId: classItem.classId,
                  startTime: session.startTime,
                  endTime: session.endTime,
                  status: session.isActive ? "active" : "completed",
                  sessionName: session.sessionName,
                  attendanceCount: session.attendanceCount || 0,
                  expectedStudents: session.expectedStudents || 0,
                })
              );
              allSessions.push(...classSessions);
            }
          } catch (error) {
            console.error(
              `Error loading sessions for class ${classItem.classId}:`,
              error
            );
          }
        }

        // Sort sessions by start time (most recent first)
        allSessions.sort(
          (a, b) => new Date(b.startTime) - new Date(a.startTime)
        );
        setSessions(allSessions);
        console.log("Loaded sessions:", allSessions);
      } else {
        console.log("No classes found");
        setSessions([]);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load attendance data for selected session
  useEffect(() => {
    if (selectedSession) {
      loadAttendanceData(selectedSession.sessionId);
    }
  }, [selectedSession]);

  const loadAttendanceData = async (sessionId) => {
    try {
      setLoading(true);
      console.log("Loading attendance data for session:", sessionId);

      const response = await reportService.getSessionAttendance(sessionId);
      if (response && response.success) {
        const attendance = response.attendance || [];
        setAttendanceData(attendance);

        // Calculate stats
        const total = attendance.length;
        const present = attendance.filter((a) => a.status === "present").length;
        const absent = total - present;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        setStats({ total, present, absent, percentage });
        console.log("Loaded attendance data:", {
          total,
          present,
          absent,
          percentage,
        });
      } else {
        console.log("No attendance data found");
        setAttendanceData([]);
        setStats({ total: 0, present: 0, absent: 0, percentage: 0 });
      }
    } catch (error) {
      console.error("Error loading attendance data:", error);
      toast.error("Failed to load attendance data");
      setAttendanceData([]);
      setStats({ total: 0, present: 0, absent: 0, percentage: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    toast.success(`Monitoring session: ${session.subject}`, {
      icon: "👁️",
    });
  };

  const handleRefresh = async () => {
    if (!selectedSession) return;

    setRefreshing(true);
    try {
      await loadActiveSessions();
      await loadAttendanceData(selectedSession.sessionId);
      toast.success("Attendance data refreshed", {
        icon: "🔄",
      });
    } catch (error) {
      console.error("Error refreshing attendance data:", error);
      toast.error("Failed to refresh attendance data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    if (!selectedSession || attendanceData.length === 0) return;

    // Create CSV content
    const headers = [
      "Roll Number",
      "Name",
      "Email",
      "Status",
      "Marked At",
      "Method",
    ];
    const csvContent = [
      headers.join(","),
      ...attendanceData.map((student) =>
        [
          student.rollNumber,
          student.name,
          student.email,
          student.status,
          student.markedAt
            ? new Date(student.markedAt).toLocaleString()
            : "N/A",
          student.method || "N/A",
        ].join(",")
      ),
    ].join("\\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${selectedSession.subject}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Attendance data exported successfully", {
      icon: "📁",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <CheckCircleIconSolid className="w-5 h-5 text-green-500" />;
      case "absent":
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "active":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "scheduled":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "completed":
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  return (
    <div className="space-y-6">
      {loading && <LoadingSpinner />}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <EyeIcon className="w-8 h-8 text-indigo-600" />
              Real-time Attendance Monitor
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor live attendance marking for your sessions
            </p>
          </div>

          {selectedSession && (
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <ArrowPathIcon
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Export CSV
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Session Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Select Session to Monitor
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <motion.div
              key={session.sessionId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleSessionSelect(session)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedSession?.sessionId === session.sessionId
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900">{session.subject}</h3>
                <span className={getStatusBadge(session.status)}>
                  {session.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">{session.className}</p>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ClockIcon className="w-4 h-4" />
                {new Date(session.startTime).toLocaleTimeString()} -
                {new Date(session.endTime).toLocaleTimeString()}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Attendance Monitoring */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Students
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total}
                    </p>
                  </div>
                  <UserGroupIcon className="w-8 h-8 text-gray-400" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.present}
                    </p>
                  </div>
                  <CheckCircleIconSolid className="w-8 h-8 text-green-400" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.absent}
                    </p>
                  </div>
                  <XCircleIcon className="w-8 h-8 text-red-400" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Attendance Rate
                    </p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {stats.percentage}%
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-600">
                      {stats.percentage}%
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Attendance Progress
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.percentage}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full relative"
                >
                  <div className="absolute right-2 top-0 h-full flex items-center">
                    <span className="text-xs font-bold text-white">
                      {stats.percentage}%
                    </span>
                  </div>
                </motion.div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>{stats.present} students marked present</span>
                <span>{stats.absent} students absent</span>
              </div>
            </motion.div>

            {/* Student List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Student Attendance
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marked At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceData.map((student, index) => (
                      <motion.tr
                        key={student.studentId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.rollNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(student.status)}
                            <span
                              className={`text-sm font-medium ${
                                student.status === "present"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {student.status.charAt(0).toUpperCase() +
                                student.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.markedAt
                            ? new Date(student.markedAt).toLocaleTimeString()
                            : "Not marked"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.method ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.method === "qr-code"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {student.method === "qr-code"
                                ? "QR Code"
                                : "Face Recognition"}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceMonitor;
