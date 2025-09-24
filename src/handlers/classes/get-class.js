const { GetCommand } = require("@aws-sdk/lib-dynamodb");

const { dynamodb } = require("../../utils/aws/clients");
const { verifyToken } = require("../../utils/helpers/jwt-helper");
const { apiResponse } = require("../../utils/helpers/api-response");

module.exports.getClass = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return apiResponse(401, false, "No token provided");
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
      return apiResponse(404, false, "Class not found");
    }

    // Check if this teacher owns the class
    if (result.Item.teacherId !== decoded.teacherId) {
      return apiResponse(403, false, "Access denied");
    }

    return apiResponse(200, true, "Class retrieved successfully", result.Item);
  } catch (error) {
    console.error("Get class error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
