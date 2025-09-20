const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
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

module.exports.register = async (event) => {
  try {
    const { name, email, password, phone, department } = JSON.parse(event.body);

    // Validate input
    if (!name || !email || !password) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message: "Name, email, and password are required",
        }),
      };
    }

    // Check if teacher already exists (simplified - scan for email)
    const existingResult = await dynamodb.send(
      new ScanCommand({
        TableName: "Teachers",
        FilterExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      })
    );

    if (existingResult.Items && existingResult.Items.length > 0) {
      return {
        statusCode: 409,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message: "Teacher with this email already exists",
        }),
      };
    }

    const teacherId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create teacher record
    const teacher = {
      teacherId,
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      department: department || null,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: "Teachers",
        Item: teacher,
      })
    );

    // Generate JWT token
    const token = jwt.sign({ teacherId, email, name }, JWT_SECRET, {
      expiresIn: "24h",
    });

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        success: true,
        message: "Teacher registered successfully",
        data: {
          teacherId,
          name,
          email,
          token,
        },
      }),
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};

module.exports.login = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);

    // Validate input
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message: "Email and password are required",
        }),
      };
    }

    // Find teacher by email
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: "Teachers",
        FilterExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message: "Invalid email or password",
        }),
      };
    }

    const teacher = result.Items[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, teacher.password);
    if (!passwordMatch) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message: "Invalid email or password",
        }),
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        teacherId: teacher.teacherId,
        email: teacher.email,
        name: teacher.name,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        success: true,
        message: "Login successful",
        data: {
          teacherId: teacher.teacherId,
          name: teacher.name,
          email: teacher.email,
          token,
        },
      }),
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    };
  }
};
