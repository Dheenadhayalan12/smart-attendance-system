const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  CreateCollectionCommand,
  ListCollectionsCommand,
} = require("@aws-sdk/client-rekognition");
const { v4: uuidv4 } = require("uuid");

// Configure AWS clients for production
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

// Constants
const FACE_COLLECTION_ID = "smart-attendance-faces";
const S3_BUCKET = process.env.S3_BUCKET || "smart-attendance-faces";
const FACE_MATCH_THRESHOLD = 80;

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

// Initialize face collection
const initializeFaceCollection = async () => {
  try {
    const collections = await rekognitionClient.send(
      new ListCollectionsCommand({})
    );
    if (!collections.CollectionIds.includes(FACE_COLLECTION_ID)) {
      await rekognitionClient.send(
        new CreateCollectionCommand({
          CollectionId: FACE_COLLECTION_ID,
        })
      );
      console.log("Face collection created");
    }
  } catch (error) {
    console.log("Face collection initialization:", error.message);
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
    };

    return apiResponse(200, true, "Session information retrieved", sessionInfo);
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

// Register new student with face recognition
const registerNewStudent = async (
  rollNumber,
  classId,
  faceImage,
  studentName = null
) => {
  try {
    await initializeFaceCollection();

    const studentId = uuidv4();
    const imageKey = `students/${studentId}/face.jpg`;

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(
      faceImage.replace(/^data:image\/[a-z]+;base64,/, ""),
      "base64"
    );

    // Upload image to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: imageKey,
        Body: imageBuffer,
        ContentType: "image/jpeg",
      })
    );

    // Index face in Rekognition
    const indexResult = await rekognitionClient.send(
      new IndexFacesCommand({
        CollectionId: FACE_COLLECTION_ID,
        Image: {
          Bytes: imageBuffer,
        },
        ExternalImageId: studentId,
        MaxFaces: 1,
        QualityFilter: "AUTO",
        DetectionAttributes: ["ALL"],
      })
    );

    if (!indexResult.FaceRecords || indexResult.FaceRecords.length === 0) {
      throw new Error(
        "No face detected in the image. Please upload a clear face photo."
      );
    }

    const faceId = indexResult.FaceRecords[0].Face.FaceId;

    // Get class details
    const classResult = await dynamodb.send(
      new GetCommand({
        TableName: "Classes",
        Key: { classId },
      })
    );

    // Create student record
    const studentData = {
      studentId,
      rollNumber,
      name: studentName || `Student ${rollNumber}`,
      classId,
      className: classResult.Item?.subject || "Unknown",
      teacherId: classResult.Item?.teacherId,
      faceId,
      faceImageS3Key: imageKey,
      registeredAt: new Date().toISOString(),
      isActive: true,
      attendanceCount: 0,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: "Students",
        Item: studentData,
      })
    );

    return { success: true, student: studentData, faceId };
  } catch (error) {
    console.error("Student registration error:", error);
    throw error;
  }
};

// Verify face using Rekognition
const verifyStudentFace = async (faceImage, expectedStudentId) => {
  try {
    const imageBuffer = Buffer.from(
      faceImage.replace(/^data:image\/[a-z]+;base64,/, ""),
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
          "Face doesn't match the registered student for this roll number.",
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
      attendanceMethod: "QR_FACE_RECOGNITION",
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

    return attendanceData;
  } catch (error) {
    console.error("Mark attendance error:", error);
    throw error;
  }
};

// Main attendance submission endpoint
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
