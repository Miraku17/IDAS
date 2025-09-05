import React, { useState } from "react";
import { View, Text, Button, ScrollView, StyleSheet, Alert } from "react-native";
import { useStudentsDb, Student } from "../../hooks/useStudentsDb";
import { useAttendanceStore } from "../../store/attendanceStore"; 

export default function TestDbScreen() {
  const { getStudents, resetStudents, clearStudents } = useStudentsDb();
  const resetAttendance = useAttendanceStore((s) => s.resetAttendance);
  const fetchAllAttendance = useAttendanceStore((s) => s.fetchAllAttendance);

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
    setStudents([]); // empty UI immediately
  };

  const resetAttendanceTable = async () => {
    await resetAttendance();
    Alert.alert("Success", "Attendance table has been reset!");
  };

  const loadAttendance = async () => {
    const data = await fetchAllAttendance();
    setAttendance(data);
  };

  return (
    <View style={styles.container}>
      {/* Centered buttons */}
      <View style={styles.buttonsContainer}>
        <Button title="Load Students" onPress={loadStudents} />
        <Button title="Reset Students" onPress={resetAndReload} color="red" />
        <Button title="Clear Students" onPress={clearAll} color="orange" />
        <Button
          title="Reset Attendance Table"
          onPress={resetAttendanceTable}
          color="green"
        />
        <Button
          title="Show Attendance"
          onPress={loadAttendance}
          color="blue"
        />
      </View>

      {/* Student list */}
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
              {a.session} | {a.date} {a.time}
            </Text>
            <Text>Status: {a.status}</Text>
          </View>
        ))}
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
    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
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
