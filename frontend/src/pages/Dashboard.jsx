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
      color: "var(--color-primary)",
      bgColor: "var(--color-info-light)",
    },
    {
      name: "Total Students",
      value: "0",
      icon: UserGroupIcon,
      color: "var(--color-success)",
      bgColor: "var(--color-success-light)",
    },
    {
      name: "Total Sessions",
      value: "0",
      icon: ClockIcon,
      color: "var(--color-warning)",
      bgColor: "var(--color-warning-light)",
    },
    {
      name: "Attendance Rate",
      value: "0%",
      icon: ChartBarIcon,
      color: "var(--color-info)",
      bgColor: "var(--color-info-light)",
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
            color: "var(--color-primary)",
            bgColor: "var(--color-info-light)",
          },
          {
            name: "Total Students",
            value: statsData.totalStudents.toString(),
            icon: UserGroupIcon,
            color: "var(--color-success)",
            bgColor: "var(--color-success-light)",
          },
          {
            name: "Total Sessions",
            value: statsData.totalSessions.toString(),
            icon: ClockIcon,
            color: "var(--color-warning)",
            bgColor: "var(--color-warning-light)",
          },
          {
            name: "Attendance Rate",
            value: `${statsData.averageAttendanceRate}%`,
            icon: ChartBarIcon,
            color: "var(--color-info)",
            bgColor: "var(--color-info-light)",
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
    <div
      className="container-responsive py-4 sm:py-6 lg:py-8 space-y-8 min-h-screen"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className="text-3xl sm:text-4xl font-bold mb-3"
          style={{
            color: "var(--color-text-primary)",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          Dashboard
        </h1>
        <p
          className="text-lg"
          style={{
            color: "var(--color-text-secondary)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Welcome to Smart Attendance System
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading
          ? // Loading skeleton
            [...Array(4)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl border p-6"
                style={{
                  backgroundColor: "var(--color-bg-card)",
                  borderColor: "var(--color-border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
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
                className="rounded-2xl border p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: "var(--color-bg-soft)",
                  borderColor: "var(--color-border)",
                  boxShadow: "var(--shadow-sm)",
                }}
                whileHover={{ y: -4, boxShadow: "var(--shadow-lg)" }}
              >
                <div className="flex items-center">
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: stat.bgColor,
                    }}
                  >
                    <stat.icon
                      className="h-6 w-6"
                      style={{ color: stat.color }}
                    />
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
                        color: "var(--color-text-primary)",
                        fontFamily: "Manrope, sans-serif",
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
        className="rounded-xl border p-6 card-responsive"
        style={{
          backgroundColor: "var(--color-bg-subtle)",
          borderColor: "var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          className="text-xl font-semibold mb-4"
          style={{
            color: "var(--color-text-primary)",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          Recent Activity
        </h2>
        <div className="text-center py-12">
          <AcademicCapIcon
            className="mx-auto h-12 w-12"
            style={{ color: "var(--color-text-muted)" }}
          />
          <h3
            className="mt-2 text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            No recent activity
          </h3>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Get started by creating your first class.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
