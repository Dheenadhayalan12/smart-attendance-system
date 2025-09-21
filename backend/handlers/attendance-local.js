// Simplified attendance marking for local development (without Rekognition)
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

// Configure AWS clients for LocalStack
const dynamoClient = new DynamoDBClient({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

// Validate QR code and check session
const validateQRData = async (qrData) => {
  try {
    const sessionData = JSON.parse(qrData);
    const { sessionId, classId, validUntil } = sessionData;

    // Check if session is still valid
    if (new Date() > new Date(validUntil)) {
      return { valid: false, message: "Session has expired" };
    }

    // Get session details
    const sessionResult = await dynamodb.send(
      new GetCommand({
        TableName: "Sessions",
        Key: { sessionId },
      })
    );

    if (!sessionResult.Item) {
      return { valid: false, message: "Session not found" };
    }

    if (!sessionResult.Item.isActive) {
      return { valid: false, message: "Session is no longer active" };
    }

    return {
      valid: true,
      session: sessionResult.Item,
      qrData: sessionData,
    };
  } catch (error) {
    return { valid: false, message: "Invalid QR code format" };
  }
};

// Simplified face verification for local development
const verifyFaceLocal = async (faceImageBase64, expectedStudentId) => {
  // In local development mode, we'll always return success for testing
  // In production, this would use Rekognition
  console.log(
    "🧪 Local face verification mode - simulating 95% confidence match"
  );

  return {
    verified: true,
    confidence: "95.50",
    studentId: expectedStudentId,
    note: "Local development mode - no actual face recognition",
  };
};

// Mark attendance for a student (simplified for local development)
module.exports.markAttendance = async (event) => {
  try {
    const { qrData, rollNumber, faceImageBase64 } = JSON.parse(event.body);

    // Validate required fields
    if (!qrData || !rollNumber || !faceImageBase64) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "QR data, roll number, and face image are required",
        }),
      };
    }

    // Step 1: Validate QR code and session
    const qrValidation = await validateQRData(qrData);
    if (!qrValidation.valid) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: qrValidation.message,
        }),
      };
    }

    const { session, qrData: parsedQrData } = qrValidation;

    // Step 2: Find student by roll number and class
    const studentResult = await dynamodb.send(
      new ScanCommand({
        TableName: "Students",
        FilterExpression: "rollNumber = :rollNumber AND classId = :classId",
        ExpressionAttributeValues: {
          ":rollNumber": rollNumber,
          ":classId": parsedQrData.classId,
        },
      })
    );

    if (!studentResult.Items || studentResult.Items.length === 0) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message:
            "Student not found in this class. Please check your roll number.",
        }),
      };
    }

    const student = studentResult.Items[0];

    // Step 3: Check if already marked attendance for this session
    const existingAttendance = await dynamodb.send(
      new ScanCommand({
        TableName: "Attendance",
        FilterExpression: "sessionId = :sessionId AND studentId = :studentId",
        ExpressionAttributeValues: {
          ":sessionId": session.sessionId,
          ":studentId": student.studentId,
        },
      })
    );

    if (existingAttendance.Items && existingAttendance.Items.length > 0) {
      return {
        statusCode: 409,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Attendance already marked for this session",
        }),
      };
    }

    // Step 4: Verify face (simplified for local development)
    const faceVerification = await verifyFaceLocal(
      faceImageBase64,
      student.studentId
    );
    if (!faceVerification.verified) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: faceVerification.message,
        }),
      };
    }

    // Step 5: Mark attendance
    const attendanceId = uuidv4();
    const attendanceData = {
      attendanceId,
      sessionId: session.sessionId,
      classId: session.classId,
      studentId: student.studentId,
      rollNumber: student.rollNumber,
      studentName: student.name,
      teacherId: session.teacherId,
      sessionName: session.sessionName,
      markedAt: new Date().toISOString(),
      faceConfidence: faceVerification.confidence,
      attendanceMethod: "QR_FACE_RECOGNITION_LOCAL",
      isPresent: true,
      localMode: true,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: "Attendance",
        Item: attendanceData,
      })
    );

    // Step 6: Update session attendance count
    await dynamodb.send(
      new UpdateCommand({
        TableName: "Sessions",
        Key: { sessionId: session.sessionId },
        UpdateExpression: "SET attendanceCount = attendanceCount + :inc",
        ExpressionAttributeValues: {
          ":inc": 1,
        },
      })
    );

    // Step 7: Update student total attendance count
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

    return {
      statusCode: 201,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Attendance marked successfully (local development mode)",
        data: {
          attendanceId,
          studentName: student.name,
          rollNumber: student.rollNumber,
          sessionName: session.sessionName,
          markedAt: attendanceData.markedAt,
          faceConfidence: faceVerification.confidence,
          mode: "local_development",
        },
      }),
    };
  } catch (error) {
    console.error("Mark attendance error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};

// Get attendance for a session
module.exports.getSessionAttendance = async (event) => {
  try {
    const sessionId = event.pathParameters.sessionId;

    // Get session details to verify access
    const sessionResult = await dynamodb.send(
      new GetCommand({
        TableName: "Sessions",
        Key: { sessionId },
      })
    );

    if (!sessionResult.Item) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Session not found",
        }),
      };
    }

    // Get all attendance records for this session
    const attendanceResult = await dynamodb.send(
      new ScanCommand({
        TableName: "Attendance",
        FilterExpression: "sessionId = :sessionId",
        ExpressionAttributeValues: {
          ":sessionId": sessionId,
        },
      })
    );

    const attendanceRecords = attendanceResult.Items || [];

    // Get expected students for this class
    const studentsResult = await dynamodb.send(
      new ScanCommand({
        TableName: "Students",
        FilterExpression: "classId = :classId",
        ExpressionAttributeValues: {
          ":classId": sessionResult.Item.classId,
        },
      })
    );

    const allStudents = studentsResult.Items || [];
    const presentStudents = attendanceRecords.map((record) => record.studentId);
    const absentStudents = allStudents.filter(
      (student) => !presentStudents.includes(student.studentId)
    );

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        data: {
          session: {
            sessionId: sessionResult.Item.sessionId,
            sessionName: sessionResult.Item.sessionName,
            startTime: sessionResult.Item.startTime,
            endTime: sessionResult.Item.endTime,
            isActive: sessionResult.Item.isActive,
          },
          summary: {
            totalStudents: allStudents.length,
            presentCount: attendanceRecords.length,
            absentCount: absentStudents.length,
            attendancePercentage:
              allStudents.length > 0
                ? (
                    (attendanceRecords.length / allStudents.length) *
                    100
                  ).toFixed(2)
                : 0,
          },
          presentStudents: attendanceRecords.map((record) => ({
            rollNumber: record.rollNumber,
            studentName: record.studentName,
            markedAt: record.markedAt,
            faceConfidence: record.faceConfidence,
            method: record.attendanceMethod || "UNKNOWN",
          })),
          absentStudents: absentStudents.map((student) => ({
            rollNumber: student.rollNumber,
            studentName: student.name,
          })),
        },
      }),
    };
  } catch (error) {
    console.error("Get session attendance error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    };
  }
};

