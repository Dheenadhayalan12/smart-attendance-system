import { authService } from "./authService";

const API_BASE_URL = "http://localhost:3000/local";

class ClassService {
  // Get all classes for the authenticated teacher
  async getClasses() {
    try {
      const token = authService.getToken();

      console.log("Fetching classes from backend");
      console.log("Using token:", token ? "Token present" : "No token");

      const response = await fetch(`${API_BASE_URL}/classes`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Backend error:", errorText);
        throw new Error("Backend not available, using fallback");
      }

      const result = await response.json();
      console.log("Backend classes fetched successfully:", result);
      return result;
    } catch (error) {
      console.log("Backend not available:", error.message);

      // Return empty result when backend is not available
      return {
        success: false,
        error: "Backend not available",
        data: [],
      };
    }
  }

  // Create a new class
  async createClass(classData) {
    try {
      const token = authService.getToken();

      console.log("Creating class with data:", classData);
      console.log("Using token:", token ? "Token present" : "No token");

      const response = await fetch(`${API_BASE_URL}/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: classData.name,
          subject: classData.subject,
          rollNumberRange: `${classData.rollNumberFrom}-${classData.rollNumberTo}`,
          rollNumberFrom: classData.rollNumberFrom,
          rollNumberTo: classData.rollNumberTo,
        }),
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Backend error:", errorText);
        throw new Error("Failed to create class");
      }

      const result = await response.json();
      console.log("Backend class created successfully:", result);
      return result;
    } catch (error) {
      console.error("Error creating class:", error);
      throw error;
    }
  }

  // Update a class
  async updateClass(classId, classData) {
    try {
      const token = authService.getToken();

      const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: classData.name,
          subject: classData.subject,
          rollNumberRange: `${classData.rollNumberFrom}-${classData.rollNumberTo}`,
          rollNumberFrom: classData.rollNumberFrom,
          rollNumberTo: classData.rollNumberTo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update class");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating class:", error);
      throw error;
    }
  }

  // Delete a class
  async deleteClass(classId) {
    try {
      const token = authService.getToken();

      const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete class");
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting class:", error);
      throw error;
    }
  }
}

export const classService = new ClassService();
