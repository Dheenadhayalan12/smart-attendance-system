const { GetCommand } = require("@aws-sdk/lib-dynamodb");

const { dynamodb } = require("../../utils/aws/clients");
const { apiResponse } = require("../../utils/helpers/api-response");

module.exports.getStudent = async (event) => {
  try {
    const studentId = event.pathParameters.studentId;

    const result = await dynamodb.send(
      new GetCommand({
        TableName: "Students",
        Key: { studentId },
      })
    );

    if (!result.Item) {
      return apiResponse(404, false, "Student not found");
    }

    // Remove sensitive data
    const student = {
      studentId: result.Item.studentId,
      rollNumber: result.Item.rollNumber,
      name: result.Item.name,
      email: result.Item.email,
      department: result.Item.department,
      className: result.Item.className,
      registeredAt: result.Item.registeredAt,
      attendanceCount: result.Item.attendanceCount,
      isActive: result.Item.isActive,
    };

    return apiResponse(200, true, "Student retrieved successfully", student);
  } catch (error) {
    console.error("Get student error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
