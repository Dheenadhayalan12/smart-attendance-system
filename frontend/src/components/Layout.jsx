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
      style={{ backgroundColor: "var(--color-bg-primary)" }}
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
            className="fixed inset-y-0 left-0 z-50 w-80 lg:hidden"
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              boxShadow: "var(--shadow-xl)",
            }}
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
        <div className="flex flex-col w-80">
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
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {navigation.find((item) => isActivePath(item.href))?.name ||
              "Smart Attendance"}
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </header>

        {/* Page content - removed top header completely */}
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
        backgroundColor: "var(--color-bg-secondary)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Logo and close button */}
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary), var(--color-info))",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <UserGroupIcon
              className="h-6 w-6"
              style={{ color: "var(--color-text-inverse)" }}
            />
          </div>
          <div className="ml-3">
            <span
              className="text-xl font-bold"
              style={{
                color: "var(--color-text-primary)",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Smart
            </span>
            <span
              className="text-xl font-bold ml-1"
              style={{
                color: "var(--color-info)",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Attendance
            </span>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="lg:hidden p-2 rounded-md transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = "var(--color-hover)")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "transparent")
            }
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
                  isActive ? "" : ""
                }`}
                style={
                  isActive
                    ? {
                        background:
                          "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
                        color: "var(--color-text-inverse)",
                        boxShadow: "var(--shadow-lg)",
                      }
                    : { color: "var(--color-text-secondary)" }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = "var(--color-hover)";
                    e.target.style.color = "var(--color-text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "var(--color-text-secondary)";
                  }
                }}
              >
                <item.icon
                  className="mr-3 h-5 w-5 transition-colors"
                  style={
                    isActive
                      ? { color: "var(--color-text-inverse)" }
                      : { color: "inherit" }
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
          style={{ backgroundColor: "var(--color-bg-accent)" }}
        >
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary), var(--color-info))",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <span
              style={{ color: "var(--color-text-inverse)" }}
              className="text-sm font-bold"
            >
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <p
              className="text-sm font-semibold truncate"
              style={{
                color: "var(--color-text-primary)",
                fontFamily: "Manrope, sans-serif",
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
          className="group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200"
          style={{
            color: "var(--color-error)",
            fontFamily: "Inter, sans-serif",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "var(--color-error-light)";
            e.target.style.color = "var(--color-error)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "var(--color-error)";
          }}
        >
          <ArrowRightOnRectangleIcon
            className="mr-3 h-5 w-5"
            style={{ color: "inherit" }}
          />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Layout;
