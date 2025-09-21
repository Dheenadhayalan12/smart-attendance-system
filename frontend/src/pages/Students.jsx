import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  PhotoIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { classService } from "../services/classService";
import { studentService } from "../services/studentService";

const Students = () => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    unregistered: 0,
    registrationRate: 0,
  });

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Load classes from backend
  const loadClasses = async () => {
    try {
      console.log("Loading classes...");
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

  // Load students from backend
  const loadStudents = useCallback(async () => {
    if (!selectedClass) return;

    setLoading(true);

    try {
      console.log("Loading students for class:", selectedClass.classId);
      const response = await studentService.getStudentsByClass(
        selectedClass.classId
      );

      if (response && response.success && response.students) {
        setStudents(response.students);

        // Calculate stats
        const total = response.students.length;
        const registered = response.students.filter(
          (s) => s.isRegistered === true
        ).length;
        const unregistered = total - registered;
        const registrationRate =
          total > 0 ? Math.round((registered / total) * 100) : 0;

        setStats({ total, registered, unregistered, registrationRate });
        console.log("Students loaded successfully:", response.students);
        console.log("Stats calculated:", {
          total,
          registered,
          unregistered,
          registrationRate,
        });
      } else {
        console.log("No students data received");
        setStudents([]);
        setStats({
          total: 0,
          registered: 0,
          unregistered: 0,
          registrationRate: 0,
        });
      }
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
      setStudents([]);
      setStats({
        total: 0,
        registered: 0,
        unregistered: 0,
        registrationRate: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  // Load students when class is selected
  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass, loadStudents]);

  // Filter students based on search and status
  useEffect(() => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((student) =>
        filterStatus === "registered"
          ? student.isRegistered
          : !student.isRegistered
      );
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, filterStatus]);

  const handleClassSelect = (classData) => {
    setSelectedClass(classData);
    setSearchTerm("");
    setFilterStatus("all");
    toast.success(`Viewing students for ${classData.subject}`, {
      icon: "👥",
    });
  };

  const getStatusIcon = (isRegistered) => {
    return isRegistered ? (
      <CheckCircleIconSolid className="w-5 h-5 text-green-500" />
    ) : (
      <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />
    );
  };

  const getStatusBadge = (isRegistered) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    return isRegistered
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-yellow-100 text-yellow-800`;
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
              <UserGroupIcon className="w-8 h-8 text-indigo-600" />
              Student Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage student registrations and view attendance records
            </p>
          </div>
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

      {/* Selected Class View */}
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Total Students
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {stats.total}
                    </p>
                  </div>
                  <UserGroupIcon className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Registered
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {stats.registered}
                    </p>
                  </div>
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">
                      Unregistered
                    </p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {stats.unregistered}
                    </p>
                  </div>
                  <ExclamationCircleIcon className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      Registration Rate
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {stats.registrationRate}%
                    </p>
                  </div>
                  <AcademicCapIcon className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Students</option>
                  <option value="registered">Registered Only</option>
                  <option value="unregistered">Unregistered Only</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Students List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Loading students...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No students found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Students will appear here once they register."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Face Registration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Seen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <AnimatePresence>
                      {filteredStudents.map((student, index) => (
                        <motion.tr
                          key={student.rollNumber}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.rollNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(student.isRegistered)}
                              <span
                                className={`ml-2 ${getStatusBadge(
                                  student.isRegistered
                                )}`}
                              >
                                {student.isRegistered
                                  ? "Registered"
                                  : "Unregistered"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <PhotoIcon
                                className={`w-4 h-4 mr-2 ${
                                  student.faceRegistered
                                    ? "text-green-500"
                                    : "text-gray-400"
                                }`}
                              />
                              <span
                                className={`text-sm ${
                                  student.faceRegistered
                                    ? "text-green-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {student.faceRegistered
                                  ? "Completed"
                                  : "Pending"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div
                                className={`font-medium ${getAttendanceColor(
                                  student.attendanceRate
                                )}`}
                              >
                                {student.attendanceRate}%
                              </div>
                              <div className="text-gray-500">
                                {student.attendedSessions}/
                                {student.totalSessions} sessions
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.registrationDate ? (
                              <div className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                {new Date(
                                  student.registrationDate
                                ).toLocaleDateString()}
                              </div>
                            ) : (
                              "Never"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 flex items-center">
                              <EyeIcon className="w-4 h-4 mr-1" />
                              View Details
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Students;
