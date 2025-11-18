import { Stack } from 'expo-router';

export default function InvoicesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="create" 
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
