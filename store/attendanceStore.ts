import { create } from "zustand";
import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";
import { printToFileAsync } from 'expo-print';
import * as Sharing from 'expo-sharing';


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
      const fileUri = FileSystem.documentDirectory + "attendance_export.csv";
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
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
exportAttendanceByDate: async (date: string, format: 'csv' | 'pdf') => {
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
        throw new Error('No attendance records found for this date');
      }
  
      if (format === 'csv') {
        return await get().generateCSV(rows, date);
      } else {
        return await get().generatePDF(rows, date);
      }
    } catch (err: any) {
      console.error(`❌ Error exporting ${format}:`, err.message);
      throw err;
    }
  },
  
 
  generateCSV: async (rows: any[], date: string) => {
    // Group rows by session
    const groupedBySession: Record<string, any[]> = {};
    
    rows.forEach((row) => {
      const session = row.session;
      if (!groupedBySession[session]) {
        groupedBySession[session] = [];
      }
      groupedBySession[session].push(row);
    });
  
    let csv = "";
    
    // Create sections for each session
    Object.keys(groupedBySession).forEach((session, index) => {
      const sessionRows = groupedBySession[session];
      
      // Add session header
      csv += `\n=== ${session.toUpperCase()} SESSION ===\n`;
      csv += "Student Name,Student Code,Date,Time,Status\n";
      
      // Add rows for this session
      sessionRows.forEach((row) => {
        csv += `"${row.student_name}",${row.student_code},${row.date},${row.time},${row.status}\n`;
      });
      
      // Add session summary
      csv += `\nTotal ${session} attendance: ${sessionRows.length}\n`;
      
      // Add spacing between sessions (except for the last one)
      if (index < Object.keys(groupedBySession).length - 1) {
        csv += "\n";
      }
    });
  
    // Add overall summary at the end
    // csv += `\n=== DAILY SUMMARY ===\n`;
    // csv += `Total attendance records: ${rows.length}\n`;
    // csv += `Sessions recorded: ${Object.keys(groupedBySession).join(', ')}\n`;
  
    const fileName = `attendance_${date}_grouped.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  
    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    }
  
    console.log("✅ Grouped CSV exported:", fileUri);
    return fileUri;
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
  
    const html = `
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 30px; 
              font-size: 12px;
              line-height: 1.4;
            }
            h1 { 
              color: #087444; 
              text-align: center; 
              margin-bottom: 30px; 
              font-size: 24px;
            }
            h2 { 
              color: #087444; 
              border-bottom: 2px solid #4CAF50; 
              padding-bottom: 8px; 
              margin-top: 25px; 
              font-size: 18px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px; 
              margin-bottom: 20px; 
              font-size: 11px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px; 
              text-align: left; 
            }
            th { 
              background-color: #4CAF50; 
              color: #4e4c4f; 
              font-weight: bold;
            }
            .summary { 
              background-color: #f9f9f9; 
              padding: 15px; 
              margin: 10px 0; 
              border-radius: 5px; 
            }
            .session-summary { 
              background-color: #e8f5e8; 
              padding: 8px; 
              margin: 10px 0; 
              border-radius: 5px; 
              font-size: 11px;
            }
            .overall-summary { 
              background-color: #4CAF50; 
              color: white; 
              padding: 15px; 
              margin: 20px 0; 
              border-radius: 5px; 
            }
          </style>
        </head>
        <body>
          <h1>REYES Attendance Grade 12</h1>
          <div class="summary">
            <strong>Date:</strong> ${formatDate}<br>
            <strong>Total Records:</strong> ${rows.length}<br>
            <strong>Sessions:</strong> ${Object.keys(groupedBySession).join(', ')}
          </div>
          
          ${Object.keys(groupedBySession).map(session => {
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
                ${sessionRows.map(row => `
                  <tr>
                    <td>${row.student_name}</td>
                    <td>${row.student_code}</td>
                    <td>${row.time}</td>
                    <td>${row.status}</td>
                  </tr>
                `).join('')}
              </table>
              <div class="session-summary">
                <strong>${session} Total:</strong> ${sessionRows.length} students
              </div>
            `;
          }).join('')}
          
        </body>
      </html>
    `;
  
    const { uri } = await printToFileAsync({
      html,
      base64: false,
      width: 612,  // Letter width in points
      height: 1008, // Long page height (1.5x normal letter height)
    });
  
    // Create custom filename with date
    const customFileName = `${date}_REYES_attendance_grade_12.pdf`;
    const customFileUri = FileSystem.documentDirectory + customFileName;
    
    // Copy the file with custom name
    await FileSystem.copyAsync({
      from: uri,
      to: customFileUri
    });
  
    // Share the file with custom name
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(customFileUri, {
        dialogTitle: 'Export Attendance Report',
        mimeType: 'application/pdf'
      });
    }
  
    console.log("✅ Custom PDF exported:", customFileUri);
    return customFileUri;
  },

  
}));
