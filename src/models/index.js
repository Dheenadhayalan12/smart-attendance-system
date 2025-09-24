// Data models for the Smart Attendance System
// These models define the structure of our data entities

class Teacher {
  constructor(data) {
    this.teacherId = data.teacherId;
    this.name = data.name;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.isVerified = data.isVerified || false;
    this.verificationToken = data.verificationToken;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  toJSON() {
    const { passwordHash, verificationToken, ...publicData } = this;
    return publicData;
  }
}

class Class {
  constructor(data) {
    this.classId = data.classId;
    this.className = data.className;
    this.description = data.description;
    this.rollNumberRange = data.rollNumberRange; // "21CS001-21CS060"
    this.teacherId = data.teacherId;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  getRollStart() {
    return this.rollNumberRange.split("-")[0];
  }

  getRollEnd() {
    return this.rollNumberRange.split("-")[1];
  }

  getExpectedStudentCount() {
    const [start, end] = this.rollNumberRange.split("-");
    const startNum = parseInt(start.slice(-3));
    const endNum = parseInt(end.slice(-3));
    return endNum - startNum + 1;
  }
}

class Session {
  constructor(data) {
    this.sessionId = data.sessionId;
    this.sessionName = data.sessionName;
    this.classId = data.classId;
    this.teacherId = data.teacherId;
    this.qrCode = data.qrCode;
    this.qrData = data.qrData;
    this.startTime = data.startTime || new Date().toISOString();
    this.endTime = data.endTime;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.expectedStudents = data.expectedStudents || 0;
    this.presentStudents = data.presentStudents || 0;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  getAttendancePercentage() {
    if (this.expectedStudents === 0) return 0;
    return ((this.presentStudents / this.expectedStudents) * 100).toFixed(2);
  }

  isExpired() {
    if (!this.qrData) return true;
    try {
      const qrInfo = JSON.parse(this.qrData);
      return new Date() > new Date(qrInfo.validUntil);
    } catch {
      return true;
    }
  }
}

class Student {
  constructor(data) {
    this.studentId = data.studentId; // Usually the roll number
    this.rollNumber = data.rollNumber;
    this.name = data.name;
    this.classId = data.classId;
    this.faceDataPath = data.faceDataPath; // S3 path
    this.rekognitionFaceId = data.rekognitionFaceId;
    this.registeredAt = data.registeredAt || new Date().toISOString();
    this.lastAttendance = data.lastAttendance;
  }

  hasValidFaceData() {
    return !!(this.faceDataPath && this.rekognitionFaceId);
  }
}

class Attendance {
  constructor(data) {
    this.attendanceId = data.attendanceId;
    this.sessionId = data.sessionId;
    this.studentId = data.studentId;
    this.rollNumber = data.rollNumber;
    this.studentName = data.studentName;
    this.markedAt = data.markedAt || new Date().toISOString();
    this.faceConfidence = data.faceConfidence;
    this.verificationStatus = data.verificationStatus || "verified"; // 'verified', 'auto-registered'
  }

  isHighConfidence() {
    return this.faceConfidence >= 80;
  }
}

// Validation helpers
const validateTeacher = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Valid email is required");
  }

  if (!data.password || data.password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateClass = (data) => {
  const errors = [];

  if (!data.className || data.className.trim().length < 2) {
    errors.push("Class name must be at least 2 characters long");
  }

  if (!data.rollNumberRange || !data.rollNumberRange.includes("-")) {
    errors.push("Valid roll number range is required (e.g., 21CS001-21CS060)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  Teacher,
  Class,
  Session,
  Student,
  Attendance,
  validateTeacher,
  validateClass,
};
