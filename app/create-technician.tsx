import React from 'react';
import { router, Stack } from 'expo-router';

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
          title: 'Create Technician',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#111827',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
          presentation: 'modal',
        }}
      />
      <CreateTechnicianForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </>
  );
}
