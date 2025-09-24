const {
  GetCommand,
  ScanCommand,
  PutCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const { dynamodb } = require("../aws/clients");
const { uploadToS3 } = require("../aws/s3");
const { indexFace, searchFace } = require("./face-service");

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
    console.error("Error checking existing attendance:", error);
    return false;
  }
};

// Get existing student by roll number and class ID
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

// Register new student with face data
const registerNewStudent = async (
  rollNumber,
  classId,
  faceImage,
  studentName
) => {
  try {
    const studentId = uuidv4();
    const imageBuffer = Buffer.from(faceImage, "base64");

    // Upload face image to S3
    const faceImageKey = `faces/${studentId}.jpg`;
    await uploadToS3(faceImageKey, imageBuffer);

    // Index face in Rekognition
    const indexResult = await indexFace(imageBuffer, studentId);

    if (!indexResult.FaceRecords || indexResult.FaceRecords.length === 0) {
      throw new Error(
        "Unable to detect face in the image. Please ensure your face is clearly visible."
      );
    }

    const faceId = indexResult.FaceRecords[0].Face.FaceId;

    // Create student record
    const studentData = {
      studentId,
      rollNumber,
      classId,
      name: studentName || `Student ${rollNumber}`,
      faceDataPath: faceImageKey,
      rekognitionFaceId: faceId,
      registeredAt: new Date().toISOString(),
      attendanceCount: 0,
      isActive: true,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: "Students",
        Item: studentData,
      })
    );

    return { student: studentData };
  } catch (error) {
    console.error("Error registering new student:", error);
    throw new Error(`Failed to register student: ${error.message}`);
  }
};

// Verify student face against stored face data
const verifyStudentFace = async (faceImage, studentId) => {
  try {
    const imageBuffer = Buffer.from(faceImage, "base64");

    // Search for face in collection
    const searchResult = await searchFace(imageBuffer);

    if (!searchResult.FaceMatches || searchResult.FaceMatches.length === 0) {
      return {
        verified: false,
        confidence: "0.00",
        message:
          "Face not recognized. Please ensure your face is clearly visible and matches your registered photo.",
      };
    }

    const bestMatch = searchResult.FaceMatches[0];
    const matchFound = bestMatch.Face.ExternalImageId === studentId;

    return {
      verified: matchFound,
      confidence: bestMatch.Similarity.toFixed(2),
      message: matchFound
        ? "Face verified successfully"
        : "Face does not match registered photo",
    };
  } catch (error) {
    console.error("Error verifying student face:", error);
    return {
      verified: false,
      confidence: "0.00",
      message: "Face verification failed. Please try again.",
    };
  }
};

// Mark attendance for verified student
const markAttendance = async (sessionId, student, verificationResult) => {
  const attendanceId = uuidv4();
  const timestamp = new Date().toISOString();

  const attendanceData = {
    attendanceId,
    sessionId,
    studentId: student.studentId,
    rollNumber: student.rollNumber,
    studentName: student.name,
    timestamp,
    status: "Present",
    verificationStatus: verificationResult.verified ? "Verified" : "Failed",
    faceConfidence: verificationResult.confidence,
    isManual: false,
  };

  // Save attendance record
  await dynamodb.send(
    new PutCommand({
      TableName: "Attendance",
      Item: attendanceData,
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

  return attendanceData;
};

module.exports = {
  checkExistingAttendance,
  getExistingStudent,
  registerNewStudent,
  verifyStudentFace,
  markAttendance,
};
