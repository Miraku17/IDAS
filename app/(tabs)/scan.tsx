import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, Modal, Animated, StatusBar, Platform, ScrollView, Dimensions } from 'react-native';
import { CameraView, Camera, useCameraPermissions } from 'expo-camera';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LinearGradient } from 'expo-linear-gradient';

const ATTENDANCE_TYPES = [
  { id: 'morning', label: 'Morning', color: '#4CAF50' },
  { id: 'lunch_dismissal', label: 'Lunch', color: '#FF9800' },
  { id: 'after_lunch', label: 'After Lunch', color: '#2196F3' },
  { id: 'dismissal', label: 'Dismissal', color: '#9C27B0' }
];

// Get responsive dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive breakpoints
const BREAKPOINTS = {
  small: 360,
  medium: 600,
  large: 900,
  xlarge: 1200
};

// Helper functions for responsive design
const getScreenSize = (width) => {
  if (width < BREAKPOINTS.small) return 'xs';
  if (width < BREAKPOINTS.medium) return 'sm';
  if (width < BREAKPOINTS.large) return 'md';
  if (width < BREAKPOINTS.xlarge) return 'lg';
  return 'xl';
};

const isTablet = screenWidth >= BREAKPOINTS.medium;
const isLandscape = screenWidth > screenHeight;
const screenSize = getScreenSize(screenWidth);

