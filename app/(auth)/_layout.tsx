import { Redirect } from 'expo-router';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

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
      case 'front_desk_manager':
      case 'manager':
        return <Redirect href="/(tabs)/dashboard" />;
      case 'technician':
        return <Redirect href="/(tabs)/technician" />;
      default:
        return <Redirect href="/(tabs)" />;
    }
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}
