import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [selectedSession, setSelectedSession] = useState('Morning');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  // Format date and time using Philippine locale
  const currentDate = currentDateTime.toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const currentTime = currentDateTime.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const sessions = [
    { name: 'Morning', icon: 'sunny-outline' },
    { name: 'Lunch Dismissal', icon: 'restaurant-outline' },
    { name: 'After Lunch', icon: 'cafe-outline' },
    { name: 'Dismissal', icon: 'home-outline' }
  ];
  
  const stats = {
    total: 32,
    present: 28,
    male: 15,
    female: 13
  };

  const recentScans = [
    { name: 'Juan Dela Cruz', time: '7:45 AM', status: 'present' },
    { name: 'Maria Santos', time: '7:46 AM', status: 'present' },
    { name: 'Pedro Gonzalez', time: '7:47 AM', status: 'present' },
    { name: 'Ana Rodriguez', time: '7:48 AM', status: 'present' },
  ];

  return (
    <View style={styles.container}>
      {/* Gradient Background Layers */}
      <View style={styles.gradientLayer1} />
      <View style={styles.gradientLayer2} />
      <View style={styles.gradientLayer3} />
      
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          {/* Top Section */}
          <View style={styles.topSection}>
            <Text style={styles.sectionTitle}>IDAS - Attendance Checker</Text>
            <Text style={styles.subSectionTitle}>Grade 10 – Section A</Text>
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
                    selectedSession === session.name && styles.sessionButtonActive
                  ]}
                  onPress={() => setSelectedSession(session.name)}
                >
                  <View style={styles.sessionButtonContent}>
                    <Ionicons 
                      name={session.icon} 
                      size={16} 
                      color={selectedSession === session.name ? '#10B981' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.sessionButtonText,
                      selectedSession === session.name && styles.sessionButtonTextActive
                    ]}>
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
              <TouchableOpacity style={styles.scanButton}>
                <View style={styles.scanButtonContent}>
                  <Ionicons name="qr-code-outline" size={48} color="#FFFFFF" />
                  <Text style={styles.scanButtonText}>Scan QR Code</Text>
                  <Text style={styles.scanButtonSubtext}>Tap to scan student attendance</Text>
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
                  <Text style={[styles.statNumber, styles.presentNumber]}>{stats.present}</Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.male}</Text>
                  <Text style={styles.statLabel}>Male</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.female}</Text>
                  <Text style={styles.statLabel}>Female</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Section - Recent Scans */}
          <View style={styles.bottomSection}>
            <Text style={styles.recentTitle}>Recent Scans</Text>
            <View style={styles.recentList}>
              {recentScans.map((scan, index) => (
                <View key={index} style={styles.recentItem}>
                  <View style={styles.recentItemLeft}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.recentName}>{scan.name}</Text>
                  </View>
                  <Text style={styles.recentTime}>{scan.time}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  
  // Gradient Background Layers
  gradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F0FDF4',
  },
  gradientLayer2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: '60%',
    bottom: '40%',
    backgroundColor: '#ECFDF5',
    borderBottomRightRadius: 100,
  },
  gradientLayer3: {
    position: 'absolute',
    top: '60%',
    left: '40%',
    right: 0,
    bottom: 0,
    backgroundColor: '#D1FAE5',
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.3)',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.1,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    letterSpacing: 0.1,
    textAlign: 'right',
  },
  sessionContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(254, 243, 199, 0.9)',
    borderRadius: 12,
    padding: 4,
    gap: 2,
    shadowColor: '#F59E0B',
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
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  sessionButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sessionButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
  },
  sessionButtonTextActive: {
    color: '#047857',
    fontWeight: '600',
  },

  // Middle Section
  middleSection: {
    padding: 20,
    gap: 20,
  },
  
  // Scan Button with Custom Gradient
  scanButtonContainer: {
    position: 'relative',
    borderRadius: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#10B981',
    borderRadius: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButton: {
    padding: 28,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanButtonContent: {
    alignItems: 'center',
    gap: 8,
  },
  scanButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scanButtonSubtext: {
    fontSize: 14,
    color: '#D1FAE5',
    textAlign: 'center',
  },

  // Stats Card
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  sessionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    backgroundColor: 'rgba(254, 243, 199, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  presentNumber: {
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Bottom Section
  bottomSection: {
    padding: 20,
    paddingBottom: 100,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  recentList: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(243, 244, 246, 0.5)',
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  recentTime: {
    fontSize: 12,
    color: '#6B7280',
  },
});