const { ddbDocClient } = require("../../utils/aws/clients");
const { GetCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { apiResponse } = require("../../utils/helpers/api-response");

exports.handler = async (event) => {
  try {
    const sessionId = event.pathParameters.sessionId;

    // Get session details to verify access
    const sessionResult = await ddbDocClient.send(
      new GetCommand({
        TableName: "Sessions",
        Key: { sessionId },
      })
    );

    if (!sessionResult.Item) {
      return apiResponse(404, false, "Session not found");
    }

    // Get all attendance records for this session
    const attendanceResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: "Attendance",
        FilterExpression: "sessionId = :sessionId",
        ExpressionAttributeValues: {
          ":sessionId": sessionId,
        },
      })
    );

    const attendanceRecords = attendanceResult.Items || [];

    // Get expected students for this class
    const studentsResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: "Students",
        FilterExpression: "classId = :classId",
        ExpressionAttributeValues: {
          ":classId": sessionResult.Item.classId,
        },
      })
    );

    const allStudents = studentsResult.Items || [];
    const presentStudents = attendanceRecords.map((record) => record.studentId);
    const absentStudents = allStudents.filter(
      (student) => !presentStudents.includes(student.studentId)
    );

    const data = {
      session: {
        sessionId: sessionResult.Item.sessionId,
        sessionName: sessionResult.Item.sessionName,
        startTime: sessionResult.Item.startTime,
        endTime: sessionResult.Item.endTime,
        isActive: sessionResult.Item.isActive,
      },
      summary: {
        totalStudents: allStudents.length,
        presentCount: attendanceRecords.length,
        absentCount: absentStudents.length,
        attendancePercentage:
          allStudents.length > 0
            ? ((attendanceRecords.length / allStudents.length) * 100).toFixed(2)
            : 0,
      },
      presentStudents: attendanceRecords.map((record) => ({
        rollNumber: record.rollNumber,
        studentName: record.studentName,
        markedAt: record.markedAt,
        faceConfidence: record.faceConfidence,
      })),
      absentStudents: absentStudents.map((student) => ({
        rollNumber: student.rollNumber,
        studentName: student.name,
      })),
    };

    return apiResponse(
      200,
      true,
      "Session attendance retrieved successfully",
      data
    );
  } catch (error) {
    console.error("Get session attendance error:", error);
    return apiResponse(
      500,
      false,
      "Failed to retrieve session attendance",
      null,
      error.message
    );
  }
};
