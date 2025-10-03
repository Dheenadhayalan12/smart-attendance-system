import api from './api';

// Submit student attendance (no auth required)
export const submitAttendance = async (attendanceData) => {
  try {
    const response = await api.post('/attendance/submit', {
      sessionId: attendanceData.sessionId,
      rollNumber: attendanceData.rollNumber,
      faceImage: attendanceData.faceImage, // Base64 string without data URL prefix
      studentName: attendanceData.studentName
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get session info for attendance submission
export const getSessionInfo = async (sessionId) => {
  try {
    const response = await api.get(`/attendance/session-info`, {
      params: { sessionId }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get session attendance (teacher only)
export const getSessionAttendance = async (sessionId) => {
  try {
    const response = await api.get(`/attendance/session/${sessionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get student attendance history (teacher only)
export const getStudentAttendance = async (studentId) => {
  try {
    const response = await api.get(`/attendance/student/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};