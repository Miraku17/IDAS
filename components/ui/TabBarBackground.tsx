import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

// Custom TabBarBackground component
export default function TabBarBackground() {
  if (Platform.OS === 'ios') {
    // Use BlurView for iOS to get that native blur effect
    return (
      <BlurView
        style={StyleSheet.absoluteFill}
        intensity={100}
        tint="dark"
      />
    );
  }

  // For Android and Web, use a solid/gradient background
  return (
    <View style={[StyleSheet.absoluteFill, styles.background]} />
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    // You can also use gradient here if you want
    // backgroundImage: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%)',
  },
});

export function useBottomTabOverflow() {
  return 12; // Adjust this value to control how much the tab bar overlaps content
}