import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

const { width: screenWidth } = Dimensions.get('window');

export default function CaptureSection() {
  const { user } = useAuthStore();
  const { createMediaItem, uploadToSupabase, ticketFilter, assignMediaToTicket } = useMediaHubStore();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showJobCardSelector, setShowJobCardSelector] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <IconSymbol name="camera.fill" size={64} color={BrandColors.primary} style={styles.permissionIcon} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            We need access to your camera to capture photos and videos for job cards.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : current === 'on' ? 'auto' : 'off'));
  };

  const handleCapture = async (uri: string, type: 'image' | 'video') => {
    if (!user?.id) return;

    try {
      // 1. Save to local library
      const asset = await MediaLibrary.createAssetAsync(uri);

      // 2. Create media item
      const fileName = asset.filename || `capture_${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`;

      const mediaItem = await createMediaItem({
        userId: user.id,
        mediaType: type,
        fileName,
        localUri: asset.uri,
        durationSeconds: type === 'video' ? asset.duration : undefined,
        width: asset.width,
        height: asset.height,
        ticketId: undefined,
        assignedAt: undefined,
      });

      // 3. Handle upload and assignment
      if (ticketFilter) {
        // Assignment will handle the upload internally
        Alert.alert('Captured!', 'Assigning media to job card...');

        setIsAssigning(true);

        // Assignment will wait for/trigger upload as needed
        assignMediaToTicket([mediaItem.id], ticketFilter)
          .then(() => {
            Alert.alert('Success', 'Media assigned to job card!');
          })
          .catch((error) => {
            console.error('Assignment failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to assign to job card';
            Alert.alert('Assignment Failed', errorMessage);
          })
          .finally(() => {
            setIsAssigning(false);
          });
      } else {
        // Just upload in background
        uploadToSupabase(mediaItem).catch(console.error);
        Alert.alert('Saved', 'Media saved to library and uploading in background.');
      }

    } catch (error) {
      console.error('Capture handling failed:', error);
      Alert.alert('Error', 'Failed to save media.');
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        await handleCapture(photo.uri, 'image');
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;
    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync();
      if (video) {
        await handleCapture(video.uri, 'video');
      }
    } catch (error) {
      console.error('Failed to record video:', error);
    } finally {
      setIsRecording(false);
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
        style={styles.camera}
        facing={facing}
        flash={flash}
        ref={cameraRef}
        mode="picture"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.topControls}
        >
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <IconSymbol
              name={flash === 'on' ? 'bolt.fill' : flash === 'auto' ? 'bolt.badge.a.fill' : 'bolt.slash.fill'}
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, ticketFilter && styles.activeTicketButton]}
            onPress={() => setShowJobCardSelector(true)}
          >
            <IconSymbol
              name={ticketFilter ? 'checkmark.circle.fill' : 'doc.text.magnifyingglass'}
              size={24}
              color={ticketFilter ? Colors.success[400] : Colors.white}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <IconSymbol name="camera.rotate.fill" size={24} color={Colors.white} />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={() => useMediaHubStore.getState().setActiveTab('library')}
          >
            <IconSymbol name="photo.on.rectangle" size={24} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButtonOuter}
            onPress={takePicture}
            onLongPress={startRecording}
            onPressOut={stopRecording}
          >
            <View style={[
              styles.captureButtonInner,
              isRecording && styles.captureButtonRecording
            ]} />
          </TouchableOpacity>

          <View style={styles.placeholderButton} />
        </View>

        {isAssigning && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={BrandColors.primary} style={styles.loadingIcon} />
              <Text style={styles.loadingTitle}>Assigning...</Text>
              <Text style={styles.loadingSubtitle}>Linking to job card</Text>
            </View>
          </View>
        )}
      </CameraView>

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
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTicketButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: Colors.success[400],
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: Spacing.xl,
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
  },
  captureButtonRecording: {
    backgroundColor: Colors.error[500],
    transform: [{ scale: 0.8 }],
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderButton: {
    width: 50,
  },

  // Permission styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BrandColors.surface,
    paddingHorizontal: Spacing.xl,
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
