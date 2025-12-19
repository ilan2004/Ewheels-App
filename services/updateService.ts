import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface AppVersion {
    version: string;
    versionCode: number;
    releaseDate: string;
    downloadUrl: string;
    releaseNotes: string[];
    mandatory: boolean;
    minSupportedVersion?: string;
}

export interface UpdateCheckResult {
    updateAvailable: boolean;
    latestVersion?: AppVersion;
    currentVersion: string;
    currentVersionCode: number;
}

/**
 * Service for checking and managing app updates for APK distribution
 */
class UpdateService {
    // URL where you'll host the version metadata JSON
    // This should be a publicly accessible URL (e.g., GitHub Pages, your server, etc.)
    private readonly UPDATE_METADATA_URL = 'https://your-domain.com/ewheels-app/version.json';

    private readonly LAST_CHECK_KEY = 'last_update_check';
    private readonly DISMISSED_VERSION_KEY = 'dismissed_update_version';

    /**
     * Get current app version from app.json
     */
    getCurrentVersion(): { version: string; versionCode: number } {
        const version = Constants.expoConfig?.version || '1.0.0';
        const versionCode = Platform.OS === 'android'
            ? Constants.expoConfig?.android?.versionCode || 1
            : 1;

        return { version, versionCode };
    }

    /**
     * Fetch latest version metadata from server
     */
    async fetchLatestVersion(): Promise<AppVersion | null> {
        try {
            const response = await fetch(this.UPDATE_METADATA_URL, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });

            if (!response.ok) {
                console.error('Failed to fetch update metadata:', response.status);
                return null;
            }

            const data: AppVersion = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching update metadata:', error);
            return null;
        }
    }

    /**
     * Check if an update is available
     */
    async checkForUpdates(): Promise<UpdateCheckResult> {
        const current = this.getCurrentVersion();
        const latest = await this.fetchLatestVersion();

        if (!latest) {
            return {
                updateAvailable: false,
                currentVersion: current.version,
                currentVersionCode: current.versionCode,
            };
        }

        // Compare version codes (more reliable than version strings)
        const updateAvailable = latest.versionCode > current.versionCode;

        return {
            updateAvailable,
            latestVersion: updateAvailable ? latest : undefined,
            currentVersion: current.version,
            currentVersionCode: current.versionCode,
        };
    }

    /**
     * Download and install APK update
     * Note: This only works on Android
     */
    async downloadAndInstallUpdate(downloadUrl: string): Promise<boolean> {
        if (Platform.OS !== 'android') {
            console.warn('APK installation is only supported on Android');
            return false;
        }

        try {
            const fileUri = `${FileSystem.documentDirectory}ewheels-app-update.apk`;

            // Download the APK
            const downloadResumable = FileSystem.createDownloadResumable(
                downloadUrl,
                fileUri,
                {},
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    console.log(`Download progress: ${(progress * 100).toFixed(2)}%`);
                }
            );

            const result = await downloadResumable.downloadAsync();

            if (!result) {
                console.error('Download failed');
                return false;
            }

            // Open the APK for installation
            // Note: User will need to allow installation from unknown sources
            await Linking.openURL(`file://${result.uri}`);

            return true;
        } catch (error) {
            console.error('Error downloading/installing update:', error);
            return false;
        }
    }

    /**
     * Send a local notification about available update
     */
    async notifyUpdateAvailable(version: AppVersion): Promise<void> {
        try {
            const { status } = await Notifications.getPermissionsAsync();

            if (status !== 'granted') {
                const { status: newStatus } = await Notifications.requestPermissionsAsync();
                if (newStatus !== 'granted') {
                    console.warn('Notification permission not granted');
                    return;
                }
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🚀 Update Available',
                    body: `Ewheels App v${version.version} is now available. Tap to update.`,
                    data: {
                        type: 'app_update',
                        version: version.version,
                        downloadUrl: version.downloadUrl,
                    },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: null, // Show immediately
            });
        } catch (error) {
            console.error('Error sending update notification:', error);
        }
    }

    /**
     * Check if user has dismissed this version
     */
    async hasUserDismissedVersion(versionCode: number): Promise<boolean> {
        try {
            const dismissed = await AsyncStorage.getItem(this.DISMISSED_VERSION_KEY);
            return dismissed === versionCode.toString();
        } catch {
            return false;
        }
    }

    /**
     * Mark version as dismissed by user
     */
    async dismissVersion(versionCode: number): Promise<void> {
        try {
            await AsyncStorage.setItem(this.DISMISSED_VERSION_KEY, versionCode.toString());
        } catch (error) {
            console.error('Error saving dismissed version:', error);
        }
    }

    /**
     * Clear dismissed version (e.g., when user manually checks for updates)
     */
    async clearDismissedVersion(): Promise<void> {
        try {
            await AsyncStorage.removeItem(this.DISMISSED_VERSION_KEY);
        } catch (error) {
            console.error('Error clearing dismissed version:', error);
        }
    }

    /**
     * Get last update check timestamp
     */
    async getLastCheckTime(): Promise<number | null> {
        try {
            const timestamp = await AsyncStorage.getItem(this.LAST_CHECK_KEY);
            return timestamp ? parseInt(timestamp, 10) : null;
        } catch {
            return null;
        }
    }

    /**
     * Update last check timestamp
     */
    async updateLastCheckTime(): Promise<void> {
        try {
            await AsyncStorage.setItem(this.LAST_CHECK_KEY, Date.now().toString());
        } catch (error) {
            console.error('Error updating last check time:', error);
        }
    }

    /**
     * Should check for updates based on last check time
     * Default: check once per day
     */
    async shouldCheckForUpdates(intervalHours: number = 24): Promise<boolean> {
        const lastCheck = await this.getLastCheckTime();
        if (!lastCheck) return true;

        const hoursSinceLastCheck = (Date.now() - lastCheck) / (1000 * 60 * 60);
        return hoursSinceLastCheck >= intervalHours;
    }
}

export const updateService = new UpdateService();