// Get student's attendance history
module.exports.getStudentAttendance = async (event) => {
  try {
    const studentId = event.pathParameters.studentId;

    const attendanceResult = await dynamodb.send(
      new ScanCommand({
        TableName: "Attendance",
        FilterExpression: "studentId = :studentId",
        ExpressionAttributeValues: {
          ":studentId": studentId,
        },
      })
    );

    const attendanceRecords = (attendanceResult.Items || []).map((record) => ({
      attendanceId: record.attendanceId,
      sessionName: record.sessionName,
      markedAt: record.markedAt,
      faceConfidence: record.faceConfidence,
      method: record.attendanceMethod || "UNKNOWN",
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        data: attendanceRecords,
      }),
    };
  } catch (error) {
    console.error("Get student attendance error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    };
  }
};

// Mark attendance for student mobile interface (handles FormData)
module.exports.markAttendanceMobile = async (event) => {
  try {
    console.log("Mobile attendance request:", event);

    // Parse FormData from multipart request
    let sessionId, studentId, photoData;

    // For demo purposes, we'll accept the FormData and create a mock attendance record
    // In a real implementation, you'd parse the multipart form data properly

    // Try to parse body if it's JSON (fallback)
    try {
      const body = JSON.parse(event.body || "{}");
      sessionId = body.sessionId;
      studentId = body.studentId;
    } catch (e) {
      // Handle multipart form data (simplified for demo)
      sessionId = "demo-session-1"; // Default for demo
      studentId = "demo-student-1";
    }

    // Create attendance record
    const attendanceId = uuidv4();
    const timestamp = new Date().toISOString();

    const attendanceRecord = {
      attendanceId,
      sessionId: sessionId || "demo-session-1",
      studentId: studentId || "demo-student-1",
      studentName: "Demo Student",
      rollNumber: "CS001",
      markedAt: timestamp,
      attendanceMethod: "MOBILE_QR_FACE",
      faceConfidence: 95.5, // Demo confidence
      status: "PRESENT",
      location: "Demo Location",
    };

    // Save to DynamoDB
    await dynamodb.send(
      new PutCommand({
        TableName: "Attendance",
        Item: attendanceRecord,
      })
    );

    // Update session attendance count
    try {
      await dynamodb.send(
        new UpdateCommand({
          TableName: "Sessions",
          Key: { sessionId: sessionId || "demo-session-1" },
          UpdateExpression: "ADD attendanceCount :increment",
          ExpressionAttributeValues: {
            ":increment": 1,
          },
        })
      );
    } catch (updateError) {
      console.log("Session update error (non-critical):", updateError);
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
      },
      body: JSON.stringify({
        success: true,
        message: "Attendance marked successfully",
        data: {
          attendanceId,
          studentName: "Demo Student",
          sessionName: "Demo Session",
          markedAt: timestamp,
          status: "PRESENT",
        },
      }),
    };
  } catch (error) {
    console.error("Mobile attendance marking error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
      },
      body: JSON.stringify({
        success: false,
        message: "Failed to mark attendance",
        error: error.message,
      }),
    };
  }
};
