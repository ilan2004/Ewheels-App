import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppVersion } from '../../services/updateService';

interface UpdateDialogProps {
    visible: boolean;
    version: AppVersion | null;
    onUpdate: () => Promise<void>;
    onDismiss: () => void;
    onSkip?: () => void;
    isDownloading?: boolean;
}

export default function UpdateDialog({
    visible,
    version,
    onUpdate,
    onDismiss,
    onSkip,
    isDownloading = false,
}: UpdateDialogProps) {
    if (!version) return null;

    const handleUpdate = async () => {
        try {
            await onUpdate();
        } catch (error) {
            Alert.alert(
                'Update Failed',
                'Failed to download the update. Please check your internet connection and try again.',
                [{ text: 'OK' }]
            );
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={version.mandatory ? undefined : onDismiss}
        >
            <View style={styles.overlay}>
                <View style={styles.dialog}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.icon}>🚀</Text>
                        <Text style={styles.title}>Update Available</Text>
                        <Text style={styles.version}>Version {version.version}</Text>
                    </View>

                    {/* Release Notes */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionTitle}>What's New:</Text>
                        {version.releaseNotes.map((note: string, index: number) => (
                            <View key={index} style={styles.noteItem}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.noteText}>{note}</Text>
                            </View>
                        ))}

                        {version.mandatory && (
                            <View style={styles.mandatoryBanner}>
                                <Text style={styles.mandatoryText}>
                                    ⚠️ This is a mandatory update. Please update to continue using the app.
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.actions}>
                        {isDownloading ? (
                            <View style={styles.downloadingContainer}>
                                <ActivityIndicator size="small" color="#0EA5E9" />
                                <Text style={styles.downloadingText}>Downloading update...</Text>
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[styles.button, styles.updateButton]}
                                    onPress={handleUpdate}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.updateButtonText}>Update Now</Text>
                                </TouchableOpacity>

                                {!version.mandatory && (
                                    <View style={styles.secondaryActions}>
                                        {onSkip && (
                                            <TouchableOpacity
                                                style={styles.textButton}
                                                onPress={onSkip}
                                                activeOpacity={0.6}
                                            >
                                                <Text style={styles.textButtonLabel}>Skip This Version</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={styles.textButton}
                                            onPress={onDismiss}
                                            activeOpacity={0.6}
                                        >
                                            <Text style={styles.textButtonLabel}>Later</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dialog: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    header: {
        alignItems: 'center',
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    icon: {
        fontSize: 48,
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    version: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    content: {
        padding: 20,
        maxHeight: 300,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    noteItem: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 4,
    },
    bullet: {
        fontSize: 16,
        color: '#0EA5E9',
        marginRight: 8,
        fontWeight: '700',
    },
    noteText: {
        flex: 1,
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    mandatoryBanner: {
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        padding: 12,
        marginTop: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    mandatoryText: {
        fontSize: 13,
        color: '#92400E',
        lineHeight: 18,
    },
    actions: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 10,
        alignItems: 'center',
    },
    updateButton: {
        backgroundColor: '#0EA5E9',
        elevation: 2,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 12,
    },
    textButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    textButtonLabel: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
    },
    downloadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    downloadingText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#0EA5E9',
        fontWeight: '600',
    },
});
