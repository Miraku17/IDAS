import { useEffect } from "react";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("students.db");

export type Attendance = {
  id: number;
  student_id: number;
  session: string; // Morning, Lunch, After Lunch, Dismissal
  date: string;
  time: string;
  status: string;
  name?: string; // joined from students table
  code?: string; // student code e.g. 12-REYES-2025-001
};

export type TodayStats = {
  totalMales: number;
  totalFemales: number;
  presentMales: number;
  presentFemales: number;
  absentMales: number;
  absentFemales: number;
  totalPresent: number;
  totalAbsent: number;
};

export function useAttendanceDb() {
  // Create attendance table on first load
  useEffect(() => {
    (async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          session TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          status TEXT DEFAULT 'present',
          FOREIGN KEY (student_id) REFERENCES students(id)
        );
      `);
    })();
  }, []);

// ✅ Mark attendance with duplicate check (snake_case sessions in DB)
const markAttendance = async (studentId: number, session: string) => {
    try {
      const now = new Date();
      const date = now.toLocaleDateString("en-CA"); // YYYY-MM-DD
      const time = now.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
  
      // 🔑 Normalize session into snake_case for DB storage
      const sessionMap: Record<string, string> = {
        morning: "morning",
        lunch: "lunch",
        lunch_dismissal: "lunch_dismissal", // if you want to keep this distinct
        after_lunch: "after_lunch",
        dismissal: "dismissal",
      };
  
      const normalizedSession =
        sessionMap[session.toLowerCase().replace(/\s+/g, "_")] || session;
  
      // Check if attendance already exists for this student, session, and date
      const existingAttendance = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM attendance 
         WHERE student_id = ? AND session = ? AND date = ?`,
        [studentId, normalizedSession, date]
      );
  
      if (existingAttendance) {
        throw new Error(
          `Attendance already recorded for this student in ${normalizedSession} today`
        );
      }
  
      // If no existing record, insert new attendance
      await db.runAsync(
        `INSERT INTO attendance (student_id, session, date, time, status)
         VALUES (?, ?, ?, ?, 'present')`,
        [studentId, normalizedSession, date, time]
      );
  
      console.log(
        `✅ Attendance marked for student ${studentId} in ${normalizedSession}`
      );
    } catch (error) {
      console.error("❌ Error marking attendance:", error);
      throw error; // Re-throw to allow calling code to handle the error
    }
  };

  

  // ✅ Get recent scans (latest 10)
  const getRecentScans = async (): Promise<Attendance[]> => {
    try {
      const result = await db.getAllAsync<Attendance>(
        `SELECT a.id, s.name, s.code, a.time, a.session, a.date, a.status, a.student_id
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         ORDER BY a.id DESC
         LIMIT 10`
      );

      console.log("Get Recent Scan Result:", result);
      return result;
    } catch (error) {
      console.error("Error fetching recent scans:", error);
      throw error;
    }
  };

  const getTodayStats = async (session: string): Promise<TodayStats> => {
    try {
      const today = new Date().toLocaleDateString("en-CA");
      console.log("📅 Today:", today, "| 🕒 Session:", JSON.stringify(session));
  
      // 🔎 Fetch all students
      const students = await db.getAllAsync<{ id: number; code: string }>(
        `SELECT id, code FROM students`
      );
      console.log("👨‍🎓 Students fetched:", students.length);
  
      // 🔎 Log attendance table (limit for safety)
      const allAttendance = await db.getAllAsync<any>(
        `SELECT * FROM attendance ORDER BY date DESC LIMIT 50`
      );
      console.log("🗂️ Attendance table (latest 50 rows):", allAttendance);
  
      // 🔎 Fetch present students for today + session (case-insensitive, trimmed)
      const present = await db.getAllAsync<{ student_id: number }>(
        `SELECT student_id FROM attendance 
         WHERE date = ? AND LOWER(session) = LOWER(?)`,
        [today, session.trim()]
      );
  
      console.log("✅ Present records fetched:", present.length);
      console.log("Present IDs:", present.map((p) => p.student_id));
  
      const presentIds = new Set(present.map((p) => p.student_id));
  
      // 🔎 Counters
      let totalMales = 0;
      let totalFemales = 0;
      let presentMales = 0;
      let presentFemales = 0;
  
      students.forEach((s) => {
        const codeNum = parseInt(s.code.split("-").pop() || "0", 10);
        const isMale = codeNum >= 1 && codeNum <= 13;
  
        console.log(
          `Student ID: ${s.id}, Code: ${s.code}, Gender: ${
            isMale ? "Male" : "Female"
          }, Present: ${presentIds.has(s.id)}`
        );
  
        if (isMale) {
          totalMales++;
          if (presentIds.has(s.id)) presentMales++;
        } else {
          totalFemales++;
          if (presentIds.has(s.id)) presentFemales++;
        }
      });
  
      const result: TodayStats = {
        totalMales,
        totalFemales,
        presentMales,
        presentFemales,
        absentMales: totalMales - presentMales,
        absentFemales: totalFemales - presentFemales,
        totalPresent: presentMales + presentFemales,
        totalAbsent:
          totalMales + totalFemales - (presentMales + presentFemales),
      };
  
      console.log("📊 Computed Stats:", result);
      return result;
    } catch (error) {
      console.error("❌ Error fetching today's stats:", error);
      throw error;
    }
  };
  

  // ✅ Reset attendance table
  const resetAttendance = async () => {
    try {
      await db.execAsync(`DELETE FROM attendance;`);
      console.log("Attendance table reset successfully.");
    } catch (error) {
      console.error("Error resetting attendance table:", error);
      throw error;
    }
  };

  // ✅ Check if a date has any attendance records (for calendar coloring)
  const hasAttendanceForDate = async (date: string): Promise<boolean> => {
    try {
      console.log("[hasAttendanceForDate] Checking date:", date);
      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM attendance WHERE date = ?`,
        [date]
      );
      console.log("[hasAttendanceForDate] Query result:", row);
      return (row?.count ?? 0) > 0;
    } catch (error) {
      console.error("[hasAttendanceForDate] Error:", error);
      return false;
    }
  };

  // ✅ Get all attendance details for a specific date
  const getAttendanceByDate = async (date: string): Promise<Attendance[]> => {
    try {
      console.log("[getAttendanceByDate] Fetching attendance for:", date);
      const rows = await db.getAllAsync<Attendance>(
        `SELECT a.id, s.name, s.code, a.session, a.time, a.status, a.student_id, a.date
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         WHERE a.date = ?
         ORDER BY a.session, a.time ASC`,
        [date]
      );
      console.log("[getAttendanceByDate] Rows fetched:", rows);
      return rows;
    } catch (error) {
      console.error("[getAttendanceByDate] Error:", error);
      throw error;
    }
  };

  const getSessionCountsByDate = async (
    date: string
  ): Promise<Record<string, number>> => {
    try {
      console.log("[getSessionCountsByDate] Getting session counts for:", date);
      const rows = await db.getAllAsync<{ session: string; count: number }>(
        `SELECT session, COUNT(*) as count
         FROM attendance
         WHERE date = ?
         GROUP BY session`,
        [date]
      );
      console.log("[getSessionCountsByDate] Raw query result:", rows);

      const counts: Record<string, number> = {
        Morning: 0,
        Lunch: 0,
        "After Lunch": 0,
        Dismissal: 0,
      };

      // normalize db values -> display values
      const sessionMap: Record<string, string> = {
        morning: "Morning",
        lunch: "Lunch",
        lunch_dismissal: "Lunch",
        after_lunch: "After Lunch",
        dismissal: "Dismissal",
      };

      rows.forEach((row) => {
        const normalized = sessionMap[row.session.toLowerCase()] || row.session;
        if (counts[normalized] !== undefined) {
          counts[normalized] += row.count;
        }
      });

      console.log("[getSessionCountsByDate] Final normalized counts:", counts);
      return counts;
    } catch (error) {
      console.error("[getSessionCountsByDate] Error:", error);
      throw error;
    }
  };

  const getAllDatesWithAttendance = async () => {
    try {
      const result = await db.getAllAsync(
        "SELECT DISTINCT date FROM attendance ORDER BY date"
      );
      return result.map((row) => row.date);
    } catch (error) {
      console.error("Error getting all dates with attendance:", error);
      return [];
    }
  };
  return {
    markAttendance,
    getRecentScans,
    getTodayStats,
    resetAttendance,
    hasAttendanceForDate,
    getAttendanceByDate,
    getSessionCountsByDate,
    getAllDatesWithAttendance,
  };
}
