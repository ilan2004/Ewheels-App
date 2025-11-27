import {
    RecordingPresets,
    requestRecordingPermissionsAsync,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from 'expo-audio';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuthStore } from '@/stores/authStore';
import { useMediaHubStore } from '@/stores/mediaHubStore';
import JobCardSelector from './JobCardSelector';

export default function AudioRecorder() {
    const { user } = useAuthStore();
    const {
        createMediaItem,
        uploadToSupabase,
        ticketFilter,
        assignMediaToTicket,
    } = useMediaHubStore();

    const router = useRouter();
    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(audioRecorder);

    const [hasPermission, setHasPermission] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [showJobCardSelector, setShowJobCardSelector] = useState(false);

    const durationInterval = useRef<number | null>(null);

    useEffect(() => {
        initAudio();
        return () => {
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
            }
        };
    }, []);

    const initAudio = async () => {
        try {
            const { status, granted } = await requestRecordingPermissionsAsync();
            if (!granted || status !== 'granted') {
                setHasPermission(false);
                Alert.alert(
                    'Microphone permission required',
                    'Please enable microphone access in Settings to record audio.',
                );
                return;
            }

            setHasPermission(true);

            await setAudioModeAsync({
                playsInSilentMode: true,
                allowsRecording: true,
            });
        } catch (error) {
            console.error('Error initializing audio:', error);
            Alert.alert('Error', 'Failed to configure audio recording.');
        }
    };

    const startRecording = async () => {
        try {
            if (!hasPermission || isBusy || recorderState.isRecording) return;

            setIsBusy(true);

            await audioRecorder.prepareToRecordAsync();
            audioRecorder.record();

            if (durationInterval.current) {
                clearInterval(durationInterval.current);
            }
            durationInterval.current = setInterval(() => {
                // Force re-render to update duration
            }, 1000);
        } catch (error) {
            console.error('Failed to start recording:', error);
            Alert.alert('Error', 'Failed to start recording. Please try again.');
        } finally {
            setIsBusy(false);
        }
    };

    const stopRecording = async () => {
        if (!recorderState.isRecording || !user?.id) return;

        try {
            setIsBusy(true);
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
                durationInterval.current = null;
            }

            const statusBeforeStop = await audioRecorder.getStatus();
            await audioRecorder.stop();

            const uri = audioRecorder.uri || statusBeforeStop.url;
            if (!uri) {
                Alert.alert('Error', 'No recording URI returned.');
                return;
            }

            const durationSeconds = Math.max(
                1,
                Math.round((statusBeforeStop.durationMillis || 0) / 1000),
            );

            // Create media item
            const fileName = `audio_${Date.now()}.m4a`;

            // 1. Create local media item first (unassigned initially)
            const mediaItem = await createMediaItem({
                userId: user.id,
                mediaType: 'audio',
                fileName,
                localUri: uri,
                durationSeconds,
                ticketId: undefined, // Don't assign yet
                assignedAt: undefined,
                metadata: {
                    recordingPreset: 'HIGH_QUALITY',
                    duration: durationSeconds,
                },
            });

            // 2. If ticket selected, assign it immediately
            if (ticketFilter) {
                setIsAssigning(true);
                try {
                    await assignMediaToTicket([mediaItem.id], ticketFilter);
                    Alert.alert(
                        'Recording Saved',
                        'Voice memo saved and assigned to job card successfully!',
                        [{ text: 'OK' }]
                    );
                } catch (assignError) {
                    console.error('Assignment failed:', assignError);
                    Alert.alert(
                        'Saved with Warning',
                        'Voice memo saved but failed to assign to job card. Please try assigning from the library.',
                        [{ text: 'OK' }]
                    );
                } finally {
                    setIsAssigning(false);
                }
            } else {
                // Just upload if no ticket selected
                uploadToSupabase(mediaItem).catch(error => {
                    console.error('Upload failed:', error);
                });

                Alert.alert(
                    'Recording Saved',
                    'Voice memo saved successfully!',
                    [{ text: 'OK' }]
                );
            }

        } catch (error) {
            console.error('Failed to stop recording:', error);
            Alert.alert('Error', 'Failed to stop recording.');
        } finally {
            setIsBusy(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs
            .toString()
            .padStart(2, '0')}`;
    };

    if (!hasPermission) {
        return (
            <View style={styles.permissionContainer}>
                <View style={styles.permissionCard}>
                    <IconSymbol
                        name="mic.fill"
                        size={64}
                        color={BrandColors.primary}
                        style={styles.permissionIcon}
                    />
                    <Text style={styles.permissionTitle}>Microphone Access Required</Text>
                    <Text style={styles.permissionMessage}>
                        We need access to your microphone to record voice memos for job cards and documentation.
                    </Text>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={initAudio}
                    >
                        <Text style={styles.permissionButtonText}>Grant Microphone Access</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                {/* Visualizer Area */}
                <View style={styles.visualizerContainer}>
                    <View style={[
                        styles.microphoneCircle,
                        recorderState.isRecording && styles.microphoneRecording
                    ]}>
                        <IconSymbol
                            name="mic.fill"
                            size={64}
                            color={recorderState.isRecording ? Colors.white : BrandColors.primary}
                        />
                    </View>

                    {recorderState.isRecording && (
                        <View style={styles.recordingStatus}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.recordingText}>RECORDING</Text>
                        </View>
                    )}

                    <Text style={styles.timerText}>
                        {formatDuration(Math.round((recorderState.durationMillis || 0) / 1000))}
                    </Text>

                    {recorderState.isRecording && (
                        <View style={styles.waveformContainer}>
                            {Array.from({ length: 12 }).map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.waveformBar,
                                        {
                                            height: Math.random() * 40 + 10,
                                            backgroundColor: BrandColors.primary,
                                            opacity: 0.6 + (Math.random() * 0.4),
                                        },
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* Controls Area */}
                <View style={styles.controlsContainer}>
                    <Text style={styles.instructionText}>
                        {recorderState.isRecording
                            ? 'Tap Stop to finish recording'
                            : 'Tap the microphone to start recording'}
                    </Text>

                    <View style={styles.buttonsRow}>
                        {/* Job Card Button */}
                        <TouchableOpacity
                            style={[styles.controlButton, ticketFilter && styles.controlButtonActive]}
                            onPress={() => setShowJobCardSelector(true)}
                            disabled={isBusy || recorderState.isRecording}
                        >
                            <IconSymbol
                                name={ticketFilter ? 'checkmark.circle.fill' : 'doc.text.magnifyingglass'}
                                size={24}
                                color={ticketFilter ? Colors.white : BrandColors.primary}
                            />
                            <Text style={[styles.controlButtonText, ticketFilter && styles.controlButtonTextActive]}>
                                {ticketFilter ? 'Assigned' : 'Assign Job'}
                            </Text>
                        </TouchableOpacity>

                        {/* Record/Stop Button */}
                        <TouchableOpacity
                            style={[
                                styles.mainActionButton,
                                recorderState.isRecording && styles.stopButton
                            ]}
                            onPress={recorderState.isRecording ? stopRecording : startRecording}
                            disabled={isBusy}
                        >
                            <IconSymbol
                                name={recorderState.isRecording ? 'stop.fill' : 'mic.fill'}
                                size={32}
                                color={Colors.white}
                            />
                        </TouchableOpacity>

                        {/* Placeholder for symmetry or future feature */}
                        <View style={styles.controlButtonPlaceholder} />
                    </View>
                </View>
            </View>

            {/* Job Card Selector Modal */}
            <Modal
                visible={showJobCardSelector}
                transparent
                animationType="slide"
                onRequestClose={() => setShowJobCardSelector(false)}
            >
                <JobCardSelector
                    onClose={() => setShowJobCardSelector(false)}
                    showUnassignOption={true}
                />
            </Modal>

            {/* Loading Overlay */}
            {isAssigning && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingCard}>
                        <IconSymbol name="arrow.triangle.2.circlepath" size={32} color={BrandColors.primary} style={styles.loadingIcon} />
                        <Text style={styles.loadingTitle}>Assigning...</Text>
                        <Text style={styles.loadingSubtitle}>Linking audio to job card</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.surface,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'space-between',
        padding: Spacing.xl,
    },

    // Permission styles
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: BrandColors.surface,
        padding: Spacing.xl,
    },
    permissionCard: {
        width: '100%',
        backgroundColor: BrandColors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BrandColors.ink + '10',
        ...Shadows.md,
    },
    permissionIcon: {
        marginBottom: Spacing.lg,
    },
    permissionTitle: {
        fontSize: Typography.fontSize.xl,
        fontFamily: Typography.fontFamily.bold,
        color: BrandColors.title,
        marginBottom: Spacing.base,
        textAlign: 'center',
    },
    permissionMessage: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.regular,
        color: BrandColors.ink + '80',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: Spacing.xl,
    },
    permissionButton: {
        backgroundColor: BrandColors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
    },
    permissionButtonText: {
        color: Colors.white,
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.semibold,
    },

    // Visualizer
    visualizerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    microphoneCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: BrandColors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: BrandColors.primary + '20',
        marginBottom: Spacing.xl,
        ...Shadows.sm,
    },
    microphoneRecording: {
        backgroundColor: Colors.error[500],
        borderColor: Colors.error[200],
        transform: [{ scale: 1.05 }],
    },
    recordingStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.error[500] + '15',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        marginBottom: Spacing.md,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.error[500],
        marginRight: Spacing.xs,
    },
    recordingText: {
        color: Colors.error[600],
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.bold,
        letterSpacing: 1,
    },
    timerText: {
        fontSize: 48,
        fontFamily: Typography.fontFamily.bold,
        color: BrandColors.title,
        fontVariant: ['tabular-nums'],
        marginBottom: Spacing.lg,
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        height: 60,
    },
    waveformBar: {
        width: 6,
        borderRadius: 3,
    },

    // Controls
    controlsContainer: {
        paddingBottom: Spacing.xl,
    },
    instructionText: {
        textAlign: 'center',
        color: BrandColors.ink + '60',
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.medium,
        marginBottom: Spacing.xl,
    },
    buttonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
    },
    controlButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        gap: Spacing.xs,
    },
    controlButtonActive: {
        backgroundColor: BrandColors.primary,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    controlButtonText: {
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.medium,
        color: BrandColors.primary,
    },
    controlButtonTextActive: {
        color: Colors.white,
    },
    controlButtonPlaceholder: {
        width: 80,
    },
    mainActionButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: BrandColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.lg,
    },
    stopButton: {
        backgroundColor: Colors.error[500],
    },

    // Loading Overlay
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingCard: {
        backgroundColor: BrandColors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        ...Shadows.lg,
        width: 200,
    },
    loadingIcon: {
        marginBottom: Spacing.md,
    },
    loadingTitle: {
        fontSize: Typography.fontSize.lg,
        fontFamily: Typography.fontFamily.bold,
        color: BrandColors.title,
        marginBottom: Spacing.xs,
    },
    loadingSubtitle: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.regular,
        color: BrandColors.ink + '60',
        textAlign: 'center',
    },
});
