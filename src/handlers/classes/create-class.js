const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const { dynamodb } = require("../../utils/aws/clients");
const { verifyToken } = require("../../utils/helpers/jwt-helper");
const { apiResponse } = require("../../utils/helpers/api-response");

module.exports.createClass = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return apiResponse(401, false, "No token provided");
    }

    const decoded = verifyToken(token);
    const { subject, description, rollNumberRange, department } = JSON.parse(
      event.body
    );

    // Validate input
    if (!subject || !rollNumberRange) {
      return apiResponse(
        400,
        false,
        "Subject and roll number range are required"
      );
    }

    const classId = uuidv4();
    const classData = {
      classId,
      teacherId: decoded.teacherId,
      teacherName: decoded.name,
      subject,
      description: description || null,
      rollNumberRange, // e.g., "2024179001-2024179060"
      department: department || null,
      createdAt: new Date().toISOString(),
      isActive: true,
      totalSessions: 0,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: "Classes",
        Item: classData,
      })
    );

    return apiResponse(201, true, "Class created successfully", classData);
  } catch (error) {
    console.error("Create class error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
