import { authService } from "./authService";

const API_BASE_URL = "http://localhost:3000/local";

class StudentService {
  // Register a new student
  async registerStudent(studentData) {
    try {
      const token = authService.getToken();

      console.log("Registering student with data:", studentData);
      console.log("Using token:", token ? "Token present" : "No token");

      const response = await fetch(`${API_BASE_URL}/students/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(studentData),
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Backend error:", errorText);
        throw new Error("Failed to register student");
      }

      const result = await response.json();
      console.log("Backend student registered successfully:", result);
      return result;
    } catch (error) {
      console.error("Error registering student:", error);
      throw error;
    }
  }

  // Get students by class
  async getStudentsByClass(classId) {
    try {
      const token = authService.getToken();

      console.log("Fetching students for class:", classId);
      console.log("Using token:", token ? "Token present" : "No token");

      const response = await fetch(
        `${API_BASE_URL}/classes/${classId}/students`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Backend error:", errorText);
        throw new Error("Backend not available, using fallback");
      }

      const result = await response.json();
      console.log("Backend students fetched successfully:", result);
      return result;
    } catch (error) {
      console.log("Backend not available:", error.message);

      // Return empty result when backend is not available
      return {
        success: false,
        error: "Backend not available",
        students: [],
      };
    }
  } // Get specific student
  async getStudent(studentId) {
    try {
      const token = authService.getToken();

      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch student");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching student:", error);
      throw error;
    }
  }

  // Get student attendance
  async getStudentAttendance(studentId) {
    try {
      const token = authService.getToken();

      const response = await fetch(
        `${API_BASE_URL}/students/${studentId}/attendance`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch student attendance");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      throw error;
    }
  }
}

export const studentService = new StudentService();
