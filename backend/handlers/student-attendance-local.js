// Simplified student attendance for local development (without Rekognition)
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");

// Configure AWS clients for LocalStack
const dynamoClient = new DynamoDBClient({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const s3Client = new S3Client({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  forcePathStyle: true,
});

const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

// Constants
const S3_BUCKET = "smart-attendance-faces";

// API Response helper
const apiResponse = (
  statusCode,
  success,
  message,
  data = null,
  error = null
) => {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      success,
      message,
      ...(data && { data }),
      ...(error && { error }),
    }),
  };
};

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

// Get session information for student attendance (public endpoint)
module.exports.getSessionInfo = async (event) => {
  try {
    const sessionId = event.pathParameters.sessionId;

    if (!sessionId) {
      return apiResponse(400, false, "Session ID is required");
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

    // Check if session is still active and valid
    const now = new Date();
    const endTime = new Date(session.endTime);

    if (!session.isActive) {
      return apiResponse(400, false, "Session has been ended by teacher");
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

    // Return session info needed for student attendance
    const sessionInfo = {
      sessionId: session.sessionId,
      sessionName: session.sessionName,
      subject: classResult.Item.subject,
      section: classResult.Item.section || "N/A",
      department: classResult.Item.department || "N/A",
      rollNumberRange: classResult.Item.rollNumberRange,
      validUntil: session.endTime,
      description: session.description,
      classId: session.classId,
      mode: "local_development",
    };

    return apiResponse(
      200,
      true,
      "Session information retrieved (Local Mode)",
      sessionInfo
    );
  } catch (error) {
    console.error("Get session info error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};

// Check if student exists and get their info
const getExistingStudent = async (rollNumber, classId) => {
  try {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: "Students",
        FilterExpression: "rollNumber = :rollNumber AND classId = :classId",
        ExpressionAttributeValues: {
          ":rollNumber": rollNumber,
          ":classId": classId,
        },
      })
    );

    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch (error) {
    console.error("Error checking existing student:", error);
    return null;
  }
};

// Check if attendance already marked for this session
const checkExistingAttendance = async (sessionId, rollNumber) => {
  try {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: "Attendance",
        FilterExpression: "sessionId = :sessionId AND rollNumber = :rollNumber",
        ExpressionAttributeValues: {
          ":sessionId": sessionId,
          ":rollNumber": rollNumber,
        },
      })
    );
    return result.Items && result.Items.length > 0;
  } catch (error) {
    return false;
  }
};

// Register new student (local mode - no face recognition)
const registerNewStudentLocal = async (
  rollNumber,
  classId,
  faceImage,
  studentName = null
) => {
  try {
    const studentId = uuidv4();
    const imageKey = `students/${studentId}/face.jpg`;

    // Convert base64 to buffer (for S3 storage)
    const imageBuffer = Buffer.from(
      faceImage.replace(/^data:image\/[a-z]+;base64,/, ""),
      "base64"
    );

    // Try to upload image to S3 (may fail in LocalStack, that's okay)
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: imageKey,
          Body: imageBuffer,
          ContentType: "image/jpeg",
        })
      );
      console.log("✅ Face image uploaded to S3 (LocalStack)");
    } catch (s3Error) {
      console.log(
        "⚠️ S3 upload failed (LocalStack), continuing:",
        s3Error.message
      );
    }

    // Get class details
    const classResult = await dynamodb.send(
      new GetCommand({
        TableName: "Classes",
        Key: { classId },
      })
    );

    // Create student record with local face ID
    const studentData = {
      studentId,
      rollNumber,
      name: studentName || `Student ${rollNumber}`,
      classId,
      className: classResult.Item?.subject || "Unknown",
      teacherId: classResult.Item?.teacherId,
      faceId: `local_face_${studentId}`, // Local mock face ID
      faceImageS3Key: imageKey,
      registeredAt: new Date().toISOString(),
      isActive: true,
      attendanceCount: 0,
      localMode: true,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: "Students",
        Item: studentData,
      })
    );

    return { success: true, student: studentData, faceId: studentData.faceId };
  } catch (error) {
    console.error("Student registration error (local):", error);
    throw error;
  }
};

