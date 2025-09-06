import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useInitializeTablesStore } from "@/store/initializeTablesStore";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { initializeTables, isInitialized, isInitializing, initializationError } = useInitializeTablesStore();

  // Initialize database when tab layout mounts
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

  // Optional: Log status changes for debugging
  useEffect(() => {
    if (isInitialized) {
      console.log("✅ Database is ready for use");
    } else if (isInitializing) {
      console.log("⏳ Database initialization in progress...");
    } else if (initializationError) {
      console.error("❌ Database initialization error:", initializationError);
    }
  }, [isInitialized, isInitializing, initializationError]);

  return (
    <Tabs
      screenOptions={{
        // Enhanced color scheme
        tabBarActiveTintColor: "#10B981", // Green theme to match your app
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault || "#6B7280",
        
        // Header configuration
        headerShown: false,
        
        // Interactive elements
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        
        // Hide labels
        tabBarShowLabel: false,
        
        // Compact styling
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderTopWidth: 0,
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            height: 60,
            paddingTop: 8,
            paddingBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
          },
          android: {
            backgroundColor: "#FFFFFF",
            borderTopWidth: 0,
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            height: 55,
            paddingTop: 6,
            paddingBottom: 6,
            elevation: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
          },
          default: {
            backgroundColor: "#FFFFFF",
            borderTopWidth: 0,
            height: 55,
            paddingTop: 6,
            paddingBottom: 6,
          },
        }),
        
        // Icon styling
        tabBarIconStyle: {
          marginTop: 0,
        },
        
        // Item styling - more compact
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 26 : 24} 
              name={focused ? "house.fill" : "house"} 
              color={color} 
            />
          ),
          tabBarAccessibilityLabel: "Home Tab",
        }}
      />
      
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan QR",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 26 : 24} 
              name={focused ? "qrcode" : "qrcode"} 
              color={color} 
            />
          ),
          tabBarAccessibilityLabel: "QR Code Scanner Tab",
        }}
      />
      
      <Tabs.Screen
        name="record"
        options={{
          title: "Records",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 26 : 24} 
              name={focused ? "doc.text.fill" : "doc.text"} 
              color={color} 
            />
          ),
          tabBarAccessibilityLabel: "Attendance Records Tab",
        }}
      />
    </Tabs>
  );
}