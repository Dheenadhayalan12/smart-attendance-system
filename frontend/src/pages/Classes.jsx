import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CalendarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import QRCode from "qrcode";
import { sessionService } from "../services/sessionService";
import { classService } from "../services/classService";

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    rollNumberFrom: "",
    rollNumberTo: "",
  });

  // Session form state
  const [sessionFormData, setSessionFormData] = useState({
    topic: "",
    expiryTime: "",
  });

  const [errors, setErrors] = useState({});
  const [sessionErrors, setSessionErrors] = useState({});

  // Load classes from backend
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      console.log("Loading classes from backend...");

      // Add timeout to the request
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      );

      const response = await Promise.race([
        classService.getClasses(),
        timeoutPromise,
      ]);

      console.log("Backend response:", response);

      // Handle backend response structure: {success: true, data: [...]}
      if (response && response.success && Array.isArray(response.data)) {
        // Transform backend data to match frontend expectations
        const transformedClasses = response.data.map((cls) => {
          // Parse roll number range (e.g., "21CS001-21CS060" -> from: "21CS001", to: "21CS060")
          const rollRange = cls.rollNumberRange || "";
          const [rollNumberFrom, rollNumberTo] = rollRange.includes("-")
            ? rollRange.split("-").map((s) => s.trim())
            : ["", ""];

          return {
            id: cls.classId,
            name: cls.subject, // Backend uses 'subject' field
            subject: cls.subject,
            rollNumberFrom,
            rollNumberTo,
            studentCount: cls.studentCount || 0,
            createdAt: cls.createdAt,
            hasActiveSession: cls.hasActiveSession || false,
            activeSession: cls.activeSession || null,
          };
        });
        setClasses(transformedClasses);
        console.log("Classes loaded successfully:", transformedClasses);
      } else {
        console.log("No classes data or invalid response structure");
        setClasses([]);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      if (error.message === "Request timeout") {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("Failed to load classes");
      }
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Class name is required";
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    if (!formData.rollNumberFrom.trim()) {
      newErrors.rollNumberFrom = "Starting roll number is required";
    }
    if (!formData.rollNumberTo.trim()) {
      newErrors.rollNumberTo = "Ending roll number is required";
    }

    // Validate roll number format and range
    if (formData.rollNumberFrom && formData.rollNumberTo) {
      const fromNum = parseInt(formData.rollNumberFrom);
      const toNum = parseInt(formData.rollNumberTo);

      if (isNaN(fromNum) || isNaN(toNum)) {
        newErrors.rollNumberFrom = "Roll numbers must be numeric";
      } else if (fromNum >= toNum) {
        newErrors.rollNumberTo =
          "Ending roll number must be greater than starting roll number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (selectedClass) {
        // Update existing class
        const response = await classService.updateClass(
          selectedClass.id,
          formData
        );
        if (response.success) {
          await loadClasses(); // Reload classes from backend
          toast.success("Class updated successfully!");
          setShowEditModal(false);
        }
      } else {
        // Create new class
        console.log("Creating class with data:", formData);
        const response = await classService.createClass(formData);
        console.log("Class creation response:", response);

        if (response.success) {
          // Add a small delay to ensure database consistency
          setTimeout(async () => {
            await loadClasses(); // Reload classes from backend
          }, 500);

          toast.success("Class created successfully!");
          setShowCreateModal(false);
        } else {
          toast.error(response.message || "Failed to create class");
        }
      }

      resetForm();
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error("Error saving class. Please try again.");
    }
  };

  const handleEdit = (classItem) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      subject: classItem.subject,
      rollNumberFrom: classItem.rollNumberFrom,
      rollNumberTo: classItem.rollNumberTo,
    });
    setShowEditModal(true);
  };

  const handleDelete = async (classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        const response = await classService.deleteClass(classId);
        if (response.success) {
          await loadClasses(); // Reload classes from backend
          toast.success("Class deleted successfully!");
        }
      } catch (error) {
        console.error("Error deleting class:", error);
        toast.error("Error deleting class. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      subject: "",
      rollNumberFrom: "",
      rollNumberTo: "",
    });
    setErrors({});
    setSelectedClass(null);
  };

  // Button handlers for class cards
  const handleStartSession = (classItem) => {
    setSelectedClass(classItem);
    setSessionFormData({
      topic: "",
      expiryTime: "",
    });
    setSessionErrors({});
    setShowSessionModal(true);
  };

  const handleViewQRCode = (classItem) => {
    setSelectedClass(classItem);
    setShowQRModal(true);
  };

  const handleViewSessionHistory = async (classItem) => {
    setSelectedClass(classItem);
    try {
      // Fetch session history from backend API
      const response = await sessionService.getSessionsByClass(classItem.id);
      console.log("Session history response:", response);

      if (response && response.success && Array.isArray(response.sessions)) {
        const sessions = response.sessions.map((session) => ({
          id: session.sessionId,
          topic: session.sessionName,
          createdAt: session.startTime,
          endedAt: session.isActive ? null : session.endTime,
          attendanceCount: session.attendanceCount || 0,
          isActive: session.isActive,
        }));
        setSessionHistory(sessions);
      } else {
        // Fallback to empty array if no sessions found or invalid response
        console.log("No sessions found or invalid response structure");
        setSessionHistory([]);
      }
    } catch (error) {
      console.error("Error fetching session history:", error);
      // Fallback to empty array on error
      setSessionHistory([]);
      toast.error("Failed to load session history");
    }
    setShowHistoryModal(true);
  };

  // Handle ending an active session
  const handleEndSession = async () => {
    if (!selectedClass?.activeSession?.id) return;

    try {
      const response = await sessionService.endSession(
        selectedClass.activeSession.id
      );

      if (response.success) {
        // Update the class to remove active session
        setClasses((prevClasses) =>
          prevClasses.map((cls) =>
            cls.id === selectedClass.id
              ? {
                  ...cls,
                  hasActiveSession: false,
                  activeSession: null,
                }
              : cls
          )
        );

        toast.success(
          `Session "${selectedClass.activeSession.topic}" ended successfully!`
        );
        closeModal();
      } else {
        throw new Error(response.message || "Failed to end session");
      }
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error(error.message || "Failed to end session");
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowSessionModal(false);
    setShowQRModal(false);
    setShowHistoryModal(false);
    resetForm();
  };

  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    setSessionErrors({});

    try {
      // Call backend API to create session
      const sessionResponse = await sessionService.createSession(
        selectedClass.id,
        sessionFormData
      );

      if (sessionResponse.success) {
        const session = sessionResponse.data;

        // Update the class to have an active session
        setClasses((prevClasses) =>
          prevClasses.map((cls) =>
            cls.id === selectedClass.id
              ? {
                  ...cls,
                  hasActiveSession: true,
                  activeSession: {
                    id: session.sessionId,
                    topic: session.sessionName,
                    qrCode: session.qrCode,
                    createdAt: session.startTime,
                    expiryDate: session.endTime,
                    isActive: session.isActive,
                  },
                }
              : cls
          )
        );

        toast.success(
          `Session "${sessionFormData.topic}" started successfully!`
        );
        closeModal();
      } else {
        throw new Error(sessionResponse.message || "Failed to create session");
      }
    } catch (error) {
      console.error("Error creating session:", error);
      setSessionErrors({ general: error.message });
      toast.error("Failed to start session. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Classes</h1>
          <p className="text-gray-600">
            Manage your classes and track student attendance
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Class
        </motion.button>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No classes yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first class
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Your First Class
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {classes.map((classItem, index) => (
            <motion.div
              key={classItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {classItem.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {classItem.subject}
                    </p>
                    <p className="text-sm text-gray-500">
                      Roll No: {classItem.rollNumberFrom} -{" "}
                      {classItem.rollNumberTo}
                    </p>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => handleEdit(classItem)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(classItem.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {classItem.studentCount} students
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    Created {new Date(classItem.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 gap-2">
                    {!classItem.hasActiveSession ? (
                      <button
                        onClick={() => handleStartSession(classItem)}
                        className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        Start Session
                      </button>
                    ) : (
                      <button
                        onClick={() => handleViewQRCode(classItem)}
                        className="px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        View QR Code
                      </button>
                    )}
                    <button
                      onClick={() => handleViewSessionHistory(classItem)}
                      className="px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      View Session History
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
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
              className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedClass ? "Edit Class" : "Create New Class"}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Enter class name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.subject ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Enter subject"
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Roll Number From *
                      </label>
                      <input
                        type="text"
                        name="rollNumberFrom"
                        value={formData.rollNumberFrom}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.rollNumberFrom
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="e.g., 2024279000"
                      />
                      {errors.rollNumberFrom && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.rollNumberFrom}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Roll Number To *
                      </label>
                      <input
                        type="text"
                        name="rollNumberTo"
                        value={formData.rollNumberTo}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.rollNumberTo
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="e.g., 2024279060"
                      />
                      {errors.rollNumberTo && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.rollNumberTo}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {selectedClass ? "Update Class" : "Create Class"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Creation Modal */}
      <AnimatePresence>
        {showSessionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Start New Session
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSessionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Topic
                  </label>
                  <input
                    type="text"
                    value={sessionFormData.topic}
                    onChange={(e) =>
                      setSessionFormData({
                        ...sessionFormData,
                        topic: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter session topic"
                    required
                  />
                  {sessionErrors.topic && (
                    <p className="mt-1 text-sm text-red-600">
                      {sessionErrors.topic}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code Expiry Time (minutes)
                  </label>
                  <select
                    value={sessionFormData.expiryTime}
                    onChange={(e) =>
                      setSessionFormData({
                        ...sessionFormData,
                        expiryTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select expiry time</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                  {sessionErrors.expiryTime && (
                    <p className="mt-1 text-sm text-red-600">
                      {sessionErrors.expiryTime}
                    </p>
                  )}
                </div>

                {sessionErrors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">
                      {sessionErrors.general}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start Session
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && selectedClass && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Session QR Code
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="text-center">
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900">
                    {selectedClass.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedClass.subject}
                  </p>
                  {selectedClass.activeSession && (
                    <p className="text-sm text-green-600 mt-1">
                      Topic: {selectedClass.activeSession.topic}
                    </p>
                  )}
                </div>

                <div className="bg-gray-100 p-6 rounded-lg mb-4">
                  <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                    {selectedClass.activeSession?.qrCode ? (
                      <img
                        src={selectedClass.activeSession.qrCode}
                        alt="Session QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <div className="text-4xl mb-2">📱</div>
                        <p className="text-sm">QR Code will appear here</p>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Students can scan this code to mark their attendance
                </p>

                <div className="flex justify-center space-x-3">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    End Session
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Add share functionality
                      toast.success("QR Code copied to clipboard");
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Share QR
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session History Modal */}
      <AnimatePresence>
        {showHistoryModal && selectedClass && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Session History - {selectedClass.name}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {sessionHistory.length > 0 ? (
                  sessionHistory.map((session) => (
                    <div
                      key={session.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {session.topic}
                        </h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            session.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {session.isActive ? "Active" : "Completed"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          Started:{" "}
                          {new Date(session.createdAt).toLocaleString()}
                        </p>
                        {session.endedAt && (
                          <p>
                            Ended: {new Date(session.endedAt).toLocaleString()}
                          </p>
                        )}
                        <p>Attendance: {session.attendanceCount} students</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No sessions found for this class</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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

export default Classes;
