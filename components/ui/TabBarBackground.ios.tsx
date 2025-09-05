import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

export default function BlurTabBarBackground() {
  return (
    <BlurView
      // System chrome material automatically adapts to the system's theme
      // and matches the native tab bar appearance on iOS.
      tint="systemChromeMaterial"
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}


// import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
// import { LinearGradient } from 'expo-linear-gradient';
// import { StyleSheet, View } from 'react-native';
// import { useColorScheme } from '@/hooks/useColorScheme';

// export default function GradientTabBarBackground() {
//   const colorScheme = useColorScheme();

//   const lightGradient = [
//     'rgba(255, 255, 255, 0.98)',
//     'rgba(248, 250, 252, 0.95)',
//     'rgba(240, 253, 244, 0.9)', // Your app's light green tint
//   ];

//   const darkGradient = [
//     'rgba(31, 41, 55, 0.98)',
//     'rgba(17, 24, 39, 0.95)',
//     'rgba(6, 78, 59, 0.9)', // Dark green tint
//   ];

//   return (
//     <View style={StyleSheet.absoluteFill}>
//       <LinearGradient
//         colors={colorScheme === 'dark' ? darkGradient : lightGradient}
//         style={[StyleSheet.absoluteFill, styles.gradient]}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//       />
      
//       {/* Top accent line */}
//       <LinearGradient
//         colors={colorScheme === 'dark' 
//           ? ['rgba(255, 255, 255, 0.2)', 'rgba(16, 185, 129, 0.3)']
//           : ['rgba(16, 185, 129, 0.4)', 'rgba(6, 182, 212, 0.2)']
//         }
//         style={styles.topAccent}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 0 }}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   gradient: {
//     borderTopLeftRadius: 15,
//     borderTopRightRadius: 15,
//   },
  
//   topAccent: {
//     position: 'absolute',
//     top: 0,
//     left: 15,
//     right: 15,
//     height: 2,
//     borderTopLeftRadius: 15,
//     borderTopRightRadius: 15,
//   },
// });

// export function useBottomTabOverflow() {
//   const tabBarHeight = useBottomTabBarHeight();
//   return tabBarHeight + 8;
// }