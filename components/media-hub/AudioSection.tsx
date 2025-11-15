import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography, Spacing } from '@/constants/design-system';
import { useMediaHubStore } from '@/stores/mediaHubStore';
import { useAuthStore } from '@/stores/authStore';
import JobCardSelector from './JobCardSelector';
import MediaItem from './MediaItem';

export default function AudioSection() {
  const { user } = useAuthStore();
  const {
    createMediaItem,
    uploadToSupabase,
    ticketFilter,
    getFilteredItems,
    setMediaTypeFilter,
    mediaTypeFilter,
  } = useMediaHubStore();
  
  const router = useRouter();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  
  const [hasPermission, setHasPermission] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [showJobCardSelector, setShowJobCardSelector] = useState(false);
  
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initAudio();
    // Set filter to show only audio files
    if (mediaTypeFilter !== 'audio') {
      setMediaTypeFilter('audio');
    }

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
      const mediaItem = await createMediaItem({
        userId: user.id,
        mediaType: 'audio',
        fileName,
        localUri: uri,
        durationSeconds,
        ticketId: ticketFilter || undefined,
        assignedAt: ticketFilter ? new Date().toISOString() : undefined,
        metadata: {
          recordingPreset: 'HIGH_QUALITY',
          duration: durationSeconds,
        },
      });

      // Upload to Supabase in background
      uploadToSupabase(mediaItem).catch(error => {
        console.error('Upload failed:', error);
      });

      Alert.alert(
        'Recording Saved',
        `Voice memo saved successfully!${ticketFilter ? ' Assigned to current job card.' : ''}`,
        [{ text: 'OK' }]
      );

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

  const audioItems = getFilteredItems().filter(item => item.mediaType === 'audio');

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient
          colors={[Colors.success[500], Colors.success[600]]}
          style={styles.permissionCard}
        >
          <IconSymbol
            name="mic.fill"
            size={64}
            color={Colors.white}
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
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Recording Section */}
      <LinearGradient
        colors={[Colors.success[50], Colors.success[100]]}
        style={styles.recordingSection}
      >
        <View style={styles.recordingVisualizer}>
          <View style={[
            styles.microphoneIcon,
            recorderState.isRecording && styles.microphoneRecording
          ]}>
            <IconSymbol
              name="mic.fill"
              size={48}
              color={recorderState.isRecording ? Colors.white : Colors.success[600]}
            />
          </View>

          {recorderState.isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.pulseDot} />
              <Text style={styles.recordingText}>REC</Text>
            </View>
          )}

          {/* Waveform Animation */}
          {recorderState.isRecording && (
            <View style={styles.waveformContainer}>
              {Array.from({ length: 20 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.waveformBar,
                    {
                      height: Math.random() * 30 + 10,
                      backgroundColor: Colors.success[400],
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <Text style={styles.durationText}>
          {formatDuration(Math.round((recorderState.durationMillis || 0) / 1000))}
        </Text>

        {/* Controls Row */}
        <View style={styles.controlsRow}>
          {/* Job Card Button */}
          <TouchableOpacity
            style={[styles.jobCardButton, ticketFilter && styles.jobCardButtonActive]}
            onPress={() => setShowJobCardSelector(true)}
          >
            <IconSymbol
              name={ticketFilter ? 'checkmark.circle.fill' : 'plus.circle.fill'}
              size={20}
              color={Colors.white}
            />
          </TouchableOpacity>

          {/* Record Button */}
          <TouchableOpacity
            style={[
              styles.recordButton,
              recorderState.isRecording && styles.recordButtonActive,
            ]}
            onPress={recorderState.isRecording ? stopRecording : startRecording}
            disabled={isBusy}
          >
            <LinearGradient
              colors={recorderState.isRecording 
                ? [Colors.error[500], Colors.error[600]]
                : [Colors.success[500], Colors.success[600]]
              }
              style={styles.recordButtonGradient}
            >
              <IconSymbol
                name={recorderState.isRecording ? 'stop.fill' : 'mic.circle.fill'}
                size={32}
                color={Colors.white}
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* Library Button */}
          <TouchableOpacity
            style={styles.libraryButton}
            onPress={() => useMediaHubStore.getState().setActiveTab('library')}
          >
            <IconSymbol
              name="waveform"
              size={20}
              color={Colors.success[600]}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.recordButtonText}>
          {recorderState.isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
        </Text>

        {recorderState.isRecording && (
          <Text style={styles.instructionText}>
            Speak clearly into the microphone
          </Text>
        )}
      </LinearGradient>

      {/* Recent Recordings */}
      <View style={styles.recordingsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Recordings</Text>
          <Text style={styles.recordingsCount}>{audioItems.length} recordings</Text>
        </View>

        {audioItems.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="waveform" size={48} color={Colors.neutral[300]} />
            <Text style={styles.emptyStateText}>No recordings yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the record button above to create your first voice memo
            </Text>
          </View>
        ) : (
          <FlatList
            data={audioItems.slice(0, 5)} // Show only recent 5
            renderItem={({ item }) => (
              <MediaItem
                item={item}
                onPress={() => router.push({
                  pathname: '/(tabs)/recording-player',
                  params: {
                    id: item.id,
                    name: item.fileName,
                    localUri: item.localUri,
                    durationSeconds: String(item.durationSeconds ?? 0),
                    createdAt: item.createdAt,
                    publicUrl: item.remoteUrl ?? '',
                  },
                })}
              />
            )}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.recordingsList}
          />
        )}

        {audioItems.length > 5 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => useMediaHubStore.getState().setActiveTab('library')}
          >
            <Text style={styles.viewAllText}>View all recordings</Text>
            <IconSymbol name="chevron.right" size={16} color={Colors.primary[600]} />
          </TouchableOpacity>
        )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  
  // Permission styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    paddingHorizontal: Spacing.xl,
  },
  permissionCard: {
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  permissionIcon: {
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.success[100],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: Colors.success[600],
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Recording section
  recordingSection: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  recordingVisualizer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  microphoneIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
    borderWidth: 3,
    borderColor: Colors.success[300],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  microphoneRecording: {
    backgroundColor: Colors.success[500],
    borderColor: Colors.success[600],
    transform: [{ scale: 1.1 }],
  },
  recordingIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error[500],
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    marginRight: Spacing.xs,
  },
  recordingText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'end',
    justifyContent: 'center',
    gap: 2,
    marginTop: Spacing.base,
    height: 40,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  durationText: {
    fontSize: Typography.fontSize.xl2,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.success[700],
    marginBottom: Spacing.lg,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.base,
  },
  jobCardButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.neutral[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobCardButtonActive: {
    backgroundColor: Colors.primary[500],
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    transform: [{ scale: 0.95 }],
  },
  recordButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  libraryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.success[300],
  },
  recordButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.success[700],
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  instructionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.success[600],
    textAlign: 'center',
  },

  // Recordings section
  recordingsSection: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[900],
  },
  recordingsCount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
    marginTop: Spacing.base,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[400],
    textAlign: 'center',
  },
  recordingsList: {
    paddingBottom: Spacing.lg,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  viewAllText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[600],
  },
});
