import { router, Stack } from 'expo-router';
import React from 'react';

import { CreateTechnicianForm } from '@/components/floor-manager/create-technician-form';
import { BrandColors } from '@/constants/design-system';

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
            backgroundColor: BrandColors.surface,
          },
          headerTintColor: BrandColors.primary,
          headerTitleStyle: {
            fontWeight: '600',
            color: BrandColors.ink,
          },
          headerShadowVisible: false,
          presentation: 'modal',
        }}
      />
      <CreateTechnicianForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </>
  );
}
