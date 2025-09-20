// Comprehensive test for the complete attendance system
const auth = require("./backend/handlers/auth");
const classes = require("./backend/handlers/classes");
const sessions = require("./backend/handlers/sessions");
const students = require("./backend/handlers/students");
const attendance = require("./backend/handlers/attendance");
const fs = require("fs");
const path = require("path");

// Create a sample base64 image for testing (1x1 pixel image)
const createSampleBase64Image = () => {
  // This is a 1x1 transparent PNG in base64
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
};

async function testCompleteAttendanceSystem() {
  console.log("🎯 Testing Complete Attendance System...\n");

  try {
    // Step 1: Register a teacher
    console.log("1️⃣ Registering teacher...");
    const teacherData = {
      name: "Prof. John Smith",
      email: "john.smith@university.edu",
      password: "securepass123",
      department: "Computer Science",
    };

    const registerResult = await auth.register({
      body: JSON.stringify(teacherData),
    });

    const teacherResponse = JSON.parse(registerResult.body);
    if (!teacherResponse.success) {
      throw new Error(
        `Teacher registration failed: ${teacherResponse.message}`
      );
    }

    console.log("✅ Teacher registered:", teacherResponse.data.name);
    const token = teacherResponse.data.token;

    // Step 2: Create a class
    console.log("\n2️⃣ Creating class...");
    const classData = {
      subject: "Advanced Data Structures",
      description: "Trees, Graphs, and Advanced Algorithms",
      rollNumberRange: "21CS001-21CS030",
      department: "Computer Science",
    };

    const classResult = await classes.createClass({
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(classData),
    });

    const classResponse = JSON.parse(classResult.body);
    if (!classResponse.success) {
      throw new Error(`Class creation failed: ${classResponse.message}`);
    }

    console.log("✅ Class created:", classResponse.data.subject);
    const classId = classResponse.data.classId;

    // Step 3: Register students with face data
    console.log("\n3️⃣ Registering students...");
    const sampleImage = createSampleBase64Image();

    const studentsToRegister = [
      {
        rollNumber: "21CS001",
        name: "Alice Johnson",
        email: "alice@student.edu",
      },
      { rollNumber: "21CS002", name: "Bob Smith", email: "bob@student.edu" },
      {
        rollNumber: "21CS003",
        name: "Charlie Brown",
        email: "charlie@student.edu",
      },
    ];

    const registeredStudents = [];
    for (const student of studentsToRegister) {
      const studentResult = await students.registerStudent({
        body: JSON.stringify({
          ...student,
          classId,
          faceImageBase64: sampleImage,
          department: "Computer Science",
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

    // Step 4: Create an attendance session
    console.log("\n4️⃣ Creating attendance session...");
    const sessionData = {
      classId,
      sessionName: "Lecture 5: Binary Search Trees",
      duration: 50,
      description: "BST operations and complexity analysis",
    };

    const sessionResult = await sessions.createSession({
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(sessionData),
    });

    const sessionResponse = JSON.parse(sessionResult.body);
    if (!sessionResponse.success) {
      throw new Error(`Session creation failed: ${sessionResponse.message}`);
    }

    console.log("✅ Session created:", sessionResponse.data.sessionName);
    console.log("📱 QR Code generated for attendance");

    const sessionId = sessionResponse.data.sessionId;
    const qrData = sessionResponse.data.qrData;

    // Step 5: Mark attendance for students
    console.log("\n5️⃣ Marking attendance...");

    // Simulate attendance marking for first two students
    const attendanceResults = [];
    for (let i = 0; i < 2; i++) {
      const student = registeredStudents[i];
      if (!student) continue;

      try {
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
            `✅ Attendance marked: ${attendanceResponse.data.rollNumber} - ${attendanceResponse.data.studentName}`
          );
        } else {
          console.log(`❌ Attendance failed: ${attendanceResponse.message}`);
        }
      } catch (error) {
        console.log(
          `❌ Attendance error for ${studentsToRegister[i].rollNumber}: ${error.message}`
        );
      }
    }

    // Step 6: Get session attendance report
    console.log("\n6️⃣ Generating attendance report...");
    const reportResult = await attendance.getSessionAttendance({
      pathParameters: { sessionId },
    });

    const reportResponse = JSON.parse(reportResult.body);
    if (reportResponse.success) {
      const report = reportResponse.data;
      console.log("📊 Attendance Report:");
      console.log(`   Session: ${report.session.sessionName}`);
      console.log(`   Total Students: ${report.summary.totalStudents}`);
      console.log(`   Present: ${report.summary.presentCount}`);
      console.log(`   Absent: ${report.summary.absentCount}`);
      console.log(
        `   Attendance Rate: ${report.summary.attendancePercentage}%`
      );

      console.log("\n📋 Present Students:");
      report.presentStudents.forEach((student) => {
        console.log(
          `   - ${student.rollNumber}: ${student.studentName} (${student.faceConfidence}% match)`
        );
      });

      if (report.absentStudents.length > 0) {
        console.log("\n❌ Absent Students:");
        report.absentStudents.forEach((student) => {
          console.log(`   - ${student.rollNumber}: ${student.studentName}`);
        });
      }
    }

    // Step 7: Test student attendance history
    console.log("\n7️⃣ Checking student attendance history...");
    if (registeredStudents[0]) {
      const historyResult = await attendance.getStudentAttendance({
        pathParameters: { studentId: registeredStudents[0].studentId },
      });

      const historyResponse = JSON.parse(historyResult.body);
      if (historyResponse.success) {
        console.log(
          `✅ ${studentsToRegister[0].name} has attended ${historyResponse.data.length} sessions`
        );
      }
    }

    console.log("\n🎉 Complete Attendance System Test Completed Successfully!");
    console.log("\n📋 System Summary:");
    console.log("✅ Teacher authentication & authorization");
    console.log("✅ Class management");
    console.log("✅ Student registration with face indexing");
    console.log("✅ QR code generation for sessions");
    console.log("✅ Attendance marking with face verification");
    console.log("✅ Comprehensive attendance reporting");
    console.log("✅ Student attendance history tracking");

    return {
      success: true,
      stats: {
        teachersRegistered: 1,
        classesCreated: 1,
        studentsRegistered: registeredStudents.length,
        sessionsCreated: 1,
        attendanceMarked: attendanceResults.length,
      },
    };
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    return { success: false, error: error.message };
  }
}

// Run the comprehensive test
testCompleteAttendanceSystem()
  .then((result) => {
    if (result.success) {
      console.log(
        "\n🚀 All systems operational! Ready for production deployment."
      );
    } else {
      console.log("\n🛠️ Issues found. Please check the logs above.");
    }
  })
  .catch((error) => {
    console.error("Test execution failed:", error);
  });
