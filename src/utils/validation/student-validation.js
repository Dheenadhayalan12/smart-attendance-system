// Validate roll number format (e.g., 2024179001 - 10 digit numeric)
const validateRollNumber = (rollNumber) => {
  const rollRegex = /^[0-9]{10}$/;
  return rollRegex.test(rollNumber);
};

// Check if roll number is within class range (e.g., 2024179001-2024179060)
const validateRollNumberInRange = (rollNumber, rollRange) => {
  try {
    if (!rollRange || !rollRange.includes("-")) {
      return false;
    }

    const [startRoll, endRoll] = rollRange.split("-");

    // Convert roll numbers to integers for comparison
    const rollNum = parseInt(rollNumber);
    const startNum = parseInt(startRoll);
    const endNum = parseInt(endRoll);

    // Check if roll number is within the numeric range
    return rollNum >= startNum && rollNum <= endNum;
  } catch (error) {
    return false;
  }
};

module.exports = {
  validateRollNumber,
  validateRollNumberInRange,
};
