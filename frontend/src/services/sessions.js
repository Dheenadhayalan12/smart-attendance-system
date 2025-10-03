import api from './api';

// Sessions API
export const createSession = async (sessionData) => {
  try {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSessionsByClass = async (classId) => {
  try {
    const response = await api.get(`/classes/${classId}/sessions`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSession = async (sessionId) => {
  try {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const endSession = async (sessionId) => {
  try {
    const response = await api.post(`/sessions/${sessionId}/end`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSessionAttendance = async (sessionId) => {
  try {
    const response = await api.get(`/sessions/${sessionId}/attendance`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};