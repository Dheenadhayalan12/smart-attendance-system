const { PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

const { dynamodb } = require("../../utils/aws/clients");
const { generateToken } = require("../../utils/helpers/jwt-helper");
const { apiResponse } = require("../../utils/helpers/api-response");
const {
  validateEmail,
  generateVerificationToken,
} = require("../../utils/email-validation");
const {
  sendVerificationEmail,
  isProduction,
} = require("../../utils/email-service");

module.exports.register = async (event) => {
  try {
    const { name, email, password, phone, department } = JSON.parse(event.body);

    // Validate input
    if (!name || !email || !password) {
      return apiResponse(400, false, "Name, email, and password are required");
    }

    // Validate email format and domain
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return apiResponse(400, false, emailValidation.message);
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
      return apiResponse(409, false, "Teacher with this email already exists");
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
      return apiResponse(
        201,
        true,
        "Registration successful! Please check your email to verify your account before logging in.",
        {
          teacherId,
          name,
          email,
          requiresVerification: true,
          verificationSent: true,
        }
      );
    } else {
      // Development: Auto-login
      const token = generateToken({ teacherId, email, name });

      return apiResponse(
        201,
        true,
        "Teacher registered successfully (Development Mode - Auto-verified)",
        {
          teacherId,
          name,
          email,
          token,
          developmentMode: true,
        }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
