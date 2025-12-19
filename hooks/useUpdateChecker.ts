import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AppVersion, UpdateCheckResult, updateService } from '../services/updateService';

interface UseUpdateCheckerOptions {
    checkOnMount?: boolean;
    checkOnAppForeground?: boolean;
    checkIntervalHours?: number;
    onUpdateAvailable?: (version: AppVersion) => void;
}

interface UseUpdateCheckerReturn {
    updateAvailable: boolean;
    latestVersion: AppVersion | null;
    isChecking: boolean;
    checkForUpdates: () => Promise<void>;
    downloadAndInstall: () => Promise<void>;
    dismissUpdate: () => Promise<void>;
    isDownloading: boolean;
}

/**
 * Hook for managing app update checks and notifications
 */
export function useUpdateChecker(options: UseUpdateCheckerOptions = {}): UseUpdateCheckerReturn {
    const {
        checkOnMount = true,
        checkOnAppForeground = true,
        checkIntervalHours = 24,
        onUpdateAvailable,
    } = options;

    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [latestVersion, setLatestVersion] = useState<AppVersion | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const checkForUpdates = async () => {
        if (isChecking) return;

        setIsChecking(true);
        try {
            const shouldCheck = await updateService.shouldCheckForUpdates(checkIntervalHours);

            if (!shouldCheck) {
                setIsChecking(false);
                return;
            }

            const result: UpdateCheckResult = await updateService.checkForUpdates();
            await updateService.updateLastCheckTime();

            if (result.updateAvailable && result.latestVersion) {
                // Check if user has dismissed this version
                const dismissed = await updateService.hasUserDismissedVersion(
                    result.latestVersion.versionCode
                );

                if (!dismissed || result.latestVersion.mandatory) {
                    setUpdateAvailable(true);
                    setLatestVersion(result.latestVersion);

                    // Send notification
                    await updateService.notifyUpdateAvailable(result.latestVersion);

                    // Call callback if provided
                    if (onUpdateAvailable) {
                        onUpdateAvailable(result.latestVersion);
                    }
                }
            } else {
                setUpdateAvailable(false);
                setLatestVersion(null);
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        } finally {
            setIsChecking(false);
        }
    };

    const downloadAndInstall = async () => {
        if (!latestVersion || isDownloading) return;

        setIsDownloading(true);
        try {
            const success = await updateService.downloadAndInstallUpdate(latestVersion.downloadUrl);

            if (!success) {
                console.error('Failed to download and install update');
            }
        } catch (error) {
            console.error('Error during update download/install:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const dismissUpdate = async () => {
        if (!latestVersion) return;

        await updateService.dismissVersion(latestVersion.versionCode);
        setUpdateAvailable(false);
        setLatestVersion(null);
    };

    // Check on mount
    useEffect(() => {
        if (checkOnMount) {
            checkForUpdates();
        }
    }, []);

    // Check when app comes to foreground
    useEffect(() => {
        if (!checkOnAppForeground) return;

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                checkForUpdates();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [checkOnAppForeground]);

    return {
        updateAvailable,
        latestVersion,
        isChecking,
        checkForUpdates,
        downloadAndInstall,
        dismissUpdate,
        isDownloading,
    };
}
