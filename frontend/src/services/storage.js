// LocalStorage helpers for managing app state

// Teacher authentication
export const setTeacherToken = (token) => {
  localStorage.setItem('teacherToken', token);
};

export const getTeacherToken = () => {
  return localStorage.getItem('teacherToken');
};

export const removeTeacherToken = () => {
  localStorage.removeItem('teacherToken');
};

export const isTeacherAuthenticated = () => {
  const token = getTeacherToken();
  if (!token) return false;
  
  try {
    // Simple token expiry check (if JWT)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Recent sessions (for quick access)
export const setRecentSessions = (sessions) => {
  localStorage.setItem('recentSessions', JSON.stringify(sessions));
};

export const getRecentSessions = () => {
  try {
    const sessions = localStorage.getItem('recentSessions');
    return sessions ? JSON.parse(sessions) : [];
  } catch {
    return [];
  }
};

// App preferences
export const setPreference = (key, value) => {
  localStorage.setItem(`pref_${key}`, JSON.stringify(value));
};

export const getPreference = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(`pref_${key}`);
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Clear all app data
export const clearAppData = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('teacherToken') || key.startsWith('recentSessions') || key.startsWith('pref_')) {
      localStorage.removeItem(key);
    }
  });
};