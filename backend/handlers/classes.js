const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

// Configure DynamoDB client for LocalStack
const dynamoClient = new DynamoDBClient({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Create a new class
module.exports.createClass = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "No token provided" }),
      };
    }

    const decoded = verifyToken(token);
    const { subject, description, rollNumberRange, department } = JSON.parse(
      event.body
    );

    // Validate input
    if (!subject || !rollNumberRange) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Subject and roll number range are required",
        }),
      };
    }

    const classId = uuidv4();
    const classData = {
      classId,
      teacherId: decoded.teacherId,
      teacherName: decoded.name,
      subject,
      description: description || null,
      rollNumberRange, // e.g., "21CS001-21CS060"
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

    return {
      statusCode: 201,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Class created successfully",
        data: classData,
      }),
    };
  } catch (error) {
    console.error("Create class error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};

// Get all classes for a teacher
module.exports.getClasses = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "No token provided" }),
      };
    }

    const decoded = verifyToken(token);

    // Get all classes for this teacher
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: "Classes",
        FilterExpression: "teacherId = :teacherId",
        ExpressionAttributeValues: {
          ":teacherId": decoded.teacherId,
        },
      })
    );

    // For each class, check if it has an active session
    const classesWithSessions = await Promise.all(
      (result.Items || []).map(async (classItem) => {
        try {
          // Check for active sessions
          const sessionsResult = await dynamodb.send(
            new ScanCommand({
              TableName: "Sessions",
              FilterExpression: "classId = :classId AND isActive = :isActive",
              ExpressionAttributeValues: {
                ":classId": classItem.classId,
                ":isActive": true,
              },
            })
          );

          const activeSessions = sessionsResult.Items || [];
          const hasActiveSession = activeSessions.length > 0;
          const activeSession = hasActiveSession ? activeSessions[0] : null;

          return {
            ...classItem,
            hasActiveSession,
            activeSession: activeSession
              ? {
                  sessionId: activeSession.sessionId,
                  sessionName: activeSession.sessionName,
                  startTime: activeSession.startTime,
                  endTime: activeSession.endTime,
                  qrCode: activeSession.qrCode,
                  isActive: activeSession.isActive,
                }
              : null,
          };
        } catch (error) {
          console.error(
            "Error checking sessions for class:",
            classItem.classId,
            error
          );
          return {
            ...classItem,
            hasActiveSession: false,
            activeSession: null,
          };
        }
      })
    );

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        data: classesWithSessions,
      }),
    };
  } catch (error) {
    console.error("Get classes error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    };
  }
};

// Get a specific class by ID
module.exports.getClass = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "No token provided" }),
      };
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
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Class not found",
        }),
      };
    }

    // Check if this teacher owns the class
    if (result.Item.teacherId !== decoded.teacherId) {
      return {
        statusCode: 403,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Access denied",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        data: result.Item,
      }),
    };
  } catch (error) {
    console.error("Get class error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    };
  }
};

// Update a class
module.exports.updateClass = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "No token provided" }),
      };
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
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Class not found",
        }),
      };
    }

    if (classResult.Item.teacherId !== decoded.teacherId) {
      return {
        statusCode: 403,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Access denied",
        }),
      };
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

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Class updated successfully",
        data: updatedResult.Item,
      }),
    };
  } catch (error) {
    console.error("Update class error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    };
  }
};

// Delete a class
module.exports.deleteClass = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "No token provided" }),
      };
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
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Class not found",
        }),
      };
    }

    if (classResult.Item.teacherId !== decoded.teacherId) {
      return {
        statusCode: 403,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: false,
          message: "Access denied",
        }),
      };
    }

    await dynamodb.send(
      new DeleteCommand({
        TableName: "Classes",
        Key: { classId },
      })
    );

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Class deleted successfully",
      }),
    };
  } catch (error) {
    console.error("Delete class error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    };
  }
};

