const { GetCommand } = require("@aws-sdk/lib-dynamodb");

const { dynamodb } = require("../../utils/aws/clients");
const { apiResponse } = require("../../utils/helpers/api-response");

exports.handler = async (event) => {
  try {
    const sessionId = event.pathParameters.sessionId;

    if (!sessionId) {
      return apiResponse(400, false, "Session ID is required");
    }

    // Get session details
    const sessionResult = await dynamodb.send(
      new GetCommand({
        TableName: "Sessions",
        Key: { sessionId },
      })
    );

    if (!sessionResult.Item) {
      return apiResponse(404, false, "Session not found");
    }

    const session = sessionResult.Item;

    // Check if session is still active and valid
    const now = new Date();
    const endTime = new Date(session.endTime);

    if (!session.isActive) {
      return apiResponse(400, false, "Session has been ended by teacher");
    }

    if (now > endTime) {
      return apiResponse(400, false, "Session has expired");
    }

    // Get class details for roll number validation
    const classResult = await dynamodb.send(
      new GetCommand({
        TableName: "Classes",
        Key: { classId: session.classId },
      })
    );

    if (!classResult.Item) {
      return apiResponse(404, false, "Class not found");
    }

    // Return session info needed for student attendance
    const sessionInfo = {
      sessionId: session.sessionId,
      sessionName: session.sessionName,
      subject: classResult.Item.subject,
      section: classResult.Item.section || "N/A",
      department: classResult.Item.department || "N/A",
      rollNumberRange: classResult.Item.rollNumberRange,
      validUntil: session.endTime,
      description: session.description,
      classId: session.classId,
    };

    return apiResponse(200, true, "Session information retrieved", sessionInfo);
  } catch (error) {
    console.error("Get session info error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
