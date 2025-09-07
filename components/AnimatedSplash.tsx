import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the native splash from auto-hiding
SplashScreen.preventAutoHideAsync();

interface AnimatedSplashProps {
  onAnimationFinish: () => void;
}

const { width, height } = Dimensions.get('window');

export default function AnimatedSplash({ onAnimationFinish }: AnimatedSplashProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.3));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [circleScale1] = useState(new Animated.Value(0));
  const [circleScale2] = useState(new Animated.Value(0));
  const [circleScale3] = useState(new Animated.Value(0));

  useEffect(() => {
    // Hide the native splash screen
    SplashScreen.hideAsync();

    // Animate background circles first
    Animated.stagger(200, [
      Animated.spring(circleScale1, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(circleScale2, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(circleScale3, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Then animate logo
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Wait a bit before finishing
        setTimeout(() => {
          onAnimationFinish();
        }, 1000);
      });
    }, 400);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background gradient circles */}
      <Animated.View 
        style={[
          styles.backgroundCircle,
          styles.circle1,
          { transform: [{ scale: circleScale1 }] }
        ]} 
      />
      <Animated.View 
        style={[
          styles.backgroundCircle,
          styles.circle2,
          { transform: [{ scale: circleScale2 }] }
        ]} 
      />
      <Animated.View 
        style={[
          styles.backgroundCircle,
          styles.circle3,
          { transform: [{ scale: circleScale3 }] }
        ]} 
      />

      {/* Floating shapes */}
      <View style={styles.shape1} />
      <View style={styles.shape2} />
      <View style={styles.shape3} />

      {/* Logo container */}
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: spin }
            ],
          },
        ]}
      >
        <View style={styles.logoBackground}>
          <Image 
            source={require('../assets/images/logo_1.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* Subtle overlay gradient */}
      <View style={styles.overlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    pointerEvents: 'none',
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.1,
  },
  circle1: {
    width: width * 1.5,
    height: width * 1.5,
    backgroundColor: '#764ba2',
    top: -width * 0.4,
    left: -width * 0.3,
  },
  circle2: {
    width: width * 1.2,
    height: width * 1.2,
    backgroundColor: '#f093fb',
    bottom: -width * 0.3,
    right: -width * 0.2,
  },
  circle3: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: '#4facfe',
    top: height * 0.15,
    right: -width * 0.2,
  },
  shape1: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    top: height * 0.2,
    left: width * 0.1,
  },
  shape2: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    bottom: height * 0.25,
    left: width * 0.15,
    transform: [{ rotate: '45deg' }],
  },
  shape3: {
    position: 'absolute',
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 40,
    top: height * 0.3,
    right: width * 0.1,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoBackground: {
    width: width * 0.5,
    height: width * 0.5,
    backgroundColor: '#1a4d3a',
    borderRadius: width * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
  },
});