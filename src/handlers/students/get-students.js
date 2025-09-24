const { ScanCommand } = require("@aws-sdk/lib-dynamodb");

const { dynamodb } = require("../../utils/aws/clients");
const { apiResponse } = require("../../utils/helpers/api-response");

exports.handler = async (event) => {
  try {
    const classId = event.pathParameters.classId;

    const result = await dynamodb.send(
      new ScanCommand({
        TableName: "Students",
        FilterExpression: "classId = :classId",
        ExpressionAttributeValues: {
          ":classId": classId,
        },
      })
    );

    // Remove sensitive data
    const students = (result.Items || []).map((student) => ({
      studentId: student.studentId,
      rollNumber: student.rollNumber,
      name: student.name,
      email: student.email,
      department: student.department,
      registeredAt: student.registeredAt,
      attendanceCount: student.attendanceCount,
      isActive: student.isActive,
    }));

    return apiResponse(200, true, "Students retrieved successfully", students);
  } catch (error) {
    console.error("Get students error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
