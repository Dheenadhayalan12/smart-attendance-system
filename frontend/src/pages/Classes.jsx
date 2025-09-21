import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CalendarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const Classes = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    rollNumberFrom: "",
    rollNumberTo: "",
  });

  const [errors, setErrors] = useState({});

  // Mock data for now - will be replaced with API calls
  useEffect(() => {
    const mockClasses = [
      {
        id: 1,
        name: "Computer Science 101",
        subject: "Computer Science",
        rollNumberFrom: "2024279000",
        rollNumberTo: "2024279030",
        studentCount: 25,
        createdAt: "2024-01-15",
      },
      {
        id: 2,
        name: "Data Structures",
        subject: "Computer Science",
        rollNumberFrom: "2024279031",
        rollNumberTo: "2024279060",
        studentCount: 18,
        createdAt: "2024-01-20",
      },
      {
        id: 3,
        name: "Web Development",
        subject: "Computer Science",
        rollNumberFrom: "2024279061",
        rollNumberTo: "2024279090",
        studentCount: 30,
        createdAt: "2024-02-01",
      },
    ];

    // Simulate API call
    setTimeout(() => {
      setClasses(mockClasses);
      setLoading(false);
    }, 1000);
  }, []);

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
        const updatedClasses = classes.map((cls) =>
          cls.id === selectedClass.id
            ? { ...cls, ...formData, id: selectedClass.id }
            : cls
        );
        setClasses(updatedClasses);
        toast.success("Class updated successfully!");
        setShowEditModal(false);
      } else {
        // Create new class
        const newClass = {
          id: Date.now(),
          ...formData,
          studentCount: 0,
          createdAt: new Date().toISOString().split("T")[0],
        };
        setClasses((prev) => [...prev, newClass]);
        toast.success("Class created successfully!");
        setShowCreateModal(false);
      }

      resetForm();
    } catch {
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

  const handleDelete = (classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      setClasses((prev) => prev.filter((cls) => cls.id !== classId));
      toast.success("Class deleted successfully!");
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
  const handleViewStudents = (classItem) => {
    // Navigate to students page with class filter
    navigate(
      `/students?classId=${classItem.id}&className=${encodeURIComponent(
        classItem.name
      )}`
    );
  };

  const handleStartSession = (classItem) => {
    // For now, show a toast - this will be implemented with session creation logic
    toast.success(`Starting session for ${classItem.name}...`);
    // In the future, this will create a new session and navigate to monitor page
    // navigate(`/monitor?classId=${classItem.id}&sessionId=${newSessionId}`);
  };

  const handleViewSessionHistory = (classItem) => {
    // For now, show a toast - this will show session history modal or page
    toast.info(`Viewing session history for ${classItem.name}`);
    // In the future, this might open a modal or navigate to a dedicated page
    // setShowSessionHistoryModal(true);
    // setSelectedClassForHistory(classItem);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    resetForm();
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
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleViewStudents(classItem)}
                      className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      View Students
                    </button>
                    <button
                      onClick={() => handleStartSession(classItem)}
                      className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      Start Session
                    </button>
                    <button
                      onClick={() => handleViewSessionHistory(classItem)}
                      className="col-span-2 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
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
    </div>
  );
};

export default Classes;
