// Application constants matching backend configuration

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  TIMEOUT: 10000, // 10 seconds
};

// Validation Constants (matching backend)
export const VALIDATION_RULES = {
  ROLL_NUMBER: {
    PATTERN: /^[0-9]{10}$/,
    LENGTH: 10,
    EXAMPLE: '2024179001'
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  SESSION_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50
  },
  CLASS_SUBJECT: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 30
  }
};

// Face Recognition Constants
export const FACE_CONFIG = {
  MATCH_THRESHOLD: 80, // Matches backend FACE_MATCH_THRESHOLD
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png'],
  COMPRESS_QUALITY: 0.8,
  MAX_WIDTH: 640,
  MAX_HEIGHT: 480
};

// QR Code Configuration
export const QR_CONFIG = {
  SCAN_DELAY: 300, // ms between scans
  SIZE: 300, // QR code display size
  MARGIN: 2
};

// Routes
export const ROUTES = {
  HOME: '/',
  TEACHER: {
    LOGIN: '/teacher/login',
    REGISTER: '/teacher/register',
    DASHBOARD: '/teacher/dashboard',
    CLASSES: '/teacher/classes',
    SESSIONS: '/teacher/sessions'
  },
  STUDENT: {
    ATTENDANCE: '/attendance'
  }
};

// Storage Keys
export const STORAGE_KEYS = {
  TEACHER_TOKEN: 'teacherToken',
  RECENT_SESSIONS: 'recentSessions',
  PREFERENCES: 'pref_'
};

// Animation Durations (milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  PAGE_TRANSITION: 400
};

// Theme Colors (matches Tailwind config)
export const THEME = {
  PRIMARY: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    900: '#1e3a8a'
  },
  ACCENT: {
    400: '#fb7185',
    500: '#f43f5e'
  },
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444'
};