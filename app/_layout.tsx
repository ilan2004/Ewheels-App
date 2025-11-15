import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { SplashScreen } from '@/components/splash-screen';
import { Colors } from '@/constants/design-system';

// Create a client instance for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Custom theme with green primary color
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.success[600], // Green instead of blue
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.success[500], // Lighter green for dark mode
  },
};

export const unstable_settings = {
  anchor: '(auth)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { checkAuthState, initialized } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);
  
  // Load Inter fonts
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  // Show splash screen while initializing, loading fonts, or if explicitly showing splash
  if (!initialized || !fontsLoaded || showSplash) {
    return (
      <SplashScreen 
        onComplete={() => {
          // Only hide splash if auth is also initialized and fonts are loaded
          if (initialized && fontsLoaded) {
            setShowSplash(false);
          }
        }}
      />
    );
  }

  // Final safety check
  if (!initialized || !fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
