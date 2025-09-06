import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  Modal,
  Animated,
  StatusBar,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { CameraView, Camera, useCameraPermissions } from "expo-camera";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { LinearGradient } from "expo-linear-gradient";
import { useStudentsDb } from "../../hooks/useStudentsDb";
import { useAttendanceDb } from "../../hooks/useAttendanceDb";
import { useFocusEffect } from "@react-navigation/native";

import { useAttendanceStore } from "../../store/attendanceStore";

const ATTENDANCE_TYPES = [
  { id: "morning", label: "Morning", color: "#4CAF50" },
  { id: "lunch_dismissal", label: "Lunch", color: "#FF9800" },
  { id: "after_lunch", label: "After Lunch", color: "#2196F3" },
  { id: "dismissal", label: "Dismissal", color: "#9C27B0" },
];

// Get responsive dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Responsive breakpoints
const BREAKPOINTS = {
  small: 360,
  medium: 600,
  large: 900,
  xlarge: 1200,
};

// Helper functions for responsive design
const getScreenSize = (width) => {
  if (width < BREAKPOINTS.small) return "xs";
  if (width < BREAKPOINTS.medium) return "sm";
  if (width < BREAKPOINTS.large) return "md";
  if (width < BREAKPOINTS.xlarge) return "lg";
  return "xl";
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
    xl: 28,
  },
  fontSize: {
    xs: { small: 12, medium: 16, large: 20, xlarge: 24 },
    sm: { small: 14, medium: 18, large: 22, xlarge: 26 },
    md: { small: 16, medium: 20, large: 24, xlarge: 28 },
    lg: { small: 18, medium: 22, large: 26, xlarge: 30 },
    xl: { small: 20, medium: 24, large: 28, xlarge: 32 },
  },
  cameraSize: {
    xs: Math.min(screenWidth * 0.8, 280),
    sm: Math.min(screenWidth * 0.75, 320),
    md: Math.min(screenWidth * 0.6, 360),
    lg: Math.min(screenWidth * 0.5, 400),
    xl: Math.min(screenWidth * 0.4, 450),
  },
};

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [selectedAttendanceType, setSelectedAttendanceType] =
    useState("morning");
  const [modalVisible, setModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [errorCountdown, setErrorCountdown] = useState(3);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const [errorMessage, setErrorMessage] = useState("");

  // New state for scanning control
  const [scanningEnabled, setScanningEnabled] = useState(true);
  const [scanDelayActive, setScanDelayActive] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  // New State of modal list of present or absent students

  const [studentListModalVisible, setStudentListModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [studentListLoading, setStudentListLoading] = useState(false);

  const { checkScannedStudent } = useStudentsDb();
  const [studentInfo, setStudentInfo] = useState(null);

  const {
    markAttendance,
    fetchTodayStats,
    todayStats,
    fetchStudentsByCategory,
    studentsByCategory,
  } = useAttendanceStore();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const errorFadeAnim = useRef(new Animated.Value(0)).current;
  const errorScaleAnim = useRef(new Animated.Value(0.8)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const buttonPressAnim = useRef(new Animated.Value(1)).current;

  // Add animation refs for the student list modal
  const studentListFadeAnim = useRef(new Animated.Value(0)).current;
  const studentListScaleAnim = useRef(new Animated.Value(0.8)).current;

  // Refs for timers
  const scanDelayTimeoutRef = useRef(null);
  const modalTimeoutRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  const handleStatCardPress = async (category) => {
    try {
      setStudentListLoading(true);
      setSelectedCategory(category);

      // Fetch the students for the current session
      await fetchStudentsByCategory(selectedAttendanceType);

      // Only show modal after data is loaded
      setStudentListModalVisible(true);
    } catch (error) {
      console.error("Error fetching students:", error);
      setErrorMessage("Failed to load student list");
      setErrorModalVisible(true);
    } finally {
      setStudentListLoading(false);
    }
  };

  // Add this function to close the student list modal
  const handleCloseStudentListModal = () => {
    setStudentListModalVisible(false);
    setSelectedCategory(null);
    studentListFadeAnim.setValue(0);
    studentListScaleAnim.setValue(0.8);
  };

  // Add animation effect for student list modal
  useEffect(() => {
    if (studentListModalVisible) {
      Animated.parallel([
        Animated.timing(studentListFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(studentListScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(studentListFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(studentListScaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [studentListModalVisible]);

  // Handle orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchStats = async () => {
        await fetchTodayStats(selectedAttendanceType);
      };

      fetchStats();

      return () => {
        isActive = false;
      };
    }, [selectedAttendanceType])
  );

  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused - enable scanning
      setIsScreenFocused(true);
      setScanningEnabled(true);

      return () => {
        // Screen is losing focus - disable scanning
        setIsScreenFocused(false);
        setScanningEnabled(false);
        setScanned(false);

        // Clear any active timeouts
        if (scanDelayTimeoutRef.current) {
          clearTimeout(scanDelayTimeoutRef.current);
        }
      };
    }, [])
  );

  // Recalculate responsive values on dimension change
  const currentScreenSize = getScreenSize(dimensions.width);
  const currentIsTablet = dimensions.width >= BREAKPOINTS.medium;
  const currentIsLandscape = dimensions.width > dimensions.height;

  // Scanning line animation - only when scanning is enabled
  useEffect(() => {
    let scanAnimation;

    if (scanningEnabled && !modalVisible && !errorModalVisible) {
      scanAnimation = Animated.loop(
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
    } else {
      // Stop animation when scanning is disabled
      scanLineAnim.setValue(0);
    }

    return () => {
      if (scanAnimation) {
        scanAnimation.stop();
      }
    };
  }, [scanningEnabled, modalVisible, errorModalVisible]);

  // Disable scanning when modals are visible
  useEffect(() => {
    if (modalVisible || errorModalVisible) {
      setScanningEnabled(false);
    }
  }, [modalVisible, errorModalVisible]);

  // Auto-close success modal after 5 seconds
  useEffect(() => {
    if (modalVisible && countdown > 0) {
      modalTimeoutRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (modalVisible && countdown === 0) {
      handleCloseModal();
    }

    return () => {
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
    };
  }, [modalVisible, countdown]);

  // Auto-close error modal after 3 seconds
  useEffect(() => {
    if (errorModalVisible && errorCountdown > 0) {
      errorTimeoutRef.current = setTimeout(() => {
        setErrorCountdown(errorCountdown - 1);
      }, 1000);
    } else if (errorModalVisible && errorCountdown === 0) {
      handleCloseErrorModal();
    }

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [errorModalVisible, errorCountdown]);

  // Success modal animation
  useEffect(() => {
    if (modalVisible) {
      setCountdown(3);
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

  // Error modal animation
  useEffect(() => {
    if (errorModalVisible) {
      setErrorCountdown(3);
      Animated.parallel([
        Animated.timing(errorFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(errorScaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(errorFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(errorScaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [errorModalVisible]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scanDelayTimeoutRef.current) {
        clearTimeout(scanDelayTimeoutRef.current);
      }
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Function to enable scanning after delay
  const enableScanningAfterDelay = (delay = 200) => {
    setScanDelayActive(true);

    if (scanDelayTimeoutRef.current) {
      clearTimeout(scanDelayTimeoutRef.current);
    }

    scanDelayTimeoutRef.current = setTimeout(() => {
      setScanningEnabled(true);
      setScanDelayActive(false);
      setScanned(false);
    }, delay);
  };

  if (!permission) {
    return (
      <ThemedView style={[styles.container, getResponsiveStyles().container]}>
        <View
          style={[
            styles.loadingContainer,
            getResponsiveStyles().loadingContainer,
          ]}
        >
          <Text style={[styles.loadingText, getResponsiveStyles().loadingText]}>
            📷
          </Text>
          <ThemedText
            style={[
              styles.loadingSubtext,
              getResponsiveStyles().loadingSubtext,
            ]}
          >
            Loading camera permissions...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={[styles.container, getResponsiveStyles().container]}>
        <View
          style={[
            styles.permissionContainer,
            getResponsiveStyles().permissionContainer,
          ]}
        >
          <Text
            style={[
              styles.permissionIcon,
              getResponsiveStyles().permissionIcon,
            ]}
          >
            🔒
          </Text>
          <ThemedText
            style={[
              styles.permissionTitle,
              getResponsiveStyles().permissionTitle,
            ]}
          >
            Camera Permission Required
          </ThemedText>
          <ThemedText
            style={[
              styles.permissionMessage,
              getResponsiveStyles().permissionMessage,
            ]}
          >
            We need camera access to scan QR codes for attendance tracking
          </ThemedText>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={[
                styles.permissionButtonGradient,
                getResponsiveStyles().permissionButtonGradient,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text
                style={[
                  styles.permissionButtonText,
                  getResponsiveStyles().permissionButtonText,
                ]}
              >
                Grant Camera Permission
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanned || modalVisible || errorModalVisible || !scanningEnabled) {
      return;
    }

    setScanned(true);
    setScanningEnabled(false);

    try {
      const student = await checkScannedStudent(data);
      console.log("Scanned Student Info", student);

      if (student) {
        setStudentInfo(student);

        // ✅ Use the returned result
        const result = await markAttendance(student.id, selectedAttendanceType);

        if (result.success) {
          await fetchTodayStats(selectedAttendanceType);
          setModalVisible(true);
        } else {
          setErrorMessage(result.message);
          setErrorModalVisible(true);
          enableScanningAfterDelay(500);
        }
      } else {
        setErrorMessage("Student not found in database");
        setErrorModalVisible(true);
        enableScanningAfterDelay(3000);
      }
    } catch (error) {
      console.error("Attendance error:", error);
      setErrorMessage("Failed to record attendance. Please try again.");
      setErrorModalVisible(true);
      enableScanningAfterDelay(3000);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setStudentInfo(null); // reset
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);

    // Clear any existing timeout
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
    }

    // Re-enable scanning after success modal with delay
    enableScanningAfterDelay(100);
  };

  const handleCloseErrorModal = () => {
    setErrorModalVisible(false);
    setErrorMessage("");
    errorFadeAnim.setValue(0);
    errorScaleAnim.setValue(0.8);

    // Clear any existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    // Re-enable scanning after error modal with delay
    enableScanningAfterDelay(100);
  };

  const getSelectedAttendanceType = () => {
    return (
      ATTENDANCE_TYPES.find((type) => type.id === selectedAttendanceType) ||
      ATTENDANCE_TYPES[0]
    );
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
        flexDirection: currentIsLandscape && currentIsTablet ? "row" : "column",
        justifyContent: "space-between",
      },
      statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
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
        alignItems: "center",
        justifyContent: "center",
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

  const getCategoryDetails = (category) => {
    const details = {
      presentMales: {
        title: "Present Males",
        color: "#4CAF50",
        icon: "👨‍🎓",
        students: studentsByCategory?.presentMales || [],
      },
      presentFemales: {
        title: "Present Females",
        color: "#4CAF50",
        icon: "👩‍🎓",
        students: studentsByCategory?.presentFemales || [],
      },
      absentMales: {
        title: "Absent Males",
        color: "#f44336",
        icon: "👨‍💼",
        students: studentsByCategory?.absentMales || [],
      },
      absentFemales: {
        title: "Absent Females",
        color: "#f44336",
        icon: "👩‍💼",
        students: studentsByCategory?.absentFemales || [],
      },
    };
    return (
      details[category] || {
        title: "Students",
        color: "#666",
        icon: "👤",
        students: [],
      }
    );
  };

  return (
    <ThemedView style={[styles.container, responsiveStyles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header Section */}
      <View style={styles.header}>
        <LinearGradient
          colors={["#f8f9fa", "#ffffff"]}
          style={[styles.headerGradient, responsiveStyles.headerGradient]}
        >
          <Text style={[styles.headerTitle, responsiveStyles.headerTitle]}>
            Attendance Today
          </Text>

          {/* Attendance Statistics */}
          <View
            style={[styles.statsContainer, responsiveStyles.statsContainer]}
          >
            <View style={[styles.statsRow, responsiveStyles.statsRow]}>
              <TouchableOpacity
                style={[styles.statCard, responsiveStyles.statCard]}
                onPress={() => handleStatCardPress("presentMales")}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.statIndicator, { backgroundColor: "#4CAF50" }]}
                />
                <Text style={[styles.statLabel, responsiveStyles.statLabel]}>
                  Present Males
                </Text>
                <Text style={[styles.statValue, responsiveStyles.statValue]}>
                  {todayStats?.presentMales ?? 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statCard, responsiveStyles.statCard]}
                onPress={() => handleStatCardPress("presentFemales")}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.statIndicator, { backgroundColor: "#4CAF50" }]}
                />
                <Text style={[styles.statLabel, responsiveStyles.statLabel]}>
                  Present Females
                </Text>
                <Text style={[styles.statValue, responsiveStyles.statValue]}>
                  {todayStats?.presentFemales ?? 0}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.statsRow, responsiveStyles.statsRow]}>
              <TouchableOpacity
                style={[styles.statCard, responsiveStyles.statCard]}
                onPress={() => handleStatCardPress("absentMales")}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.statIndicator, { backgroundColor: "#f44336" }]}
                />
                <Text style={[styles.statLabel, responsiveStyles.statLabel]}>
                  Absent Males
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    styles.absentValue,
                    responsiveStyles.statValue,
                  ]}
                >
                  {todayStats?.absentMales ?? 0}
                </Text>
              </TouchableOpacity>

              {/* Absent Females - Make it touchable */}
              <TouchableOpacity
                style={[styles.statCard, responsiveStyles.statCard]}
                onPress={() => handleStatCardPress("absentFemales")}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.statIndicator, { backgroundColor: "#f44336" }]}
                />
                <Text style={[styles.statLabel, responsiveStyles.statLabel]}>
                  Absent Females
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    styles.absentValue,
                    responsiveStyles.statValue,
                  ]}
                >
                  {todayStats?.absentFemales ?? 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Attendance Type Buttons */}
        <View
          style={[
            styles.attendanceButtonsContainer,
            responsiveStyles.attendanceButtonsContainer,
          ]}
        >
          <Text
            style={[
              styles.attendanceButtonsTitle,
              responsiveStyles.attendanceButtonsTitle,
            ]}
          >
            Attendance Type
          </Text>
          <View
            style={[
              styles.attendanceButtonsGrid,
              responsiveStyles.attendanceButtonsGrid,
            ]}
          >
            {ATTENDANCE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.attendanceButton,
                  responsiveStyles.attendanceButton,
                ]}
                onPress={() => handleAttendanceTypeSelect(type.id)}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale:
                          selectedAttendanceType === type.id
                            ? buttonPressAnim
                            : 1,
                      },
                    ],
                    borderRadius: 8,
                    overflow: "hidden",
                    flex: 1,
                    shadowColor:
                      selectedAttendanceType === type.id ? type.color : "#000",
                    shadowOffset: {
                      width: 0,
                      height: selectedAttendanceType === type.id ? 2 : 1,
                    },
                    shadowOpacity:
                      selectedAttendanceType === type.id ? 0.2 : 0.1,
                    shadowRadius: selectedAttendanceType === type.id ? 4 : 2,
                    elevation: selectedAttendanceType === type.id ? 3 : 2,
                  }}
                >
                  <LinearGradient
                    colors={
                      selectedAttendanceType === type.id
                        ? [type.color, type.color + "DD"]
                        : ["#f8f9fa", "#ffffff"]
                    }
                    style={[
                      styles.attendanceButtonGradient,
                      responsiveStyles.attendanceButtonGradient,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text
                      style={[
                        styles.attendanceButtonText,
                        responsiveStyles.attendanceButtonText,
                        {
                          color:
                            selectedAttendanceType === type.id
                              ? "#fff"
                              : "#333",
                          fontWeight:
                            selectedAttendanceType === type.id ? "bold" : "600",
                        },
                      ]}
                    >
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
          <View
            style={[styles.cameraContainer, responsiveStyles.cameraContainer]}
          >
            {scanningEnabled && !scanDelayActive ? (
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={
                  scanningEnabled &&
                  !scanned &&
                  !modalVisible &&
                  !errorModalVisible &&
                  isScreenFocused
                    ? handleBarcodeScanned
                    : undefined
                }
                barcodeScannerSettings={{
                  barcodeTypes: [
                    "qr",
                    "pdf417",
                    "aztec",
                    "ean13",
                    "ean8",
                    "upc_e",
                    "code128",
                    "code39",
                  ],
                }}
              >
                <View style={styles.scannerOverlay}>
                  <View
                    style={[styles.scannerFrame, responsiveStyles.scannerFrame]}
                  >
                    {/* Animated corners - opacity based on scanning state */}
                    <View
                      style={[
                        styles.corner,
                        styles.topLeft,
                        responsiveStyles.corner,
                        { opacity: scanningEnabled ? 1 : 0.3 },
                      ]}
                    />
                    <View
                      style={[
                        styles.corner,
                        styles.topRight,
                        responsiveStyles.corner,
                        { opacity: scanningEnabled ? 1 : 0.3 },
                      ]}
                    />
                    <View
                      style={[
                        styles.corner,
                        styles.bottomLeft,
                        responsiveStyles.corner,
                        { opacity: scanningEnabled ? 1 : 0.3 },
                      ]}
                    />
                    <View
                      style={[
                        styles.corner,
                        styles.bottomRight,
                        responsiveStyles.corner,
                        { opacity: scanningEnabled ? 1 : 0.3 },
                      ]}
                    />

                    {/* Animated scan line - only visible when scanning */}
                    {scanningEnabled && !modalVisible && !errorModalVisible && (
                      <Animated.View
                        style={[
                          styles.scanLine,
                          responsiveStyles.scanLine,
                          {
                            transform: [
                              {
                                translateY: scanLineAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [
                                    0,
                                    responsiveStyles.scannerFrame.height - 50,
                                  ],
                                }),
                              },
                            ],
                            opacity: scanLineAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0.8, 1, 0.8],
                            }),
                          },
                        ]}
                      />
                    )}

                    {/* Scanning status indicator */}
                    {(!scanningEnabled || scanDelayActive) && (
                      <View style={styles.scanStatusContainer}>
                        <View style={styles.scanStatusCard}>
                          <Text style={styles.scanStatusText}>
                            {modalVisible
                              ? "Processing..."
                              : errorModalVisible
                              ? "Error occurred"
                              : scanDelayActive
                              ? "Preparing scanner..."
                              : "Scanner paused"}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </CameraView>
            ) : (
              <View
                style={[
                  styles.camera,
                  {
                    backgroundColor: "#000",
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>
                  Preparing scanner...
                </Text>
              </View>
            )}
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
                  colors={["#4CAF50", "#45a049"]}
                  style={styles.successIconGradient}
                >
                  <Text style={styles.successIcon}>✓</Text>
                </LinearGradient>
              </View>
              <Text style={[styles.modalTitle, responsiveStyles.modalTitle]}>
                Attendance Recorded!
              </Text>
              <Text
                style={[styles.modalSubtitle, responsiveStyles.modalSubtitle]}
              >
                Student successfully checked in
              </Text>
            </View>

            {/* Attendance Details */}
            <View style={styles.modalBody}>
              <LinearGradient
                colors={[
                  getSelectedAttendanceType().color,
                  getSelectedAttendanceType().color + "CC",
                ]}
                style={styles.attendanceCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View
                  style={[
                    styles.attendanceCardContent,
                    responsiveStyles.attendanceCardContent,
                  ]}
                >
                  <Text
                    style={[
                      styles.attendanceCardLabel,
                      responsiveStyles.attendanceCardLabel,
                    ]}
                  >
                    {getSelectedAttendanceType().label}
                  </Text>
                  <Text style={styles.attendanceCardTime}>
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Text>
                </View>
              </LinearGradient>

              {/* Student Information */}
              {studentInfo && (
                <View
                  style={[styles.studentInfo, responsiveStyles.studentInfo]}
                >
                  <View style={styles.studentInfoRow}>
                    <Text style={styles.studentInfoLabel}>Name:</Text>
                    <Text style={styles.studentInfoValue}>
                      {studentInfo.name}
                    </Text>
                  </View>
                  <View style={styles.studentInfoRow}>
                    <Text style={styles.studentInfoLabel}>Student ID:</Text>
                    <Text style={styles.studentInfoValue}>
                      {studentInfo.code}
                    </Text>
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
                  colors={["#667eea", "#764ba2"]}
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

      {/* Error Modal */}
      <Modal
        transparent={true}
        visible={errorModalVisible}
        animationType="none"
        onRequestClose={handleCloseErrorModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.errorModalContent,
              responsiveStyles.modalContent,
              {
                opacity: errorFadeAnim,
                transform: [{ scale: errorScaleAnim }],
              },
            ]}
          >
            {/* Error Animation */}
            <View style={styles.modalHeader}>
              <View style={styles.errorIconContainer}>
                <LinearGradient
                  colors={["#FF6B6B", "#EE5A52"]}
                  style={styles.errorIconGradient}
                >
                  <Text style={styles.errorIcon}>⚠</Text>
                </LinearGradient>
              </View>
              <Text
                style={[
                  styles.modalTitle,
                  responsiveStyles.modalTitle,
                  styles.errorTitle,
                ]}
              >
                Attendance Error
              </Text>
              <Text
                style={[
                  styles.modalSubtitle,
                  responsiveStyles.modalSubtitle,
                  styles.errorSubtitle,
                ]}
              >
                {errorMessage}
              </Text>
            </View>

            {/* Error Details */}
            <View style={styles.modalBody}>
              <View style={styles.errorCard}>
                <View style={styles.errorCardContent}>
                  <Text style={styles.errorCardLabel}>
                    Session: {getSelectedAttendanceType().label}
                  </Text>
                  <Text style={styles.errorCardTime}>
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Text>
                  <Text style={styles.errorCardDate}>
                    {new Date().toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Error Modal Footer */}
            <View style={styles.modalFooter}>
              <View style={styles.countdownContainer}>
                <View
                  style={[styles.countdownCircle, styles.errorCountdownCircle]}
                >
                  <Text
                    style={[styles.countdownText, styles.errorCountdownText]}
                  >
                    {errorCountdown}
                  </Text>
                </View>
                <Text style={styles.autoCloseText}>Auto-closing</Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseErrorModal}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#FF6B6B", "#EE5A52"]}
                  style={styles.closeButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.closeButtonText}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Student List Modal */}
      <Modal
        transparent={true}
        visible={studentListModalVisible}
        animationType="none"
        onRequestClose={handleCloseStudentListModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleCloseStudentListModal}
          />
          <Animated.View
            style={[
              styles.studentListModalContent,
              {
                opacity: studentListFadeAnim,
                transform: [{ scale: studentListScaleAnim }],
                height: dimensions.height * 0.8,
                width: currentIsTablet ? "80%" : "90%",
                maxWidth: currentIsTablet ? 600 : 400,
              },
            ]}
          >
            {selectedCategory && (
              <>
                {/* Modal Header */}
                <View style={styles.studentListHeader}>
                  <Text
                    style={[
                      styles.studentListTitle,
                      { fontSize: currentIsTablet ? 24 : 20 },
                    ]}
                  >
                    {getCategoryDetails(selectedCategory).title}
                  </Text>
                  <Text
                    style={[
                      styles.studentListSubtitle,
                      { fontSize: currentIsTablet ? 16 : 14 },
                    ]}
                  >
                    {getSelectedAttendanceType().label} Session •{" "}
                    {new Date().toLocaleDateString()}
                  </Text>
                  <View style={styles.studentCountBadge}>
                    <Text style={styles.studentCountText}>
                      {getCategoryDetails(selectedCategory).students.length}{" "}
                      Student
                      {getCategoryDetails(selectedCategory).students.length !==
                      1
                        ? "s"
                        : ""}
                    </Text>
                  </View>
                </View>

                {/* Loading Overlay */}
                {studentListLoading && (
                  <View style={styles.loadingOverlay}>
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#667eea" />
                    </View>
                  </View>
                )}

                {/* Student List */}
                <View style={styles.studentListBody}>
                  {getCategoryDetails(selectedCategory).students.length > 0 ? (
                    <ScrollView
                      style={styles.studentScrollView}
                      contentContainerStyle={{ paddingBottom: 20 }}
                      showsVerticalScrollIndicator={true}
                      bounces={false}
                    >
                      {getCategoryDetails(selectedCategory).students.map(
                        (student, index) => (
                          <View
                            key={student.id}
                            style={[
                              styles.studentListItem,
                              {
                                marginBottom:
                                  index ===
                                  getCategoryDetails(selectedCategory).students
                                    .length -
                                    1
                                    ? 0
                                    : 12,
                        
                              },
                            ]}
                          >
                            <View style={styles.studentItemLeft}>
                              <View
                                style={[
                                  styles.studentAvatar,
                                  {
                                    backgroundColor:
                                      getCategoryDetails(selectedCategory)
                                        .color + "20",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.studentAvatarText,
                                    {
                                      color:
                                        getCategoryDetails(selectedCategory)
                                          .color,
                                    },
                                  ]}
                                >
                                  {student.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <View style={styles.studentInfoContainer}>
                                <Text
                                  style={[
                                    styles.studentName,
                                  
                                  ]}
              
                                >
                                  {student.name}
                                </Text>
                                <View
                                  style={[
                                    styles.studentStatusBadge,
                                    {
                                      backgroundColor:
                                        selectedCategory.includes("present")
                                          ? "#4CAF50"
                                          : "#f44336",
                                    },
                                  ]}
                                >
                                  <Text style={styles.studentStatusText}>
                                    {selectedCategory.includes("present")
                                      ? "Present"
                                      : "Absent"}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            
                          </View>
                        )
                      )}
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyStateContainer}>
                      <Text style={styles.emptyStateIcon}>📝</Text>
                      <Text style={styles.emptyStateTitle}>
                        No Students Found
                      </Text>
                      <Text style={styles.emptyStateMessage}>
                        No students in this category for the current session.
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  studentListLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    fontWeight: "500",
  },
  loadingSubtext: {
    fontSize: 16,
    color: "#333",
    opacity: 0.7,
  },

  // Permission States
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 30,
  },
  permissionIcon: {
    fontSize: 80,
    marginBottom: 30,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  permissionMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  permissionButton: {
    borderRadius: 30,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  permissionButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Header Section
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },

  // Statistics Section
  statsContainer: {
    width: "100%",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  statIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
    textAlign: "center",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  absentValue: {
    color: "#f44336",
  },

  // Attendance Buttons Section
  attendanceButtonsContainer: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  attendanceButtonsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  attendanceButtonsGrid: {
    flexDirection: "row",
    gap: 6,
  },
  attendanceButton: {
    flex: 1,
    minHeight: 32,
  },
  attendanceButtonGradient: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
    position: "relative",
  },
  attendanceButtonText: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 12,
  },
  selectedIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIcon: {
    fontSize: 8,
    color: "#4CAF50",
    fontWeight: "bold",
  },

  // Main Content
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 25,
  },

  // Scanner Section
  scannerSection: {
    alignItems: "center",
    flex: 1,
    minHeight: screenHeight * 0.4,
  },
  scannerHeader: {
    alignItems: "center",
    marginBottom: 10,
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  scannerSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  cameraContainer: {
    width: 300,
    height: 300,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 24,
    shadowColor: "#000",
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  // Scanner Frame
  scannerFrame: {
    width: 200,
    height: 200,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#00FF88",
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
    position: "absolute",
    left: 15,
    right: 15,
    height: 3,
    backgroundColor: "#00FF88",
    borderRadius: 2,
    shadowColor: "#00FF88",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },

  // Scan Status Styles
  scanStatusContainer: {
    position: "absolute",
    bottom: -40,
    left: -50,
    right: -50,
    alignItems: "center",
  },
  scanStatusCard: {
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  scanStatusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 25,
    width: "100%",
    maxWidth: 380,
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 25,
  },
  successIconContainer: {
    marginBottom: 20,
    borderRadius: 50,
    overflow: "hidden",
  },
  successIconGradient: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  successIcon: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "bold",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  modalBody: {
    marginBottom: 25,
  },
  attendanceCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  attendanceCardContent: {
    padding: 20,
    alignItems: "center",
  },
  attendanceCardLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  attendanceCardTime: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  studentInfoContainer: {
    flex: 1,
    minWidth: 0,
    marginLeft: 0,
    // backgroundColor: '#999999'
  },  
  studentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  studentInfoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  studentInfoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
    textAlign: "right",
    flex: 1,
    marginLeft: 10,
  },
  modalFooter: {
    flexDirection: isTablet ? "row" : "column",
    justifyContent: "space-between",
    alignItems: "center",
    gap: isTablet ? 0 : 15,
  },
  countdownContainer: {
    alignItems: "center",
    order: isTablet ? 1 : 2,
  },
  countdownCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  autoCloseText: {
    fontSize: 12,
    color: "#999",
  },
  closeButton: {
    borderRadius: 25,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Error Modal Styles
  errorModalContent: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 25,
    width: "100%",
    maxWidth: 380,
    elevation: 25,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255, 107, 107, 0.2)",
  },
  errorIconContainer: {
    marginBottom: 20,
    borderRadius: 50,
    overflow: "hidden",
  },
  errorIconGradient: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  errorIcon: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "bold",
  },
  errorTitle: {
    color: "#FF6B6B",
  },
  errorSubtitle: {
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  errorCard: {
    backgroundColor: "#FFE8E8",
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  errorCardContent: {
    alignItems: "center",
  },
  errorCardLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 4,
    textAlign: "center",
  },
  errorCardTime: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 2,
  },
  errorCardDate: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  errorCountdownCircle: {
    backgroundColor: "#FFE8E8",
    borderWidth: 2,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  errorCountdownText: {
    color: "#FF6B6B",
  },

  // Student List Modal

  studentListModalContent: {
    backgroundColor: "#ffff",
    borderRadius: 18,
    overflow: "hidden",
    elevation: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  studentListHeader: {
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  studentListIconContainer: {
    marginBottom: 15,
    borderRadius: 50,
    overflow: "hidden",
  },
  studentListIconGradient: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  studentListIcon: {
    fontSize: 28,
  },
  studentListTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
  },
  studentListSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },

  studentCountBadge: {
    backgroundColor: "#667eea",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  studentCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  studentListBody: {
    padding: 20,
    flex:1
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  studentScrollView: {
    padding: 8,
    flex: 1
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  emptyStateContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.8,
  },
  studentListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  studentItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  studentAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  studentName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4, // Add some bottom margin for the status badge
  },
  studentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 50,
    alignItems: "center",
    alignSelf: "flex-start", // Align to start since it's now under the name
  },

  studentStatusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
});
