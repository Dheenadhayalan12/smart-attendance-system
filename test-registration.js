const axios = require("axios");

async function testRegistration() {
  try {
    console.log("Testing registration endpoint...");

    const response = await axios.post(
      "http://localhost:4566/auth/register",
      {
        name: "Test Teacher",
        email: "test@example.com",
        password: "password123",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Registration successful:", response.data);
  } catch (error) {
    console.error("❌ Registration failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error:", error.message);
    }
  }
}

testRegistration();
