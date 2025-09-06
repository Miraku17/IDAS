import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "react-native-calendars";
import { useAttendanceStore } from "../../store/attendanceStore";
import { useFocusEffect } from "@react-navigation/native";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 600;

const attendanceTypeColors = {
  Morning: "#4CAF50",
  "Lunch Dismissal": "#FF9800",
  "After Lunch": "#2196F3",
  Dismissal: "#9C27B0",
};

const getSessionLabelAndColor = (session: string) => {
  switch (session) {
    case "morning":
      return { label: "Morning", color: "#4CAF50" };
    case "lunch_dismissal":
      return { label: "Lunch Dismissal", color: "#FF9800" };
    case "after_lunch":
      return { label: "After Lunch", color: "#2196F3" };
    case "dismissal":
      return { label: "Dismissal", color: "#9C27B0" };
    default:
      return { label: session, color: "#999" };
  }
};

export default function RecordsScreen() {
  const {
    recentScans,
    sessionCounts,
    fetchAttendanceByDate,
    fetchSessionCounts,
    exportAttendanceByDate,
    loading,
  } = useAttendanceStore();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [markedDates, setMarkedDates] = useState({});

  // Update attendance whenever date changes
  useEffect(() => {
    fetchAttendanceByDate(selectedDate);
    fetchSessionCounts(selectedDate);

    // Mark selected date in calendar
    setMarkedDates({
      [selectedDate]: {
        selected: true,
        selectedColor: "#4CAF50",
        marked: true,
        dotColor: "#4CAF50",
      },
    });
  }, [selectedDate]);

  useFocusEffect(
    React.useCallback(() => {
      // Refresh data when screen comes into focus
      fetchAttendanceByDate(selectedDate);
      fetchSessionCounts(selectedDate);
    }, [selectedDate])
  );

  const onDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleExportCSV = async () => {
    try {
      if (recentScans.length === 0) {
        Alert.alert("No Data", "No attendance records found for this date");
        return;
      }
      await exportAttendanceByDate(selectedDate, "csv");
      Alert.alert("Success", "CSV file exported successfully!");
    } catch (error: any) {
      Alert.alert("Export Failed", error.message);
    }
  };

  const handleExportPDF = async () => {
    try {
      if (recentScans.length === 0) {
        Alert.alert("No Data", "No attendance records found for this date");
        return;
      }
      await exportAttendanceByDate(selectedDate, "pdf");
      Alert.alert("Success", "PDF file exported successfully!");
    } catch (error: any) {
      Alert.alert("Export Failed", error.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <LinearGradient
        colors={["#ffffff", "#f0f8f0", "#e8f5e8"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Attendance Records</Text>
          <Text style={styles.headerSubtitle}>
            Track daily attendance history
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator>
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={onDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: "transparent",
              calendarBackground: "transparent",
              textSectionTitleColor: "#4CAF50",
              selectedDayBackgroundColor: "#4CAF50",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#4CAF50",
              dayTextColor: "#2d4150",
              textDisabledColor: "#d9e1e8",
              dotColor: "#4CAF50",
              selectedDotColor: "#ffffff",
              arrowColor: "#4CAF50",
              monthTextColor: "#2d4150",
              indicatorColor: "#4CAF50",
              textDayFontFamily: Platform.OS === "ios" ? "System" : "Roboto",
              textMonthFontFamily: Platform.OS === "ios" ? "System" : "Roboto",
              textDayHeaderFontFamily:
                Platform.OS === "ios" ? "System" : "Roboto",
              textDayFontWeight: "500",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "600",
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />
        </View>

        {/* Selected Date Info */}
        <View style={styles.selectedDateContainer}>
          <LinearGradient
            colors={["#4CAF50", "#45a049"]}
            style={styles.selectedDateGradient}
          >
            <Text style={styles.selectedDateText}>
              {formatDate(selectedDate)}
            </Text>
            <Text style={styles.selectedDateSubtext}>
              {recentScans.length} attendance record
              {recentScans.length !== 1 ? "s" : ""}
            </Text>
          </LinearGradient>
        </View>

        {loading ? (
          <View style={{ marginTop: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={{ marginTop: 10, color: "#666" }}>
              Loading attendance...
            </Text>
          </View>
        ) : (
          <>
            {/* Attendance Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionTitle}>Daily Summary</Text>
              <View style={styles.summaryGrid}>
                {Object.entries(attendanceTypeColors).map(([type, color]) => (
                  <View key={type} style={styles.summaryCard}>
                    <LinearGradient
                      colors={[color, color + "CC"]}
                      style={styles.summaryCardGradient}
                    >
                      <View style={styles.summaryCardContent}>
                        <Text style={styles.summaryCardLabel}>{type}</Text>
                        <Text style={styles.summaryCardValue}>
                          {sessionCounts[type] || 0}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </View>

              {/* Export Section */}
              <View style={styles.exportSection}>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={handleExportPDF}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#1565C0", "#0D47A1"]}
                    style={styles.exportButtonGradient}
                  >
                    <Text style={styles.exportButtonIcon}>📄</Text>
                    <Text style={styles.exportButtonText}>
                      Export PDF Report
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Attendance Records */}
            <View style={styles.recordsContainer}>
              <Text style={styles.sectionTitle}>Attendance Details</Text>

              {recentScans.length === 0 ? (
                <View style={styles.noRecordsContainer}>
                  <LinearGradient
                    colors={["#f8f9fa", "#ffffff"]}
                    style={styles.noRecordsGradient}
                  >
                    <Text style={styles.noRecordsIcon}>📅</Text>
                    <Text style={styles.noRecordsText}>
                      No attendance records
                    </Text>
                    <Text style={styles.noRecordsSubtext}>
                      No attendance data found for this date
                    </Text>
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.recordsList}>
                  {recentScans.map((record) => {
                    const { label, color } = getSessionLabelAndColor(
                      record.session
                    );
                    return (
                      <View key={record.id} style={styles.recordCard}>
                        <LinearGradient
                          colors={["#ffffff", "#fafafa"]}
                          style={styles.recordCardGradient}
                        >
                          <View style={styles.recordCardContent}>
                            <View style={styles.recordHeader}>
                              <View style={styles.recordMainInfo}>
                                <Text style={styles.studentName}>
                                  {record.name}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.recordTypeBadge,
                                  { backgroundColor: color },
                                ]}
                              >
                                <Text style={styles.recordTypeText}>
                                  {label}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.recordDetails}>
                              <View style={styles.recordDetailItem}>
                                <Text style={styles.recordDetailLabel}>
                                  Time:
                                </Text>
                                <Text style={styles.recordDetailValue}>
                                  {record.time}
                                </Text>
                              </View>
                              <View style={styles.recordDetailItem}>
                                <Text style={styles.recordDetailLabel}>
                                  Status:
                                </Text>
                                <View style={styles.statusBadge}>
                                  <Text style={styles.statusText}>
                                    ✓ {record.status}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        </LinearGradient>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: { alignItems: "center" },
  headerTitle: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: "bold",
    color: "#2d4150",
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: isTablet ? 18 : 16,
    color: "#666",
    textAlign: "center",
  },
  scrollContainer: { flex: 1 },
  calendarContainer: {
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  calendar: { borderRadius: 15 },
  selectedDateContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedDateGradient: { padding: 20, alignItems: "center" },
  selectedDateText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
    textAlign: "center",
  },
  selectedDateSubtext: {
    fontSize: isTablet ? 16 : 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: "bold",
    color: "#2d4150",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  summaryContainer: { marginHorizontal: 20, marginBottom: 25 },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  summaryCard: {
    width: isTablet ? "23%" : "48%",
    marginBottom: 10,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryCardGradient: { padding: 15 },
  summaryCardContent: { alignItems: "center" },
  summaryCardLabel: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 5,
    textAlign: "center",
  },
  summaryCardValue: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  exportSection: {
    marginBottom: 4,
    marginHorizontal: 10,
  },
  exportButton: {
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  exportButtonGradient: {
    paddingVertical: 24,
    paddingHorizontal: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  exportButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  exportButtonText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  exportSectionTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: "bold",
    color: "#2d4150",
    marginBottom: 20,
    paddingHorizontal: 5,
    textAlign: "center",
  },
  modernFloatingContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  modernBubble: {
    width: isTablet ? 120 : 100,
    height: isTablet ? 120 : 100,
    borderRadius: isTablet ? 60 : 50,
    elevation: 12,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  modernBubbleGradient: {
    width: "100%",
    height: "100%",
    borderRadius: isTablet ? 60 : 50,
    justifyContent: "center",
    alignItems: "center",
  },
  modernBubbleContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  modernBubbleIcon: {
    fontSize: isTablet ? 32 : 28,
    marginBottom: 8,
  },
  modernBubbleText: {
    fontSize: isTablet ? 13 : 11,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  recordsContainer: { marginHorizontal: 20, marginBottom: 20 },
  noRecordsContainer: {
    borderRadius: 15,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noRecordsGradient: { padding: 40, alignItems: "center" },
  noRecordsIcon: { fontSize: 48, marginBottom: 15 },
  noRecordsText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  noRecordsSubtext: {
    fontSize: isTablet ? 16 : 14,
    color: "#999",
    textAlign: "center",
  },
  recordsList: { gap: 12 },
  recordCard: {
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordCardGradient: { borderWidth: 1, borderColor: "#f0f0f0" },
  recordCardContent: { padding: 15 },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  recordMainInfo: { flex: 1 },
  studentName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "bold",
    color: "#2d4150",
    marginBottom: 2,
  },
  recordTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  recordTypeText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  recordDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recordDetailItem: { flexDirection: "row", alignItems: "center" },
  recordDetailLabel: {
    fontSize: isTablet ? 14 : 12,
    color: "#666",
    marginRight: 6,
  },
  recordDetailValue: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: "bold",
    color: "#2d4150",
  },
  statusBadge: {
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: isTablet ? 12 : 11,
    fontWeight: "600",
    color: "#4CAF50",
  },
  bottomSpacing: { height: 80 },
});
