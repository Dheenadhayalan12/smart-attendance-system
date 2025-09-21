import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { reportService } from "../services/reportService";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [stats, setStats] = useState([
    {
      name: "Total Classes",
      value: "0",
      icon: AcademicCapIcon,
      color: "var(--color-success)",
    },
    {
      name: "Total Students",
      value: "0",
      icon: UserGroupIcon,
      color: "var(--color-subtle-accent)",
    },
    {
      name: "Total Sessions",
      value: "0",
      icon: ClockIcon,
      color: "var(--color-primary-text)",
    },
    {
      name: "Attendance Rate",
      value: "0%",
      icon: ChartBarIcon,
      color: "var(--color-alert)",
    },
  ]);
  const [loading, setLoading] = useState(true);

  // Load teacher statistics on component mount
  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      console.log("Loading teacher statistics...");
      const response = await reportService.getTeacherStatistics();

      if (response && response.success && response.statistics) {
        const statsData = response.statistics;

        setStats([
          {
            name: "Total Classes",
            value: statsData.totalClasses.toString(),
            icon: AcademicCapIcon,
            color: "var(--color-success)",
          },
          {
            name: "Total Students",
            value: statsData.totalStudents.toString(),
            icon: UserGroupIcon,
            color: "var(--color-subtle-accent)",
          },
          {
            name: "Total Sessions",
            value: statsData.totalSessions.toString(),
            icon: ClockIcon,
            color: "var(--color-primary-text)",
          },
          {
            name: "Attendance Rate",
            value: `${statsData.averageAttendanceRate}%`,
            icon: ChartBarIcon,
            color: "var(--color-alert)",
          },
        ]);

        console.log("Statistics loaded successfully:", statsData);
      } else {
        console.log("No statistics data received");
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            color: "var(--color-primary-text)",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            color: "var(--color-text-secondary)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Welcome to Smart Attendance System
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? // Loading skeleton
            [...Array(4)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-xl shadow-sm border p-6"
                style={{
                  backgroundColor: "var(--color-card-bg)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                </div>
              </motion.div>
            ))
          : stats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow duration-200"
                style={{
                  backgroundColor: "var(--color-card-bg)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex items-center">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: stat.color }}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: "var(--color-text-secondary)",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {stat.name}
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{
                        color: "var(--color-primary-text)",
                        fontFamily: "Poppins, sans-serif",
                      }}
                    >
                      {stat.value}
                    </p>
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
