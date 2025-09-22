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

// Register a new student with face data
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

    // Initialize face collection
    await initializeFaceCollection();

    const studentId = uuidv4();
    const imageKey = `students/${studentId}/face.jpg`;

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(
      faceImageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
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
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message:
            "No face detected in the image. Please upload a clear face photo.",
        }),
      };
    }

    const faceId = indexResult.FaceRecords[0].Face.FaceId;

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

    return {
      statusCode: 201,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Student registered successfully with face recognition",
        data: {
          studentId,
          rollNumber,
          name,
          email,
          faceId,
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
      attendanceCount: student.attendanceCount || 0,
      isActive: student.isActive,
      isRegistered: true, // All students in DB are registered
      attendanceRate: 0, // TODO: Calculate based on total sessions vs attended
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        students: students,
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
