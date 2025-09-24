const { ddbDocClient } = require("../../utils/aws/clients");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { apiResponse } = require("../../utils/helpers/api-response");

exports.handler = async (event) => {
  try {
    const studentId = event.pathParameters.studentId;

    const attendanceResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: "Attendance",
        FilterExpression: "studentId = :studentId",
        ExpressionAttributeValues: {
          ":studentId": studentId,
        },
      })
    );

    const attendanceRecords = (attendanceResult.Items || []).map((record) => ({
      attendanceId: record.attendanceId,
      sessionName: record.sessionName,
      markedAt: record.markedAt,
      faceConfidence: record.faceConfidence,
    }));

    return apiResponse(
      200,
      true,
      "Student attendance retrieved successfully",
      attendanceRecords
    );
  } catch (error) {
    console.error("Get student attendance error:", error);
    return apiResponse(
      500,
      false,
      "Failed to retrieve student attendance",
      null,
      error.message
    );
  }
};
