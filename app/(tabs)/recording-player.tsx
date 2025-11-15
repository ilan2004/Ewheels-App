import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography, Spacing } from '@/constants/design-system';

const { width: screenWidth } = Dimensions.get('window');

const RECORDING_NAMES_KEY = 'recordingNames';

/**
 * Enhanced Recording Player Screen
 * 
 * Features:
 * - Gradient header with progress indicator
 * - Visual waveform representation
 * - Enhanced playback controls with skip buttons
 * - Volume control with visual feedback
 * - Improved name input with save status
 * - Card-based layout with shadows
 * - Scrollable content for better mobile experience
 */

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
      // Ensure the player has the correct source
      player.replace({ uri });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary[600], Colors.primary[700]]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={24} color={Colors.white} />
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
        
        {/* Progress indicator */}
        {duration > 0 && (
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${(currentTime / duration) * 100}%` }
              ]} 
            />
          </View>
        )}
      </LinearGradient>

      {/* Waveform Visualization */}
      <View style={styles.waveformCard}>
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
                    backgroundColor: isActive ? Colors.primary[500] : Colors.neutral[300],
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
      <View style={styles.controlsCard}>
        {/* Playback Slider */}
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.mainSlider}
            minimumValue={0}
            maximumValue={Math.max(duration || 0, 1)}
            value={currentTime}
            minimumTrackTintColor={Colors.primary[600]}
            maximumTrackTintColor={Colors.neutral[200]}
            thumbTintColor={Colors.primary[600]}
            onSlidingComplete={handleSeek}
          />
        </View>

        {/* Play Button */}
        <View style={styles.mainControlsRow}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleSeek(Math.max(0, currentTime - 10))}
          >
            <IconSymbol name="gobackward.10" size={20} color={Colors.neutral[600]} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.playButton,
              status?.playing && styles.playButtonActive
            ]}
            onPress={handlePlayPause}
          >
            <LinearGradient
              colors={status?.playing ? 
                [Colors.error[500], Colors.error[600]] : 
                [Colors.primary[500], Colors.primary[600]]
              }
              style={styles.playButtonGradient}
            >
              <IconSymbol
                name={status?.playing ? 'pause.fill' : 'play.fill'}
                size={32}
                color={Colors.white}
              />
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleSeek(Math.min(duration, currentTime + 10))}
          >
            <IconSymbol name="goforward.10" size={20} color={Colors.neutral[600]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Volume Control Card */}
      <View style={styles.volumeCard}>
        <View style={styles.volumeHeader}>
          <IconSymbol name="speaker.wave.2.fill" size={20} color={Colors.primary[600]} />
          <Text style={styles.volumeLabel}>Volume</Text>
          <Text style={styles.volumeValue}>{Math.round(volume * 100)}%</Text>
        </View>
        
        <View style={styles.volumeSliderContainer}>
          <IconSymbol name="speaker.fill" size={16} color={Colors.neutral[400]} />
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            minimumTrackTintColor={Colors.primary[600]}
            maximumTrackTintColor={Colors.neutral[200]}
            thumbTintColor={Colors.primary[600]}
            onValueChange={setVolume}
          />
          <IconSymbol name="speaker.3.fill" size={16} color={Colors.neutral[600]} />
        </View>
      </View>

      {/* Name Input Card */}
      <View style={styles.nameCard}>
        <View style={styles.nameHeader}>
          <IconSymbol name="textformat" size={20} color={Colors.primary[600]} />
          <Text style={styles.nameLabel}>Recording Name</Text>
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
          <LinearGradient
            colors={name.trim() !== initialName ? 
              [Colors.success[500], Colors.success[600]] :
              [Colors.neutral[400], Colors.neutral[500]]
            }
            style={styles.saveButtonGradient}
          >
            <IconSymbol 
              name={saving ? 'clock.fill' : 'checkmark.circle.fill'} 
              size={16} 
              color={Colors.white} 
            />
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : name.trim() !== initialName ? 'Save Changes' : 'Saved'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
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
    backgroundColor: Colors.neutral[50],
  },
  
  // Header styles
  headerGradient: {
    paddingTop: 50,
    paddingBottom: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[100],
    marginTop: 2,
  },
  progressContainer: {
    height: 3,
    backgroundColor: Colors.primary[400],
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.base,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 2,
  },

  // Waveform styles
  waveformCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: -Spacing.lg,
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
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
    color: Colors.primary[600],
  },
  totalTime: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
  },

  // Controls styles
  controlsCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
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
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonActive: {
    transform: [{ scale: 0.95 }],
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Volume styles
  volumeCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  volumeLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[700],
    marginLeft: Spacing.sm,
    flex: 1,
  },
  volumeValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[600],
  },
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
  nameCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  nameLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[700],
    marginLeft: Spacing.sm,
  },
  nameInput: {
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[800],
    backgroundColor: Colors.neutral[50],
    marginBottom: Spacing.base,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonActive: {
    // Additional styles for active state if needed
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
  },

  bottomSpacer: {
    height: 100,
  },
});

