import { IconSymbol } from '@/components/ui/icon-symbol';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
    audioPlayerContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    audioPlayerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    audioPlayerCancel: {
        fontSize: 16,
        color: '#3B82F6',
        fontWeight: '600',
    },
    audioPlayerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    audioPlayerSpacer: {
        width: 60,
    },
    audioPlayerContent: {
        flex: 1,
        padding: 30,
        justifyContent: 'center',
    },
    audioInfo: {
        alignItems: 'center',
        marginBottom: 50,
    },
    audioIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    audioFileName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    audioDuration: {
        fontSize: 14,
        color: '#6B7280',
    },
    audioWarning: {
        fontSize: 12,
        color: '#F59E0B',
        marginTop: 8,
        textAlign: 'center',
    },
    audioError: {
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    audioErrorText: {
        color: '#DC2626',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '600',
    },
    audioErrorSubtext: {
        color: '#6B7280',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
        alignSelf: 'center',
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    audioControls: {
        alignItems: 'center',
    },
    progressContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 30,
    },
    progressBar: {
        width: '100%',
        marginVertical: 15,
    },
    progressTrack: {
        width: '100%',
        height: 4,
        position: 'relative',
    },
    progressBackground: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
    },
    progressFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 2,
    },
    timeText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        minWidth: 50,
        textAlign: 'center',
    },
    playButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    playButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0.1,
    },
});

interface AudioPlayerModalProps {
    visible: boolean;
    onClose: () => void;
    audio: { id: string; url: string; name: string; duration?: number } | null;
}

export const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({
    visible,
    onClose,
    audio,
}) => {
    const insets = useSafeAreaInsets();
    const audioPlayer = useAudioPlayer(audio?.url || null);
    const playerStatus = useAudioPlayerStatus(audioPlayer);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Set audio mode for better iOS/Android compatibility
        const configureAudio = async () => {
            try {
                await setAudioModeAsync({
                    playsInSilentMode: true,
                    allowsRecording: false,
                });
            } catch (e) {
                console.log('Failed to set audio mode:', e);
            }
        };

        configureAudio();

        return () => {
            try {
                audioPlayer.remove();
            } catch (error) {
                console.log('Audio player cleanup error:', error);
            }
        };
    }, [audioPlayer]);

    useEffect(() => {
        if (!visible) {
            audioPlayer.pause();
            setError(null);
        }
    }, [visible, audioPlayer]);

    const togglePlayback = async () => {
        try {
            if (playerStatus?.playing) {
                audioPlayer.pause();
            } else {
                audioPlayer.play();
            }
        } catch (err) {
            console.error('Playback error:', err);
            setError('Playback failed. Please try again.');
        }
    };

    const seekTo = async (positionMs: number) => {
        try {
            audioPlayer.seekTo(positionMs / 1000); // expo-audio uses seconds
        } catch (err) {
            console.error('Seek error:', err);
        }
    };

    const formatTime = (milliseconds: number) => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleClose = () => {
        try {
            audioPlayer.pause();
        } catch (error) {
            console.log('Audio pause error:', error);
        }
        onClose();
    };

    if (!audio) return null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.audioPlayerContainer, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
                {/* Header */}
                <View style={styles.audioPlayerHeader}>
                    <TouchableOpacity onPress={handleClose}>
                        <Text style={styles.audioPlayerCancel}>Done</Text>
                    </TouchableOpacity>
                    <Text style={styles.audioPlayerTitle}>Audio Player</Text>
                    <View style={styles.audioPlayerSpacer} />
                </View>

                {/* Content */}
                <View style={styles.audioPlayerContent}>
                    {/* Audio Info */}
                    <View style={styles.audioInfo}>
                        <View style={styles.audioIcon}>
                            <IconSymbol name="waveform" size={48} color="#10B981" />
                        </View>
                        <Text style={styles.audioFileName} numberOfLines={2}>
                            {audio.name}
                        </Text>
                        <Text style={styles.audioDuration}>
                            {audio.duration ? `${audio.duration}s` : 'Audio file'}
                        </Text>
                        {audio.name.toLowerCase().includes('.wav') && (
                            <Text style={styles.audioWarning}>
                                ⚠️ WAV files may have limited compatibility
                            </Text>
                        )}
                    </View>

                    {/* Error Display */}
                    {error && (
                        <View style={styles.audioError}>
                            <Text style={styles.audioErrorText}>{error}</Text>
                            <Text style={styles.audioErrorSubtext}>
                                Recommended formats: MP3, M4A, AAC. WAV files may have compatibility issues.
                            </Text>
                        </View>
                    )}

                    {/* Controls */}
                    <View style={styles.audioControls}>
                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                            <Text style={styles.timeText}>{formatTime((playerStatus?.currentTime || 0) * 1000)}</Text>
                            <View style={styles.progressBar}>
                                <TouchableOpacity
                                    style={styles.progressTrack}
                                    onPress={(e) => {
                                        const duration = playerStatus?.duration || 0;
                                        if (duration > 0) {
                                            const { locationX } = e.nativeEvent;
                                            const progressBarWidth = 250; // Approximate width
                                            const newPosition = (locationX / progressBarWidth) * duration * 1000;
                                            seekTo(newPosition);
                                        }
                                    }}
                                >
                                    <View style={styles.progressBackground} />
                                    <View
                                        style={[
                                            styles.progressFill,
                                            { width: (playerStatus?.duration && playerStatus?.currentTime) ? `${((playerStatus.currentTime / playerStatus.duration) * 100)}%` : '0%' }
                                        ]}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.timeText}>{formatTime((playerStatus?.duration || 0) * 1000)}</Text>
                        </View>

                        {/* Play/Pause Button */}
                        <TouchableOpacity
                            style={[
                                styles.playButton,
                                isLoading && styles.playButtonDisabled,
                            ]}
                            onPress={togglePlayback}
                            disabled={isLoading || !!error}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <IconSymbol
                                    name={playerStatus?.playing ? 'pause.fill' : 'play.fill'}
                                    size={32}
                                    color="#FFFFFF"
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
