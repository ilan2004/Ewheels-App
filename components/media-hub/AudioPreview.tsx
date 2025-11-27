import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandColors, Colors, Spacing, Typography } from '@/constants/design-system';
import Slider from '@react-native-community/slider';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AudioPreviewProps {
    uri: string;
}

export default function AudioPreview({ uri }: AudioPreviewProps) {
    const player = useAudioPlayer(uri);
    const status = useAudioPlayerStatus(player);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);

    // Auto-play when mounted/uri changes
    useEffect(() => {
        if (uri && !status.playing && status.isLoaded) {
            player.play();
        }
    }, [uri, status.isLoaded]);

    const togglePlayback = () => {
        if (status.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    const handleSeek = (value: number) => {
        if (status.isLoaded) {
            player.seekTo(value);
        }
        setIsSeeking(false);
    };

    const formatDuration = (seconds: number) => {
        const total = Math.max(0, Math.floor(seconds));
        const mins = Math.floor(total / 60);
        const secs = total % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const duration = status.duration || 0;
    const currentTime = isSeeking ? seekValue : (status.currentTime || 0);

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <IconSymbol name="waveform" size={64} color={BrandColors.primary} />
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.playButton}
                    onPress={togglePlayback}
                    disabled={!status.isLoaded}
                >
                    {status.isLoaded ? (
                        <IconSymbol
                            name={status.playing ? 'pause.fill' : 'play.fill'}
                            size={32}
                            color={Colors.white}
                        />
                    ) : (
                        <ActivityIndicator color={Colors.white} />
                    )}
                </TouchableOpacity>

                <View style={styles.progressContainer}>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={Math.max(duration, 1)}
                        value={currentTime}
                        onSlidingStart={() => setIsSeeking(true)}
                        onValueChange={setSeekValue}
                        onSlidingComplete={handleSeek}
                        minimumTrackTintColor={BrandColors.primary}
                        maximumTrackTintColor={Colors.neutral[300]}
                        thumbTintColor={BrandColors.primary}
                    />
                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{formatDuration(currentTime)}</Text>
                        <Text style={styles.timeText}>{formatDuration(duration)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: BrandColors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    controls: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    playButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: BrandColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        flex: 1,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xs,
    },
    timeText: {
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.neutral[400],
    },
});
