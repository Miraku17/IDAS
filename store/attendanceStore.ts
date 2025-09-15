import { create } from "zustand";
import * as SQLite from "expo-sqlite";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { printToFileAsync } from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";

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

export type StudentsByCategory = {
  presentMales: Array<{ id: number; name: string; code: string }>;
  presentFemales: Array<{ id: number; name: string; code: string }>;
  absentMales: Array<{ id: number; name: string; code: string }>;
  absentFemales: Array<{ id: number; name: string; code: string }>;
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
  studentsByCategory: StudentsByCategory | null;
  allStudents: Array<{ id: number; name: string; code: string }> | null;

  markAttendance: (studentId: number, session: string) => Promise<void>;
  fetchRecentScans: () => Promise<void>;
  fetchTodayStats: (session: string) => Promise<void>;
  fetchSessionCounts: (date: string) => Promise<void>;
  fetchAttendanceByDate: (date: string) => Promise<void>;
  resetAttendance: () => Promise<void>;
  fetchAllAttendance: () => Promise<Attendance[]>;
  fetchStudentsByCategory: (session: string, date?: string) => Promise<void>;
  fetchAllStudents: () => Promise<void>;
  fetchStudentAttendance: (studentId: number) => Promise<Attendance[]>;
  exportAllAttendanceReport: (format: "csv" | "pdf") => Promise<string>;
};

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  recentScans: [],
  todayStats: null,
  sessionCounts: {},
  loading: false,
  error: null,
  allStudents: null,

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

      // ✅ ADD THIS RETURN STATEMENT FOR SUCCESS CASE
      return { success: true, message: "Attendance recorded successfully" };
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
        totalAbsent:
          totalMales + totalFemales - (presentMales + presentFemales),
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

      // console.table(rows); // ✅ Debug in console
      console.log(rows); // ✅ Debug in console

      return rows;
    } catch (err: any) {
      console.error("❌ Error fetching attendance:", err.message);
      return [];
    }
  },

  exportAttendance: async () => {
    try {
      const rows = await db.getAllAsync(
        `SELECT a.id, s.name AS student_name, s.code AS student_code,
                a.session, a.date, a.time, a.status
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         ORDER BY a.date DESC, a.time DESC`
      );

      // Convert rows → CSV string
      let csv = "id,student_name,student_code,session,date,time,status\n";
      rows.forEach((row) => {
        csv += `${row.id},"${row.student_name}",${row.student_code},${row.session},${row.date},${row.time},${row.status}\n`;
      });

      // Save CSV to file
      const fileUri =
        FileSystemLegacy.documentDirectory + "attendance_export.csv";
      await FileSystemLegacy.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystemLegacy.EncodingType.UTF8,
      });

      console.log("✅ Attendance exported to:", fileUri);
      return fileUri;
    } catch (err) {
      console.error("❌ Error exporting attendance:", err);
      throw err;
    }
  },

  // CSV and PDF

  // Add these functions to your store
  exportAttendanceByDate: async (date: string, format: "csv" | "pdf") => {
    try {
      console.log(`📤 Exporting ${format.toUpperCase()} for date:`, date);

      // Query attendance for specific date
      const rows = await db.getAllAsync<Attendance>(
        `SELECT a.id, s.name AS student_name, s.code AS student_code,
                a.session, a.date, a.time, a.status
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         WHERE a.date = ?
         ORDER BY a.time ASC`,
        [date]
      );

      if (rows.length === 0) {
        throw new Error("No attendance records found for this date");
      }

      if (format === "csv") {
        return await get().generateCSV(rows, date);
      } else {
        return await get().generatePDF(rows, date);
      }
    } catch (err: any) {
      console.error(`❌ Error exporting ${format}:`, err.message);
      throw err;
    }
  },

  generatePDF: async (rows: any[], date: string) => {
    const formatDate = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  
    // Group rows by session
    const groupedBySession: Record<string, any[]> = {};
    rows.forEach((row) => {
      const session = row.session;
      if (!groupedBySession[session]) {
        groupedBySession[session] = [];
      }
      groupedBySession[session].push(row);
    });
  
    // ✅ Load logo as Base64 (same way as generateAllAttendancePDF)
    const logoAsset = Asset.fromModule(require("../assets/images/mnstslogo.png"));
    await logoAsset.downloadAsync();
    const logoBase64 = await FileSystemLegacy.readAsStringAsync(
      logoAsset.localUri!,
      { encoding: FileSystemLegacy.EncodingType.Base64 }
    );
  
    const html = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif; 
          margin: 30px; 
          font-size: 12px;
          line-height: 1.4;
          position: relative;
          background-color: transparent;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.1;
          width: 300px;
          height: auto;
          z-index: 9999;
          pointer-events: none;
        }
        h1 { 
          color: #087444; 
          text-align: center; 
          margin-bottom: 30px; 
          font-size: 24px;
          background-color: transparent;
          position: relative;
          z-index: 2;
        }
        h2 { 
          color: #087444; 
          border-bottom: 2px solid #4CAF50; 
          padding-bottom: 8px; 
          margin-top: 25px; 
          font-size: 18px;
          background-color: transparent;
          position: relative;
          z-index: 2;
        }
  
        /* ✅ Fully transparent tables */
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 15px; 
          margin-bottom: 20px; 
          font-size: 11px;
          background-color: transparent;
        }
        th, td { 
          border: 1px solid rgba(221, 221, 221, 0.6); 
          padding: 6px; 
          text-align: left; 
          background-color: transparent;
        }
        th { 
          background-color: rgba(76, 175, 80, 0.1); 
          color: #4e4c4f; 
          font-weight: bold;
        }
        tr:nth-child(even) td {
          background-color: rgba(248, 248, 248, 0.05);
        }
  
        /* ✅ Fully transparent summary sections */
        .summary { 
          background-color: rgba(249, 249, 249, 0.1); 
          padding: 15px; 
          margin: 10px 0; 
          border-radius: 5px;
          border: 1px solid rgba(221, 221, 221, 0.3);
        }
        .session-summary { 
          background-color: rgba(232, 245, 232, 0.1); 
          padding: 8px; 
          margin: 10px 0; 
          border-radius: 5px; 
          font-size: 11px;
          border: 1px solid rgba(76, 175, 80, 0.2);
        }
        
        /* ✅ Make sure all text is readable over watermark */
        .summary strong,
        .session-summary strong {
          color: #2c5530;
        }
        
        /* ✅ Optional: Add subtle text shadow for better readability */
        h1, h2 {
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
        }
      </style>
    </head>
    <body>
      <img src="data:image/png;base64,${logoBase64}" class="watermark" />
      
      <h1>REYES Attendance Grade 12</h1>
      <div class="summary">
        <strong>Date:</strong> ${formatDate}<br>
        <strong>Total Records:</strong> ${rows.length}<br>
        <strong>Sessions:</strong> ${Object.keys(groupedBySession).join(", ")}
      </div>
  
      ${Object.keys(groupedBySession)
        .map((session) => {
          const sessionRows = groupedBySession[session];
          return `
            <h2>${session.toUpperCase()} Session</h2>
            <table>
              <tr>
                <th>Student Name</th>
                <th>Student Code</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
              ${sessionRows
                .map(
                  (row) => `
                <tr>
                  <td>${row.student_name}</td>
                  <td>${row.student_code}</td>
                  <td>${row.time}</td>
                  <td>${row.status}</td>
                </tr>
              `
                )
                .join("")}
            </table>
            <div class="session-summary">
              <strong>${session} Total:</strong> ${sessionRows.length} students
            </div>
          `;
        })
        .join("")}
    </body>
  </html>
  `;
  
    const { uri } = await printToFileAsync({ html, base64: false });
    const customFileName = `${date}_REYES_attendance_grade_12.pdf`;
    const customFileUri = FileSystemLegacy.documentDirectory + customFileName;
  
    await FileSystemLegacy.copyAsync({ from: uri, to: customFileUri });
  
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(customFileUri, {
        dialogTitle: "Export Attendance Report",
        mimeType: "application/pdf",
      });
    }
  
    console.log("✅ Custom PDF exported:", customFileUri);
    return customFileUri;
  },
  

  fetchStudentsByCategory: async (session: string, date?: string) => {
    try {
      set({ loading: true, error: null });

      const targetDate = date || new Date().toLocaleDateString("en-CA");
      console.log("🔍 Fetching for session:", session, "date:", targetDate);

      // Get all students
      const allStudents = await db.getAllAsync<{
        id: number;
        name: string;
        code: string;
      }>(`SELECT id, name, code FROM students ORDER BY name`);
      console.log("👥 All students:", allStudents.length);
      console.log("🧪 First student from DB:", allStudents[0]); // Debug: Check student structure

      // Get present students for the session/date
      const presentStudents = await db.getAllAsync<{ student_id: number }>(
        `SELECT student_id FROM attendance WHERE date = ? AND session = ?`,
        [targetDate, session]
      );
      console.log("✅ Present students:", presentStudents.length);
      console.log(
        "🧪 Present student IDs:",
        presentStudents.map((p) => p.student_id)
      ); // Debug: Check present IDs

      const presentIds = new Set(presentStudents.map((p) => p.student_id));

      // Categorize students
      const result = {
        presentMales: [],
        presentFemales: [],
        absentMales: [],
        absentFemales: [],
      };

      allStudents.forEach((student) => {
        const codeNum = parseInt(student.code.split("-").pop() || "0", 10);
        const isMale = codeNum >= 1 && codeNum <= 13;
        const isPresent = presentIds.has(student.id);

        console.log(
          `🧪 Student: ${student.name}, Code: ${student.code}, CodeNum: ${codeNum}, isMale: ${isMale}, isPresent: ${isPresent}`
        ); // Debug each student

        if (isMale) {
          if (isPresent) {
            result.presentMales.push(student);
          } else {
            result.absentMales.push(student);
          }
        } else {
          if (isPresent) {
            result.presentFemales.push(student);
          } else {
            result.absentFemales.push(student);
          }
        }
      });

      // Debug: Log actual arrays, not just lengths
      console.log("🧪 Present males (actual array):", result.presentMales);
      console.log(
        "🧪 Absent females sample:",
        result.absentFemales.slice(0, 2)
      ); // Show first 2

      console.log("📊 Final result counts:", {
        presentMales: result.presentMales.length,
        presentFemales: result.presentFemales.length,
        absentMales: result.absentMales.length,
        absentFemales: result.absentFemales.length,
      });

      set({ studentsByCategory: result, loading: false });
      return result;
    } catch (err: any) {
      console.error("❌ Error fetching students by category:", err.message);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  fetchAllStudents: async () => {
    try {
      console.log("👥 Fetching all students...");
      set({ loading: true, error: null });

      const students = await db.getAllAsync<{
        id: number;
        name: string;
        code: string;
      }>(`SELECT id, name, code FROM students ORDER BY name ASC`);

      console.log(`✅ Fetched ${students.length} students`);
      // console.table(students.slice(0, 5)); // Debug: show first 5 students

      set({ allStudents: students, loading: false });
      return students;
    } catch (err: any) {
      console.error("❌ Error fetching all students:", err.message);
      set({ error: err.message, loading: false, allStudents: null });
      throw err;
    }
  },

  fetchStudentAttendance: async (studentId: number) => {
    try {
      console.log("📚 Fetching attendance for student ID:", studentId);
      set({ loading: true, error: null });

      const attendance = await db.getAllAsync<Attendance>(
        `SELECT a.id, a.student_id, a.session, a.date, a.time, a.status, s.name, s.code
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         WHERE a.student_id = ?
         ORDER BY a.date DESC, a.time DESC`,
        [studentId]
      );

      console.log(
        `✅ Found ${attendance.length} attendance records for student ID ${studentId}`
      );
      console.log("📋 Student attendance data:", attendance);

      set({ loading: false });
      return attendance;
    } catch (err: any) {
      console.error("❌ Error fetching student attendance:", err.message);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  exportAllAttendanceReport: async (format: "csv" | "pdf") => {
    try {
      console.log(
        `📤 Exporting ALL attendance records as ${format.toUpperCase()}`
      );

      // Get all attendance records (no date filter)
      const rows = await db.getAllAsync<Attendance>(
        `SELECT a.id, s.name AS student_name, s.code AS student_code,
                a.session, a.date, a.time, a.status
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         ORDER BY a.date DESC, a.time DESC`
      );

      if (rows.length === 0) {
        throw new Error("No attendance records found");
      }

      // For PDF export of ALL records
      return await get().generateAllAttendancePDF(rows);
    } catch (err: any) {
      console.error(`❌ Error exporting all attendance:`, err.message);
      throw err;
    }
  },

  generateAllAttendancePDF: async (rows: any[]) => {
    // Load and convert the logo to base64
    const logoAsset = Asset.fromModule(
      require("../assets/images/mnstslogo.png")
    );
    await logoAsset.downloadAsync();
    const logoBase64 = await FileSystemLegacy.readAsStringAsync(
      logoAsset.localUri!,
      {
        encoding: FileSystemLegacy.EncodingType.Base64,
      }
    );

    // Group rows by date first, then by session
    const groupedByDate: Record<string, Record<string, any[]>> = {};

    rows.forEach((row) => {
      if (!groupedByDate[row.date]) {
        groupedByDate[row.date] = {};
      }
      if (!groupedByDate[row.date][row.session]) {
        groupedByDate[row.date][row.session] = [];
      }
      groupedByDate[row.date][row.session].push(row);
    });

    const html = `
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 10px; 
              position: relative;
            }
        .watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.1;
  z-index: -1;
  width: 300px;
  height: auto;
  pointer-events: none;
}
            h1 { color: #087444; text-align: center; margin-bottom: 20px; font-size: 20px; }
            h2 { color: #087444; font-size: 14px; margin-top: 20px; }
            h3 { color: #087444; font-size: 12px; margin-top: 15px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9px; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background-color: #4CAF50; color: white; font-weight: bold; }
            .summary { background-color: #f9f9f9; padding: 10px; margin: 10px 0; }
          </style>
        </head>
        <body>
<img src="data:image/png;base64,${logoBase64}" class="watermark" alt="MNSTS Logo" />          
          <h1>REYES Complete Attendance Report - Grade 12</h1>
          <div class="summary">
            <strong>Total Records:</strong> ${rows.length}<br>
            <strong>Date Range:</strong> ${
              Object.keys(groupedByDate).sort()[0]
            } to ${Object.keys(groupedByDate).sort().pop()}<br>
            <strong>Total Days:</strong> ${Object.keys(groupedByDate).length}
          </div>
          
          ${Object.keys(groupedByDate)
            .sort()
            .reverse()
            .map((date) => {
              const dateFormatted = new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              const sessionsForDate = groupedByDate[date];

              return `
              <h2>${dateFormatted}</h2>
              ${Object.keys(sessionsForDate)
                .map((session) => {
                  const sessionRows = sessionsForDate[session];
                  return `
                  <h3>${session.toUpperCase()} Session (${
                    sessionRows.length
                  } students)</h3>
                  <table>
                    <tr>
                      <th>Name</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                    ${sessionRows
                      .map(
                        (row) => `
                      <tr>
                        <td>${row.student_name}</td>
                        <td>${row.time}</td>
                        <td>${row.status}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </table>
                `;
                })
                .join("")}
            `;
            })
            .join("")}
        </body>
      </html>
    `;

    const { uri } = await printToFileAsync({
      html,
      base64: false,
      width: 612,
      height: 1008,
    });

    const customFileName = `ALL_REYES_attendance_grade_12.pdf`;
    const customFileUri = FileSystemLegacy.documentDirectory + customFileName;

    await FileSystemLegacy.copyAsync({
      from: uri,
      to: customFileUri,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(customFileUri, {
        dialogTitle: "Export Complete Attendance Report",
        mimeType: "application/pdf",
      });
    }

    console.log("✅ Complete attendance PDF exported:", customFileUri);
    return customFileUri;
  },
}));
