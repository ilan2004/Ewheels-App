import { router, Stack } from 'expo-router';
import React from 'react';

import { CreateUserForm } from '@/components/admin/create-user-form';

export default function CreateUserScreen() {
    const handleSuccess = () => {
        // Navigate back to profile
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
            <CreateUserForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </>
    );
}
