import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';

const { width: screenWidth } = Dimensions.get('window');

const RECORDING_NAMES_KEY = 'recordingNames';

export default function RecordingPlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    localUri?: string;
    durationSeconds?: string;
    createdAt?: string;
    publicUrl?: string;
  }>();

  const id = params.id ?? '';
  const initialName = params.name ?? `Recording_${id}`;
  const uri = params.localUri ?? '';

  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [volume, setVolume] = useState(1);

  const player = useAudioPlayer(uri || null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (uri) {
      player.replace({ uri });
    }
  }, [uri]);

  useEffect(() => {
    player.volume = volume;
  }, [player, volume]);

  const duration = status?.duration || 0;
  const currentTime = status?.currentTime || 0;

  const formattedTimes = useMemo(
    () => ({
      current: formatDuration(currentTime),
      total: formatDuration(duration),
    }),
    [currentTime, duration],
  );

  const handlePlayPause = () => {
    if (!uri) return;

    if (status?.playing) {
      player.pause();
    } else {
      if (!status?.isLoaded) {
        player.replace({ uri });
      }
      player.play();
    }
  };

  const handleSeek = (value: number) => {
    if (!status?.isLoaded) return;
    player.seekTo(value);
  };

  const handleSaveName = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const json = await AsyncStorage.getItem(RECORDING_NAMES_KEY);
      const names: Record<string, string> = json ? JSON.parse(json) : {};
      names[id] = name.trim() || initialName;
      await AsyncStorage.setItem(RECORDING_NAMES_KEY, JSON.stringify(names));
      router.back();
    } catch (error) {
      console.error('Failed to save recording name:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconSymbol name="chevron.left" size={24} color={BrandColors.ink} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Voice Recording</Text>
          {duration > 0 && (
            <Text style={styles.headerSubtitle}>
              {formattedTimes.total} duration
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Waveform Visualization */}
        <View style={styles.card}>
          <View style={styles.waveformContainer}>
            {Array.from({ length: 40 }).map((_, index) => {
              const height = Math.random() * 40 + 10;
              const isActive = currentTime > 0 && (index / 40) <= (currentTime / Math.max(duration, 1));
              return (
                <View
                  key={index}
                  style={[
                    styles.waveformBar,
                    {
                      height,
                      backgroundColor: isActive ? BrandColors.primary : Colors.neutral[300],
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Time display */}
          <View style={styles.timeContainer}>
            <Text style={styles.currentTime}>{formattedTimes.current}</Text>
            <Text style={styles.totalTime}>-{formatDuration(duration - currentTime)}</Text>
          </View>
        </View>

        {/* Main Controls */}
        <View style={styles.card}>
          {/* Playback Slider */}
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.mainSlider}
              minimumValue={0}
              maximumValue={Math.max(duration || 0, 1)}
              value={currentTime}
              minimumTrackTintColor={BrandColors.primary}
              maximumTrackTintColor={Colors.neutral[200]}
              thumbTintColor={BrandColors.primary}
              onSlidingComplete={handleSeek}
            />
          </View>

          {/* Play Button */}
          <View style={styles.mainControlsRow}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => handleSeek(Math.max(0, currentTime - 10))}
            >
              <IconSymbol name="gobackward.10" size={20} color={BrandColors.ink} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.playButton,
                status?.playing && styles.playButtonActive
              ]}
              onPress={handlePlayPause}
            >
              <IconSymbol
                name={status?.playing ? 'pause.fill' : 'play.fill'}
                size={32}
                color={Colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => handleSeek(Math.min(duration, currentTime + 10))}
            >
              <IconSymbol name="goforward.10" size={20} color={BrandColors.ink} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Volume Control Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="speaker.wave.2.fill" size={20} color={BrandColors.primary} />
            <Text style={styles.cardTitle}>Volume</Text>
            <Text style={styles.cardValue}>{Math.round(volume * 100)}%</Text>
          </View>

          <View style={styles.volumeSliderContainer}>
            <IconSymbol name="speaker.fill" size={16} color={Colors.neutral[400]} />
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              minimumTrackTintColor={BrandColors.primary}
              maximumTrackTintColor={Colors.neutral[200]}
              thumbTintColor={BrandColors.primary}
              onValueChange={setVolume}
            />
            <IconSymbol name="speaker.3.fill" size={16} color={Colors.neutral[600]} />
          </View>
        </View>

        {/* Name Input Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="textformat" size={20} color={BrandColors.primary} />
            <Text style={styles.cardTitle}>Recording Name</Text>
          </View>

          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter a name for this recording"
            placeholderTextColor={Colors.neutral[400]}
          />

          <TouchableOpacity
            style={[
              styles.saveButton,
              saving && styles.saveButtonDisabled,
              name.trim() !== initialName && styles.saveButtonActive
            ]}
            onPress={handleSaveName}
            disabled={saving}
          >
            <IconSymbol
              name={saving ? 'clock.fill' : 'checkmark.circle.fill'}
              size={16}
              color={name.trim() !== initialName ? Colors.white : BrandColors.ink}
            />
            <Text style={[
              styles.saveButtonText,
              name.trim() === initialName && styles.saveButtonTextDisabled
            ]}>
              {saving ? 'Saving...' : name.trim() !== initialName ? 'Save Changes' : 'Saved'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.lg,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.ink + '05',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '60',
    marginTop: 2,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: 100,
  },

  // Card styles
  card: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  cardValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },

  // Waveform styles
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    marginBottom: Spacing.base,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentTime: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  totalTime: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '60',
  },

  // Controls styles
  sliderContainer: {
    marginBottom: Spacing.lg,
  },
  mainSlider: {
    width: '100%',
    height: 40,
  },
  mainControlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  skipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BrandColors.ink + '05',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  playButtonActive: {
    backgroundColor: Colors.error[500],
  },

  // Volume styles
  volumeSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },

  // Name input styles
  nameInput: {
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
    backgroundColor: Colors.white,
    marginBottom: Spacing.base,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: BrandColors.ink + '05',
  },
  saveButtonActive: {
    backgroundColor: BrandColors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  saveButtonTextDisabled: {
    color: BrandColors.ink + '60',
  },
});
