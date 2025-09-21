import React, { useState, useEffect, useCallback } from "react";
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
import { classService } from "../services/classService";
import { reportService } from "../services/reportService";

const Reports = () => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [reportType, setReportType] = useState("overview");
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(false);

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Load classes from backend
  const loadClasses = async () => {
    try {
      console.log("Loading classes for reports...");
      const response = await classService.getClasses();

      if (response && response.success && response.classes) {
        setClasses(response.classes);
        console.log("Classes loaded successfully:", response.classes);
      } else {
        console.log("No classes data received");
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      toast.error("Failed to load classes");
    }
  };

  // Load analytics when class is selected
  const loadAnalytics = useCallback(async () => {
    if (!selectedClass) return;

    setLoading(true);

    try {
      console.log("Loading analytics for class:", selectedClass.classId);
      const response = await reportService.getAttendanceAnalytics(
        selectedClass.classId
      );

      if (response && response.success && response.analytics) {
        setAnalytics(response.analytics);
        console.log("Analytics loaded successfully:", response.analytics);
      } else {
        console.log("No analytics data received");
        setAnalytics({});
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  // Load analytics when class is selected
  useEffect(() => {
    if (selectedClass) {
      loadAnalytics();
    }
  }, [selectedClass, loadAnalytics]);

  const handleClassSelect = (classData) => {
    setSelectedClass(classData);
    toast.success(`Loading reports for ${classData.subject}`, {
      icon: "📊",
    });
  };

  const handleDownloadReport = async () => {
    if (!selectedClass) return;

    try {
      toast.loading("Generating report...", { id: "download" });

      const response = await reportService.getClassAttendanceReport(
        selectedClass.classId,
        "csv"
      );

      // Create blob and download
      const blob = new Blob([response], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedClass.subject}-attendance-report.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Report downloaded successfully!", { id: "download" });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report", { id: "download" });
    }
  };

  const getTrendIcon = (trend) => {
    return trend === "up" ? (
      <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
    ) : (
      <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
    );
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
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
              Attendance Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              View detailed attendance analytics and generate reports
            </p>
          </div>
          {selectedClass && (
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Download Report
            </button>
          )}
        </div>
      </motion.div>

      {/* Class Selection */}
      {!selectedClass && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
            Select a Class
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classData) => (
              <motion.div
                key={classData.classId}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                onClick={() => handleClassSelect(classData)}
              >
                <h3 className="font-semibold text-gray-900">
                  {classData.subject}
                </h3>
                <p className="text-sm text-gray-600">{classData.section}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Students: {classData.totalExpected || "TBD"}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Selected Class Reports */}
      {selectedClass && (
        <>
          {/* Class Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedClass.subject}
                </h2>
                <p className="text-gray-600">{selectedClass.section}</p>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                Back to Classes
              </button>
            </div>

            {/* Report Type Selector */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "overview", label: "Overview", icon: ChartBarIcon },
                { id: "sessions", label: "Sessions", icon: CalendarDaysIcon },
                { id: "students", label: "Students", icon: UserGroupIcon },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    reportType === type.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-indigo-300"
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading analytics...</span>
            </div>
          ) : (
            <>
              {/* Overview Report */}
              {reportType === "overview" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Total Students
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {analytics.totalStudents || 0}
                          </p>
                        </div>
                        <UserGroupIcon className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Total Sessions
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {analytics.totalSessions || 0}
                          </p>
                        </div>
                        <CalendarDaysIcon className="w-8 h-8 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Average Attendance
                          </p>
                          <p
                            className={`text-2xl font-bold ${getAttendanceColor(
                              analytics.averageAttendance || 0
                            )}`}
                          >
                            {analytics.averageAttendance || 0}%
                          </p>
                        </div>
                        <ChartBarIcon className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Trend
                          </p>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(analytics.trend)}
                            <span
                              className={`text-lg font-bold ${
                                analytics.trend === "up"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {analytics.trend === "up" ? "+" : "-"}
                              {Math.abs(analytics.trendPercentage || 0)}%
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            analytics.trend === "up"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          {getTrendIcon(analytics.trend)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Trend Chart */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Attendance Trend
                    </h3>
                    {analytics.attendanceTrend &&
                    analytics.attendanceTrend.length > 0 ? (
                      <div className="h-64 flex items-end justify-between gap-2">
                        {analytics.attendanceTrend.map((point, index) => (
                          <div
                            key={index}
                            className="flex-1 flex flex-col items-center"
                          >
                            <div
                              className={`w-full rounded-t ${getAttendanceColor(
                                point.percentage
                              ).replace("text-", "bg-")}`}
                              style={{
                                height: `${(point.percentage / 100) * 200}px`,
                                minHeight: "20px",
                              }}
                            ></div>
                            <div className="mt-2 text-xs text-gray-600 text-center">
                              <div>
                                {new Date(point.date).toLocaleDateString()}
                              </div>
                              <div className="font-medium">
                                {point.percentage}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-500">
                        No trend data available
                      </div>
                    )}
                  </div>

                  {/* Top and Low Performers */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Attenders */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                        Top Attenders
                      </h3>
                      {analytics.topAttenders &&
                      analytics.topAttenders.length > 0 ? (
                        <div className="space-y-3">
                          {analytics.topAttenders.map((student, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                            >
                              <span className="font-medium text-gray-900">
                                {student.name}
                              </span>
                              <span className="text-green-600 font-bold">
                                {student.attendanceRate}%
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-center py-4">
                          No data available
                        </div>
                      )}
                    </div>

                    {/* Low Attenders */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
                        Needs Attention
                      </h3>
                      {analytics.lowAttenders &&
                      analytics.lowAttenders.length > 0 ? (
                        <div className="space-y-3">
                          {analytics.lowAttenders.map((student, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                            >
                              <span className="font-medium text-gray-900">
                                {student.name}
                              </span>
                              <span className="text-yellow-600 font-bold">
                                {student.attendanceRate}%
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-center py-4">
                          All students performing well!
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Other report types placeholder */}
              {reportType !== "overview" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center"
                >
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {reportType.charAt(0).toUpperCase() + reportType.slice(1)}{" "}
                    Report
                  </h3>
                  <p className="text-gray-500">
                    Detailed {reportType} analytics will be available here.
                  </p>
                </motion.div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
