const { ScanCommand } = require("@aws-sdk/lib-dynamodb");

const { dynamodb } = require("../../utils/aws/clients");
const { verifyToken } = require("../../utils/helpers/jwt-helper");
const { apiResponse } = require("../../utils/helpers/api-response");

module.exports.getClasses = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return apiResponse(401, false, "No token provided");
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

    return apiResponse(
      200,
      true,
      "Classes retrieved successfully",
      result.Items || []
    );
  } catch (error) {
    console.error("Get classes error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
