const {
  PutCommand,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");

const { dynamodb } = require("../../utils/aws/clients");
const { verifyToken } = require("../../utils/helpers/jwt-helper");
const { apiResponse } = require("../../utils/helpers/api-response");
const {
  calculateExpectedStudents,
} = require("../../utils/helpers/session-helpers");

exports.handler = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return apiResponse(401, false, "No token provided");
    }

    const decoded = verifyToken(token);
    const { classId, sessionName, duration, description } = JSON.parse(
      event.body
    );

    // Validate input
    if (!classId || !sessionName || !duration) {
      return apiResponse(
        400,
        false,
        "Class ID, session name, and duration are required"
      );
    }

    // Verify the class exists and belongs to this teacher
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

    const sessionId = uuidv4();
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000); // duration in minutes

    // Create attendance URL for QR code (students will scan this)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const attendanceUrl = `${frontendUrl}/attendance?sessionId=${sessionId}`;

    // Store session metadata (for backend validation)
    const qrData = {
      sessionId,
      classId,
      subject: classResult.Item.subject,
      teacherId: decoded.teacherId,
      rollRange: classResult.Item.rollNumberRange,
      validUntil: endTime.toISOString(),
    };

    // Generate QR code with web URL (not JSON data)
    const qrCodeDataURL = await QRCode.toDataURL(attendanceUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    const sessionData = {
      sessionId,
      classId,
      teacherId: decoded.teacherId,
      sessionName,
      description: description || null,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration, // in minutes
      qrCode: qrCodeDataURL,
      qrData: JSON.stringify(qrData),
      attendanceUrl: attendanceUrl,
      isActive: true,
      createdAt: new Date().toISOString(),
      attendanceCount: 0,
      expectedStudents: classResult.Item.rollNumberRange
        ? calculateExpectedStudents(classResult.Item.rollNumberRange)
        : 0,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: "Sessions",
        Item: sessionData,
      })
    );

    // Update class total sessions count
    await dynamodb.send(
      new UpdateCommand({
        TableName: "Classes",
        Key: { classId },
        UpdateExpression: "SET totalSessions = totalSessions + :inc",
        ExpressionAttributeValues: {
          ":inc": 1,
        },
      })
    );

    return apiResponse(201, true, "Session created successfully", sessionData);
  } catch (error) {
    console.error("Create session error:", error);
    return apiResponse(
      500,
      false,
      "Internal server error",
      null,
      error.message
    );
  }
};
