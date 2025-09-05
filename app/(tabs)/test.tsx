import React, { useState } from "react";
import { View, Text, Button, ScrollView, StyleSheet, Alert } from "react-native";
import { useStudentsDb, Student } from "../../hooks/useStudentsDb";
import { useAttendanceStore } from "../../store/attendanceStore"; 
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function TestDbScreen() {
  const { getStudents, resetStudents, clearStudents } = useStudentsDb();
  const resetAttendance = useAttendanceStore((s) => s.resetAttendance);
  const fetchAllAttendance = useAttendanceStore((s) => s.fetchAllAttendance);
  const exportAttendance = useAttendanceStore((s) => s.exportAttendance);

  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  const loadStudents = async () => {
    const data = await getStudents();
    setStudents(data);
  };

  const resetAndReload = async () => {
    await resetStudents();
    await loadStudents();
  };

  const clearAll = async () => {
    await clearStudents();
    setStudents([]);
  };

  const resetAttendanceTable = async () => {
    await resetAttendance();
    Alert.alert("Success", "Attendance table has been reset!");
    setAttendance([]);
  };

  const loadAttendance = async () => {
    const data = await fetchAllAttendance();
    setAttendance(data);
  };

  const handleExportAttendance = async () => {
    try {
      const fileUri = await exportAttendance(); // store should generate CSV file
      Alert.alert("Success", "Attendance exported successfully!");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to export attendance.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <Button title="Load Students" onPress={loadStudents} />
        <Button title="Reset Students" onPress={resetAndReload} color="red" />
        <Button title="Clear Students" onPress={clearAll} color="orange" />
        <Button title="Reset Attendance Table" onPress={resetAttendanceTable} color="green" />
        <Button title="Show Attendance" onPress={loadAttendance} color="blue" />
        <Button title="Export Attendance CSV" onPress={handleExportAttendance} color="#4CAF50" />
      </View>

      {/* Scrollable lists */}
      <ScrollView style={styles.list}>
        <Text style={styles.sectionTitle}>📚 Students</Text>
        {students.map((s) => (
          <View key={s.code} style={styles.studentCard}>
            <Text style={styles.studentName}>{s.name}</Text>
            <Text style={styles.studentCode}>{s.code}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>📝 Attendance</Text>
        {attendance.map((a) => (
          <View key={a.id} style={styles.studentCard}>
            <Text style={styles.studentName}>{a.name}</Text>
            <Text style={styles.studentCode}>
              Session: {a.session} | Date: {a.date} | Time: {a.time}
            </Text>
            <Text>Status: {a.status}</Text>
          </View>
        ))}

        {attendance.length === 0 && <Text>No attendance records to show.</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    marginBottom: 10,
  },
  list: {
    flex: 2,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  studentCard: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 3,
  },
  studentCode: {
    fontSize: 14,
    color: "gray",
  },
});