// Mock face verification for local development
const verifyStudentFaceLocal = async (faceImage, expectedStudentId) => {
  console.log("🧪 Local face verification mode - simulating verification");

  // In local mode, we'll simulate a successful match with high confidence
  // You can modify this logic for testing different scenarios

  return {
    verified: true,
    confidence: "95.50",
    studentId: expectedStudentId,
    message: "Local development mode - mock face verification",
  };
};

// Mark attendance record
const markAttendance = async (sessionId, student, verificationResult) => {
  try {
    const attendanceId = uuidv4();
    const attendanceData = {
      attendanceId,
      sessionId,
      classId: student.classId,
      studentId: student.studentId,
      rollNumber: student.rollNumber,
      studentName: student.name,
      timestamp: new Date().toISOString(),
      status: "Present",
      verificationStatus: verificationResult.verified ? "Verified" : "Failed",
      faceConfidence: verificationResult.confidence || "N/A",
      attendanceMethod: "QR_LOCAL_MODE",
      localMode: true,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: "Attendance",
        Item: attendanceData,
      })
    );

    // Update session attendance count
    await dynamodb.send(
      new UpdateCommand({
        TableName: "Sessions",
        Key: { sessionId },
        UpdateExpression: "SET attendanceCount = attendanceCount + :inc",
        ExpressionAttributeValues: {
          ":inc": 1,
        },
      })
    );

    // Update student attendance count
    if (student.studentId) {
      await dynamodb.send(
        new UpdateCommand({
          TableName: "Students",
          Key: { studentId: student.studentId },
          UpdateExpression: "SET attendanceCount = attendanceCount + :inc",
          ExpressionAttributeValues: {
            ":inc": 1,
          },
        })
      );
    }

    return attendanceData;
  } catch (error) {
    console.error("Mark attendance error:", error);
    throw error;
  }
};

// Main attendance submission endpoint (Local Development Version)
module.exports.submitAttendance = async (event) => {
  try {
    const { sessionId, rollNumber, faceImage, studentName } = JSON.parse(
      event.body
    );

    // Validate required fields - In local mode, faceImage is optional
    if (!sessionId || !rollNumber) {
      return apiResponse(400, false, "Session ID and roll number are required");
    }

    // Validate roll number format
    if (!validateRollNumber(rollNumber)) {
      return apiResponse(
        400,
        false,
        "Invalid roll number format. Expected format: 21CS001"
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
      return apiResponse(
        400,
        false,
        `Roll number ${rollNumber} not valid for this class. Expected range: ${classResult.Item.rollNumberRange}`
      );
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
      // NEW STUDENT - Registration Flow (Local Mode)
      console.log(`🆕 New student registration (Local): ${rollNumber}`);
      isNewStudent = true;

      if (!faceImage) {
        // In local mode, we can proceed without face image for testing
        const mockImage =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
        faceImage = mockImage;
      }

      try {
        const registrationResult = await registerNewStudentLocal(
          rollNumber,
          session.classId,
          faceImage,
          studentName
        );
        student = registrationResult.student;
        verificationResult = {
          verified: true,
          confidence: "100.00",
          message: "New student registered (Local Mode)",
        };
      } catch (error) {
        return apiResponse(400, false, error.message);
      }
    } else {
      // EXISTING STUDENT - Verification Flow (Local Mode)
      console.log(`✅ Existing student verification (Local): ${rollNumber}`);
      verificationResult = await verifyStudentFaceLocal(
        faceImage || "",
        student.studentId
      );
    }

    // Mark attendance
    const attendanceData = await markAttendance(
      sessionId,
      student,
      verificationResult
    );

    return apiResponse(
      201,
      true,
      "Attendance marked successfully (Local Mode)",
      {
        attendanceId: attendanceData.attendanceId,
        rollNumber: student.rollNumber,
        studentName: student.name,
        timestamp: attendanceData.timestamp,
        status: "Present",
        isNewStudent,
        faceConfidence: verificationResult.confidence,
        verificationStatus: verificationResult.verified ? "Verified" : "Failed",
        mode: "local_development",
        note: "Local development mode - no actual face recognition",
      }
    );
  } catch (error) {
    console.error("Submit attendance error (local):", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
