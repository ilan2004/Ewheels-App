import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { LinearGradient } from 'expo-linear-gradient';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography, Spacing } from '@/constants/design-system';
import { useMediaHubStore } from '@/stores/mediaHubStore';
import { useAuthStore } from '@/stores/authStore';
import JobCardSelector from './JobCardSelector';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CaptureSection() {
  const { user } = useAuthStore();
  const { createMediaItem, uploadToSupabase, ticketFilter } = useMediaHubStore();
  
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [showJobCardSelector, setShowJobCardSelector] = useState(false);
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    if (!mediaLibraryPermission?.granted) {
      requestMediaLibraryPermission();
    }
  }, [permission, mediaLibraryPermission]);

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient
          colors={[Colors.primary[500], Colors.primary[600]]}
          style={styles.permissionCard}
        >
          <IconSymbol
            name="camera.fill"
            size={64}
            color={Colors.white}
            style={styles.permissionIcon}
          />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            We need access to your camera to capture photos and videos for job cards.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashMode(current => (current === 'off' ? 'on' : 'off'));
  };

  const handleCapture = async (uri: string, mediaType: 'image' | 'video', metadata?: any) => {
    if (!user?.id) return;

    try {
      // Save to media library if permission granted
      if (mediaLibraryPermission?.granted) {
        try {
          await MediaLibrary.saveToLibraryAsync(uri);
        } catch (saveError) {
          console.warn('Failed to save to media library:', saveError);
        }
      }

      // Create media item in our system
      const fileName = `${mediaType}_${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`;
      
      const mediaItem = await createMediaItem({
        userId: user.id,
        mediaType,
        fileName,
        localUri: uri,
        ticketId: ticketFilter || undefined,
        assignedAt: ticketFilter ? new Date().toISOString() : undefined,
        metadata: {
          captureMode,
          facing,
          flashMode,
          ...metadata,
        },
      });

      // Upload to Supabase in background
      uploadToSupabase(mediaItem).catch(error => {
        console.error('Upload failed:', error);
      });

      Alert.alert(
        `${mediaType === 'image' ? 'Photo' : 'Video'} Captured`,
        `${mediaType === 'image' ? 'Photo' : 'Video'} saved successfully!${ticketFilter ? ` Assigned to current job card.` : ''}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error handling capture:', error);
      Alert.alert('Error', `Failed to save ${mediaType}. Please try again.`);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: true,
        });
        
        if (photo) {
          await handleCapture(photo.uri, 'image', {
            width: photo.width,
            height: photo.height,
            exif: photo.exif,
          });
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync({
          maxDuration: 60,
          mute: false,
        });
        
        setIsRecording(false);
        
        if (video) {
          await handleCapture(video.uri, 'video', {
            duration: video.duration,
          });
        }
      } catch (error) {
        console.error('Error recording video:', error);
        setIsRecording(false);
        Alert.alert('Error', 'Failed to record video. Please try again.');
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flashMode}
        mode={captureMode}
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleFlash}
          >
            <IconSymbol
              name={flashMode === 'on' ? 'bolt.fill' : 'bolt.slash.fill'}
              size={24}
              color={flashMode === 'on' ? Colors.warning[500] : Colors.white}
            />
          </TouchableOpacity>
          
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                captureMode === 'photo' && styles.modeButtonActive
              ]}
              onPress={() => setCaptureMode('photo')}
            >
              <Text style={[
                styles.modeText,
                captureMode === 'photo' && styles.modeTextActive
              ]}>
                Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                captureMode === 'video' && styles.modeButtonActive
              ]}
              onPress={() => setCaptureMode('video')}
            >
              <Text style={[
                styles.modeText,
                captureMode === 'video' && styles.modeTextActive
              ]}>
                Video
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleCameraFacing}
          >
            <IconSymbol
              name="arrow.triangle.2.circlepath.camera.fill"
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Recording Indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC</Text>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Job Card Selector Button */}
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

          {/* Capture Button */}
          <TouchableOpacity
            style={[
              styles.captureButton,
              captureMode === 'video' && styles.captureButtonVideo,
              isRecording && styles.captureButtonRecording
            ]}
            onPress={captureMode === 'photo' ? takePicture : (isRecording ? stopRecording : startRecording)}
          >
            <View style={[
              styles.captureButtonInner,
              captureMode === 'video' && styles.captureButtonInnerVideo,
              isRecording && styles.captureButtonInnerRecording
            ]}>
              {captureMode === 'photo' ? (
                <IconSymbol
                  name="camera.fill"
                  size={32}
                  color={Colors.primary[600]}
                />
              ) : (
                <IconSymbol
                  name={isRecording ? 'stop.fill' : 'video.fill'}
                  size={28}
                  color={Colors.white}
                />
              )}
            </View>
          </TouchableOpacity>

          {/* Gallery Preview Button */}
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={() => useMediaHubStore.getState().setActiveTab('library')}
          >
            <IconSymbol
              name="photo.on.rectangle"
              size={20}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {isRecording 
            ? 'Recording... Tap to stop' 
            : captureMode === 'photo'
            ? 'Tap circle to take photo'
            : 'Tap circle to start recording'
          }
        </Text>
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
    backgroundColor: Colors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[900],
  },
  loadingText: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
  },
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
    color: Colors.primary[100],
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
    color: Colors.primary[600],
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.base,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 2,
  },
  modeButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
  },
  modeButtonActive: {
    backgroundColor: Colors.white,
  },
  modeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
  },
  modeTextActive: {
    color: Colors.black,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 120,
    left: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger[500],
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    marginRight: Spacing.xs,
  },
  recordingText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  jobCardButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobCardButtonActive: {
    backgroundColor: Colors.success[500],
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonVideo: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  captureButtonRecording: {
    backgroundColor: Colors.danger[500],
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInnerVideo: {
    backgroundColor: Colors.danger[500],
  },
  captureButtonInnerRecording: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
  },
  instructionsText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
});
