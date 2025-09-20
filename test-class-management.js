// Test script for class management and sessions
const auth = require("./backend/handlers/auth");
const classes = require("./backend/handlers/classes");
const sessions = require("./backend/handlers/sessions");

async function testClassManagement() {
  console.log("🔧 Testing Class Management System...\n");

  // Step 1: Register a teacher
  console.log("1. Registering teacher...");
  const registerEvent = {
    httpMethod: "POST",
    path: "/auth/register",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Dr. Sarah Johnson",
      email: "sarah@university.edu",
      password: "securepass123",
      department: "Computer Science",
    }),
  };

  const registerResult = await auth.register(registerEvent);
  const registerData = JSON.parse(registerResult.body);

  if (!registerData.success) {
    console.log("❌ Registration failed:", registerData.message);
    return;
  }

  console.log("✅ Teacher registered:", registerData.data.name);
  const token = registerData.data.token;

  // Step 2: Create a class
  console.log("\n2. Creating a class...");
  const createClassEvent = {
    httpMethod: "POST",
    path: "/classes",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      subject: "Data Structures and Algorithms",
      description: "Advanced programming concepts",
      rollNumberRange: "21CS001-21CS060",
      department: "Computer Science",
    }),
  };

  const classResult = await classes.createClass(createClassEvent);
  const classData = JSON.parse(classResult.body);

  if (!classData.success) {
    console.log("❌ Class creation failed:", classData.message);
    return;
  }

  console.log("✅ Class created:", classData.data.subject);
  const classId = classData.data.classId;

  // Step 3: Get all classes
  console.log("\n3. Getting all classes...");
  const getClassesEvent = {
    httpMethod: "GET",
    path: "/classes",
    headers: { Authorization: `Bearer ${token}` },
  };

  const getClassesResult = await classes.getClasses(getClassesEvent);
  const getClassesData = JSON.parse(getClassesResult.body);

  if (getClassesData.success) {
    console.log("✅ Found", getClassesData.data.length, "classes");
  }

  // Step 4: Create a session with QR code
  console.log("\n4. Creating attendance session...");
  const createSessionEvent = {
    httpMethod: "POST",
    path: "/sessions",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      classId: classId,
      sessionName: "Lecture 1: Introduction to Arrays",
      duration: 60, // 60 minutes
      description: "Basic array operations and complexity analysis",
    }),
  };

  const sessionResult = await sessions.createSession(createSessionEvent);
  const sessionData = JSON.parse(sessionResult.body);

  if (!sessionData.success) {
    console.log("❌ Session creation failed:", sessionData.message);
    return;
  }

  console.log("✅ Session created:", sessionData.data.sessionName);
  console.log(
    "📱 QR Code generated (length):",
    sessionData.data.qrCode.length,
    "characters"
  );

  // Parse QR data to show what students will scan
  const qrData = JSON.parse(sessionData.data.qrData);
  console.log("🔍 QR Code contains:", {
    sessionId: qrData.sessionId.substring(0, 8) + "...",
    subject: qrData.subject,
    rollRange: qrData.rollRange,
    validUntil: new Date(qrData.validUntil).toLocaleString(),
  });

  console.log("\n🎉 Class Management System Test Completed Successfully!");
  console.log("\n📋 Summary:");
  console.log("- Teacher registration: ✅");
  console.log("- Class creation: ✅");
  console.log("- Class listing: ✅");
  console.log("- Session creation: ✅");
  console.log("- QR code generation: ✅");
}

// Run the test
testClassManagement().catch(console.error);