// Responsive values
const responsive = {
  padding: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28
  },
  fontSize: {
    xs: { small: 12, medium: 16, large: 20, xlarge: 24 },
    sm: { small: 14, medium: 18, large: 22, xlarge: 26 },
    md: { small: 16, medium: 20, large: 24, xlarge: 28 },
    lg: { small: 18, medium: 22, large: 26, xlarge: 30 },
    xl: { small: 20, medium: 24, large: 28, xlarge: 32 }
  },
  cameraSize: {
    xs: Math.min(screenWidth * 0.8, 280),
    sm: Math.min(screenWidth * 0.75, 320),
    md: Math.min(screenWidth * 0.6, 360),
    lg: Math.min(screenWidth * 0.5, 400),
    xl: Math.min(screenWidth * 0.4, 450)
  }
};

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [selectedAttendanceType, setSelectedAttendanceType] = useState('morning');
  const [modalVisible, setModalVisible] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  // Mock attendance data
  const [attendanceStats, setAttendanceStats] = useState({
    totalMales: 32,
    totalFemales: 27,
    absentMales: 8,
    absentFemales: 5
  });
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const buttonPressAnim = useRef(new Animated.Value(1)).current;

  // Handle orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Recalculate responsive values on dimension change
  const currentScreenSize = getScreenSize(dimensions.width);
  const currentIsTablet = dimensions.width >= BREAKPOINTS.medium;
  const currentIsLandscape = dimensions.width > dimensions.height;

  // Scanning line animation
  useEffect(() => {
    const scanAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    scanAnimation.start();
    return () => scanAnimation.stop();
  }, []);

  // Auto-close modal after 5 seconds
  useEffect(() => {
    let timer;
    if (modalVisible && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (modalVisible && countdown === 0) {
      handleCloseModal();
    }
    return () => clearTimeout(timer);
  }, [modalVisible, countdown]);

  // Modal animation
  useEffect(() => {
    if (modalVisible) {
      setCountdown(5);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [modalVisible]);

  if (!permission) {
    return (
      <ThemedView style={[styles.container, getResponsiveStyles().container]}>
        <View style={[styles.loadingContainer, getResponsiveStyles().loadingContainer]}>
          <Text style={[styles.loadingText, getResponsiveStyles().loadingText]}>📷</Text>
          <ThemedText style={[styles.loadingSubtext, getResponsiveStyles().loadingSubtext]}>Loading camera permissions...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={[styles.container, getResponsiveStyles().container]}>
        <View style={[styles.permissionContainer, getResponsiveStyles().permissionContainer]}>
          <Text style={[styles.permissionIcon, getResponsiveStyles().permissionIcon]}>🔒</Text>
          <ThemedText style={[styles.permissionTitle, getResponsiveStyles().permissionTitle]}>Camera Permission Required</ThemedText>
          <ThemedText style={[styles.permissionMessage, getResponsiveStyles().permissionMessage]}>
            We need camera access to scan QR codes for attendance tracking
          </ThemedText>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={[styles.permissionButtonGradient, getResponsiveStyles().permissionButtonGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.permissionButtonText, getResponsiveStyles().permissionButtonText]}>Grant Camera Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const handleBarcodeScanned = ({ type, data }) => {
    setScanned(true);
    setScannedData({ type, data });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setScanned(false);
    setScannedData(null);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
  };

  const getSelectedAttendanceType = () => {
    return ATTENDANCE_TYPES.find(type => type.id === selectedAttendanceType) || ATTENDANCE_TYPES[0];
  };

  const handleAttendanceTypeSelect = (typeId) => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonPressAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonPressAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSelectedAttendanceType(typeId);
  };

  // Get responsive styles based on current screen size
  function getResponsiveStyles() {
    const padding = responsive.padding[currentScreenSize];
    const fontSize = responsive.fontSize[currentScreenSize];
    const cameraSize = responsive.cameraSize[currentScreenSize];
    const scanFrameSize = Math.min(cameraSize * 0.7, 240);

    return StyleSheet.create({
      container: {
        paddingHorizontal: currentIsTablet ? padding * 2 : padding,
      },
      loadingContainer: {
        paddingHorizontal: padding,
      },
      loadingText: {
        fontSize: currentIsTablet ? 80 : 64,
      },
      loadingSubtext: {
        fontSize: fontSize.medium,
      },
      permissionContainer: {
        paddingHorizontal: padding * 1.5,
      },
      permissionIcon: {
        fontSize: currentIsTablet ? 100 : 80,
      },
      permissionTitle: {
        fontSize: fontSize.xlarge,
      },
      permissionMessage: {
        fontSize: fontSize.medium,
      },
      permissionButtonGradient: {
        paddingHorizontal: padding * 2,
        paddingVertical: padding,
      },
      permissionButtonText: {
        fontSize: fontSize.large,
      },
      headerGradient: {
        paddingHorizontal: padding,
        paddingBottom: padding,
      },
      headerTitle: {
        fontSize: fontSize.xlarge,
        marginBottom: padding,
      },
      statsContainer: {
        marginBottom: padding,
        flexDirection: currentIsLandscape && currentIsTablet ? 'row' : 'column',
        justifyContent: 'space-between',
      },
      statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: currentIsLandscape && currentIsTablet ? 0 : 12,
        flex: currentIsLandscape && currentIsTablet ? 1 : undefined,
        marginHorizontal: currentIsLandscape && currentIsTablet ? 4 : 0,
      },
      statCard: {
        padding: padding,
        marginHorizontal: currentIsTablet ? 6 : 4,
      },
      statLabel: {
        fontSize: fontSize.small,
      },
      statValue: {
        fontSize: currentIsTablet ? fontSize.xlarge : fontSize.large,
      },
      attendanceButtonsContainer: {
        paddingHorizontal: padding * 0.8,
        paddingBottom: padding * 0.6,
      },
      attendanceButtonsTitle: {
        fontSize: fontSize.small,
        marginBottom: padding * 0.4,
      },
      attendanceButtonsGrid: {
        gap: currentIsTablet ? 8 : 6,
      },
      attendanceButton: {
        flex: 1,
        minHeight: currentIsTablet ? 36 : 32,
      },
      attendanceButtonGradient: {
        paddingHorizontal: padding * 0.4,
        paddingVertical: padding * 0.3,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: currentIsTablet ? 36 : 32,
      },
      attendanceButtonText: {
        fontSize: currentIsTablet ? fontSize.small : 11,
      },
      scannerTitle: {
        fontSize: fontSize.xlarge,
      },
      scannerSubtitle: {
        fontSize: fontSize.medium,
        paddingHorizontal: padding,
      },
      cameraContainer: {
        width: cameraSize,
        height: cameraSize,
        marginBottom: padding,
      },
      scannerFrame: {
        width: scanFrameSize,
        height: scanFrameSize,
      },
      corner: {
        width: Math.max(20, cameraSize * 0.08),
        height: Math.max(20, cameraSize * 0.08),
      },
      scanLine: {
        left: scanFrameSize * 0.075,
        right: scanFrameSize * 0.075,
        height: 3,
      },
      modalContent: {
        padding: padding * 1.25,
        maxWidth: currentIsTablet ? 480 : 380,
      },
      modalTitle: {
        fontSize: fontSize.xlarge,
      },
      modalSubtitle: {
        fontSize: fontSize.medium,
      },
      attendanceCardContent: {
        padding: padding,
      },
      attendanceCardLabel: {
        fontSize: fontSize.large,
      },
      studentInfo: {
        padding: padding,
      },
    });
  }

  const responsiveStyles = getResponsiveStyles();

  return (
    <ThemedView style={[styles.container, responsiveStyles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#f8f9fa', '#ffffff']}
          style={[styles.headerGradient, responsiveStyles.headerGradient]}
        >
          <Text style={[styles.headerTitle, responsiveStyles.headerTitle]}>Attendance Today</Text>
          
          {/* Attendance Statistics */}
          <View style={[styles.statsContainer, responsiveStyles.statsContainer]}>
            <View style={[styles.statsRow, responsiveStyles.statsRow]}>
              <View style={[styles.statCard, responsiveStyles.statCard]}>
                <View style={[styles.statIndicator, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.statLabel, responsiveStyles.statLabel]}>Total Males</Text>
                <Text style={[styles.statValue, responsiveStyles.statValue]}>{attendanceStats.totalMales}</Text>
              </View>
              <View style={[styles.statCard, responsiveStyles.statCard]}>
                <View style={[styles.statIndicator, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.statLabel, responsiveStyles.statLabel]}>Total Females</Text>
                <Text style={[styles.statValue, responsiveStyles.statValue]}>{attendanceStats.totalFemales}</Text>
              </View>
            </View>
            
            <View style={[styles.statsRow, responsiveStyles.statsRow]}>
              <View style={[styles.statCard, responsiveStyles.statCard]}>
                <View style={[styles.statIndicator, { backgroundColor: '#f44336' }]} />
                <Text style={[styles.statLabel, responsiveStyles.statLabel]}>Absent Males</Text>
                <Text style={[styles.statValue, styles.absentValue, responsiveStyles.statValue]}>{attendanceStats.absentMales}</Text>
              </View>
              <View style={[styles.statCard, responsiveStyles.statCard]}>
                <View style={[styles.statIndicator, { backgroundColor: '#f44336' }]} />
                <Text style={[styles.statLabel, responsiveStyles.statLabel]}>Absent Females</Text>
                <Text style={[styles.statValue, styles.absentValue, responsiveStyles.statValue]}>{attendanceStats.absentFemales}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
        
        {/* Attendance Type Buttons */}
        <View style={[styles.attendanceButtonsContainer, responsiveStyles.attendanceButtonsContainer]}>
          <Text style={[styles.attendanceButtonsTitle, responsiveStyles.attendanceButtonsTitle]}>
            Attendance Type
          </Text>
          <View style={[styles.attendanceButtonsGrid, responsiveStyles.attendanceButtonsGrid]}>
            {ATTENDANCE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.attendanceButton, responsiveStyles.attendanceButton]}
                onPress={() => handleAttendanceTypeSelect(type.id)}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={{
                    transform: [{ scale: selectedAttendanceType === type.id ? buttonPressAnim : 1 }],
                    borderRadius: 8,
                    overflow: 'hidden',
                    flex: 1,
                    shadowColor: selectedAttendanceType === type.id ? type.color : '#000',
                    shadowOffset: { width: 0, height: selectedAttendanceType === type.id ? 2 : 1 },
                    shadowOpacity: selectedAttendanceType === type.id ? 0.2 : 0.1,
                    shadowRadius: selectedAttendanceType === type.id ? 4 : 2,
                    elevation: selectedAttendanceType === type.id ? 3 : 2,
                  }}
                >
                  <LinearGradient
                    colors={selectedAttendanceType === type.id ? 
                      [type.color, type.color + 'DD'] : 
                      ['#f8f9fa', '#ffffff']
                    }
                    style={[styles.attendanceButtonGradient, responsiveStyles.attendanceButtonGradient]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={[
                      styles.attendanceButtonText, 
                      responsiveStyles.attendanceButtonText,
                      {
                        color: selectedAttendanceType === type.id ? '#fff' : '#333',
                        fontWeight: selectedAttendanceType === type.id ? 'bold' : '600'
                      }
                    ]}>
                      {type.label}
                    </Text>
                    {selectedAttendanceType === type.id && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIcon}>✓</Text>
                      </View>
                    )}
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Main Content with Scanner */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.scannerSection}>
          <View style={styles.scannerHeader}>
            {/* <Text style={[styles.scannerTitle, responsiveStyles.scannerTitle]}>📱 Scan QR Code</Text> */}
            <Text style={[styles.scannerSubtitle, responsiveStyles.scannerSubtitle]}>Position the QR code within the frame</Text>
          </View>
          
          <View style={[styles.cameraContainer, responsiveStyles.cameraContainer]}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'pdf417', 'aztec', 'ean13', 'ean8', 'upc_e', 'code128', 'code39'],
              }}
            >
              <View style={styles.scannerOverlay}>
                <View style={[styles.scannerFrame, responsiveStyles.scannerFrame]}>
                  {/* Animated corners */}
                  <View style={[styles.corner, styles.topLeft, responsiveStyles.corner]} />
                  <View style={[styles.corner, styles.topRight, responsiveStyles.corner]} />
                  <View style={[styles.corner, styles.bottomLeft, responsiveStyles.corner]} />
                  <View style={[styles.corner, styles.bottomRight, responsiveStyles.corner]} />
                  
                  {/* Animated scan line */}
                  <Animated.View
                    style={[
                      styles.scanLine,
                      responsiveStyles.scanLine,
                      {
                        transform: [{
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, responsiveStyles.scannerFrame.height - 50],
                          }),
                        }],
                        opacity: scanLineAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.8, 1, 0.8],
                        }),
                      },
                    ]}
                  />
                </View>
              </View>
            </CameraView>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              responsiveStyles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Success Animation */}
            <View style={styles.modalHeader}>
              <View style={styles.successIconContainer}>
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.successIconGradient}
                >
                  <Text style={styles.successIcon}>✓</Text>
                </LinearGradient>
              </View>
              <Text style={[styles.modalTitle, responsiveStyles.modalTitle]}>Attendance Recorded!</Text>
              <Text style={[styles.modalSubtitle, responsiveStyles.modalSubtitle]}>Student successfully checked in</Text>
            </View>
            
            {/* Attendance Details */}
            <View style={styles.modalBody}>
              <LinearGradient
                colors={[getSelectedAttendanceType().color, getSelectedAttendanceType().color + 'CC']}
                style={styles.attendanceCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.attendanceCardContent, responsiveStyles.attendanceCardContent]}>
                  <Text style={[styles.attendanceCardLabel, responsiveStyles.attendanceCardLabel]}>
                    {getSelectedAttendanceType().label}
                  </Text>
                  <Text style={styles.attendanceCardTime}>
                    {new Date().toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </Text>
                </View>
              </LinearGradient>
              
              {/* Student Information */}
              {scannedData && (
                <View style={[styles.studentInfo, responsiveStyles.studentInfo]}>
                  <View style={styles.studentInfoRow}>
                    <Text style={styles.studentInfoLabel}>Student ID:</Text>
                    <Text style={styles.studentInfoValue}>{scannedData.data}</Text>
                  </View>
                  <View style={styles.studentInfoRow}>
                    <Text style={styles.studentInfoLabel}>Scan Type:</Text>
                    <Text style={styles.studentInfoValue}>{scannedData.type}</Text>
                  </View>
                  <View style={styles.studentInfoRow}>
                    <Text style={styles.studentInfoLabel}>Date:</Text>
                    <Text style={styles.studentInfoValue}>
                      {new Date().toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <View style={styles.countdownContainer}>
                <View style={styles.countdownCircle}>
                  <Text style={styles.countdownText}>{countdown}</Text>
                </View>
                <Text style={styles.autoCloseText}>Auto-closing</Text>
              </View>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.closeButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.closeButtonText}>Continue Scanning</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 64,
    marginBottom: 20,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#333',
    opacity: 0.7,
  },
  
  // Permission States
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 30,
  },
  permissionIcon: {
    fontSize: 80,
    marginBottom: 30,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  permissionMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  permissionButton: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  permissionButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Header Section
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // Statistics Section
  statsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  absentValue: {
    color: '#f44336',
  },
  
  // Attendance Buttons Section
  attendanceButtonsContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  attendanceButtonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  attendanceButtonsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  attendanceButton: {
    flex: 1,
    minHeight: 32,
  },
  attendanceButtonGradient: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    position: 'relative',
  },
  attendanceButtonText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIcon: {
    fontSize: 8,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  
  // Main Content
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  
  // Scanner Section
  scannerSection: {
    alignItems: 'center',
    flex: 1,
    minHeight: screenHeight * 0.4,
  },
  scannerHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  scannerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  cameraContainer: {
    width: 300,
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  
  // Scanner Frame
  scannerFrame: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00FF88',
    borderWidth: 4,
    borderRadius: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 15,
    right: 15,
    height: 3,
    backgroundColor: '#00FF88',
    borderRadius: 2,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  
  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 25,
    width: '100%',
    maxWidth: 380,
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  successIconContainer: {
    marginBottom: 20,
    borderRadius: 50,
    overflow: 'hidden',
  },
  successIconGradient: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 25,
  },
  attendanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  attendanceCardContent: {
    padding: 20,
    alignItems: 'center',
  },
  attendanceCardLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  attendanceCardTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  studentInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
  },
  studentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  studentInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  studentInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  modalFooter: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: isTablet ? 0 : 15,
  },
  countdownContainer: {
    alignItems: 'center',
    order: isTablet ? 1 : 2,
  },
  countdownCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  autoCloseText: {
    fontSize: 12,
    color: '#999',
  },
  closeButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    order: isTablet ? 2 : 1,
  },
  closeButtonGradient: {
    paddingHorizontal: 25,
    paddingVertical: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});