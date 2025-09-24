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
    const classId = event.pathParameters.classId;
    const updates = JSON.parse(event.body);

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

    // Build update expression
    const allowedFields = [
      "subject",
      "description",
      "rollNumberRange",
      "department",
      "isActive",
    ];
    let updateExpression = "SET updatedAt = :updatedAt";
    const expressionAttributeValues = {
      ":updatedAt": new Date().toISOString(),
    };

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        updateExpression += `, ${field} = :${field}`;
        expressionAttributeValues[`:${field}`] = updates[field];
      }
    });

    await dynamodb.send(
      new UpdateCommand({
        TableName: "Classes",
        Key: { classId },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    // Get updated class
    const updatedResult = await dynamodb.send(
      new GetCommand({
        TableName: "Classes",
        Key: { classId },
      })
    );

    return apiResponse(
      200,
      true,
      "Class updated successfully",
      updatedResult.Item
    );
  } catch (error) {
    console.error("Update class error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
