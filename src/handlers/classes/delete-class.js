const { GetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const { dynamodb } = require("../../utils/aws/clients");
const { verifyToken } = require("../../utils/helpers/jwt-helper");
const { apiResponse } = require("../../utils/helpers/api-response");

module.exports.deleteClass = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return apiResponse(401, false, "No token provided");
    }

    const decoded = verifyToken(token);
    const classId = event.pathParameters.classId;

    // First, get the class to verify ownership
    const classResult = await dynamodb.send(
      new GetCommand({
        TableName: "Classes",
        Key: { classId },
      })
    );

    if (!classResult.Item) {
      return apiResponse(404, false, "Class not found");
    }

    if (classResult.Item.teacherId !== decoded.teacherId) {
      return apiResponse(403, false, "Access denied");
    }

    await dynamodb.send(
      new DeleteCommand({
        TableName: "Classes",
        Key: { classId },
      })
    );

    return apiResponse(200, true, "Class deleted successfully");
  } catch (error) {
    console.error("Delete class error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
