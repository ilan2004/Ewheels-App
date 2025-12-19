import Constants from 'expo-constants';
import React from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateService } from '../services/updateService';

export default function AboutScreen() {
    const version = Constants.expoConfig?.version || '1.0.0';
    const versionCode = Constants.expoConfig?.android?.versionCode || 1;
    const appName = Constants.expoConfig?.name || 'Ewheels App';

    const handleCheckUpdates = async () => {
        try {
            await updateService.clearDismissedVersion();
            const result = await updateService.checkForUpdates();

            if (result.updateAvailable && result.latestVersion) {
                Alert.alert(
                    'Update Available',
                    `Version ${result.latestVersion.version} is available. Would you like to update now?`,
                    [
                        { text: 'Later', style: 'cancel' },
                        {
                            text: 'Update',
                            onPress: async () => {
                                await updateService.downloadAndInstallUpdate(
                                    result.latestVersion!.downloadUrl
                                );
                            },
                        },
                    ]
                );
            } else {
                Alert.alert(
                    'No Updates',
                    'You are using the latest version of the app.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to check for updates. Please try again later.');
        }
    };

    const handleOpenWebsite = () => {
        Linking.openURL('https://your-company-website.com');
    };

    const handleContactSupport = () => {
        Linking.openURL('mailto:support@your-company.com');
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* App Info */}
                <View style={styles.section}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>⚡</Text>
                    </View>
                    <Text style={styles.appName}>{appName}</Text>
                    <Text style={styles.tagline}>
                        Professional EV Service Management
                    </Text>
                </View>

                {/* Version Info */}
                <View style={styles.section}>
                    <View style={styles.infoCard}>
                        <InfoRow label="Version" value={version} />
                        <InfoRow label="Build Number" value={versionCode.toString()} />
                        <InfoRow label="Package" value="com.ilan20.EvWheelsApp" />
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.section}>
                    <ActionButton
                        title="Check for Updates"
                        icon="🔄"
                        onPress={handleCheckUpdates}
                    />
                    <ActionButton
                        title="Visit Website"
                        icon="🌐"
                        onPress={handleOpenWebsite}
                    />
                    <ActionButton
                        title="Contact Support"
                        icon="📧"
                        onPress={handleContactSupport}
                    />
                </View>

                {/* About */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.description}>
                        Ewheels App is a comprehensive service management system designed for
                        electric vehicle repair and maintenance businesses. Streamline your
                        operations with job card management, battery tracking, customer
                        records, and financial reporting.
                    </Text>
                </View>

                {/* Legal */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Legal</Text>
                    <TouchableOpacity style={styles.legalLink}>
                        <Text style={styles.legalLinkText}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.legalLink}>
                        <Text style={styles.legalLinkText}>Terms of Service</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.legalLink}>
                        <Text style={styles.legalLinkText}>Open Source Licenses</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        © 2025 Ewheels. All rights reserved.
                    </Text>
                    <Text style={styles.footerSubtext}>
                        Made with ❤️ for EV service professionals
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

function ActionButton({
    title,
    icon,
    onPress,
}: {
    title: string;
    icon: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <Text style={styles.actionIcon}>{icon}</Text>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#0EA5E9',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    logoText: {
        fontSize: 40,
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 4,
    },
    tagline: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoLabel: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    actionIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    actionTitle: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '600',
    },
    actionChevron: {
        fontSize: 24,
        color: '#9CA3AF',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
    },
    legalLink: {
        paddingVertical: 12,
    },
    legalLinkText: {
        fontSize: 15,
        color: '#0EA5E9',
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    footerText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 13,
        color: '#9CA3AF',
    },
});
