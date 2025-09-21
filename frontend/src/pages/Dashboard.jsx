import React from "react";
import { motion } from "framer-motion";
import {
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const stats = [
    {
      name: "Total Classes",
      value: "0",
      icon: AcademicCapIcon,
      color: "bg-blue-500",
    },
    {
      name: "Total Students",
      value: "0",
      icon: UserGroupIcon,
      color: "bg-green-500",
    },
    {
      name: "Active Sessions",
      value: "0",
      icon: ClockIcon,
      color: "bg-yellow-500",
    },
    {
      name: "Attendance Rate",
      value: "0%",
      icon: ChartBarIcon,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to Smart Attendance System</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="text-center py-12">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No recent activity
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first class.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
