const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");

// Configure DynamoDB client for LocalStack
const dynamoClient = new DynamoDBClient({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Create a new attendance session with QR code
module.exports.createSession = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "No token provided" }),
      };
    }

    const decoded = verifyToken(token);
    const { classId, sessionName, duration, description } = JSON.parse(
      event.body
    );

    // Validate input
    if (!classId || !sessionName || !duration) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Class ID, session name, and duration are required",
        }),
      };
    }

    // Verify the class exists and belongs to this teacher
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

    if (classResult.Item.teacherId !== decoded.teacherId) {
      return {
        statusCode: 403,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Access denied",
        }),
      };
    }

    const sessionId = uuidv4();
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000); // duration in minutes

    // Create attendance URL for QR code (students will scan this)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const attendanceUrl = `${frontendUrl}/attendance?sessionId=${sessionId}`;

    // Store session metadata (for backend validation)
    const qrData = {
      sessionId,
      classId,
      subject: classResult.Item.subject,
      teacherId: decoded.teacherId,
      rollRange: classResult.Item.rollNumberRange,
      validUntil: endTime.toISOString(),
    };

    // Generate QR code with web URL (not JSON data)
    const qrCodeDataURL = await QRCode.toDataURL(attendanceUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    const sessionData = {
      sessionId,
      classId,
      teacherId: decoded.teacherId,
      sessionName,
      description: description || null,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration, // in minutes
      qrCode: qrCodeDataURL,
      qrData: JSON.stringify(qrData),
      attendanceUrl: attendanceUrl,
      isActive: true,
      createdAt: new Date().toISOString(),
      attendanceCount: 0,
      expectedStudents: classResult.Item.rollNumberRange
        ? this.calculateExpectedStudents(classResult.Item.rollNumberRange)
        : 0,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: "Sessions",
        Item: sessionData,
      })
    );

    // Update class total sessions count
    await dynamodb.send(
      new UpdateCommand({
        TableName: "Classes",
        Key: { classId },
        UpdateExpression: "SET totalSessions = totalSessions + :inc",
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
        message: "Session created successfully",
        data: sessionData,
      }),
    };
  } catch (error) {
    console.error("Create session error:", error);
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

// Helper function to calculate expected students from roll range
module.exports.calculateExpectedStudents = (rollRange) => {
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

// Get all sessions for a class
module.exports.getSessionsByClass = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "No token provided" }),
      };
    }

    const decoded = verifyToken(token);
    const classId = event.pathParameters.classId;

    // Verify the class belongs to this teacher
    const classResult = await dynamodb.send(
      new GetCommand({
        TableName: "Classes",
        Key: { classId },
      })
    );

    if (!classResult.Item || classResult.Item.teacherId !== decoded.teacherId) {
      return {
        statusCode: 403,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Access denied",
        }),
      };
    }

    // Get all sessions for this class
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: "Sessions",
        FilterExpression: "classId = :classId",
        ExpressionAttributeValues: {
          ":classId": classId,
        },
      })
    );

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        data: result.Items || [],
      }),
    };
  } catch (error) {
    console.error("Get sessions error:", error);
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

// Get a specific session
module.exports.getSession = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "No token provided" }),
      };
    }

    const decoded = verifyToken(token);
    const sessionId = event.pathParameters.sessionId;

    const result = await dynamodb.send(
      new GetCommand({
        TableName: "Sessions",
        Key: { sessionId },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Session not found",
        }),
      };
    }

    // Check if this teacher owns the session
    if (result.Item.teacherId !== decoded.teacherId) {
      return {
        statusCode: 403,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Access denied",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        data: result.Item,
      }),
    };
  } catch (error) {
    console.error("Get session error:", error);
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

// End a session (deactivate)
module.exports.endSession = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "No token provided" }),
      };
    }

    const decoded = verifyToken(token);
    const sessionId = event.pathParameters.sessionId;

    // Get session to verify ownership
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

    if (sessionResult.Item.teacherId !== decoded.teacherId) {
      return {
        statusCode: 403,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Access denied",
        }),
      };
    }

    // Update session to inactive
    await dynamodb.send(
      new UpdateCommand({
        TableName: "Sessions",
        Key: { sessionId },
        UpdateExpression: "SET isActive = :inactive, endedAt = :endedAt",
        ExpressionAttributeValues: {
          ":inactive": false,
          ":endedAt": new Date().toISOString(),
        },
      })
    );

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Session ended successfully",
      }),
    };
  } catch (error) {
    console.error("End session error:", error);
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
