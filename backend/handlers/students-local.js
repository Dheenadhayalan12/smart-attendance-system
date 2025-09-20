// Simplified student registration for local development (without Rekognition)
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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

const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const S3_BUCKET = "smart-attendance-faces";

// Simplified student registration (stores face image but no Rekognition)
module.exports.registerStudent = async (event) => {
  try {
    const {
      rollNumber,
      name,
      email,
      phone,
      department,
      classId,
      faceImageBase64,
    } = JSON.parse(event.body);

    // Validate required fields
    if (!rollNumber || !name || !email || !faceImageBase64 || !classId) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message:
            "Roll number, name, email, class ID, and face image are required",
        }),
      };
    }

    // Check if student already exists
    const existingStudent = await dynamodb.send(
      new ScanCommand({
        TableName: "Students",
        FilterExpression: "rollNumber = :rollNumber OR email = :email",
        ExpressionAttributeValues: {
          ":rollNumber": rollNumber,
          ":email": email,
        },
      })
    );

    if (existingStudent.Items && existingStudent.Items.length > 0) {
      return {
        statusCode: 409,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Student with this roll number or email already exists",
        }),
      };
    }

    // Verify the class exists
    const classResult = await dynamodb.send(
      new GetCommand({
        TableName: "Classes",
        Key: { classId },
      })
    );

    if (!classResult.Item) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Class not found",
        }),
      };
    }

    const studentId = uuidv4();
    const imageKey = `students/${studentId}/face.jpg`;

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(
      faceImageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
      "base64"
    );

    try {
      // Upload image to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: imageKey,
          Body: imageBuffer,
          ContentType: "image/jpeg",
        })
      );
      console.log("✅ Face image uploaded to S3");
    } catch (s3Error) {
      console.log(
        "⚠️ S3 upload failed, continuing without image storage:",
        s3Error.message
      );
    }

    // Create student record
    const studentData = {
      studentId,
      rollNumber,
      name,
      email,
      phone: phone || null,
      department: department || null,
      classId,
      className: classResult.Item.subject,
      teacherId: classResult.Item.teacherId,
      faceImageS3Key: imageKey,
      // For local development, we'll use a simulated face ID
      faceId: `local_face_${studentId}`,
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

    return {
      statusCode: 201,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message:
          "Student registered successfully (local mode - no face recognition)",
        data: {
          studentId,
          rollNumber,
          name,
          email,
          faceId: studentData.faceId,
          registeredAt: studentData.registeredAt,
        },
      }),
    };
  } catch (error) {
    console.error("Student registration error:", error);
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
