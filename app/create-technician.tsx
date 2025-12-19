import { router, Stack } from 'expo-router';
import React from 'react';

import { CreateTechnicianForm } from '@/components/floor-manager/create-technician-form';

export default function CreateTechnicianScreen() {
  const handleSuccess = () => {
    // Navigate back to floor manager dashboard
    router.back();
  };

  const handleCancel = () => {
    // Navigate back without changes
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <CreateTechnicianForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </>
  );
}
