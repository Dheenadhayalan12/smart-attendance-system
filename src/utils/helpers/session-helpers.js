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

module.exports = {
  calculateExpectedStudents,
};
