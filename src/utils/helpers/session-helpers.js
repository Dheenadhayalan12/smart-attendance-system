const calculateExpectedStudents = (rollRange) => {
  try {
    if (!rollRange || !rollRange.includes("-")) {
      return 0;
    }

    // Example: "2024179001-2024179060" -> 60 students
    const [start, end] = rollRange.split("-");
    const startNum = parseInt(start); // Parse full 10-digit number
    const endNum = parseInt(end); // Parse full 10-digit number

    if (isNaN(startNum) || isNaN(endNum)) {
      return 0;
    }

    return endNum - startNum + 1;
  } catch (error) {
    return 0;
  }
};

// Parse roll number range (example: "21CS001-21CS060")
const parseRollRange = (rollRange) => {
  try {
    const [start, end] = rollRange.split("-");
    const startNum = parseInt(start.slice(-3));
    const endNum = parseInt(end.slice(-3));
    return {
      prefix: start.slice(0, -3),
      startNum,
      endNum,
      count: endNum - startNum + 1,
    };
  } catch (error) {
    return null;
  }
};

// Check if roll number is within range
const isRollInRange = (rollNumber, rollRange) => {
  const range = parseRollRange(rollRange);
  if (!range) return false;

  const rollNum = parseInt(rollNumber.slice(-3));
  const rollPrefix = rollNumber.slice(0, -3);

  return (
    rollPrefix === range.prefix &&
    rollNum >= range.startNum &&
    rollNum <= range.endNum
  );
};

module.exports = {
  calculateExpectedStudents,
  parseRollRange,
  isRollInRange,
};
