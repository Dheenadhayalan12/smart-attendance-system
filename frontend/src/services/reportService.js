import { authService } from "./authService";

const API_BASE_URL = "http://localhost:3000/local";

class ReportService {
  // Get attendance analytics
  async getAttendanceAnalytics(classId, startDate, endDate) {
    try {
      const token = authService.getToken();

      console.log("Fetching attendance analytics for class:", classId);
      console.log("Date range:", startDate, "to", endDate);

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(
        `${API_BASE_URL}/classes/${classId}/attendance/analytics?${params}`,
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
      console.log("Backend analytics fetched successfully:", result);
      return result;
    } catch (error) {
      console.log("Backend not available:", error.message);

      // Return empty analytics when backend is not available
      return {
        success: false,
        error: "Backend not available",
        analytics: {
          totalStudents: 0,
          totalSessions: 0,
          averageAttendance: 0,
          attendanceTrend: [],
          topAttenders: [],
          lowAttenders: [],
        },
      };
    }
  }

  // Get class attendance report
  async getClassAttendanceReport(classId, format = "json") {
    try {
      const token = authService.getToken();

      console.log(
        "Generating attendance report for class:",
        classId,
        "format:",
        format
      );

      const response = await fetch(
        `${API_BASE_URL}/classes/${classId}/reports/attendance?format=${format}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Backend not available");
      }

      if (format === "csv") {
        return await response.text();
      }

      return await response.json();
    } catch (error) {
      console.log("Backend not available:", error.message);

      return {
        success: false,
        error: "Backend not available",
        report: null,
      };
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
        throw new Error("Failed to fetch session attendance");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching session attendance:", error);
      throw error;
    }
  }

  // Get overall statistics for teacher
  async getTeacherStatistics() {
    try {
      const token = authService.getToken();

      console.log("Fetching teacher statistics");

      const response = await fetch(`${API_BASE_URL}/teachers/statistics`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Backend error:", errorText);
        throw new Error("Backend not available");
      }

      const result = await response.json();
      console.log("Backend statistics fetched successfully:", result);
      return result;
    } catch (error) {
      console.log("Backend not available:", error.message);

      // Return empty statistics when backend is not available
      return {
        success: false,
        error: "Backend not available",
        statistics: {
          totalClasses: 0,
          totalStudents: 0,
          totalSessions: 0,
          averageAttendanceRate: 0,
          recentActivity: [],
          classPerformance: [],
        },
      };
    }
  }
}

export const reportService = new ReportService();
