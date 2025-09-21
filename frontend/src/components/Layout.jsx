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
  BellIcon,
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
    <div className="flex h-screen bg-gray-50">
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
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:hidden"
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
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="ml-3 lg:ml-0 text-2xl font-semibold text-gray-900">
                {navigation.find((item) => isActivePath(item.href))?.name ||
                  "Smart Attendance"}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 transition-colors">
                <BellIcon className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
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
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo and close button */}
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <UserGroupIcon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3">
            <span className="text-lg font-bold text-gray-900">Smart</span>
            <span className="text-lg font-bold text-blue-600 ml-1">
              Attendance
            </span>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 transition-colors"
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
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                />
                {item.name}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* User profile and logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center mb-4 px-4 py-3 bg-gray-50 rounded-xl">
          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="group flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 rounded-xl hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Layout;