// Get teacher statistics for dashboard
module.exports.getTeacherStatistics = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "No token provided" }),
      };
    }

    const decoded = verifyToken(token);

    // Get all classes for this teacher
    const classesResult = await dynamodb.send(
      new ScanCommand({
        TableName: "Classes",
        FilterExpression: "teacherId = :teacherId",
        ExpressionAttributeValues: {
          ":teacherId": decoded.teacherId,
        },
      })
    );

    const classes = classesResult.Items || [];
    const totalClasses = classes.length;

    // Get all sessions for this teacher
    const sessionsResult = await dynamodb.send(
      new ScanCommand({
        TableName: "Sessions",
        FilterExpression: "teacherId = :teacherId",
        ExpressionAttributeValues: {
          ":teacherId": decoded.teacherId,
        },
      })
    );

    const sessions = sessionsResult.Items || [];
    const totalSessions = sessions.length;

    // Calculate total students from all classes
    let totalStudents = 0;
    classes.forEach((cls) => {
      if (cls.rollNumberRange) {
        const [from, to] = cls.rollNumberRange.split("-");
        if (from && to) {
          // Extract numbers from roll numbers (e.g., "21CS001" -> 1, "21CS060" -> 60)
          const fromNum = parseInt(from.replace(/\D/g, ""));
          const toNum = parseInt(to.replace(/\D/g, ""));
          if (!isNaN(fromNum) && !isNaN(toNum)) {
            totalStudents += toNum - fromNum + 1;
          }
        }
      }
    });

    // Calculate average attendance rate from sessions
    let totalAttendanceRate = 0;
    let sessionsWithAttendance = 0;
    sessions.forEach((session) => {
      if (session.attendanceCount && session.expectedStudents) {
        totalAttendanceRate +=
          (session.attendanceCount / session.expectedStudents) * 100;
        sessionsWithAttendance++;
      }
    });

    const averageAttendanceRate =
      sessionsWithAttendance > 0
        ? Math.round((totalAttendanceRate / sessionsWithAttendance) * 10) / 10
        : 0;

    const statistics = {
      totalClasses,
      totalStudents,
      totalSessions,
      averageAttendanceRate,
      recentActivity: [],
      classPerformance: [],
    };

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        statistics,
      }),
    };
  } catch (error) {
    console.error("Get teacher statistics error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};

// Get analytics for a specific class
module.exports.getClassAnalytics = async (event) => {
  try {
    // Verify authentication
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "No token provided" }),
      };
    }

    const decoded = verifyToken(token);
    const classId = event.pathParameters.classId;

    // Get class details
    const classResult = await dynamodb.send(
      new GetCommand({
        TableName: "Classes",
        Key: { classId },
      })
    );

    const classData = classResult.Item;
    if (!classData) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "Class not found" }),
      };
    }

    // Verify teacher owns this class
    if (classData.teacherId !== decoded.teacherId) {
      return {
        statusCode: 403,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ success: false, message: "Access denied" }),
      };
    }

    // Get all sessions for this class
    const sessionsResult = await dynamodb.send(
      new ScanCommand({
        TableName: "Sessions",
        FilterExpression: "classId = :classId",
        ExpressionAttributeValues: {
          ":classId": classId,
        },
      })
    );

    const sessions = sessionsResult.Items || [];
    const totalSessions = sessions.length;

    // Calculate total students from class roll number range
    let totalStudents = 0;
    if (classData.rollNumberRange) {
      const [from, to] = classData.rollNumberRange.split("-");
      if (from && to) {
        const fromNum = parseInt(from.replace(/\D/g, ""));
        const toNum = parseInt(to.replace(/\D/g, ""));
        if (!isNaN(fromNum) && !isNaN(toNum)) {
          totalStudents = toNum - fromNum + 1;
        }
      }
    }

    // Calculate attendance statistics
    let totalAttendanceRate = 0;
    let sessionsWithAttendance = 0;
    const attendanceTrend = [];

    sessions.forEach((session) => {
      if (session.attendanceCount !== undefined && session.expectedStudents) {
        const rate = (session.attendanceCount / session.expectedStudents) * 100;
        totalAttendanceRate += rate;
        sessionsWithAttendance++;

        // Add to trend data
        attendanceTrend.push({
          date: session.startTime,
          percentage: Math.round(rate),
          present: session.attendanceCount,
          total: session.expectedStudents,
        });
      }
    });

    // Sort trend by date
    attendanceTrend.sort((a, b) => new Date(a.date) - new Date(b.date));

    const averageAttendance =
      sessionsWithAttendance > 0
        ? Math.round((totalAttendanceRate / sessionsWithAttendance) * 10) / 10
        : 0;

    // Calculate trend (comparing last few sessions)
    let trend = "neutral";
    let trendPercentage = 0;
    if (attendanceTrend.length >= 2) {
      const recent = attendanceTrend.slice(-3); // Last 3 sessions
      const earlier = attendanceTrend.slice(-6, -3); // Previous 3 sessions

      if (recent.length > 0 && earlier.length > 0) {
        const recentAvg =
          recent.reduce((sum, item) => sum + item.percentage, 0) /
          recent.length;
        const earlierAvg =
          earlier.reduce((sum, item) => sum + item.percentage, 0) /
          earlier.length;
        const diff = recentAvg - earlierAvg;

        if (Math.abs(diff) > 2) {
          // Only consider significant changes
          trend = diff > 0 ? "up" : "down";
          trendPercentage = Math.round(Math.abs(diff) * 10) / 10;
        }
      }
    }

    // Get session details for reports
    const sessionDetails = sessions.map((session) => ({
      sessionId: session.sessionId,
      sessionName: session.sessionName,
      date: session.startTime,
      status: session.isActive ? "active" : "completed",
      attendanceCount: session.attendanceCount || 0,
      expectedStudents: session.expectedStudents || 0,
      attendanceRate: session.expectedStudents
        ? Math.round((session.attendanceCount / session.expectedStudents) * 100)
        : 0,
    }));

    const analytics = {
      totalStudents,
      totalSessions,
      averageAttendance,
      trend,
      trendPercentage,
      attendanceTrend: attendanceTrend.slice(-10), // Last 10 sessions for trend
      sessionDetails: sessionDetails.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ),
    };

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        analytics,
      }),
    };
  } catch (error) {
    console.error("Get class analytics error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};
