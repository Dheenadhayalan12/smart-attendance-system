import React, { useState, useEffect } from "react";
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

  // Mock data for demonstration
  useEffect(() => {
    const mockClasses = [
      {
        classId: "class-1",
        subject: "Machine Learning Fundamentals",
        section: "AI-2024-A",
        rollNumberStart: "21AI001",
        rollNumberEnd: "21AI030",
        totalExpected: 30,
      },
      {
        classId: "class-2",
        subject: "Data Structures",
        section: "CS-2024-B",
        rollNumberStart: "21CS001",
        rollNumberEnd: "21CS025",
        totalExpected: 25,
      },
      {
        classId: "class-3",
        subject: "Web Development",
        section: "IT-2024-A",
        rollNumberStart: "21IT001",
        rollNumberEnd: "21IT020",
        totalExpected: 20,
      },
    ];
    setClasses(mockClasses);
  }, []);

  // Mock student data when class is selected
  useEffect(() => {
    if (selectedClass) {
      setLoading(true);

      // Simulate API call
      setTimeout(() => {
        const mockStudents = [
          {
            rollNumber: "21AI001",
            name: "Alice Johnson",
            email: "alice.johnson@university.edu",
            registrationStatus: "registered",
            faceRegistered: true,
            registrationDate: "2025-09-15T10:30:00Z",
            lastSeen: "2025-09-20T09:15:00Z",
            attendanceCount: 15,
            totalSessions: 18,
            attendanceRate: 83,
          },
          {
            rollNumber: "21AI002",
            name: "Bob Smith",
            email: "bob.smith@university.edu",
            registrationStatus: "registered",
            faceRegistered: true,
            registrationDate: "2025-09-14T14:20:00Z",
            lastSeen: "2025-09-20T09:12:00Z",
            attendanceCount: 17,
            totalSessions: 18,
            attendanceRate: 94,
          },
          {
            rollNumber: "21AI003",
            name: "Carol Davis",
            email: "carol.davis@university.edu",
            registrationStatus: "unregistered",
            faceRegistered: false,
            registrationDate: null,
            lastSeen: null,
            attendanceCount: 0,
            totalSessions: 18,
            attendanceRate: 0,
          },
          {
            rollNumber: "21AI004",
            name: "David Wilson",
            email: "david.wilson@university.edu",
            registrationStatus: "registered",
            faceRegistered: true,
            registrationDate: "2025-09-16T11:45:00Z",
            lastSeen: "2025-09-19T14:30:00Z",
            attendanceCount: 12,
            totalSessions: 18,
            attendanceRate: 67,
          },
          {
            rollNumber: "21AI005",
            name: "Eva Brown",
            email: "eva.brown@university.edu",
            registrationStatus: "unregistered",
            faceRegistered: false,
            registrationDate: null,
            lastSeen: null,
            attendanceCount: 0,
            totalSessions: 18,
            attendanceRate: 0,
          },
        ];

        setStudents(mockStudents);

        // Calculate stats
        const total = mockStudents.length;
        const registered = mockStudents.filter(
          (s) => s.registrationStatus === "registered"
        ).length;
        const unregistered = total - registered;
        const registrationRate =
          total > 0 ? Math.round((registered / total) * 100) : 0;

        setStats({ total, registered, unregistered, registrationRate });
        setLoading(false);
      }, 1000);
    }
  }, [selectedClass]);

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
      filtered = filtered.filter(
        (student) => student.registrationStatus === filterStatus
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

  const getStatusIcon = (status) => {
    return status === "registered" ? (
      <CheckCircleIconSolid className="w-5 h-5 text-green-500" />
    ) : (
      <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />
    );
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    return status === "registered"
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
              View and manage students in your classes
            </p>
          </div>
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
          Select Class
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
                <p>
                  Roll Range: {classData.rollNumberStart} -{" "}
                  {classData.rollNumberEnd}
                </p>
                <p>Expected: {classData.totalExpected} students</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Student Management */}
      <AnimatePresence>
        {selectedClass && (
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
                    <p className="text-sm font-medium text-gray-600">
                      Face Registered
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.registered}
                    </p>
                  </div>
                  <PhotoIcon className="w-8 h-8 text-green-400" />
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
                      Not Registered
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.unregistered}
                    </p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-yellow-400" />
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
                      Registration Rate
                    </p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {stats.registrationRate}%
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-600">
                      {stats.registrationRate}%
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Search and Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, roll number, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <FunnelIcon className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Students</option>
                    <option value="registered">Face Registered</option>
                    <option value="unregistered">Not Registered</option>
                  </select>
                </div>
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
                Students in {selectedClass.subject} ({filteredStudents.length})
              </h3>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
                          Roll Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Seen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map((student, index) => (
                        <motion.tr
                          key={student.rollNumber}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.rollNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(student.registrationStatus)}
                              <span
                                className={getStatusBadge(
                                  student.registrationStatus
                                )}
                              >
                                {student.registrationStatus === "registered"
                                  ? "Face Registered"
                                  : "Not Registered"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.registrationDate
                              ? new Date(
                                  student.registrationDate
                                ).toLocaleDateString()
                              : "Not registered"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.lastSeen
                              ? new Date(student.lastSeen).toLocaleDateString()
                              : "Never"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-medium ${getAttendanceColor(
                                  student.attendanceRate
                                )}`}
                              >
                                {student.attendanceRate}%
                              </span>
                              <span className="text-xs text-gray-500">
                                ({student.attendanceCount}/
                                {student.totalSessions})
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredStudents.length === 0 && (
                    <div className="text-center py-8">
                      <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No students found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm || filterStatus !== "all"
                          ? "Try adjusting your search or filter criteria."
                          : "Students will appear here once they register their faces by scanning QR codes."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Students;
