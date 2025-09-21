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
      console.log("Backend not available, using fallback mode:", error.message);

      // Fallback: Return mock data
      return {
        success: true,
        classes: [
          {
            classId: "1",
            name: "Computer Science 101",
            subject: "Computer Science",
            rollNumberFrom: "2024279000",
            rollNumberTo: "2024279030",
            studentCount: 25,
            createdAt: "2024-01-15T00:00:00Z",
            hasActiveSession: true,
            activeSession: {
              sessionId: "session-1",
              topic: "Introduction to Programming",
              qrCode:
                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ3aGl0ZSIvPiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iYmxhY2siIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5EZW1vIFFSIENvZGU8L3RleHQ+PC9zdmc+",
              createdAt: "2024-09-21T10:00:00Z",
              isActive: true,
            },
          },
          {
            classId: "2",
            name: "Data Structures",
            subject: "Computer Science",
            rollNumberFrom: "2024279031",
            rollNumberTo: "2024279060",
            studentCount: 18,
            createdAt: "2024-01-20T00:00:00Z",
            hasActiveSession: false,
          },
          {
            classId: "3",
            name: "Web Development",
            subject: "Computer Science",
            rollNumberFrom: "2024279061",
            rollNumberTo: "2024279090",
            studentCount: 30,
            createdAt: "2024-02-01T00:00:00Z",
            hasActiveSession: false,
          },
        ],
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
