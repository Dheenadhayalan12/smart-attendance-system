const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

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

// Create a new class
module.exports.createClass = async (event) => {
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
    const { subject, description, rollNumberRange, department } = JSON.parse(
      event.body
    );

    // Validate input
    if (!subject || !rollNumberRange) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Subject and roll number range are required",
        }),
      };
    }

    const classId = uuidv4();
    const classData = {
      classId,
      teacherId: decoded.teacherId,
      teacherName: decoded.name,
      subject,
      description: description || null,
      rollNumberRange, // e.g., "2024179001-2024179060"
      department: department || null,
      createdAt: new Date().toISOString(),
      isActive: true,
      totalSessions: 0,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: "Classes",
        Item: classData,
      })
    );

    return {
      statusCode: 201,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Class created successfully",
        data: classData,
      }),
    };
  } catch (error) {
    console.error("Create class error:", error);
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

// Get all classes for a teacher
module.exports.getClasses = async (event) => {
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

    // Get all classes for this teacher
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: "Classes",
        FilterExpression: "teacherId = :teacherId",
        ExpressionAttributeValues: {
          ":teacherId": decoded.teacherId,
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
    console.error("Get classes error:", error);
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

// Get a specific class by ID
module.exports.getClass = async (event) => {
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

    const result = await dynamodb.send(
      new GetCommand({
        TableName: "Classes",
        Key: { classId },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Class not found",
        }),
      };
    }

    // Check if this teacher owns the class
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
    console.error("Get class error:", error);
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

// Update a class
module.exports.updateClass = async (event) => {
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
    const updates = JSON.parse(event.body);

    // First, get the class to verify ownership
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

    // Build update expression
    const allowedFields = [
      "subject",
      "description",
      "rollNumberRange",
      "department",
      "isActive",
    ];
    let updateExpression = "SET updatedAt = :updatedAt";
    const expressionAttributeValues = {
      ":updatedAt": new Date().toISOString(),
    };

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        updateExpression += `, ${field} = :${field}`;
        expressionAttributeValues[`:${field}`] = updates[field];
      }
    });

    await dynamodb.send(
      new UpdateCommand({
        TableName: "Classes",
        Key: { classId },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    // Get updated class
    const updatedResult = await dynamodb.send(
      new GetCommand({
        TableName: "Classes",
        Key: { classId },
      })
    );

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Class updated successfully",
        data: updatedResult.Item,
      }),
    };
  } catch (error) {
    console.error("Update class error:", error);
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

// Delete a class
module.exports.deleteClass = async (event) => {
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

    // First, get the class to verify ownership
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

    await dynamodb.send(
      new DeleteCommand({
        TableName: "Classes",
        Key: { classId },
      })
    );

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Class deleted successfully",
      }),
    };
  } catch (error) {
    console.error("Delete class error:", error);
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
