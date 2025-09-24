const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");

const { dynamodb } = require("../../utils/aws/clients");
const { generateToken } = require("../../utils/helpers/jwt-helper");
const { apiResponse } = require("../../utils/helpers/api-response");
const { isProduction } = require("../../utils/email-service");

module.exports.login = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);

    // Validate input
    if (!email || !password) {
      return apiResponse(400, false, "Email and password are required");
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
      return apiResponse(401, false, "Invalid email or password");
    }

    const teacher = result.Items[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, teacher.password);
    if (!passwordMatch) {
      return apiResponse(401, false, "Invalid email or password");
    }

    // Check if account is verified (only in production)
    if (isProduction && !teacher.canLogin) {
      return apiResponse(
        403,
        false,
        "Please verify your email address before logging in. Check your inbox for the verification email.",
        { requiresVerification: true }
      );
    }

    // Generate JWT token
    const token = generateToken({
      teacherId: teacher.teacherId,
      email: teacher.email,
      name: teacher.name,
    });

    return apiResponse(200, true, "Login successful", {
      teacherId: teacher.teacherId,
      name: teacher.name,
      email: teacher.email,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
