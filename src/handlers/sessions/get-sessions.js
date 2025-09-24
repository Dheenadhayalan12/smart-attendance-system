const { GetCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const { dynamodb } = require("../../utils/aws/clients");
const { verifyToken } = require("../../utils/helpers/jwt-helper");
const { apiResponse } = require("../../utils/helpers/api-response");

module.exports.getSessionsByClass = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return apiResponse(401, false, "No token provided");
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
      return apiResponse(403, false, "Access denied");
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

    return apiResponse(200, true, "Sessions retrieved successfully", result.Items || []);
  } catch (error) {
    console.error("Get sessions error:", error);
    return apiResponse(500, false, "Internal server error", null, error.message);
  }
};