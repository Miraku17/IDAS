import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar, Platform, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 600;

// Mock attendance data
const attendanceRecords = {
  '2025-01-15': [
    { id: 'STU001', name: 'John Smith', time: '07:30 AM', type: 'Morning', status: 'Present' },
    { id: 'STU002', name: 'Emma Johnson', time: '07:45 AM', type: 'Morning', status: 'Present' },
    { id: 'STU003', name: 'Michael Brown', time: '12:15 PM', type: 'Lunch', status: 'Present' },
    { id: 'STU004', name: 'Sarah Davis', time: '01:00 PM', type: 'After Lunch', status: 'Present' },
    { id: 'STU005', name: 'David Wilson', time: '03:30 PM', type: 'Dismissal', status: 'Present' },
  ],
  '2025-01-14': [
    { id: 'STU001', name: 'John Smith', time: '07:35 AM', type: 'Morning', status: 'Present' },
    { id: 'STU002', name: 'Emma Johnson', time: '07:50 AM', type: 'Morning', status: 'Present' },
    { id: 'STU006', name: 'Lisa Anderson', time: '12:20 PM', type: 'Lunch', status: 'Present' },
    { id: 'STU007', name: 'James Miller', time: '01:05 PM', type: 'After Lunch', status: 'Present' },
  ],
  '2025-01-13': [
    { id: 'STU008', name: 'Ashley Garcia', time: '07:25 AM', type: 'Morning', status: 'Present' },
    { id: 'STU009', name: 'Ryan Martinez', time: '07:40 AM', type: 'Morning', status: 'Present' },
    { id: 'STU010', name: 'Jessica Taylor', time: '12:10 PM', type: 'Lunch', status: 'Present' },
  ]
};

const attendanceTypeColors = {
  'Morning': '#4CAF50',
  'Lunch': '#FF9800',
  'After Lunch': '#2196F3',
  'Dismissal': '#9C27B0'
};

