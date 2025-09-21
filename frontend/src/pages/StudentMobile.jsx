import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  QrCodeIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { attendanceService } from "../services/authService";

const StudentMobile = () => {
  const [currentStep, setCurrentStep] = useState("scan"); // scan, camera, success, error
  const [sessionData, setSessionData] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const qrReaderRef = useRef(null);

  // QR Code Scanner
  const startQRScanner = async () => {
    try {
      setIsLoading(true);
      setScanError(null);

      // Request camera access for QR scanning
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCameraStream(stream);
      setIsLoading(false);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setScanError("Unable to access camera. Please check permissions.");
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // Simulate QR code detection (in real app, you'd use a QR code library)
  const simulateQRDetection = (qrData) => {
    try {
      const sessionInfo = JSON.parse(qrData);
      setSessionData(sessionInfo);
      stopCamera();
      setCurrentStep("camera");
    } catch (error) {
      toast.error("Invalid QR code");
    }
  };

  // Face capture for verification
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const video = videoRef.current;

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.8);
    });
  };

  const submitAttendance = async () => {
    setIsLoading(true);

    try {
      // Start camera for face capture
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // Use front camera for selfie
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCameraStream(stream);

      // Auto capture after 3 seconds or let user click capture
      setTimeout(async () => {
        const photoBlob = await capturePhoto();

        if (photoBlob && sessionData) {
          // Create form data for submission
          const formData = new FormData();
          formData.append("photo", photoBlob, "attendance.jpg");
          formData.append("sessionId", sessionData.sessionId);
          formData.append("studentId", studentInfo?.id || "demo-student");

          try {
            const response = await attendanceService.markAttendance(formData);

            if (response.success) {
              stopCamera();
              setCurrentStep("success");
              toast.success("Attendance marked successfully!");
            } else {
              throw new Error(response.message || "Failed to mark attendance");
            }
          } catch (error) {
            console.error("Attendance submission error:", error);
            stopCamera();
            setCurrentStep("error");
            toast.error("Failed to mark attendance. Please try again.");
          }
        }

        setIsLoading(false);
      }, 3000);
    } catch (error) {
      console.error("Camera access error:", error);
      setIsLoading(false);
      toast.error("Unable to access camera for face verification");
    }
  };

  const resetFlow = () => {
    setCurrentStep("scan");
    setSessionData(null);
    setScanError(null);
    stopCamera();
  };

  useEffect(() => {
    // Cleanup camera on unmount
    return () => {
      stopCamera();
    };
  }, []);

  const renderScanStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <QrCodeIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Mark Attendance
          </h1>
          <p className="text-gray-600">
            Scan the QR code displayed by your teacher
          </p>
        </div>

        {scanError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{scanError}</p>
            </div>
          </div>
        )}

        <div className="relative mb-6">
          <video
            ref={videoRef}
            className="w-full h-64 bg-gray-900 rounded-lg object-cover"
            playsInline
            muted
          />
          {!cameraStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
              <div className="text-center text-white">
                <CameraIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-75">Camera preview</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={startQRScanner}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <QrCodeIcon className="w-5 h-5 mr-2" />
            )}
            {isLoading ? "Starting Camera..." : "Start QR Scanner"}
          </button>

          {/* Demo QR codes for testing */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-3">Demo QR Codes:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  simulateQRDetection(
                    JSON.stringify({
                      sessionId: "demo-session-1",
                      className: "Computer Science 101",
                      sessionName: "Morning Lecture",
                    })
                  )
                }
                className="text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded text-center transition-colors"
              >
                CS 101 - Morning
              </button>
              <button
                onClick={() =>
                  simulateQRDetection(
                    JSON.stringify({
                      sessionId: "demo-session-2",
                      className: "Mathematics",
                      sessionName: "Tutorial",
                    })
                  )
                }
                className="text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded text-center transition-colors"
              >
                Math - Tutorial
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderCameraStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-green-50 to-emerald-100"
    >
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <CameraIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Face Verification
          </h1>
          <p className="text-gray-600">
            Position your face in the camera frame
          </p>
        </div>

        {sessionData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <UserIcon className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-900">
                {sessionData.className}
              </span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-700">
                {sessionData.sessionName}
              </span>
            </div>
          </div>
        )}

        <div className="relative mb-6">
          <video
            ref={videoRef}
            className="w-full h-64 bg-gray-900 rounded-lg object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Face outline guide */}
          <div className="absolute inset-4 border-2 border-white border-dashed rounded-full opacity-50"></div>
        </div>

        <div className="space-y-4">
          <button
            onClick={submitAttendance}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <CameraIcon className="w-5 h-5 mr-2" />
            )}
            {isLoading ? "Capturing..." : "Capture & Submit"}
          </button>

          <button
            onClick={resetFlow}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Back to QR Scanner
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderSuccessStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-green-50 to-emerald-100"
    >
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md text-center">
        <CheckCircleIcon className="w-20 h-20 text-green-600 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Attendance Marked!
        </h1>
        <p className="text-gray-600 mb-6">
          Your attendance has been successfully recorded for{" "}
          {sessionData?.className}.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-semibold">✓ Present</p>
          <p className="text-green-600 text-sm">
            {new Date().toLocaleTimeString()} -{" "}
            {new Date().toLocaleDateString()}
          </p>
        </div>

        <button
          onClick={resetFlow}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Mark Another Attendance
        </button>
      </div>
    </motion.div>
  );

  const renderErrorStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-red-50 to-pink-100"
    >
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md text-center">
        <XCircleIcon className="w-20 h-20 text-red-600 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Attendance Failed
        </h1>
        <p className="text-gray-600 mb-6">
          There was an issue marking your attendance. Please try again or
          contact your teacher.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => setCurrentStep("camera")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>

          <button
            onClick={resetFlow}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {currentStep === "scan" && renderScanStep()}
      {currentStep === "camera" && renderCameraStep()}
      {currentStep === "success" && renderSuccessStep()}
      {currentStep === "error" && renderErrorStep()}
    </div>
  );
};

export default StudentMobile;
