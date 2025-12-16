import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandColors, Colors, Spacing, Typography } from '@/constants/design-system';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
const RECORDINGS_DIR = (FileSystem as any).documentDirectory
  ? (FileSystem as any).documentDirectory + 'recordings'
  : ((FileSystem as any).cacheDirectory || '') + 'recordings';
const SUPABASE_BUCKET = 'recordings'; // make sure this bucket exists in Supabase
const RECORDING_NAMES_KEY = 'recordingNames';

interface RecordingItem {
  id: string;
  name: string;
  localUri: string;
  durationSeconds: number;
  createdAt: string; // ISO
  supabasePath?: string;
  publicUrl?: string;
}

export default function RecordAudio() {
  const { user } = useAuthStore();
  const router = useRouter();

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);

  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initAudio();
    loadLocalRecordings();

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      player.pause();
      player.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload list whenever this tab/screen regains focus
  useFocusEffect(
    React.useCallback(() => {
      loadLocalRecordings();
    }, []),
  );

  useEffect(() => {
    if (playerStatus?.didJustFinish) {
      setPlayingId(null);
    }
  }, [playerStatus?.didJustFinish]);

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

  const loadLocalRecordings = async () => {
    if (!RECORDINGS_DIR) {
      setRecordings([]);
      return;
    }

    try {
      const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
      if (!dirInfo.exists) {
        setRecordings([]);
        return;
      }

      const fileNames = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);
      const loaded: RecordingItem[] = [];

      // Load saved names map
      const namesJson = await AsyncStorage.getItem(RECORDING_NAMES_KEY);
      const names: Record<string, string> = namesJson ? JSON.parse(namesJson) : {};

      for (const fileName of fileNames) {
        const localUri = RECORDINGS_DIR + '/' + fileName;
        const info = await FileSystem.getInfoAsync(localUri);

        const id = fileName
          .replace(/^Recording_/, '')
          .replace(/\.m4a$/, '');
        const defaultName = fileName.replace('.m4a', '').replace(/_/g, ' ');
        const storedName = names[id];

        loaded.push({
          id,
          name: storedName || defaultName,
          localUri,
          durationSeconds: 0,
          createdAt:
            info.exists && info.modificationTime != null
              ? new Date(info.modificationTime * 1000).toISOString()
              : new Date().toISOString(),
        });
      }

      loaded.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setRecordings(loaded);
    } catch (error) {
      console.error('Error loading recordings:', error);
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
        // this just forces re-render via recorderState; actual duration comes from state
      }, 1000) as unknown as NodeJS.Timeout;
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const stopRecording = async () => {
    if (!recorderState.isRecording) return;

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

      const saved = await saveRecordingLocally(uri, durationSeconds);
      setRecordings(prev => [saved, ...prev]);

      // Fire and forget Supabase upload
      uploadRecordingToSupabase(saved).catch(err => {
        console.error('Supabase upload failed:', err);
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    } finally {
      setIsBusy(false);
    }
  };

  const saveRecordingLocally = async (
    tempUri: string,
    durationSeconds: number,
  ): Promise<RecordingItem> => {
    const now = new Date();
    const id = now.toISOString().replace(/[:.]/g, '-');
    const ext = 'm4a';

    // On web, documentDirectory may be null. In that case, just use the temp URI
    if (!RECORDINGS_DIR) {
      return {
        id,
        name: `Recording_${id}`,
        localUri: tempUri,
        durationSeconds,
        createdAt: now.toISOString(),
      };
    }

    const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
    }

    const fileName = `Recording_${id}.${ext}`;
    const destUri = RECORDINGS_DIR + '/' + fileName;

    await FileSystem.moveAsync({ from: tempUri, to: destUri });

    return {
      id,
      name: fileName.replace('.m4a', ''),
      localUri: destUri,
      durationSeconds,
      createdAt: now.toISOString(),
    };
  };

  const uploadRecordingToSupabase = async (item: RecordingItem) => {
    try {
      const supabaseUrl =
        process.env.EXPO_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL;
      const supabaseAnonKey =
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase env vars missing; skipping upload');
        return;
      }

      const userId = user?.id || 'anonymous';
      const objectPath = `${userId}/${item.id}.m4a`;
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${objectPath}`;

      const formData = new FormData();
      formData.append('file', {
        uri: item.localUri,
        name: `${item.id}.m4a`,
        type: 'audio/mp4',
      } as any);

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'x-upsert': 'true', // Allow overwriting if object exists (optional, but useful for retries)
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed with status ${res.status}`);
      }

      const { data } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(objectPath);

      setRecordings(prev =>
        prev.map(r =>
          r.id === item.id
            ? { ...r, supabasePath: objectPath, publicUrl: data.publicUrl }
            : r,
        ),
      );
    } catch (error) {
      console.error('Error uploading recording to Supabase:', error);
    }
  };

  const playRecording = (item: RecordingItem) => {
    try {
      if (!item.localUri) return;

      if (playingId === item.id) {
        player.pause();
        setPlayingId(null);
        return;
      }

      player.replace({ uri: item.localUri });
      player.play();
      setPlayingId(item.id);
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording.');
    }
  };

  const deleteRecording = async (item: RecordingItem) => {
    Alert.alert(
      'Delete Recording',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (playingId === item.id) {
                player.pause();
                setPlayingId(null);
              }

              if (item.localUri) {
                await FileSystem.deleteAsync(item.localUri, { idempotent: true });
              }

              if (item.supabasePath) {
                await supabase.storage
                  .from(SUPABASE_BUCKET)
                  .remove([item.supabasePath]);
              }

              setRecordings(prev => prev.filter(r => r.id !== item.id));
            } catch (error) {
              console.error('Error deleting recording:', error);
              Alert.alert('Error', 'Failed to delete recording.');
            }
          },
        },
      ],
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const renderRecordingItem = ({ item }: { item: RecordingItem }) => (
    <TouchableOpacity
      style={styles.recordingItem}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: '/(tabs)/recording-player',
          params: {
            id: item.id,
            name: item.name,
            localUri: item.localUri,
            durationSeconds: String(item.durationSeconds ?? 0),
            createdAt: item.createdAt,
            publicUrl: item.publicUrl ?? '',
          },
        })
      }
    >
      <View style={styles.recordingInfo}>
        <View style={styles.recordingTitleRow}>
          <IconSymbol
            name="waveform"
            size={18}
            color={Colors.primary[600]}
          />
          <Text style={styles.recordingName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <Text style={styles.recordingDate}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
        <Text style={styles.recordingSize}>
          {formatDuration(item.durationSeconds)}
          {item.publicUrl ? '  •  Synced' : ''}
        </Text>
      </View>

      <View style={styles.recordingActions}>
        <IconSymbol
          name="chevron.right"
          size={18}
          color={Colors.neutral[400]}
        />
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteRecording(item)}
        >
          <IconSymbol name="trash.fill" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <IconSymbol
          name="mic.fill"
          size={64}
          color={Colors.neutral[400]}
          style={styles.permissionIcon}
        />
        <Text style={styles.permissionTitle}>Microphone Access Required</Text>
        <Text style={styles.permissionMessage}>
          We need access to your microphone to record voice memos for tickets and documentation.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={initAudio}
        >
          <Text style={styles.permissionButtonText}>Grant Microphone Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.recordingSection}>
        <View style={styles.recordingVisualizer}>
          <View style={[styles.microphoneIcon, recorderState.isRecording && styles.microphoneRecording]}>
            <IconSymbol
              name="mic.fill"
              size={48}
              color={recorderState.isRecording ? Colors.white : Colors.neutral[600]}
            />
          </View>

          {recorderState.isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.pulseDot} />
              <Text style={styles.recordingText}>REC</Text>
            </View>
          )}
        </View>

        <Text style={styles.durationText}>
          {formatDuration(Math.round((recorderState.durationMillis || 0) / 1000))}
        </Text>

        <TouchableOpacity
          style={[
            styles.recordButton,
            recorderState.isRecording && styles.recordButtonActive,
          ]}
          onPress={recorderState.isRecording ? stopRecording : startRecording}
          disabled={isBusy}
        >
          <IconSymbol
            name={recorderState.isRecording ? 'stop.fill' : 'mic.circle.fill'}
            size={32}
            color={Colors.white}
          />
          <Text style={styles.recordButtonText}>
            {recorderState.isRecording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </TouchableOpacity>

        {recorderState.isRecording && (
          <Text style={styles.instructionText}>
            Tap stop when you're finished recording
          </Text>
        )}
      </View>

      <View style={styles.recordingsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Recordings</Text>
          <Text style={styles.recordingsCount}>{recordings.length} recordings</Text>
        </View>

        {recordings.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="waveform" size={48} color={Colors.neutral[300]} />
            <Text style={styles.emptyStateText}>No recordings yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the record button above to create your first voice memo
            </Text>
          </View>
        ) : (
          <FlatList
            data={recordings}
            renderItem={renderRecordingItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.recordingsList}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BrandColors.surface,
    paddingHorizontal: Spacing.xl,
  },
  permissionIcon: {
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  recordingSection: {
    backgroundColor: BrandColors.surface,
    padding: Spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  recordingVisualizer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  microphoneIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BrandColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
    borderWidth: 2,
    borderColor: Colors.neutral[200],
  },
  microphoneRecording: {
    backgroundColor: Colors.danger[500],
  },
  recordingIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger[600],
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
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
  durationText: {
    fontSize: Typography.fontSize.xl2,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing.lg,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: 25,
    gap: Spacing.base,
  },
  recordButtonActive: {
    backgroundColor: Colors.danger[600],
  },
  recordButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  instructionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: Spacing.base,
    textAlign: 'center',
  },
  recordingsSection: {
    flex: 1,
    padding: Spacing.lg,
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
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.surface,
    padding: Spacing.base,
    borderRadius: 12,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  recordingName: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[900],
  },
  recordingDate: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    marginBottom: 2,
  },
  recordingSize: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: Colors.success[600],
  },
  deleteButton: {
    backgroundColor: Colors.danger[600],
  },
});
