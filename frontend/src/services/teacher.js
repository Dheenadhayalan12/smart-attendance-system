import api from './api';

// Auth endpoints
export const teacherLogin = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('teacherToken', response.data.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const teacherRegister = async (teacherData) => {
  try {
    const response = await api.post('/auth/register', teacherData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const verifyEmail = async (token) => {
  try {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Class management
export const createClass = async (classData) => {
  try {
    const response = await api.post('/classes', classData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getClasses = async () => {
  try {
    const response = await api.get('/classes');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getClass = async (classId) => {
  try {
    const response = await api.get(`/classes/${classId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateClass = async (classId, updates) => {
  try {
    const response = await api.put(`/classes/${classId}`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteClass = async (classId) => {
  try {
    const response = await api.delete(`/classes/${classId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Session management
export const createSession = async (sessionData) => {
  try {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSessions = async (classId) => {
  try {
    const response = await api.get(`/sessions`, {
      params: { classId }
    });
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
    const response = await api.patch(`/sessions/${sessionId}/end`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};