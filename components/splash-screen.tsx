import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SplashLogo } from './SplashLogo';

interface SplashScreenProps {
  onComplete?: () => void;
}

/**
 * Simple Splash Screen Component
 * 
 * Displays only the EvWheels logo on a plain white background.
 * Shows for 2 seconds while the app initializes authentication.
 */
export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    // Simple 2-second timer
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SplashLogo
        width={300}
        height={125}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure white background
    justifyContent: 'center',
    alignItems: 'center',
  },
});
