import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  UserGroupIcon,
  DevicePhoneMobileIcon,
  AcademicCapIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-2xl">
              <AcademicCapIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Smart Attendance System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamlined attendance tracking with QR codes and facial recognition
          </p>
        </motion.div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Teacher Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 group"
          >
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                <UserGroupIcon className="w-12 h-12 text-blue-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Teacher Portal
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Manage classes, create attendance sessions, monitor real-time
                attendance, and generate comprehensive reports.
              </p>

              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm">Create and manage classes</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm">
                    Generate QR codes for sessions
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm">
                    Real-time attendance monitoring
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm">Analytics and reports</span>
                </div>
              </div>

              <Link
                to="/login"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors inline-block text-center"
              >
                Access Teacher Dashboard
              </Link>
            </div>
          </motion.div>

          {/* Student Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 group"
          >
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                <DevicePhoneMobileIcon className="w-12 h-12 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Student Mobile
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Quickly mark your attendance by scanning QR codes and taking a
                verification photo. No login required.
              </p>

              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">Scan QR codes instantly</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">Face verification capture</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">
                    Instant attendance confirmation
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">Mobile-optimized interface</span>
                </div>
              </div>

              <Link
                to="/student"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors inline-block text-center"
              >
                Mark Attendance
              </Link>
            </div>
          </motion.div>
        </div>

        {/* How it Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-20 text-center"
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-12">
            How It Works
          </h3>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Teacher Creates Session
              </h4>
              <p className="text-gray-600 text-sm">
                Teacher logs in and creates an attendance session with a unique
                QR code
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Student Scans QR
              </h4>
              <p className="text-gray-600 text-sm">
                Students use their mobile devices to scan the displayed QR code
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Attendance Recorded
              </h4>
              <p className="text-gray-600 text-sm">
                Face verification confirms identity and attendance is
                automatically recorded
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 text-center text-gray-500 text-sm"
        >
          <p>© 2025 Smart Attendance System. Built for modern education.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
