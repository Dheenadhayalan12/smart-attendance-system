import React from "react";

const LoadingSpinner = ({
  size = "lg",
  className = "",
  message = "Loading...",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <div
      className={`flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${className}`}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {/* Outer ring */}
          <div
            className={`${sizeClasses[size]} border-4 border-blue-200 rounded-full animate-spin`}
          >
            <div
              className={`${sizeClasses[size]} border-4 border-transparent border-t-blue-600 rounded-full animate-spin`}
            ></div>
          </div>

          {/* Inner dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 text-sm font-medium">{message}</p>
          <div className="flex space-x-1 justify-center mt-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