export default function RecordsScreen() {
  const [selectedDate, setSelectedDate] = useState('2025-01-15');
  const [markedDates, setMarkedDates] = useState({
    '2025-01-15': { selected: true, selectedColor: '#4CAF50' },
    '2025-01-14': { marked: true, dotColor: '#4CAF50' },
    '2025-01-13': { marked: true, dotColor: '#4CAF50' }
  });

  const onDayPress = (day) => {
    const newMarkedDates = {};
    
    // Mark all dates with attendance records
    Object.keys(attendanceRecords).forEach(date => {
      if (date === day.dateString) {
        newMarkedDates[date] = { selected: true, selectedColor: '#4CAF50' };
      } else {
        newMarkedDates[date] = { marked: true, dotColor: '#4CAF50' };
      }
    });
    
    setMarkedDates(newMarkedDates);
    setSelectedDate(day.dateString);
  };

  const getSelectedDateRecords = () => {
    return attendanceRecords[selectedDate] || [];
  };

  const getAttendanceSummary = () => {
    const records = getSelectedDateRecords();
    const summary = {
      Morning: 0,
      Lunch: 0,
      'After Lunch': 0,
      Dismissal: 0,
      Total: records.length
    };
    
    records.forEach(record => {
      if (summary.hasOwnProperty(record.type)) {
        summary[record.type]++;
      }
    });
    
    return summary;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const summary = getAttendanceSummary();
  const records = getSelectedDateRecords();

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#ffffff', '#f0f8f0', '#e8f5e8']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Attendance Records</Text>
          <Text style={styles.headerSubtitle}>Track daily attendance history</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Calendar Section */}
        <View style={styles.calendarContainer}>
          <LinearGradient
            colors={['#ffffff', '#f8fdf8']}
            style={styles.calendarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Calendar
              current={selectedDate}
              onDayPress={onDayPress}
              markedDates={markedDates}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: '#4CAF50',
                selectedDayBackgroundColor: '#4CAF50',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#4CAF50',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#4CAF50',
                selectedDotColor: '#ffffff',
                arrowColor: '#4CAF50',
                monthTextColor: '#2d4150',
                indicatorColor: '#4CAF50',
                textDayFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                textMonthFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                textDayHeaderFontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14
              }}
              style={styles.calendar}
            />
          </LinearGradient>
        </View>

        {/* Selected Date Info */}
        <View style={styles.selectedDateContainer}>
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            style={styles.selectedDateGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.selectedDateText}>
              {formatDate(selectedDate)}
            </Text>
            <Text style={styles.selectedDateSubtext}>
              {records.length} attendance record{records.length !== 1 ? 's' : ''}
            </Text>
          </LinearGradient>
        </View>

        {/* Attendance Summary Cards */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Daily Summary</Text>
          <View style={styles.summaryGrid}>
            {Object.entries(attendanceTypeColors).map(([type, color]) => (
              <View key={type} style={styles.summaryCard}>
                <LinearGradient
                  colors={[color, color + 'CC']}
                  style={styles.summaryCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.summaryCardContent}>
                    <Text style={styles.summaryCardLabel}>{type}</Text>
                    <Text style={styles.summaryCardValue}>{summary[type]}</Text>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>
          
          {/* Total Summary */}
          <View style={styles.totalSummaryCard}>
            <LinearGradient
              colors={['#f8f9fa', '#ffffff']}
              style={styles.totalSummaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.totalSummaryContent}>
                <Text style={styles.totalSummaryLabel}>Total Attendance</Text>
                <Text style={styles.totalSummaryValue}>{summary.Total}</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Attendance Records List */}
        <View style={styles.recordsContainer}>
          <Text style={styles.sectionTitle}>Attendance Details</Text>
          
          {records.length === 0 ? (
            <View style={styles.noRecordsContainer}>
              <LinearGradient
                colors={['#f8f9fa', '#ffffff']}
                style={styles.noRecordsGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.noRecordsIcon}>📅</Text>
                <Text style={styles.noRecordsText}>No attendance records</Text>
                <Text style={styles.noRecordsSubtext}>
                  No attendance data found for this date
                </Text>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.recordsList}>
              {records.map((record, index) => (
                <View key={record.id} style={styles.recordCard}>
                  <LinearGradient
                    colors={['#ffffff', '#fafafa']}
                    style={styles.recordCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.recordCardContent}>
                      <View style={styles.recordHeader}>
                        <View style={styles.recordMainInfo}>
                          <Text style={styles.studentName}>{record.name}</Text>
                          <Text style={styles.studentId}>ID: {record.id}</Text>
                        </View>
                        <View style={[
                          styles.recordTypeBadge,
                          { backgroundColor: attendanceTypeColors[record.type] }
                        ]}>
                          <Text style={styles.recordTypeText}>{record.type}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.recordDetails}>
                        <View style={styles.recordDetailItem}>
                          <Text style={styles.recordDetailLabel}>Time:</Text>
                          <Text style={styles.recordDetailValue}>{record.time}</Text>
                        </View>
                        <View style={styles.recordDetailItem}>
                          <Text style={styles.recordDetailLabel}>Status:</Text>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>✓ {record.status}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Header Section
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: isTablet ? 18 : 16,
    color: '#666',
    textAlign: 'center',
  },
  
  // Main Content
  scrollContainer: {
    flex: 1,
  },
  
  // Calendar Section
  calendarContainer: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  calendarGradient: {
    padding: 15,
  },
  calendar: {
    borderRadius: 15,
  },
  
  // Selected Date
  selectedDateContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedDateGradient: {
    padding: 20,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedDateSubtext: {
    fontSize: isTablet ? 16 : 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  
  // Section Titles
  sectionTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  
  // Summary Section
  summaryContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryCard: {
    width: isTablet ? '23%' : '48%',
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryCardGradient: {
    padding: 15,
  },
  summaryCardContent: {
    alignItems: 'center',
  },
  summaryCardLabel: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 5,
    textAlign: 'center',
  },
  summaryCardValue: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  // Total Summary
  totalSummaryCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    
  },
  totalSummaryGradient: {
    padding: 20,
    borderWidth: 0,
    borderColor: '#4CAF50',
  },
  totalSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSummaryLabel: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#2d4150',
  },
  totalSummaryValue: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  
  // Records Section
  recordsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  
  // No Records State
  noRecordsContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noRecordsGradient: {
    padding: 40,
    alignItems: 'center',
  },
  noRecordsIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  noRecordsText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  noRecordsSubtext: {
    fontSize: isTablet ? 16 : 14,
    color: '#999',
    textAlign: 'center',
  },
  
  // Records List
  recordsList: {
    gap: 12,
  },
  recordCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordCardGradient: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  recordCardContent: {
    padding: 15,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recordMainInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 2,
  },
  studentId: {
    fontSize: isTablet ? 14 : 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  recordTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  recordTypeText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordDetailLabel: {
    fontSize: isTablet ? 14 : 12,
    color: '#666',
    marginRight: 6,
  },
  recordDetailValue: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: 'bold',
    color: '#2d4150',
  },
  statusBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: isTablet ? 12 : 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  
  // Bottom Spacing
  bottomSpacing: {
    height: 80,
  },
});