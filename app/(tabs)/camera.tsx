import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography, Spacing } from '@/constants/design-system';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    // Request permissions when component mounts
    if (!permission?.granted) {
      requestPermission();
    }
    if (!mediaLibraryPermission?.granted) {
      requestMediaLibraryPermission();
    }
  }, [permission, requestPermission, mediaLibraryPermission, requestMediaLibraryPermission]);

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <IconSymbol 
          name="camera.fill" 
          size={64} 
          color={Colors.neutral[400]} 
          style={styles.permissionIcon}
        />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionMessage}>
          We need access to your camera to take photos for tickets and documentation.
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashMode(current => (current === 'off' ? 'on' : 'off'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false,
        });
        
        if (photo) {
          // Save to media library if permission is granted
          if (mediaLibraryPermission?.granted) {
            try {
              await MediaLibrary.saveToLibraryAsync(photo.uri);
              Alert.alert(
                'Photo Saved',
                'Photo has been saved to your gallery and is ready for use.',
                [{ text: 'OK' }]
              );
            } catch (saveError) {
              console.error('Error saving photo:', saveError);
              Alert.alert(
                'Photo Captured',
                'Photo captured but could not save to gallery. You can still use it in the app.',
                [{ text: 'OK' }]
              );
            }
          } else {
            Alert.alert(
              'Photo Captured',
              'Photo captured! Grant media library permission to save to gallery.',
              [
                { text: 'OK' },
                {
                  text: 'Grant Permission',
                  onPress: requestMediaLibraryPermission
                }
              ]
            );
          }
          
          console.log('Photo URI:', photo.uri);
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
          quality: '720p',
          maxDuration: 60, // 60 seconds max
          mute: false,
        });
        
        setIsRecording(false);
        
        if (video) {
          // Save to media library if permission is granted
          if (mediaLibraryPermission?.granted) {
            try {
              await MediaLibrary.saveToLibraryAsync(video.uri);
              Alert.alert(
                'Video Saved',
                'Video has been saved to your gallery and is ready for use.',
                [{ text: 'OK' }]
              );
            } catch (saveError) {
              console.error('Error saving video:', saveError);
              Alert.alert(
                'Video Recorded',
                'Video recorded but could not save to gallery. You can still use it in the app.',
                [{ text: 'OK' }]
              );
            }
          } else {
            Alert.alert(
              'Video Recorded',
              'Video recorded! Grant media library permission to save to gallery.',
              [
                { text: 'OK' },
                {
                  text: 'Grant Permission',
                  onPress: requestMediaLibraryPermission
                }
              ]
            );
          }
          
          console.log('Video URI:', video.uri);
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
          
          <View style={styles.recordingIndicator}>
            {isRecording && (
              <View style={styles.recordingDot}>
                <Text style={styles.recordingText}>REC</Text>
              </View>
            )}
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

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Photo Button */}
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            disabled={isRecording}
          >
            <View style={[
              styles.captureButtonInner,
              isRecording && styles.captureButtonDisabled
            ]}>
              <IconSymbol
                name="camera.fill"
                size={32}
                color={isRecording ? Colors.neutral[400] : Colors.white}
              />
            </View>
          </TouchableOpacity>

          {/* Video Button */}
          <TouchableOpacity
            style={[
              styles.videoButton,
              isRecording && styles.videoButtonRecording
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <IconSymbol
              name={isRecording ? 'stop.fill' : 'video.fill'}
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {isRecording ? 'Recording... Tap video button to stop' : 'Tap camera to take photo, video button to record'}
        </Text>
      </View>
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
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60, // Account for status bar
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
  recordingIndicator: {
    flex: 1,
    alignItems: 'center',
  },
  recordingDot: {
    backgroundColor: Colors.danger[500],
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  videoButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.danger[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoButtonRecording: {
    backgroundColor: Colors.danger[600],
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
