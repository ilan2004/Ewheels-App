import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import UpdateDialog from '../components/ui/UpdateDialog';
import { useUpdateChecker } from '../hooks/useUpdateChecker';

/**
 * Example integration of the update checker in your main app component
 * 
 * Add this to your root layout or main app component (e.g., app/_layout.tsx)
 */
export default function AppWithUpdateChecker() {
    const {
        updateAvailable,
        latestVersion,
        isChecking,
        checkForUpdates,
        downloadAndInstall,
        dismissUpdate,
        isDownloading,
    } = useUpdateChecker({
        checkOnMount: true,
        checkOnAppForeground: true,
        checkIntervalHours: 24, // Check once per day
        onUpdateAvailable: (version) => {
            console.log('New update available:', version.version);
        },
    });

    return (
        <>
            {/* Your app content */}
            <View style={styles.container}>
                <Text>Your App Content Here</Text>

                {/* Optional: Manual check button in settings */}
                <TouchableOpacity
                    style={styles.checkButton}
                    onPress={checkForUpdates}
                    disabled={isChecking}
                >
                    <Text style={styles.checkButtonText}>
                        {isChecking ? 'Checking...' : 'Check for Updates'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Update Dialog */}
            <UpdateDialog
                visible={updateAvailable}
                version={latestVersion}
                onUpdate={downloadAndInstall}
                onDismiss={() => {
                    // User clicked "Later"
                    // Don't dismiss the version, show again next time
                }}
                onSkip={dismissUpdate}
                isDownloading={isDownloading}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#0EA5E9',
        borderRadius: 8,
    },
    checkButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
