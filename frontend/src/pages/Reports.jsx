import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const Reports = () => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState("last30days");
  const [analytics, setAnalytics] = useState({});
  const [sessionReports, setSessionReports] = useState([]);
  const [studentReports, setStudentReports] = useState([]);

  // Mock data for demonstration
  useEffect(() => {
    const mockClasses = [
      {
        classId: "class-1",
        subject: "Machine Learning Fundamentals",
        section: "AI-2024-A",
        totalStudents: 30,
        totalSessions: 24,
      },
      {
        classId: "class-2",
        subject: "Data Structures",
        section: "CS-2024-B",
        totalStudents: 25,
        totalSessions: 28,
      },
      {
        classId: "class-3",
        subject: "Web Development",
        section: "IT-2024-A",
        totalStudents: 20,
        totalSessions: 22,
      },
    ];
    setClasses(mockClasses);
  }, []);

  // Mock analytics data when class is selected
  useEffect(() => {
    if (selectedClass) {
      setTimeout(() => {
        const mockAnalytics = {
          overview: {
            totalSessions: 24,
            averageAttendance: 78.5,
            bestAttendance: 96.7,
            worstAttendance: 45.2,
            trend: "up",
            trendPercentage: 5.2,
          },
          sessionData: [
            { date: "2025-09-01", attendance: 85.5, present: 25, total: 29 },
            { date: "2025-09-03", attendance: 89.7, present: 26, total: 29 },
            { date: "2025-09-05", attendance: 75.9, present: 22, total: 29 },
            { date: "2025-09-08", attendance: 82.1, present: 23, total: 28 },
            { date: "2025-09-10", attendance: 92.9, present: 26, total: 28 },
            { date: "2025-09-12", attendance: 71.4, present: 20, total: 28 },
            { date: "2025-09-15", attendance: 85.7, present: 24, total: 28 },
            { date: "2025-09-17", attendance: 78.6, present: 22, total: 28 },
            { date: "2025-09-19", attendance: 89.3, present: 25, total: 28 },
            { date: "2025-09-20", attendance: 82.1, present: 23, total: 28 },
          ],
        };

        const mockSessionReports = [
          {
            sessionId: "session-1",
            date: "2025-09-20",
            startTime: "09:00",
            endTime: "10:30",
            totalStudents: 28,
            presentCount: 23,
            absentCount: 5,
            attendanceRate: 82.1,
            lateArrivals: 2,
            verificationFailures: 1,
          },
          {
            sessionId: "session-2",
            date: "2025-09-19",
            startTime: "11:00",
            endTime: "12:30",
            totalStudents: 28,
            presentCount: 25,
            absentCount: 3,
            attendanceRate: 89.3,
            lateArrivals: 1,
            verificationFailures: 0,
          },
          {
            sessionId: "session-3",
            date: "2025-09-17",
            startTime: "14:00",
            endTime: "15:30",
            totalStudents: 28,
            presentCount: 22,
            absentCount: 6,
            attendanceRate: 78.6,
            lateArrivals: 3,
            verificationFailures: 2,
          },
        ];

        const mockStudentReports = [
          {
            rollNumber: "21AI001",
            name: "Alice Johnson",
            totalSessions: 24,
            attended: 22,
            missed: 2,
            attendanceRate: 91.7,
            trend: "stable",
            lastAttended: "2025-09-20",
            consecutiveMissed: 0,
            averageArrivalTime: "09:05",
          },
          {
            rollNumber: "21AI002",
            name: "Bob Smith",
            totalSessions: 24,
            attended: 20,
            missed: 4,
            attendanceRate: 83.3,
            trend: "declining",
            lastAttended: "2025-09-19",
            consecutiveMissed: 1,
            averageArrivalTime: "09:12",
          },
          {
            rollNumber: "21AI003",
            name: "Carol Davis",
            totalSessions: 24,
            attended: 15,
            missed: 9,
            attendanceRate: 62.5,
            trend: "declining",
            lastAttended: "2025-09-15",
            consecutiveMissed: 3,
            averageArrivalTime: "09:18",
          },
          {
            rollNumber: "21AI004",
            name: "David Wilson",
            totalSessions: 24,
            attended: 23,
            missed: 1,
            attendanceRate: 95.8,
            trend: "improving",
            lastAttended: "2025-09-20",
            consecutiveMissed: 0,
            averageArrivalTime: "08:58",
          },
        ];

        setAnalytics(mockAnalytics);
        setSessionReports(mockSessionReports);
        setStudentReports(mockStudentReports);
      }, 1000);
    }
  }, [selectedClass, dateRange]);

  const handleClassSelect = (classData) => {
    setSelectedClass(classData);
    toast.success(`Loading reports for ${classData.subject}`, {
      icon: "📊",
    });
  };

  const handleExportReport = (type) => {
    let data, filename;

    switch (type) {
      case "sessions":
        data = sessionReports;
        filename = `session-reports-${selectedClass.subject.replace(
          /\s+/g,
          "-"
        )}-${new Date().toISOString().split("T")[0]}.csv`;
        break;
      case "students":
        data = studentReports;
        filename = `student-reports-${selectedClass.subject.replace(
          /\s+/g,
          "-"
        )}-${new Date().toISOString().split("T")[0]}.csv`;
        break;
      default:
        return;
    }

    // Create CSV content
    const headers = Object.keys(data[0]).join(",");
    const csvContent = [
      headers,
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Report exported successfully", {
      icon: "📁",
    });
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
      case "improving":
        return <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />;
      case "down":
      case "declining":
        return <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300"></div>;
    }
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getAttendanceBg = (rate) => {
    if (rate >= 80) return "bg-green-100";
    if (rate >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ChartBarIcon className="w-8 h-8 text-indigo-600" />
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive attendance analytics and reporting
            </p>
          </div>

          {selectedClass && (
            <div className="flex gap-3">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="overview">Overview</option>
                <option value="sessions">Session Reports</option>
                <option value="students">Student Reports</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="last7days">Last 7 days</option>
                <option value="last30days">Last 30 days</option>
                <option value="last3months">Last 3 months</option>
                <option value="semester">Full Semester</option>
              </select>
            </div>
          )}
        </div>
      </motion.div>

      {/* Class Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Select Class for Reports
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classData) => (
            <motion.div
              key={classData.classId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleClassSelect(classData)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedClass?.classId === classData.classId
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900">
                  {classData.subject}
                </h3>
                <AcademicCapIcon className="w-5 h-5 text-gray-400" />
              </div>

              <p className="text-sm text-gray-600 mb-2">{classData.section}</p>

              <div className="text-xs text-gray-500">
                <p>Students: {classData.totalStudents}</p>
                <p>Sessions: {classData.totalSessions}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Reports Content */}
      <AnimatePresence>
        {selectedClass && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {reportType === "overview" && (
              <>
                {/* Overview Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Sessions
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.overview?.totalSessions}
                        </p>
                      </div>
                      <CalendarDaysIcon className="w-8 h-8 text-gray-400" />
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
                        <p className="text-sm font-medium text-gray-600">
                          Average Attendance
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-indigo-600">
                            {analytics.overview?.averageAttendance}%
                          </p>
                          {getTrendIcon(analytics.overview?.trend)}
                        </div>
                      </div>
                      <UserGroupIcon className="w-8 h-8 text-indigo-400" />
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
                        <p className="text-sm font-medium text-gray-600">
                          Best Session
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {analytics.overview?.bestAttendance}%
                        </p>
                      </div>
                      <CheckCircleIcon className="w-8 h-8 text-green-400" />
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
                          Worst Session
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {analytics.overview?.worstAttendance}%
                        </p>
                      </div>
                      <XCircleIcon className="w-8 h-8 text-red-400" />
                    </div>
                  </motion.div>
                </div>

                {/* Attendance Trend Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Attendance Trend
                  </h3>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {analytics.sessionData?.map((session, index) => (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div
                          className="w-full bg-gradient-to-t from-indigo-500 to-indigo-300 rounded-t transition-all hover:from-indigo-600 hover:to-indigo-400"
                          style={{
                            height: `${(session.attendance / 100) * 200}px`,
                          }}
                          title={`${new Date(
                            session.date
                          ).toLocaleDateString()}: ${session.attendance}%`}
                        ></div>
                        <span className="text-xs text-gray-500 mt-2 transform rotate-45 origin-left">
                          {new Date(session.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

            {reportType === "sessions" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Session Reports
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleExportReport("sessions")}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Export CSV
                  </motion.button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Present
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Absent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issues
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessionReports.map((session, index) => (
                        <motion.tr
                          key={session.sessionId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(session.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.startTime} - {session.endTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {session.presentCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                            {session.absentCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAttendanceBg(
                                session.attendanceRate
                              )} ${getAttendanceColor(session.attendanceRate)}`}
                            >
                              {session.attendanceRate}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.lateArrivals > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 mr-1">
                                {session.lateArrivals} late
                              </span>
                            )}
                            {session.verificationFailures > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                {session.verificationFailures} failed
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {reportType === "students" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Student Reports
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleExportReport("students")}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Export CSV
                  </motion.button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attended
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Missed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trend
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Seen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {studentReports.map((student, index) => (
                        <motion.tr
                          key={student.rollNumber}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                <span className="text-xs font-medium text-white">
                                  {student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {student.rollNumber}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {student.attended}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                            {student.missed}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAttendanceBg(
                                student.attendanceRate
                              )} ${getAttendanceColor(student.attendanceRate)}`}
                            >
                              {student.attendanceRate}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {getTrendIcon(student.trend)}
                              <span className="text-sm text-gray-500 capitalize">
                                {student.trend}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(
                              student.lastAttended
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.consecutiveMissed > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                {student.consecutiveMissed} missed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                Active
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
