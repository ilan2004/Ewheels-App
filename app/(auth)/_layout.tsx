import { useAuthStore } from '@/stores/authStore';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { user, loading } = useAuthStore();

  if (loading) {
    // You could show a loading screen here
    return null;
  }

  if (user) {
    // User is authenticated, redirect to main app based on role
    switch (user.role) {
      case 'admin':
        return <Redirect href="/(tabs)/dashboard" />;
      case 'front_desk_manager':
      case 'manager':
        return <Redirect href="/(tabs)/front-desk-dashboard" />;
      case 'technician':
        return <Redirect href="/(tabs)/technician-jobcards" />;
      case 'floor_manager':
        return <Redirect href="/(tabs)/dashboard" />;
      default:
        return <Redirect href="/(tabs)/dashboard" />;
    }
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}
