// Simple test for our auth function
const auth = require("./backend/handlers/auth");

// Mock AWS Lambda event for teacher registration
const registerEvent = {
  httpMethod: "POST",
  path: "/auth/register",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "John Teacher",
    email: "john@school.com",
    password: "securepassword123",
  }),
};

// Mock context
const context = {};

console.log("Testing teacher registration...");
auth.register(registerEvent, context, (err, result) => {
  if (err) {
    console.error("Registration failed:", err);
  } else {
    console.log("Registration success:", result);
  }
});
