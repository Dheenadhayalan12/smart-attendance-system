const { ScanCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const { dynamodb } = require("../../utils/aws/clients");
const { generateToken } = require("../../utils/helpers/jwt-helper");
const { apiResponse } = require("../../utils/helpers/api-response");

module.exports.verifyEmail = async (event) => {
  try {
    const { token } = JSON.parse(event.body);

    if (!token) {
      return apiResponse(400, false, "Verification token is required");
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
      return apiResponse(400, false, "Invalid or expired verification token");
    }

    const teacher = result.Items[0];

    // Check if token is expired
    if (
      teacher.verificationTokenExpiry &&
      new Date() > new Date(teacher.verificationTokenExpiry)
    ) {
      return apiResponse(
        400,
        false,
        "Verification token has expired. Please request a new verification email."
      );
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
    const loginToken = generateToken({
      teacherId: teacher.teacherId,
      email: teacher.email,
      name: teacher.name,
    });

    return apiResponse(
      200,
      true,
      "Email verified successfully! You can now login.",
      {
        teacherId: teacher.teacherId,
        name: teacher.name,
        email: teacher.email,
        token: loginToken,
        verified: true,
      }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
