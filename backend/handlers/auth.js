const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  validateEmail,
  generateVerificationToken,
} = require("../utils/email-validation");
const {
  sendVerificationEmail,
  isProduction,
} = require("../utils/email-service");

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

    // Validate email format and domain
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message: emailValidation.message,
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

    // Environment-based verification logic
    let isVerified = !isProduction; // Auto-verify in development
    let canLogin = !isProduction; // Allow login in development
    let verificationToken = null;

    if (isProduction) {
      // Production: Require email verification
      verificationToken = generateVerificationToken();
      isVerified = false;
      canLogin = false;
    }

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
      // New email verification fields
      isVerified,
      canLogin,
      verificationToken,
      verificationTokenExpiry: isProduction
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        : null,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: "Teachers",
        Item: teacher,
      })
    );

    // Send verification email in production
    if (isProduction && verificationToken) {
      const emailResult = await sendVerificationEmail(
        email,
        name,
        verificationToken
      );

      if (!emailResult.success) {
        console.error("Failed to send verification email:", emailResult.error);
        // Continue with registration but log the error
      }
    }

    // Response depends on environment
    if (isProduction) {
      // Production: Email verification required
      return {
        statusCode: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: true,
          message:
            "Registration successful! Please check your email to verify your account before logging in.",
          data: {
            teacherId,
            name,
            email,
            requiresVerification: true,
            verificationSent: true,
          },
        }),
      };
    } else {
      // Development: Auto-login
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
          message:
            "Teacher registered successfully (Development Mode - Auto-verified)",
          data: {
            teacherId,
            name,
            email,
            token,
            developmentMode: true,
          },
        }),
      };
    }
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

    // Check if account is verified (only in production)
    if (isProduction && !teacher.canLogin) {
      return {
        statusCode: 403,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message:
            "Please verify your email address before logging in. Check your inbox for the verification email.",
          requiresVerification: true,
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

// Email verification endpoint
module.exports.verifyEmail = async (event) => {
  try {
    const { token } = JSON.parse(event.body);

    if (!token) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message: "Verification token is required",
        }),
      };
    }

    // Find teacher by verification token
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: "Teachers",
        FilterExpression: "verificationToken = :token",
        ExpressionAttributeValues: {
          ":token": token,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message: "Invalid or expired verification token",
        }),
      };
    }

    const teacher = result.Items[0];

    // Check if token is expired
    if (
      teacher.verificationTokenExpiry &&
      new Date() > new Date(teacher.verificationTokenExpiry)
    ) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message:
            "Verification token has expired. Please request a new verification email.",
        }),
      };
    }

    // Activate teacher account
    await dynamodb.send(
      new PutCommand({
        TableName: "Teachers",
        Item: {
          ...teacher,
          isVerified: true,
          canLogin: true,
          verificationToken: null,
          verificationTokenExpiry: null,
          verifiedAt: new Date().toISOString(),
        },
      })
    );

    // Generate login token
    const loginToken = jwt.sign(
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
        message: "Email verified successfully! You can now login.",
        data: {
          teacherId: teacher.teacherId,
          name: teacher.name,
          email: teacher.email,
          token: loginToken,
          verified: true,
        },
      }),
    };
  } catch (error) {
    console.error("Email verification error:", error);
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

// Resend verification email endpoint
module.exports.resendVerification = async (event) => {
  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message: "Email is required",
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
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message: "No account found with this email address",
        }),
      };
    }

    const teacher = result.Items[0];

    if (teacher.isVerified) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message: "Account is already verified",
        }),
      };
    }

    // Generate new verification token
    const newVerificationToken = generateVerificationToken();
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Update teacher with new token
    await dynamodb.send(
      new PutCommand({
        TableName: "Teachers",
        Item: {
          ...teacher,
          verificationToken: newVerificationToken,
          verificationTokenExpiry: newExpiry,
        },
      })
    );

    // Send new verification email
    const emailResult = await sendVerificationEmail(
      email,
      teacher.name,
      newVerificationToken
    );

    if (!emailResult.success) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
          message: "Failed to send verification email. Please try again.",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        success: true,
        message:
          "Verification email sent successfully. Please check your inbox.",
      }),
    };
  } catch (error) {
    console.error("Resend verification error:", error);
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
