import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, Dimensions, View } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useInitializeTablesStore } from "@/store/initializeTablesStore";

export default function TabLayout() {
  const { initializeTables, isInitialized, isInitializing, initializationError } =
    useInitializeTablesStore();

  // Screen size detection
  const { width: screenWidth } = Dimensions.get("window");
  const isSmallScreen = screenWidth < 375;
  const isLargeScreen = screenWidth > 600;

  // Initialize database
  useEffect(() => {
    const initDB = async () => {
      try {
        console.log("🚀 Starting database initialization from TabLayout...");
        await initializeTables();
        console.log("✅ Database initialization completed in TabLayout");
      } catch (error) {
        console.error("❌ Database initialization failed in TabLayout:", error);
      }
    };
    initDB();
  }, [initializeTables]);

  // Log DB state
  useEffect(() => {
    if (isInitialized) {
      console.log("✅ Database is ready for use");
    } else if (isInitializing) {
      console.log("⏳ Database initialization in progress...");
    } else if (initializationError) {
      console.error("❌ Database initialization error:", initializationError);
    }
  }, [isInitialized, isInitializing, initializationError]);

  // Responsive tab bar dimensions
  const getResponsiveDimensions = () => {
    if (isSmallScreen) {
      return { height: 58, iconSize: { focused: 24, unfocused: 22 } };
    } else if (isLargeScreen) {
      return { height: 72, iconSize: { focused: 30, unfocused: 28 } };
    } else {
      return { height: 64, iconSize: { focused: 26, unfocused: 24 } };
    }
  };
  const dimensions = getResponsiveDimensions();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#16A34A", // modern green
        tabBarInactiveTintColor: "#9CA3AF", // gray-400
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,

        // Floating pill style
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          height: dimensions.height,
          marginHorizontal: isLargeScreen ? 24 : 16,
          marginBottom: Platform.OS === "ios" ? 20 : 16,
          borderRadius: 28,
          overflow: "hidden",
          paddingBottom: 0,
          paddingTop: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },

        // Center icons vertically
        tabBarIconStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },

        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          minWidth: isSmallScreen ? 60 : isLargeScreen ? 90 : 75,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <IconSymbol
                size={
                  focused
                    ? dimensions.iconSize.focused
                    : dimensions.iconSize.unfocused
                }
                name={focused ? "house.fill" : "house"}
                color={color}
              />
            </View>
          ),
          tabBarAccessibilityLabel: "Home Tab",
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <IconSymbol
                size={
                  focused
                    ? dimensions.iconSize.focused
                    : dimensions.iconSize.unfocused
                }
                name={focused ? "camera.fill" : "camera"}
                color={color}
              />
            </View>
          ),
          tabBarAccessibilityLabel: "Camera Scanner Tab",
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: "Records",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <IconSymbol
                size={
                  focused
                    ? dimensions.iconSize.focused
                    : dimensions.iconSize.unfocused
                }
                name={focused ? "doc.text.fill" : "doc.text"}
                color={color}
              />
            </View>
          ),
          tabBarAccessibilityLabel: "Attendance Records Tab",
        }}
      />
    </Tabs>
  );
}
