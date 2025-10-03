// Validation utilities based on backend validation rules

// Roll number validation (10-digit numeric)
export const validateRollNumber = (rollNumber) => {
  const rollRegex = /^[0-9]{10}$/;
  return {
    isValid: rollRegex.test(rollNumber),
    message: rollRegex.test(rollNumber) 
      ? null 
      : 'Roll number must be exactly 10 digits (e.g., 2024179001)'
  };
};

// Check if roll number is within class range
export const validateRollNumberInRange = (rollNumber, rollRange) => {
  try {
    if (!rollRange || !rollRange.includes('-')) {
      return { isValid: false, message: 'Invalid class roll number range' };
    }

    const [startRoll, endRoll] = rollRange.split('-');
    const rollNum = parseInt(rollNumber);
    const startNum = parseInt(startRoll);
    const endNum = parseInt(endRoll);

    const isInRange = rollNum >= startNum && rollNum <= endNum;
    
    return {
      isValid: isInRange,
      message: isInRange 
        ? null 
        : `Roll number must be between ${startRoll} and ${endRoll}`
    };
  } catch (error) {
    return { isValid: false, message: 'Invalid roll number format' };
  }
};

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(email),
    message: emailRegex.test(email) ? null : 'Please enter a valid email address'
  };
};

// Password validation
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  const errors = [];
  if (password.length < minLength) errors.push(`At least ${minLength} characters`);
  if (!hasUpperCase) errors.push('One uppercase letter');
  if (!hasLowerCase) errors.push('One lowercase letter');
  if (!hasNumbers) errors.push('One number');
  
  return {
    isValid: errors.length === 0,
    message: errors.length > 0 ? `Password must contain: ${errors.join(', ')}` : null
  };
};

// Session name validation
export const validateSessionName = (name) => {
  const trimmed = name.trim();
  return {
    isValid: trimmed.length >= 3 && trimmed.length <= 50,
    message: trimmed.length < 3 
      ? 'Session name must be at least 3 characters'
      : trimmed.length > 50 
      ? 'Session name must be less than 50 characters'
      : null
  };
};

// Class subject validation
export const validateSubject = (subject) => {
  const trimmed = subject.trim();
  return {
    isValid: trimmed.length >= 2 && trimmed.length <= 30,
    message: trimmed.length < 2 
      ? 'Subject must be at least 2 characters'
      : trimmed.length > 30 
      ? 'Subject must be less than 30 characters'
      : null
  };
};