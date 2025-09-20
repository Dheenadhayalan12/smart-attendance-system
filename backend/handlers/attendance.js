const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
  RekognitionClient,
  SearchFacesByImageCommand,
} = require("@aws-sdk/client-rekognition");
const { v4: uuidv4 } = require("uuid");

// Configure AWS clients for LocalStack
const dynamoClient = new DynamoDBClient({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

const rekognitionClient = new RekognitionClient({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

const FACE_COLLECTION_ID = "smart-attendance-faces";
const FACE_MATCH_THRESHOLD = 80; // 80% confidence threshold

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

// Verify student's face using Rekognition
const verifyFace = async (faceImageBase64, expectedStudentId) => {
  try {
    const imageBuffer = Buffer.from(
      faceImageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
      "base64"
    );

    const searchResult = await rekognitionClient.send(
      new SearchFacesByImageCommand({
        CollectionId: FACE_COLLECTION_ID,
        Image: {
          Bytes: imageBuffer,
        },
        MaxFaces: 1,
        FaceMatchThreshold: FACE_MATCH_THRESHOLD,
      })
    );

    if (!searchResult.FaceMatches || searchResult.FaceMatches.length === 0) {
      return {
        verified: false,
        message:
          "Face not recognized. Please ensure good lighting and face the camera directly.",
      };
    }

    const match = searchResult.FaceMatches[0];
    const matchedStudentId = match.Face.ExternalImageId;
    const confidence = match.Similarity;

    if (matchedStudentId !== expectedStudentId) {
      return {
        verified: false,
        message:
          "Face verification failed. The face doesn't match the provided roll number.",
      };
    }

    return {
      verified: true,
      confidence: confidence.toFixed(2),
      studentId: matchedStudentId,
    };
  } catch (error) {
    console.error("Face verification error:", error);
    return {
      verified: false,
      message: "Face verification failed. Please try again.",
    };
  }
};

// Mark attendance for a student
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

    // Step 4: Verify face
    const faceVerification = await verifyFace(
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
      attendanceMethod: "QR_FACE_RECOGNITION",
      isPresent: true,
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
        message: "Attendance marked successfully",
        data: {
          attendanceId,
          studentName: student.name,
          rollNumber: student.rollNumber,
          sessionName: session.sessionName,
          markedAt: attendanceData.markedAt,
          faceConfidence: faceVerification.confidence,
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
