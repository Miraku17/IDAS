import { create } from "zustand";
import * as SQLite from "expo-sqlite";
import students from "../assets/students.json";

export type Student = {
  id?: number;
  name: string;
  code: string;
};

type InitializeTablesState = {
  // Database connection
  db: SQLite.SQLiteDatabase | null;
  
  // Initialization status
  isInitialized: boolean;
  isInitializing: boolean;
  initializationError: string | null;
  
  // Individual table status
  studentsTableReady: boolean;
  attendanceTableReady: boolean;
  studentsSeeded: boolean;
  
  // Methods
  initializeTables: () => Promise<void>;
  resetInitialization: () => void;
  getDatabase: () => SQLite.SQLiteDatabase | null;
};

export const useInitializeTablesStore = create<InitializeTablesState>((set, get) => ({
  // Initial state
  db: null,
  isInitialized: false,
  isInitializing: false,
  initializationError: null,
  studentsTableReady: false,
  attendanceTableReady: false,
  studentsSeeded: false,

  initializeTables: async () => {
    const state = get();
    
    // Prevent multiple initializations
    if (state.isInitialized || state.isInitializing) {
      console.log("✅ Database already initialized or initializing");
      return;
    }

    try {
      set({ 
        isInitializing: true, 
        initializationError: null,
        studentsTableReady: false,
        attendanceTableReady: false,
        studentsSeeded: false
      });

      console.log("🚀 Starting database initialization...");

      // 1. Open database connection
      const database = await SQLite.openDatabaseAsync("students.db");
      set({ db: database });
      console.log("✅ Database connection established");

      // 2. Create students table
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL
        );
      `);
      set({ studentsTableReady: true });
      console.log("✅ Students table created/verified");

      // 3. Create attendance table
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          session TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'present',
          FOREIGN KEY (student_id) REFERENCES students (id)
        );
      `);
      set({ attendanceTableReady: true });
      console.log("✅ Attendance table created/verified");

      // 4. Check if students data needs seeding
      const row = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM students"
      );

      if (row?.count === 0) {
        console.log("📥 Seeding students data...");
        
        // Use transaction for better performance
        await database.withTransactionAsync(async () => {
          for (const student of students as Student[]) {
            try {
              await database.runAsync(
                "INSERT INTO students (name, code) VALUES (?, ?)",
                [student.name, student.code]
              );
            } catch (err) {
              console.log("❌ Insert error for student:", student.name, err);
            }
          }
        });
        
        console.log(`✅ Seeded ${students.length} students`);
      } else {
        console.log(`✅ Found ${row.count} existing students - skipping seed`);
      }
      
      set({ studentsSeeded: true });

      // 5. Test database connectivity
      await database.getFirstAsync("SELECT 1");
      console.log("✅ Database connectivity test passed");

      // 6. Mark as fully initialized
      set({
        isInitialized: true,
        isInitializing: false,
        initializationError: null,
      });

      console.log("🎉 Database initialization completed successfully!");

    } catch (error: any) {
      console.error("❌ Database initialization failed:", error);
      set({
        initializationError: error.message,
        isInitializing: false,
        isInitialized: false,
        studentsTableReady: false,
        attendanceTableReady: false,
        studentsSeeded: false,
      });
      throw error;
    }
  },

  resetInitialization: () => {
    set({
      db: null,
      isInitialized: false,
      isInitializing: false,
      initializationError: null,
      studentsTableReady: false,
      attendanceTableReady: false,
      studentsSeeded: false,
    });
    console.log("🔄 Database initialization state reset");
  },

  getDatabase: () => {
    const state = get();
    if (!state.isInitialized || !state.db) {
      console.warn("⚠️ Database not initialized yet");
      return null;
    }
    return state.db;
  },
}));