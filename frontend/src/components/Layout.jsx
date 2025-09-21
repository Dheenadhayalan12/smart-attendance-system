import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  EyeIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Classes", href: "/classes", icon: AcademicCapIcon },
    { name: "Students", href: "/students", icon: UserGroupIcon },
    { name: "Monitor", href: "/monitor", icon: EyeIcon },
    { name: "Reports", href: "/reports", icon: ChartBarIcon },
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <div
      className="flex h-screen"
      style={{ backgroundColor: "var(--color-primary-bg)" }}
    >
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-50 w-64 shadow-xl lg:hidden"
            style={{ backgroundColor: "var(--color-card-bg)" }}
          >
            <SidebarContent
              navigation={navigation}
              isActivePath={isActivePath}
              user={user}
              logout={logout}
              onClose={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent
            navigation={navigation}
            isActivePath={isActivePath}
            user={user}
            logout={logout}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top nav */}
        <header
          className="shadow-sm border-b"
          style={{
            backgroundColor: "var(--color-card-bg)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset transition-colors"
                style={{ color: "var(--color-primary-text)" }}
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1
                className="ml-3 lg:ml-0 text-2xl font-semibold"
                style={{
                  color: "var(--color-primary-text)",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                {navigation.find((item) => isActivePath(item.href))?.name ||
                  "Smart Attendance"}
              </h1>
            </div>

            {/* Removed duplicate notification and profile section */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({
  navigation,
  isActivePath,
  user,
  logout,
  onClose,
}) => {
  return (
    <div
      className="flex flex-col h-full border-r"
      style={{
        backgroundColor: "var(--color-card-bg)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Logo and close button */}
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, var(--color-success), var(--color-subtle-accent))",
            }}
          >
            <UserGroupIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3">
            <span
              className="text-lg font-bold"
              style={{
                color: "var(--color-primary-text)",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Smart
            </span>
            <span
              className="text-lg font-bold ml-1"
              style={{
                color: "var(--color-success)",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Attendance
            </span>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            style={{ color: "var(--color-primary-text)" }}
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 space-y-2">
        {navigation.map((item, index) => {
          const isActive = isActivePath(item.href);
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <NavLink
                to={item.href}
                onClick={onClose}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive ? "text-white shadow-lg" : "hover:bg-gray-100"
                }`}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, var(--color-success), var(--color-subtle-accent))`,
                        boxShadow: "0 10px 25px rgba(34, 139, 34, 0.25)",
                      }
                    : { color: "var(--color-primary-text)" }
                }
              >
                <item.icon
                  className={`mr-3 h-5 w-5 transition-colors ${
                    isActive ? "text-white" : "group-hover:opacity-70"
                  }`}
                  style={
                    !isActive ? { color: "var(--color-primary-text)" } : {}
                  }
                />
                {item.name}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* User profile and logout */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="flex items-center mb-4 px-4 py-3 rounded-xl"
          style={{ backgroundColor: "var(--color-accent-light)" }}
        >
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, var(--color-success), var(--color-subtle-accent))`,
            }}
          >
            <span className="text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <p
              className="text-sm font-medium truncate"
              style={{
                color: "var(--color-primary-text)",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {user?.name}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl hover:bg-gray-100 transition-all duration-200"
          style={{
            color: "var(--color-alert)",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          <ArrowRightOnRectangleIcon
            className="mr-3 h-5 w-5 group-hover:opacity-70"
            style={{ color: "var(--color-alert)" }}
          />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Layout;
