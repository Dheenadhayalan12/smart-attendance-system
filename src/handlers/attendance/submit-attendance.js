const { GetCommand } = require("@aws-sdk/lib-dynamodb");

const { dynamodb } = require("../../utils/aws/clients");
const { apiResponse } = require("../../utils/helpers/api-response");
const {
  validateRollNumber,
  validateRollNumberInRange,
} = require("../../utils/validation/student-validation");
const {
  checkExistingAttendance,
  getExistingStudent,
  registerNewStudent,
  verifyStudentFace,
  markAttendance,
} = require("../../utils/services/attendance-service");

module.exports.submitAttendance = async (event) => {
  try {
    const { sessionId, rollNumber, faceImage, studentName } = JSON.parse(
      event.body
    );

    // Validate required fields
    if (!sessionId || !rollNumber || !faceImage) {
      return apiResponse(
        400,
        false,
        "Session ID, roll number, and face image are required"
      );
    }

    // Validate roll number format
    if (!validateRollNumber(rollNumber)) {
      return apiResponse(
        400,
        false,
        "Invalid roll number format. Expected format: 2024179001 (10 digits)"
      );
    }

    // Get session details
    const sessionResult = await dynamodb.send(
      new GetCommand({
        TableName: "Sessions",
        Key: { sessionId },
      })
    );

    if (!sessionResult.Item) {
      return apiResponse(404, false, "Session not found");
    }

    const session = sessionResult.Item;

    // Validate session is active and not expired
    const now = new Date();
    const endTime = new Date(session.endTime);

    if (!session.isActive) {
      return apiResponse(400, false, "Session has been ended");
    }

    if (now > endTime) {
      return apiResponse(400, false, "Session has expired");
    }

    // Get class details for roll number validation
    const classResult = await dynamodb.send(
      new GetCommand({
        TableName: "Classes",
        Key: { classId: session.classId },
      })
    );

    if (!classResult.Item) {
      return apiResponse(404, false, "Class not found");
    }

    // Validate roll number is in class range
    const isValidRollNumber = validateRollNumberInRange(
      rollNumber,
      classResult.Item.rollNumberRange
    );

    if (!isValidRollNumber) {
      return apiResponse(400, false, "Roll number not valid for this class");
    }

    // Check if attendance already marked
    const alreadyMarked = await checkExistingAttendance(sessionId, rollNumber);
    if (alreadyMarked) {
      return apiResponse(
        409,
        false,
        "Attendance already marked for this session"
      );
    }

    // Check if student exists
    let student = await getExistingStudent(rollNumber, session.classId);
    let isNewStudent = false;
    let verificationResult;

    if (!student) {
      // NEW STUDENT - Registration Flow
      console.log(`New student registration: ${rollNumber}`);
      isNewStudent = true;

      try {
        const registrationResult = await registerNewStudent(
          rollNumber,
          session.classId,
          faceImage,
          studentName
        );
        student = registrationResult.student;
        verificationResult = {
          verified: true,
          confidence: "100.00",
          message: "New student registered",
        };
      } catch (error) {
        return apiResponse(400, false, error.message);
      }
    } else {
      // EXISTING STUDENT - Verification Flow
      console.log(`Existing student verification: ${rollNumber}`);
      verificationResult = await verifyStudentFace(
        faceImage,
        student.studentId
      );

      if (!verificationResult.verified) {
        return apiResponse(400, false, verificationResult.message);
      }
    }

    // Mark attendance
    const attendanceData = await markAttendance(
      sessionId,
      student,
      verificationResult
    );

    return apiResponse(201, true, "Attendance marked successfully", {
      attendanceId: attendanceData.attendanceId,
      rollNumber: student.rollNumber,
      studentName: student.name,
      timestamp: attendanceData.timestamp,
      status: "Present",
      isNewStudent,
      faceConfidence: verificationResult.confidence,
      verificationStatus: verificationResult.verified ? "Verified" : "Failed",
    });
  } catch (error) {
    console.error("Submit attendance error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
