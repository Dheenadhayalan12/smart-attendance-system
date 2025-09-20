const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Verify JWT token middleware
const verifyToken = (token) => {
  try {
    if (!token) {
      throw new Error("No token provided");
    }
    return jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Standard API response format
const apiResponse = (
  statusCode,
  success,
  message,
  data = null,
  error = null
) => {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      success,
      message,
      ...(data && { data }),
      ...(error && { error }),
    }),
  };
};

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate roll number format (example: 21CS001)
const validateRollNumber = (rollNumber) => {
  const rollRegex = /^[0-9]{2}[A-Z]{2}[0-9]{3}$/;
  return rollRegex.test(rollNumber);
};

// Parse roll number range (example: "21CS001-21CS060")
const parseRollRange = (rollRange) => {
  try {
    const [start, end] = rollRange.split("-");
    const startNum = parseInt(start.slice(-3));
    const endNum = parseInt(end.slice(-3));
    return {
      prefix: start.slice(0, -3),
      startNum,
      endNum,
      count: endNum - startNum + 1,
    };
  } catch (error) {
    return null;
  }
};

// Check if roll number is within range
const isRollInRange = (rollNumber, rollRange) => {
  const range = parseRollRange(rollRange);
  if (!range) return false;

  const rollNum = parseInt(rollNumber.slice(-3));
  const rollPrefix = rollNumber.slice(0, -3);

  return (
    rollPrefix === range.prefix &&
    rollNum >= range.startNum &&
    rollNum <= range.endNum
  );
};

// Convert base64 image to buffer
const base64ToBuffer = (base64String) => {
  return Buffer.from(
    base64String.replace(/^data:image\/[a-z]+;base64,/, ""),
    "base64"
  );
};

// Generate unique filename for S3
const generateS3Key = (studentId, type = "face") => {
  const timestamp = Date.now();
  return `students/${studentId}/${type}_${timestamp}.jpg`;
};

module.exports = {
  verifyToken,
  apiResponse,
  validateEmail,
  validateRollNumber,
  parseRollRange,
  isRollInRange,
  base64ToBuffer,
  generateS3Key,
};
