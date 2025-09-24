const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const { dynamodb } = require("../../utils/aws/clients");
const { verifyToken } = require("../../utils/helpers/jwt-helper");
const { apiResponse } = require("../../utils/helpers/api-response");

exports.handler = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return apiResponse(401, false, "No token provided");
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
      return apiResponse(404, false, "Session not found");
    }

    if (sessionResult.Item.teacherId !== decoded.teacherId) {
      return apiResponse(403, false, "Access denied");
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

    return apiResponse(200, true, "Session ended successfully");
  } catch (error) {
    console.error("End session error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
