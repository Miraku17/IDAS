import { useEffect } from "react";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("students.db");

export type Attendance = {
  id: number;
  student_id: number;
  session: string;   // Morning, Lunch, After Lunch, Dismissal
  date: string;
  time: string;
  status: string;
  name?: string;     // joined from students table
  code?: string;     // student code e.g. 12-REYES-2025-001
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

  // ✅ Mark attendance with duplicate check
  const markAttendance = async (studentId: number, session: string) => {
    try {
      const now = new Date();
      const date = now.toLocaleDateString("en-CA"); // YYYY-MM-DD
      const time = now.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Check if attendance already exists for this student, session, and date
      const existingAttendance = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM attendance 
         WHERE student_id = ? AND session = ? AND date = ?`,
        [studentId, session, date]
      );

      if (existingAttendance) {
        throw new Error("Attendance already recorded for this student in this session today");
      }

      // If no existing record, insert new attendance
      await db.runAsync(
        `INSERT INTO attendance (student_id, session, date, time, status)
         VALUES (?, ?, ?, ?, 'present')`,
        [studentId, session, date, time]
      );

      console.log(`Attendance marked successfully for student ${studentId} in ${session} session`);
      
    } catch (error) {
      console.error("Error marking attendance:", error);
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

  // ✅ Get stats for today (per session)
  const getTodayStats = async (session: string): Promise<TodayStats> => {
    try {
      const today = new Date().toLocaleDateString("en-CA");

      // All students with code
      const students = await db.getAllAsync<{ id: number; code: string }>(
        `SELECT id, code FROM students`
      );

      // Present for session + date
      const present = await db.getAllAsync<{ student_id: number }>(
        `SELECT student_id FROM attendance 
         WHERE date = ? AND session = ?`,
        [today, session]
      );
      const presentIds = new Set(present.map((p) => p.student_id));

      // Counters
      let totalMales = 0;
      let totalFemales = 0;
      let presentMales = 0;
      let presentFemales = 0;

      students.forEach((s) => {
        const codeNum = parseInt(s.code.split("-").pop() || "0", 10);
        const isMale = codeNum >= 1 && codeNum <= 13;

        if (isMale) {
          totalMales++;
          if (presentIds.has(s.id)) presentMales++;
        } else {
          totalFemales++;
          if (presentIds.has(s.id)) presentFemales++;
        }
      });

      return {
        totalMales,
        totalFemales,
        presentMales,
        presentFemales,
        absentMales: totalMales - presentMales,
        absentFemales: totalFemales - presentFemales,
        totalPresent: presentMales + presentFemales,
        totalAbsent: (totalMales + totalFemales) - (presentMales + presentFemales),
      };

    } catch (error) {
      console.error("Error fetching today's stats:", error);
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

  return { markAttendance, getRecentScans, getTodayStats, resetAttendance };
}