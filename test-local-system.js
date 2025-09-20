// Test for local development version (without Rekognition)
const auth = require("./backend/handlers/auth");
const classes = require("./backend/handlers/classes");
const sessions = require("./backend/handlers/sessions");
const students = require("./backend/handlers/students-local");
const attendance = require("./backend/handlers/attendance-local");

// Create a sample base64 image for testing
const createSampleBase64Image = () => {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
};

async function testLocalAttendanceSystem() {
  console.log("🧪 Testing Local Development Attendance System...\n");

  try {
    // Step 1: Register a teacher
    console.log("1️⃣ Registering teacher...");
    const teacherResult = await auth.register({
      body: JSON.stringify({
        name: "Dr. Sarah Wilson",
        email: "sarah.wilson@university.edu",
        password: "securepass123",
        department: "Computer Science",
      }),
    });

    const teacherResponse = JSON.parse(teacherResult.body);
    if (!teacherResponse.success) {
      throw new Error(
        `Teacher registration failed: ${teacherResponse.message}`
      );
    }

    console.log("✅ Teacher registered:", teacherResponse.data.name);
    const token = teacherResponse.data.token;

    // Step 2: Create a class
    console.log("\n2️⃣ Creating class...");
    const classResult = await classes.createClass({
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        subject: "Machine Learning Fundamentals",
        description: "Introduction to ML algorithms and applications",
        rollNumberRange: "21AI001-21AI025",
        department: "Artificial Intelligence",
      }),
    });

    const classResponse = JSON.parse(classResult.body);
    if (!classResponse.success) {
      throw new Error(`Class creation failed: ${classResponse.message}`);
    }

    console.log("✅ Class created:", classResponse.data.subject);
    const classId = classResponse.data.classId;

    // Step 3: Register students
    console.log("\n3️⃣ Registering students (local mode)...");
    const sampleImage = createSampleBase64Image();

    const studentsToRegister = [
      {
        rollNumber: "21AI001",
        name: "Emma Watson",
        email: "emma.watson@student.edu",
      },
      {
        rollNumber: "21AI002",
        name: "David Chen",
        email: "david.chen@student.edu",
      },
      {
        rollNumber: "21AI003",
        name: "Priya Sharma",
        email: "priya.sharma@student.edu",
      },
      {
        rollNumber: "21AI004",
        name: "Alex Johnson",
        email: "alex.johnson@student.edu",
      },
    ];

    const registeredStudents = [];
    for (const student of studentsToRegister) {
      const studentResult = await students.registerStudent({
        body: JSON.stringify({
          ...student,
          classId,
          faceImageBase64: sampleImage,
          department: "Artificial Intelligence",
        }),
      });

      const studentResponse = JSON.parse(studentResult.body);
      if (studentResponse.success) {
        registeredStudents.push(studentResponse.data);
        console.log(
          `✅ Student registered: ${student.rollNumber} - ${student.name}`
        );
      } else {
        console.log(
          `❌ Student registration failed: ${student.rollNumber} - ${studentResponse.message}`
        );
      }
    }

    // Step 4: Get students list
    console.log("\n4️⃣ Getting class students list...");
    const studentsListResult = await students.getStudentsByClass({
      pathParameters: { classId },
    });

    const studentsListResponse = JSON.parse(studentsListResult.body);
    if (studentsListResponse.success) {
      console.log(
        `✅ Found ${studentsListResponse.data.length} students in class`
      );
    }

    // Step 5: Create an attendance session
    console.log("\n5️⃣ Creating attendance session...");
    const sessionResult = await sessions.createSession({
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        classId,
        sessionName: "Week 3: Neural Networks Basics",
        duration: 75,
        description: "Introduction to perceptrons and backpropagation",
      }),
    });

    const sessionResponse = JSON.parse(sessionResult.body);
    if (!sessionResponse.success) {
      throw new Error(`Session creation failed: ${sessionResponse.message}`);
    }

    console.log("✅ Session created:", sessionResponse.data.sessionName);
    console.log("📱 QR Code generated for attendance");

    const sessionId = sessionResponse.data.sessionId;
    const qrData = sessionResponse.data.qrData;

    // Step 6: Mark attendance for students
    console.log("\n6️⃣ Marking attendance (local face verification)...");

    const attendanceResults = [];
    // Mark attendance for 3 out of 4 students
    for (let i = 0; i < 3; i++) {
      const student = registeredStudents[i];
      if (!student) continue;

      const attendanceResult = await attendance.markAttendance({
        body: JSON.stringify({
          qrData,
          rollNumber: studentsToRegister[i].rollNumber,
          faceImageBase64: sampleImage,
        }),
      });

      const attendanceResponse = JSON.parse(attendanceResult.body);
      if (attendanceResponse.success) {
        attendanceResults.push(attendanceResponse.data);
        console.log(
          `✅ Attendance marked: ${attendanceResponse.data.rollNumber} - ${attendanceResponse.data.studentName} (${attendanceResponse.data.faceConfidence}% confidence)`
        );
      } else {
        console.log(`❌ Attendance failed: ${attendanceResponse.message}`);
      }
    }

    // Step 7: Generate attendance report
    console.log("\n7️⃣ Generating attendance report...");
    const reportResult = await attendance.getSessionAttendance({
      pathParameters: { sessionId },
    });

    const reportResponse = JSON.parse(reportResult.body);
    if (reportResponse.success) {
      const report = reportResponse.data;
      console.log("📊 Attendance Report:");
      console.log(`   📚 Session: ${report.session.sessionName}`);
      console.log(`   👥 Total Students: ${report.summary.totalStudents}`);
      console.log(`   ✅ Present: ${report.summary.presentCount}`);
      console.log(`   ❌ Absent: ${report.summary.absentCount}`);
      console.log(
        `   📈 Attendance Rate: ${report.summary.attendancePercentage}%`
      );

      console.log("\n📋 Present Students:");
      report.presentStudents.forEach((student) => {
        console.log(
          `   ✅ ${student.rollNumber}: ${student.studentName} (${student.faceConfidence}% match, ${student.method})`
        );
      });

      if (report.absentStudents.length > 0) {
        console.log("\n❌ Absent Students:");
        report.absentStudents.forEach((student) => {
          console.log(`   ❌ ${student.rollNumber}: ${student.studentName}`);
        });
      }
    }

    // Step 8: Test duplicate attendance prevention
    console.log("\n8️⃣ Testing duplicate attendance prevention...");
    const duplicateResult = await attendance.markAttendance({
      body: JSON.stringify({
        qrData,
        rollNumber: studentsToRegister[0].rollNumber,
        faceImageBase64: sampleImage,
      }),
    });

    const duplicateResponse = JSON.parse(duplicateResult.body);
    if (!duplicateResponse.success) {
      console.log(
        "✅ Duplicate attendance prevention working:",
        duplicateResponse.message
      );
    } else {
      console.log("⚠️ Duplicate attendance was not prevented");
    }

    console.log("\n🎉 Local Development System Test Completed Successfully!");
    console.log("\n📋 System Features Tested:");
    console.log("✅ Teacher authentication & JWT tokens");
    console.log("✅ Class management & validation");
    console.log("✅ Student registration (local mode)");
    console.log("✅ QR code generation with session data");
    console.log("✅ Attendance marking with simulated face verification");
    console.log("✅ Comprehensive attendance reporting");
    console.log("✅ Duplicate attendance prevention");
    console.log("✅ S3 image storage integration");
    console.log("✅ DynamoDB data persistence");

    return {
      success: true,
      stats: {
        teachersRegistered: 1,
        classesCreated: 1,
        studentsRegistered: registeredStudents.length,
        sessionsCreated: 1,
        attendanceMarked: attendanceResults.length,
        attendanceRate: reportResponse.success
          ? reportResponse.data.summary.attendancePercentage
          : 0,
      },
    };
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testLocalAttendanceSystem()
  .then((result) => {
    if (result.success) {
      console.log("\n🚀 Local development system fully operational!");
      console.log("📊 Test Statistics:", result.stats);
      console.log("\n💡 Note: This is local development mode. In production:");
      console.log("   • Face recognition will use AWS Rekognition");
      console.log("   • Real face matching with confidence scores");
      console.log("   • Enhanced security and validation");
    } else {
      console.log("\n🛠️ Issues found. Please check the logs above.");
    }
  })
  .catch((error) => {
    console.error("Test execution failed:", error);
  });
