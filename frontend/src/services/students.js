import api from './api';

// Students API
export const getStudentsByClass = async (classId) => {
  try {
    const response = await api.get(`/classes/${classId}/students`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStudent = async (studentId) => {
  try {
    const response = await api.get(`/students/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStudentAttendance = async (studentId) => {
  try {
    const response = await api.get(`/students/${studentId}/attendance`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};