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
        throw new Error("Backend not available, using fallback");
      }

      const result = await response.json();
      console.log("Backend session created successfully:", result);
      return result;
    } catch (error) {
      console.log("Backend not available, using fallback mode:", error.message);

      // Fallback: Generate session locally
      return await this.createSessionFallback(classId, sessionData);
    }
  }

  // Fallback session creation when backend is not available
  async createSessionFallback(classId, sessionData) {
    const sessionId = `session-${Date.now()}`;
    const expiryTimeMs = parseInt(sessionData.expiryTime) * 60 * 1000;
    const expiryDate = new Date(Date.now() + expiryTimeMs);

    // QR code data that will be scanned by students
    const qrData = {
      sessionId: sessionId,
      classId: classId,
      topic: sessionData.topic,
      expiryTime: expiryDate.toISOString(),
      attendanceUrl: `${window.location.origin}/attendance/${sessionId}`,
    };

    // Generate QR code image
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return {
      success: true,
      session: {
        sessionId: sessionId,
        sessionName: sessionData.topic,
        startTime: new Date().toISOString(),
        endTime: expiryDate.toISOString(),
        qrCode: qrCodeDataURL,
        isActive: true,
      },
    };
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
      return result;
    } catch (error) {
      console.log("Backend not available, using fallback mode:", error.message);

      // Fallback: Return class-specific mock data
      return this.getClassSpecificMockSessions(classId);
    }
  }

  // Generate class-specific mock session data
  getClassSpecificMockSessions(classId) {
    const classMockData = {
      1: [
        {
          sessionId: `session-${classId}-1`,
          sessionName: "Introduction to Data Structures",
          startTime: "2024-09-20T10:00:00Z",
          endTime: "2024-09-20T11:30:00Z",
          attendanceCount: 25,
          isActive: false,
        },
        {
          sessionId: `session-${classId}-2`,
          sessionName: "Arrays and Linked Lists",
          startTime: "2024-09-21T10:00:00Z",
          endTime: null,
          attendanceCount: 22,
          isActive: true,
        },
      ],
      2: [
        {
          sessionId: `session-${classId}-1`,
          sessionName: "Machine Learning Basics",
          startTime: "2024-09-19T14:00:00Z",
          endTime: "2024-09-19T15:30:00Z",
          attendanceCount: 30,
          isActive: false,
        },
      ],
      3: [
        {
          sessionId: `session-${classId}-1`,
          sessionName: "Web Development Fundamentals",
          startTime: "2024-09-18T09:00:00Z",
          endTime: "2024-09-18T10:30:00Z",
          attendanceCount: 20,
          isActive: false,
        },
        {
          sessionId: `session-${classId}-2`,
          sessionName: "React Components",
          startTime: "2024-09-21T09:00:00Z",
          endTime: null,
          attendanceCount: 18,
          isActive: true,
        },
      ],
    };

    return {
      success: true,
      sessions: classMockData[classId] || [],
    };
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
          method: "PUT",
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
