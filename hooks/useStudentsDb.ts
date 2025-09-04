import { useEffect, useState } from "react";
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import students from "../assets/students.json";

export type Student = {
  id?: number;
  name: string;
  code: string;
};

export function useStudentsDb() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [dbReady, setDbReady] = useState(false); // ✅ flag

  useEffect(() => {
    const setupDb = async () => {
      const database = await openDatabaseAsync("students.db");
      setDb(database);

      // 1. Create table
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL
        );
      `);

      // 2. Seed data if empty
      const row = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM students"
      );

      if (row?.count === 0) {
        console.log("📥 Seeding students...");
        for (const student of students as Student[]) {
          try {
            await database.runAsync(
              "INSERT INTO students (name, code) VALUES (?, ?)",
              [student.name, student.code]
            );
          } catch (err) {
            console.log("❌ Insert error:", err);
          }
        }
      }

      setDbReady(true); // ✅ mark DB as ready
    };

    setupDb();
  }, []);

  // --- Helpers ---

  const getStudents = async (): Promise<Student[]> => {
    if (!db || !dbReady) return [];
    return await db.getAllAsync<Student>("SELECT * FROM students");
  };

  const getTotalStudents = async (): Promise<number> => {
    if (!db || !dbReady) return 0;
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM students"
    );
    return row?.count ?? 0;
  };

  const findStudentByCode = async (code: string): Promise<Student | null> => {
    if (!db || !dbReady) return null;
    const student = await db.getFirstAsync<Student>(
      "SELECT * FROM students WHERE code = ?",
      [code]
    );
    return student ?? null;
  };

  const resetStudents = async () => {
    if (!db || !dbReady) return;
    await db.runAsync("DELETE FROM students");

    for (const student of students as Student[]) {
      try {
        await db.runAsync("INSERT INTO students (name, code) VALUES (?, ?)", [
          student.name,
          student.code,
        ]);
      } catch (err) {
        console.log("❌ Insert error:", err);
      }
    }
  };

  const clearStudents = async () => {
    if (!db || !dbReady) return;
    await db.runAsync("DELETE FROM students");
    console.log("🗑️ All students cleared");
  };

  const checkScannedStudent = async (qrCode: string): Promise<Student | null> => {
    if (!db || !dbReady) return null;
    const student = await findStudentByCode(qrCode);
    if (student) {
      console.log("🎉 Student found:", student.name);
      return student;
    } else {
      console.log("⚠️ No student found for QR:", qrCode);
      return null;
    }
  };

  return { 
    getStudents, 
    findStudentByCode, 
    resetStudents, 
    clearStudents, 
    checkScannedStudent,
    getTotalStudents,
    dbReady // ✅ expose ready flag
  };
}
