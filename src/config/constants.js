// Constants for the Smart Attendance System
// Environment-specific configuration constants

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "24h";

// Email Configuration
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@smartattendance.edu";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// AWS Configuration
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const S3_BUCKET = process.env.S3_BUCKET || "smart-attendance-faces";

// Face Recognition Configuration
const FACE_COLLECTION_ID = "smart-attendance-faces";
const FACE_MATCH_THRESHOLD = 80; // 80% confidence threshold

// DynamoDB Table Names
const TABLES = {
  TEACHERS: "Teachers",
  CLASSES: "Classes",
  SESSIONS: "Sessions",
  STUDENTS: "Students",
  ATTENDANCE: "Attendance",
};

// Validation Patterns
const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ROLL_NUMBER: /^[0-9]{2}[A-Z]{2}[0-9]{3}$/, // Example: 21CS001
  PASSWORD_MIN_LENGTH: 8,
};

// API Response Messages
const MESSAGES = {
  SUCCESS: {
    REGISTRATION:
      "Registration successful! Please check your email for verification.",
    LOGIN: "Login successful",
    EMAIL_VERIFIED: "Email verified successfully",
    CLASS_CREATED: "Class created successfully",
    SESSION_CREATED: "Session created successfully",
    ATTENDANCE_MARKED: "Attendance marked successfully",
  },
  ERROR: {
    INVALID_CREDENTIALS: "Invalid email or password",
    EMAIL_NOT_VERIFIED: "Please verify your email before logging in",
    UNAUTHORIZED: "Unauthorized access",
    SESSION_NOT_FOUND: "Session not found",
    CLASS_NOT_FOUND: "Class not found",
    STUDENT_NOT_FOUND: "Student not found",
    FACE_NOT_RECOGNIZED: "Face not recognized. Please register first.",
    SESSION_EXPIRED: "Session has expired",
  },
};

// Environment Detection
const ENVIRONMENT = {
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_LOCAL: process.env.NODE_ENV === "local" || process.env.IS_OFFLINE,
  IS_DEVELOPMENT:
    !process.env.NODE_ENV || process.env.NODE_ENV === "development",
};

// LocalStack Configuration
const LOCALSTACK_CONFIG = {
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
};

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  FROM_EMAIL,
  FRONTEND_URL,
  AWS_REGION,
  S3_BUCKET,
  FACE_COLLECTION_ID,
  FACE_MATCH_THRESHOLD,
  TABLES,
  VALIDATION_PATTERNS,
  MESSAGES,
  ENVIRONMENT,
  LOCALSTACK_CONFIG,
};
