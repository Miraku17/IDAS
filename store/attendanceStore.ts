import { create } from "zustand";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("students.db");

export type Attendance = {
  id: number;
  student_id: number;
  session: string;
  date: string;
  time: string;
  status: string;
  name?: string;
  code?: string;
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

type AttendanceState = {
  recentScans: Attendance[];
  todayStats: TodayStats | null;
  sessionCounts: Record<string, number>;
  loading: boolean;
  error: string | null;

  markAttendance: (studentId: number, session: string) => Promise<void>;
  fetchRecentScans: () => Promise<void>;
  fetchTodayStats: (session: string) => Promise<void>;
  fetchSessionCounts: (date: string) => Promise<void>;
  fetchAttendanceByDate: (date: string) => Promise<void>; 
  resetAttendance: () => Promise<void>;
  fetchAllAttendance: () => Promise<Attendance[]>; 
};

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  recentScans: [],
  todayStats: null,
  sessionCounts: {},
  loading: false,
  error: null,

  markAttendance: async (studentId, session) => {
    try {
      console.log("🟢 [markAttendance] Starting...");
      console.log("➡️ Student ID:", studentId, "Session:", session);
  
      set({ loading: true, error: null });
  
      const now = new Date();
      const date = now.toLocaleDateString("en-CA");
      const time = now.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
  
      console.log("📅 Date:", date, "| ⏰ Time:", time);
  
      // Check if already marked
      const existing = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM attendance WHERE student_id = ? AND session = ? AND date = ?`,
        [studentId, session, date]
      );
      console.log("🔍 Existing record:", existing);
  
      if (existing) {
        console.warn("⚠️ Already marked for this session");
        // throw new Error("Already marked for this session");
        return { success: false, message: "Already marked for this session" };

      }
  
      // Insert new attendance record
      console.log("📝 Inserting new attendance record...");
      await db.runAsync(
        `INSERT INTO attendance (student_id, session, date, time, status)
         VALUES (?, ?, ?, ?, 'present')`,
        [studentId, session, date, time]
      );
      console.log("✅ Insert successful!");
  
      // Refresh scans
      console.log("🔄 Fetching recent scans...");
      await get().fetchRecentScans();
      console.log("✅ Recent scans updated");
    } catch (err: any) {
      console.error("❌ [markAttendance] Error:", err.message);
      set({ error: err.message });
      return { success: false, message: err.message };
    } finally {
      set({ loading: false });
      console.log("🔵 [markAttendance] Finished");
    }
  },
  
  fetchRecentScans: async () => {
    const scans = await db.getAllAsync<Attendance>(
      `SELECT a.id, s.name, s.code, a.time, a.session, a.date, a.status, a.student_id
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       ORDER BY a.id DESC
       LIMIT 10`
    );
    set({ recentScans: scans });
  },

  fetchTodayStats: async (session) => {
    const today = new Date().toLocaleDateString("en-CA");
    const students = await db.getAllAsync<{ id: number; code: string }>(
      `SELECT id, code FROM students`
    );
    const present = await db.getAllAsync<{ student_id: number }>(
      `SELECT student_id FROM attendance WHERE date = ? AND session = ?`,
      [today, session]
    );

    const presentIds = new Set(present.map((p) => p.student_id));

    let totalMales = 0,
      totalFemales = 0,
      presentMales = 0,
      presentFemales = 0;

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

    set({
      todayStats: {
        totalMales,
        totalFemales,
        presentMales,
        presentFemales,
        absentMales: totalMales - presentMales,
        absentFemales: totalFemales - presentFemales,
        totalPresent: presentMales + presentFemales,
        totalAbsent: totalMales + totalFemales - (presentMales + presentFemales),
      },
    });
  },

  fetchSessionCounts: async (date) => {
    const rows = await db.getAllAsync<{ session: string; count: number }>(
      `SELECT session, COUNT(*) as count FROM attendance WHERE date = ? GROUP BY session`,
      [date]
    );

    const counts: Record<string, number> = {
      Morning: 0,
      "Lunch Dismissal": 0,
      "After Lunch": 0,
      Dismissal: 0,
    };

    const map: Record<string, string> = {
      morning: "Morning",
      lunch_dismissal: "Lunch Dismissal",
      after_lunch: "After Lunch",
      dismissal: "Dismissal",
    };

    rows.forEach((r) => {
      const normalized = map[r.session.toLowerCase()] || r.session;
      if (counts[normalized] !== undefined) counts[normalized] += r.count;
    });

    set({ sessionCounts: counts });
  },


  fetchAttendanceByDate: async (date) => {
    set({ loading: true, error: null });
    try {
      const scans = await db.getAllAsync<Attendance>(
        `SELECT a.id, s.name, s.code, a.time, a.session, a.date, a.status, a.student_id
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         WHERE a.date = ?
         ORDER BY a.time DESC`,
        [date]
      );
      set({ recentScans: scans, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  resetAttendance: async () => {
    await db.execAsync(`DELETE FROM attendance;`);
    set({ recentScans: [], todayStats: null, sessionCounts: {} });
  },

  fetchAllAttendance: async () => {
    try {
      console.log("📥 Fetching all attendance records...");
      const rows = await db.getAllAsync<Attendance>(
        `SELECT a.id, s.name, s.code, a.session, a.date, a.time, a.status
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         ORDER BY a.id DESC`
      );
  
      console.table(rows); // ✅ Debug in console
      return rows;
    } catch (err: any) {
      console.error("❌ Error fetching attendance:", err.message);
      return [];
    }
  },
  
}));
