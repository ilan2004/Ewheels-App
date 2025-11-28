import { useAuthStore } from '@/stores/authStore';
import { Redirect } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuthStore();

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = user.role;

  // Redirect based on role
  if (role === 'technician') {
    return <Redirect href="/(tabs)/technician-jobcards" />;
  }

  if (role === 'floor_manager') {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  if (role === 'front_desk_manager' || role === 'manager') {
    return <Redirect href="/(tabs)/front-desk-dashboard" />;
  }

  if (role === 'admin') {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  // Fallback
  return <Redirect href="/(tabs)/dashboard" />;
}
