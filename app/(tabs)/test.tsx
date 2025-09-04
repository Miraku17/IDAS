import React, { useState } from "react";
import { View, Text, Button, ScrollView, StyleSheet, Alert } from "react-native";
import { useStudentsDb, Student } from "../../hooks/useStudentsDb";
import { useAttendanceDb } from "../../hooks/useAttendanceDb"; // ✅ import hook

export default function TestDbScreen() {
  const { getStudents, resetStudents, clearStudents } = useStudentsDb();
  const { resetAttendance } = useAttendanceDb(); // ✅ get resetAttendance
  const [students, setStudents] = useState<Student[]>([]);

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
      </View>

      {/* Student list */}
      <ScrollView style={styles.list}>
        {students.map((s) => (
          <View key={s.code} style={styles.studentCard}>
            <Text style={styles.studentName}>{s.name}</Text>
            <Text style={styles.studentCode}>{s.code}</Text>
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