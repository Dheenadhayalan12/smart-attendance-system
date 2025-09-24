const { ScanCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const { dynamodb } = require("../../utils/aws/clients");
const { apiResponse } = require("../../utils/helpers/api-response");
const { generateVerificationToken } = require("../../utils/email-validation");
const { sendVerificationEmail } = require("../../utils/email-service");

module.exports.resendVerification = async (event) => {
  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return apiResponse(400, false, "Email is required");
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
      return apiResponse(
        404,
        false,
        "No account found with this email address"
      );
    }

    const teacher = result.Items[0];

    if (teacher.isVerified) {
      return apiResponse(400, false, "Account is already verified");
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
      return apiResponse(
        500,
        false,
        "Failed to send verification email. Please try again."
      );
    }

    return apiResponse(
      200,
      true,
      "Verification email sent successfully. Please check your inbox."
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
