import axios from "axios";

// Configure axios base URL based on environment
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/local";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Helper function to set auth token in axios headers
const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export const authService = {
  setAuthToken: setAuthToken,

  getToken: () => {
    return localStorage.getItem("token");
  },

  setToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
      setAuthToken(token);
    } else {
      localStorage.removeItem("token");
      setAuthToken(null);
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
  },

  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response;
  },

  register: async (name, email, password) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    return response;
  },

  // Teacher profile methods
  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response;
  },

  updateProfile: async (data) => {
    const response = await api.put("/auth/profile", data);
    return response;
  },
};

export const attendanceService = {
  markAttendance: async (formData) => {
    try {
      // Create a special API instance for form data
      const formApi = axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000, // 30 seconds for file upload
      });

      // Add auth token to form data request
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await formApi.post("/attendance/mark", formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Attendance marking error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to mark attendance",
      };
    }
  },

  getAttendanceHistory: async (studentId) => {
    const response = await api.get(`/attendance/history/${studentId}`);
    return response;
  },

  getSessionAttendance: async (sessionId) => {
    const response = await api.get(`/attendance/session/${sessionId}`);
    return response;
  },

  getStudentAttendanceRate: async (studentId, classId) => {
    const response = await api.get(`/attendance/rate/${studentId}/${classId}`);
    return response;
  },
};

export default api;
