import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

// ✅ import Zustand store
import { useAttendanceStore } from "../../store/attendanceStore";

export default function HomeScreen() {
  const [selectedSession, setSelectedSession] = useState("Morning");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [modalView, setModalView] = useState("students");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAttendanceData, setStudentAttendanceData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);

  const router = useRouter();

  // ✅ grab store state + actions
  const {
    recentScans,
    todayStats,
    allStudents,
    fetchRecentScans,
    fetchTodayStats,
    fetchAllStudents,
    fetchStudentAttendance,
  } = useAttendanceStore();

  const fetchStudentAttendanceData = async (studentId) => {
    try {
      console.log("Fetching attendance for student ID:", studentId);
      const attendance = await fetchStudentAttendance(studentId);
      setStudentAttendanceData(attendance);
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      setStudentAttendanceData([]);
    }
  };

  useEffect(() => {
    fetchAllStudents();
  }, []);

  // Update the useEffect that filters students
  useEffect(() => {
    if (!allStudents) return; // Guard against null/undefined

    if (searchQuery.trim() === "") {
      setFilteredStudents(allStudents);
    } else {
      const filtered = allStudents.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, allStudents]); // Change dependency from 'students' to 'allStudents'

  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchRecentScans();
    }, [fetchRecentScans])
  );

  // Fetch stats when session changes
  useEffect(() => {
    const sessionForDb = selectedSession.toLowerCase().replace(" ", "_"); // convert to DB format
    fetchTodayStats(sessionForDb);
  }, [selectedSession]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format date and time using Philippine locale
  const currentDate = currentDateTime.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentTime = currentDateTime.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const sessions = [
    { name: "Morning", icon: "sunny-outline" },
    { name: "Lunch Dismissal", icon: "restaurant-outline" },
    { name: "After Lunch", icon: "cafe-outline" },
    { name: "Dismissal", icon: "home-outline" },
  ];

  // Calculate stats for display
  const stats = {
    total: 32, // Constant as requested
    present: todayStats?.totalPresent ?? 0,
    male: todayStats?.presentMales ?? 0,
    female: todayStats?.presentFemales ?? 0,
  };

  const renderStudentItem = ({ item }) => {
    const codeNum = parseInt(item.code.split("-").pop() || "0", 10);
    const gender = codeNum >= 1 && codeNum <= 13 ? "Male" : "Female";

    const handleViewPress = async () => {
      console.log("🧪 View button pressed for:", item.name, "ID:", item.id);

      // Set the selected student
      setSelectedStudent(item);

      // Switch to attendance view
      setModalView("attendance");

      // Fetch the attendance data
      try {
        console.log("🧪 Fetching attendance data...");
        const attendance = await fetchStudentAttendance(item.id);
        console.log("🧪 Attendance data received:", attendance);
        setStudentAttendanceData(attendance || []);
      } catch (error) {
        console.error("🧪 Error fetching student attendance:", error);
        setStudentAttendanceData([]);
      }
    };

    return (
      <View style={styles.studentItem}>
        <View style={styles.studentInfo}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentAvatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentGender}>{gender}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.viewButton} onPress={handleViewPress}>
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // UPDATE your students button:
  const openStudentsModal = () => {
    setModalView("students");
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background Layers */}
      <View style={styles.gradientLayer1} />
      <View style={styles.gradientLayer2} />
      <View style={styles.gradientLayer3} />

      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Section */}
          <View style={styles.topSection}>
            <Text style={styles.sectionTitle}>IDAS</Text>
            <Text style={styles.subSectionTitle}>Grade 12 – Reyes</Text>
            <View style={styles.dateTimeContainer}>
              <Text style={styles.dateText}>{currentDate}</Text>
              <Text style={styles.timeText}>{currentTime}</Text>
            </View>

            {/* Session Selector */}
            <View style={styles.sessionContainer}>
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session.name}
                  style={[
                    styles.sessionButton,
                    selectedSession === session.name &&
                      styles.sessionButtonActive,
                  ]}
                  onPress={() => setSelectedSession(session.name)}
                >
                  <View style={styles.sessionButtonContent}>
                    <Ionicons
                      name={session.icon}
                      size={16}
                      color={
                        selectedSession === session.name ? "#10B981" : "#6B7280"
                      }
                    />
                    <Text
                      style={[
                        styles.sessionButtonText,
                        selectedSession === session.name &&
                          styles.sessionButtonTextActive,
                      ]}
                    >
                      {session.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Middle Section */}
          <View style={styles.middleSection}>
            {/* Big Scan QR Button with Gradient Effect */}
            <View style={styles.scanButtonContainer}>
              <View style={styles.scanButtonGradient} />
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => router.push("/scan")}
              >
                <View style={styles.scanButtonContent}>
                  <Ionicons name="qr-code-outline" size={48} color="#FFFFFF" />
                  <Text style={styles.scanButtonText}>Scan QR Code</Text>
                  <Text style={styles.scanButtonSubtext}>
                    Tap to scan student attendance
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Stats Card */}
            <View style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <Text style={styles.statsTitle}>Attendance Overview</Text>
                <Text style={styles.sessionLabel}>{selectedSession}</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total Students</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, styles.presentNumber]}>
                    {stats.present}
                  </Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.male}</Text>
                  <Text style={styles.statLabel}>Male Present</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.female}</Text>
                  <Text style={styles.statLabel}>Female Present</Text>
                </View>
              </View>
            </View>

            {/* Students Section Button */}
            <TouchableOpacity
              style={styles.studentsButton}
              onPress={openStudentsModal}
            >
              <View style={styles.studentsButtonContent}>
                <Ionicons name="people-outline" size={24} color="#059669" />
                <Text style={styles.studentsButtonText}>View All Students</Text>
                <Text style={styles.studentsButtonSubtext}>
                  Search and manage student list
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Bottom Section - Recent Scans */}
          <View style={styles.bottomSection}>
            <Text style={styles.recentTitle}>Recent Scans</Text>
            <View style={styles.recentList}>
              {recentScans.length === 0 ? (
                <View style={styles.noRecentContainer}>
                  <Text style={styles.noRecentText}>📭 No recent scans</Text>
                </View>
              ) : (
                recentScans.map((scan, index) => (
                  <View key={index} style={styles.recentItem}>
                    <View style={styles.recentItemLeft}>
                      <Ionicons
                        name={
                          scan.status === "present"
                            ? "checkmark-circle"
                            : "close-circle"
                        }
                        size={20}
                        color={
                          scan.status === "present" ? "#10B981" : "#EF4444"
                        }
                      />
                      <View>
                        <Text style={styles.recentName}>{scan.name}</Text>
                        <Text style={styles.recentSession}>
                          {scan.session.replace("_", " ").toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.recentTime}>{scan.time}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setModalVisible(false);
          setModalView("students");
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          {modalView === "students" ? (
            <>
              {/* STUDENTS LIST VIEW */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>All Students</Text>
                <View style={styles.modalHeaderSpacer} />
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={20} color="#6B7280" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search students..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9CA3AF"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery("")}
                      style={styles.clearButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Students List */}
              <View style={styles.studentsListContainer}>
                <Text style={styles.studentsCountText}>
                  {filteredStudents.length} of {allStudents?.length || 0}{" "}
                  students
                </Text>
                <FlatList
                  data={filteredStudents}
                  renderItem={renderStudentItem}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.studentsList}
                />
              </View>
            </>
          ) : (
            <>
              {/* ATTENDANCE VIEW */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalView("students")}
                >
                  <Ionicons name="arrow-back" size={24} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.modalAttendanceTitle}>
                  {selectedStudent?.name}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.attendanceList}>
                {studentAttendanceData.length === 0 ? (
                  <View style={styles.noAttendanceContainer}>
                    <Text style={styles.noAttendanceText}>
                      No attendance records found
                    </Text>
                  </View>
                ) : (
                  (() => {
                    // Group attendance records by date
                    const groupedAttendance = studentAttendanceData.reduce(
                      (groups, record) => {
                        const date = record.date;
                        if (!groups[date]) {
                          groups[date] = [];
                        }
                        groups[date].push(record);
                        return groups;
                      },
                      {}
                    );

                    // Sort dates in descending order (most recent first)
                    const sortedDates = Object.keys(groupedAttendance).sort(
                      (a, b) => new Date(b) - new Date(a)
                    );

                    // Format functions
                    const formatSession = (session) => {
                      const sessionMap = {
                        morning: "Morning",
                        lunch_dismissal: "Lunch Dismissal",
                        after_lunch: "After Lunch",
                        dismissal: "Dismissal",
                      };
                      return sessionMap[session] || session;
                    };

                    const formatDate = (dateString) => {
                      const date = new Date(dateString);
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);

                      if (date.toDateString() === today.toDateString()) {
                        return "Today";
                      } else if (
                        date.toDateString() === yesterday.toDateString()
                      ) {
                        return "Yesterday";
                      } else {
                        return date.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      }
                    };

                    return sortedDates.map((date, dateIndex) => (
                      <View key={dateIndex} style={styles.dateGroup}>
                        {/* Date Header */}
                        <View style={styles.dateHeader}>
                          <Text style={styles.dateHeaderText}>
                            {formatDate(date)}
                          </Text>
                          <View style={styles.dateHeaderLine} />
                        </View>

                        {/* Sessions for this date */}
                        {groupedAttendance[date]
                          .sort((a, b) => {
                            // Sort sessions by time order
                            const sessionOrder = {
                              morning: 1,
                              lunch_dismissal: 2,
                              after_lunch: 3,
                              dismissal: 4,
                            };
                            return (
                              (sessionOrder[a.session] || 5) -
                              (sessionOrder[b.session] || 5)
                            );
                          })
                          .map((record, sessionIndex) => (
                            <View key={sessionIndex} style={styles.sessionItem}>
                              <View style={styles.sessionInfo}>
                                <Text style={styles.sessionName}>
                                  {formatSession(record.session)}
                                </Text>
                                <Text style={styles.sessionTime}>
                                  {record.time}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.sessionStatusBadge,
                                  record.status === "present"
                                    ? styles.presentBadge
                                    : styles.absentBadge,
                                ]}
                              >
                                <Ionicons
                                  name={
                                    record.status === "present"
                                      ? "checkmark-circle"
                                      : "close-circle"
                                  }
                                  size={16}
                                  color={
                                    record.status === "present"
                                      ? "#047857"
                                      : "#DC2626"
                                  }
                                />
                                <Text
                                  style={[
                                    styles.sessionStatusText,
                                    record.status === "present"
                                      ? styles.presentText
                                      : styles.absentText,
                                  ]}
                                >
                                  {record.status}
                                </Text>
                              </View>
                            </View>
                          ))}
                      </View>
                    ));
                  })()
                )}
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },

  // Gradient Background Layers
  gradientLayer1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F0FDF4",
  },
  gradientLayer2: {
    position: "absolute",
    top: 0,
    left: 0,
    right: "60%",
    bottom: "40%",
    backgroundColor: "#ECFDF5",
    borderBottomRightRadius: 100,
  },
  gradientLayer3: {
    position: "absolute",
    top: "60%",
    left: "40%",
    right: 0,
    bottom: 0,
    backgroundColor: "#D1FAE5",
    borderTopLeftRadius: 100,
    opacity: 0.7,
  },

  safeArea: {
    flex: 1,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // Top Section
  topSection: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(229, 231, 235, 0.3)",
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
    letterSpacing: 0.1,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    letterSpacing: 0.1,
    textAlign: "right",
  },
  sessionContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(254, 243, 199, 0.9)",
    borderRadius: 12,
    padding: 4,
    gap: 2,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  sessionButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionButtonContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  sessionButtonText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 14,
  },
  sessionButtonTextActive: {
    color: "#047857",
    fontWeight: "600",
  },

  // Middle Section
  middleSection: {
    padding: 20,
    gap: 20,
  },

  // Scan Button with Custom Gradient
  scanButtonContainer: {
    position: "relative",
    borderRadius: 20,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#10B981",
    borderRadius: 20,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButton: {
    padding: 28,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  scanButtonContent: {
    alignItems: "center",
    gap: 8,
  },
  scanButtonText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  scanButtonSubtext: {
    fontSize: 14,
    color: "#D1FAE5",
    textAlign: "center",
  },

  // Stats Card
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  sessionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1F2937",
    backgroundColor: "rgba(254, 243, 199, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  presentNumber: {
    color: "#10B981",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },

  // Students Section Button
  studentsButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  studentsButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  studentsButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  studentsButtonSubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  // Bottom Section
  bottomSection: {
    padding: 20,
    paddingBottom: 100,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  recentList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(243, 244, 246, 0.5)",
  },
  recentItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  recentTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  recentSession: {
    fontSize: 11,
    color: "#6B7280",
    textTransform: "capitalize",
    marginTop: 2,
  },
  noRecentContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noRecentText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalAttendanceTitle: {
    fontSize: 8,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalHeaderSpacer: {
    width: 32,
  },

  // Search Styles
  searchContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "400",
  },
  clearButton: {
    padding: 2,
  },

  // Students List Styles
  studentsListContainer: {
    flex: 1,
    padding: 20,
  },
  studentsCountText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    fontWeight: "500",
  },
  studentsList: {
    paddingBottom: 20,
  },
  studentItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  studentAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 2,
  },
  studentGender: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  presentBadge: {
    backgroundColor: "#D1FAE5",
  },
  absentBadge: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  presentText: {
    color: "#047857",
  },
  absentText: {
    color: "#DC2626",
  },
  viewButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  viewButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },

  // Attendance Modal Styles
  attendanceList: {
    flex: 1,
    padding: 20,
  },
  noAttendanceContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  noAttendanceText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  attendanceItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attendanceDate: {
    flex: 1,
  },
  attendanceDateText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 2,
  },
  attendanceSessionText: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "capitalize",
  },
  attendanceDetails: {
    alignItems: "flex-end",
  },
  attendanceTimeText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  attendanceStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  attendanceStatusText: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  sessionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  sessionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  sessionStatusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
