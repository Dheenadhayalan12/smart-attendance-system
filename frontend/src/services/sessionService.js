import { authService } from "./authService";
import QRCode from "qrcode";

const API_BASE_URL = "http://localhost:3000/local";

class SessionService {
  // Create a new session
  async createSession(classId, sessionData) {
    try {
      const token = authService.getToken();

      console.log("Creating session with data:", { classId, sessionData });
      console.log("Using token:", token ? "Token present" : "No token");

      // Try backend API first
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classId,
          sessionName: sessionData.topic,
          duration: parseInt(sessionData.expiryTime),
          description: `Session: ${sessionData.topic}`,
        }),
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Backend error:", errorText);
        throw new Error("Backend not available");
      }

      const result = await response.json();
      console.log("Backend session created successfully:", result);
      return result;
    } catch (error) {
      console.log("Backend not available:", error.message);

      // Return error response when backend is not available
      return {
        success: false,
        error: "Backend not available",
        message: "Cannot create session without backend connection",
      };
    }
  }

  // Get sessions for a specific class
  async getSessionsByClass(classId) {
    try {
      const token = authService.getToken();

      console.log("Fetching sessions for class:", classId);
      console.log("Using token:", token ? "Token present" : "No token");

      const response = await fetch(
        `${API_BASE_URL}/classes/${classId}/sessions`,
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
        throw new Error("Backend not available");
      }

      const result = await response.json();
      console.log("Backend sessions fetched successfully:", result);

      // Transform backend response to match frontend expectations
      if (result.success && Array.isArray(result.data)) {
        return {
          success: true,
          sessions: result.data,
        };
      }

      return result;
    } catch (error) {
      console.log("Backend not available:", error.message);

      // Return empty sessions when backend is not available
      return {
        success: false,
        error: "Backend not available",
        sessions: [],
      };
    }
  }

  // Get a specific session
  async getSession(sessionId) {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch session");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching session:", error);
      throw error;
    }
  }

  // End a session
  async endSession(sessionId) {
    try {
      const token = authService.getToken();
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionId}/end`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to end session");
      }

      return await response.json();
    } catch (error) {
      console.error("Error ending session:", error);
      throw error;
    }
  }

  // Get session attendance
  async getSessionAttendance(sessionId) {
    try {
      const token = authService.getToken();
      const response = await fetch(
        `${API_BASE_URL}/sessions/${sessionId}/attendance`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch attendance");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching attendance:", error);
      throw error;
    }
  }
}

export const sessionService = new SessionService();
