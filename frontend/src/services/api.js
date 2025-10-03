import axios from 'axios';

// API base URL - adjust for your backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/local';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token for teacher routes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('teacherToken');
    if (token && (config.url?.includes('classes') || config.url?.includes('sessions'))) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('teacherToken');
      window.location.href = '/teacher/login';
    }
    return Promise.reject(error);
  }
);

export default api;