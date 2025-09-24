const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const {
  RekognitionClient,
  IndexFacesCommand,
  CreateCollectionCommand,
  ListCollectionsCommand,
} = require("@aws-sdk/client-rekognition");
const { v4: uuidv4 } = require("uuid");

// Configure AWS clients for LocalStack
const dynamoClient = new DynamoDBClient({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

const s3Client = new S3Client({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
  forcePathStyle: true,
});

const rekognitionClient = new RekognitionClient({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

// Initialize face collection for the institution
const FACE_COLLECTION_ID = "smart-attendance-faces";
const S3_BUCKET = "smart-attendance-faces";

// Ensure face collection exists
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

// NOTE: Teacher-based student registration removed
// Students now self-register automatically when they first scan QR code for attendance
// See student-attendance.js for the new auto-registration flow

// Get all students for a class
module.exports.getStudentsByClass = async (event) => {
  try {
    const classId = event.pathParameters.classId;

    const result = await dynamodb.send(
      new ScanCommand({
        TableName: "Students",
        FilterExpression: "classId = :classId",
        ExpressionAttributeValues: {
          ":classId": classId,
        },
      })
    );

    // Remove sensitive data
    const students = (result.Items || []).map((student) => ({
      studentId: student.studentId,
      rollNumber: student.rollNumber,
      name: student.name,
      email: student.email,
      department: student.department,
      registeredAt: student.registeredAt,
      attendanceCount: student.attendanceCount,
      isActive: student.isActive,
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        data: students,
      }),
    };
  } catch (error) {
    console.error("Get students error:", error);
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

// Get student profile
module.exports.getStudent = async (event) => {
  try {
    const studentId = event.pathParameters.studentId;

    const result = await dynamodb.send(
      new GetCommand({
        TableName: "Students",
        Key: { studentId },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Student not found",
        }),
      };
    }

    // Remove sensitive data
    const student = {
      studentId: result.Item.studentId,
      rollNumber: result.Item.rollNumber,
      name: result.Item.name,
      email: result.Item.email,
      department: result.Item.department,
      className: result.Item.className,
      registeredAt: result.Item.registeredAt,
      attendanceCount: result.Item.attendanceCount,
      isActive: result.Item.isActive,
    };

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        data: student,
      }),
    };
  } catch (error) {
    console.error("Get student error:", error);
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
