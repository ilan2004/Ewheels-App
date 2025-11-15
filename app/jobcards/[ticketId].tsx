import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  Image,
  TextInput,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { jobCardsService } from '@/services/jobCardsService';
import { floorManagerService } from '@/services/floorManagerService';
import { StatusIcon } from '@/components/empty-states';
import { TriageManagement } from '@/components/triage/TriageManagement';
import { StatusUpdatesTimeline } from '@/components/status/StatusUpdatesTimeline';
import { StatusUpdateInput } from '@/components/status/StatusUpdateInput';

interface TechnicianPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (technicianId: string, dueDate?: string) => void;
  currentAssignee?: string;
  currentDueDate?: string;
}

const TechnicianPickerModal: React.FC<TechnicianPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  currentAssignee,
  currentDueDate,
}) => {
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(currentAssignee || null);
  const [dueDate, setDueDate] = useState<Date>(() => {
    if (currentDueDate) {
      return new Date(currentDueDate);
    }
    // Default to 3 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    return defaultDate;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [step, setStep] = useState<'technician' | 'duedate'>('technician');

  const { data: technicians, isLoading } = useQuery({
    queryKey: ['available-technicians'],
    queryFn: jobCardsService.getTechnicians,
    enabled: visible,
  });

  const handleTechnicianSelect = (technicianId: string) => {
    setSelectedTechnician(technicianId);
    if (technicianId === '') {
      // If unassigning, do it immediately without due date
      onSelect(technicianId);
      onClose();
    } else {
      // Move to due date step
      setStep('duedate');
    }
  };

  const handleAssignWithDueDate = () => {
    if (selectedTechnician) {
      onSelect(selectedTechnician, dueDate.toISOString());
      onClose();
      // Reset state
      setStep('technician');
      setSelectedTechnician(null);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSelectedTechnicianName = () => {
    if (!selectedTechnician) return 'None';
    const technician = technicians?.find(t => t.id === selectedTechnician);
    if (!technician) return selectedTechnician;
    return `${technician.first_name || ''} ${technician.last_name || ''}`.trim() || technician.email;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={step === 'duedate' ? () => setStep('technician') : onClose}>
            <Text style={styles.modalCancel}>{step === 'duedate' ? 'Back' : 'Cancel'}</Text>
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            {step === 'technician' ? 'Assign Technician' : 'Set Due Date'}
          </ThemedText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          {step === 'technician' ? (
            // Step 1: Technician Selection
            <>
              {technicians?.map((technician) => (
                <TouchableOpacity
                  key={technician.id}
                  style={[
                    styles.technicianOption,
                    selectedTechnician === technician.id && styles.technicianOptionSelected,
                  ]}
                  onPress={() => handleTechnicianSelect(technician.id)}
                >
                  <View style={styles.technicianAvatar}>
                    <Text style={styles.technicianInitials}>
                      {`${technician.first_name?.[0] || ''}${technician.last_name?.[0] || ''}`}
                    </Text>
                  </View>
                  <View style={styles.technicianDetails}>
                    <Text style={styles.technicianName}>
                      {`${technician.first_name || ''} ${technician.last_name || ''}`.trim()}
                    </Text>
                    <Text style={styles.technicianEmail}>{technician.email}</Text>
                  </View>
                  {selectedTechnician === technician.id && (
                    <IconSymbol name="checkmark" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}

              {/* Unassign option */}
              <TouchableOpacity
                style={[
                  styles.technicianOption,
                  !currentAssignee && styles.technicianOptionSelected,
                ]}
                onPress={() => handleTechnicianSelect('')}
              >
                <View style={[styles.technicianAvatar, { backgroundColor: '#6B7280' }]}>
                  <IconSymbol name="minus" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.technicianDetails}>
                  <Text style={styles.technicianName}>Unassigned</Text>
                  <Text style={styles.technicianEmail}>Remove current assignment</Text>
                </View>
                {!currentAssignee && (
                  <IconSymbol name="checkmark" size={20} color="#10B981" />
                )}
              </TouchableOpacity>
            </>
          ) : (
            // Step 2: Due Date Selection
            <>
              {/* Assignment Summary */}
              <View style={styles.assignmentSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Technician:</Text>
                  <Text style={styles.summaryValue}>{getSelectedTechnicianName()}</Text>
                </View>
              </View>

              {/* Due Date Section */}
              <View style={styles.dueDateSection}>
                <Text style={styles.dueDateTitle}>Set Due Date</Text>
                <Text style={styles.dueDateSubtitle}>
                  When should this job card be completed?
                </Text>

                {/* Date Display */}
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <IconSymbol name="calendar" size={20} color="#3B82F6" />
                  <Text style={styles.dateButtonText}>{formatDate(dueDate)}</Text>
                  <IconSymbol name="chevron.right" size={16} color="#6B7280" />
                </TouchableOpacity>

                {/* Quick Date Options */}
                <View style={styles.quickDateOptions}>
                  <Text style={styles.quickDateTitle}>Quick Options:</Text>
                  <View style={styles.quickDateButtons}>
                    {[1, 3, 7, 14].map((days) => {
                      const quickDate = new Date();
                      quickDate.setDate(quickDate.getDate() + days);
                      return (
                        <TouchableOpacity
                          key={days}
                          style={styles.quickDateButton}
                          onPress={() => setDueDate(quickDate)}
                        >
                          <Text style={styles.quickDateButtonText}>
                            {days === 1 ? 'Tomorrow' : `${days} days`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Date Picker */}
                {showDatePicker && (
                  <DateTimePicker
                    value={dueDate}
                    mode="date"
                    minimumDate={new Date()}
                    onChange={handleDateChange}
                  />
                )}
              </View>

              {/* Assign Button */}
              <TouchableOpacity
                style={styles.assignButton}
                onPress={handleAssignWithDueDate}
              >
                <Text style={styles.assignButtonText}>Assign with Due Date</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </ThemedView>
    </Modal>
  );
};

// Image Viewer Modal Component
interface ImageViewerModalProps {
  visible: boolean;
  onClose: () => void;
  images: Array<{ id: string; url: string; name: string }>;
  initialIndex: number;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  onClose,
  images,
  initialIndex,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  if (!images.length) return null;

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <View style={styles.imageViewerContainer}>
        <StatusBar hidden />
        
        {/* Header */}
        <View style={styles.imageViewerHeader}>
          <TouchableOpacity onPress={onClose} style={styles.imageViewerCloseButton}>
            <IconSymbol name="xmark" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.imageViewerTitle}>
            <Text style={styles.imageViewerTitleText}>
              {currentIndex + 1} of {images.length}
            </Text>
            <Text style={styles.imageViewerSubtitle} numberOfLines={1}>
              {images[currentIndex]?.name}
            </Text>
          </View>
          <View style={styles.imageViewerSpacer} />
        </View>

        {/* Image */}
        <View style={styles.imageViewerContent}>
          <Image
            source={{ uri: images[currentIndex]?.url }}
            style={[styles.fullScreenImage, { width: screenWidth, height: screenHeight - 100 }]}
            resizeMode="contain"
          />
        </View>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <TouchableOpacity
              style={[styles.imageNavButton, styles.imageNavButtonLeft]}
              onPress={goToPrevious}
            >
              <IconSymbol name="chevron.left" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.imageNavButton, styles.imageNavButtonRight]}
              onPress={goToNext}
            >
              <IconSymbol name="chevron.right" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}

        {/* Bottom indicators */}
        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.imageIndicator,
                  index === currentIndex && styles.imageIndicatorActive,
                ]}
                onPress={() => setCurrentIndex(index)}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
};

// Audio Player Modal Component
interface AudioPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  audio: { id: string; url: string; name: string; duration?: number } | null;
}

const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({
  visible,
  onClose,
  audio,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set audio mode for better iOS/Android compatibility
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.log('Failed to set audio mode:', e);
      }
    };
    
    configureAudio();
    
    return () => {
      if (sound) {
        sound.unloadAsync().catch(e => console.log('Error unloading sound:', e));
      }
    };
  }, [sound]);

  useEffect(() => {
    if (!visible) {
      if (sound) {
        sound.unloadAsync().catch(e => console.log('Error unloading sound:', e));
        setSound(null);
      }
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      setError(null);
    }
  }, [visible, sound]);

  const loadAudio = async () => {
    if (!audio?.url) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Clean up existing sound
      if (sound) {
        await sound.unloadAsync();
      }

      console.log('Loading audio from URL:', audio.url);
      
      // Try to load with different configurations for better WAV compatibility
      let audioSound;
      
      try {
        // First try with basic configuration
        const result = await Audio.Sound.createAsync(
          { uri: audio.url },
          {
            shouldPlay: false,
            isLooping: false,
            volume: 1.0,
            rate: 1.0,
            shouldCorrectPitch: false,
          },
          onPlaybackStatusUpdate
        );
        audioSound = result.sound;
      } catch (firstError) {
        console.log('First load attempt failed, trying alternative method:', firstError);
        
        // Second attempt with minimal configuration
        try {
          const result = await Audio.Sound.createAsync(
            { uri: audio.url },
            { shouldPlay: false },
            onPlaybackStatusUpdate
          );
          audioSound = result.sound;
        } catch (secondError) {
          console.log('Second load attempt failed:', secondError);
          throw new Error('Audio format not compatible with this device');
        }
      }
      
      setSound(audioSound);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading audio:', err);
      let errorMessage = 'Failed to load audio file.';
      
      // Provide more specific error messages
      if (err.message?.includes('11800')) {
        errorMessage = 'WAV file format not compatible with this device. Try converting to MP3 or M4A format.';
      } else if (err.message?.includes('not compatible')) {
        errorMessage = 'Audio format not supported on this device.';
      } else if (err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Audio loading timed out. Please try again.';
      } else if (audio.url.toLowerCase().includes('.wav')) {
        errorMessage = 'WAV file playback issue. Some WAV formats are not supported on mobile devices.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying || false);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    } else if (status.error) {
      console.error('Playback status error:', status.error);
      setError(`Playback error: ${status.error}`);
      setIsPlaying(false);
    }
  };

  const togglePlayback = async () => {
    try {
      if (!sound) {
        await loadAudio();
        return;
      }

      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError('Playback failed. Please try again.');
    }
  };

  const seekTo = async (positionMs: number) => {
    if (sound && duration > 0) {
      try {
        await sound.setPositionAsync(positionMs);
      } catch (err) {
        console.error('Seek error:', err);
      }
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (sound) {
      sound.unloadAsync().catch(e => console.log('Error closing sound:', e));
    }
    onClose();
  };

  if (!audio) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.audioPlayerContainer}>
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
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={loadAudio}
                disabled={isLoading}
              >
                <Text style={styles.retryButtonText}>
                  {isLoading ? 'Loading...' : 'Retry'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Controls */}
          <View style={styles.audioControls}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <View style={styles.progressBar}>
                <TouchableOpacity
                  style={styles.progressTrack}
                  onPress={(e) => {
                    if (duration > 0) {
                      const { locationX } = e.nativeEvent;
                      const progressBarWidth = 250; // Approximate width
                      const newPosition = (locationX / progressBarWidth) * duration;
                      seekTo(newPosition);
                    }
                  }}
                >
                  <View style={styles.progressBackground} />
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }
                    ]} 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
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
                  name={isPlaying ? 'pause.fill' : 'play.fill'}
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

export default function JobCardDetailScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const [showTechnicianPicker, setShowTechnicianPicker] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedAudio, setSelectedAudio] = useState<{ id: string; url: string; name: string; duration?: number } | null>(null);
  const queryClient = useQueryClient();

  // Fetch ticket details
  const {
    data: ticket,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ticket-detail', ticketId],
    queryFn: () => jobCardsService.getTicketById(ticketId!),
    enabled: !!ticketId,
  });

  // Fetch technicians for name lookup
  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => jobCardsService.getTechnicians(),
  });

  // Fetch ticket attachments
  const { data: attachments = [] } = useQuery({
    queryKey: ['ticket-attachments', ticketId],
    queryFn: () => jobCardsService.getTicketAttachments(ticketId!),
    enabled: !!ticketId,
  });

  // Fetch status updates
  const { data: statusUpdates = [], refetch: refetchStatusUpdates } = useQuery({
    queryKey: ['status-updates', ticketId],
    queryFn: () => jobCardsService.getStatusUpdates(ticketId!),
    enabled: !!ticketId,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Assignment mutation
  const assignTicketMutation = useMutation({
    mutationFn: ({ technicianId, dueDate }: { technicianId: string; dueDate?: string }) =>
      jobCardsService.assignTicket(ticketId!, technicianId, dueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['team-workload'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', ticketId] });
    },
    onError: (error: any) => {
      Alert.alert(
        'Assignment Failed',
        error.message || 'Failed to assign ticket. Please try again.'
      );
    },
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      jobCardsService.updateTicketStatus(ticketId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
    },
  });

  const handleAssignTechnician = (technicianId: string, dueDate?: string) => {
    assignTicketMutation.mutate({ technicianId, dueDate });
  };

  const handleStatusUpdate = (status: string) => {
    Alert.alert(
      'Update Status',
      `Change status to "${status.replace('_', ' ')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => updateStatusMutation.mutate(status),
        },
      ]
    );
  };

  // Media click handlers
  const handleImageClick = (attachmentId: string) => {
    const imageAttachments = attachments
      .filter(att => (att.attachmentType === 'photo' || att.attachment_type === 'photo') && imageUrls[att.id])
      .map(att => ({
        id: att.id,
        url: imageUrls[att.id],
        name: att.originalName || att.original_name || att.fileName || att.file_name || 'Image'
      }));
    
    const index = imageAttachments.findIndex(img => img.id === attachmentId);
    if (index >= 0) {
      setSelectedImageIndex(index);
      setShowImageViewer(true);
    }
  };

  const handleAudioClick = (attachmentId: string) => {
    const attachment = attachments.find(att => att.id === attachmentId);
    const audioUrl = audioUrls[attachmentId];
    
    if (attachment && audioUrl) {
      setSelectedAudio({
        id: attachment.id,
        url: audioUrl,
        name: attachment.originalName || attachment.original_name || attachment.fileName || attachment.file_name || 'Audio',
        duration: attachment.duration
      });
      setShowAudioPlayer(true);
    }
  };

  // Helper function to get technician name
  const getTechnicianName = (technicianId: string): string => {
    if (!technicianId) return 'Unassigned';
    const technician = technicians.find(t => t.id === technicianId);
    if (!technician) return technicianId; // Fallback to ID if name not found
    return `${technician.first_name || ''} ${technician.last_name || ''}`.trim() || technician.email || technicianId;
  };

  // Helper function to get creator name
  const getCreatorName = (ticket: any): string => {
    if (ticket.creator) {
      // Use the creator information from the API join
      return ticket.creator.username || ticket.creator.email || 'Unknown';
    }
    // Fallback: if no creator info, return 'Unknown' instead of showing user ID
    return 'Unknown';
  };

  // Load media URLs for attachments
  React.useEffect(() => {
    const loadMediaUrls = async () => {
      for (const attachment of attachments) {
        const isPhoto = attachment.attachmentType === 'photo' || attachment.attachment_type === 'photo';
        const isAudio = attachment.attachmentType === 'audio' || attachment.attachment_type === 'audio';
        const storagePath = attachment.storagePath || attachment.storage_path;
        const attachmentType = attachment.attachmentType || attachment.attachment_type;
        
        if (isPhoto && storagePath && !imageUrls[attachment.id]) {
          try {
            const signedUrl = await jobCardsService.getAttachmentSignedUrl(storagePath, attachmentType);
            if (signedUrl) {
              setImageUrls(prev => ({ ...prev, [attachment.id]: signedUrl }));
            }
          } catch (error) {
            console.error('Error loading image URL for attachment:', attachment.id, error);
          }
        } else if (isAudio && storagePath && !audioUrls[attachment.id]) {
          try {
            const signedUrl = await jobCardsService.getAttachmentSignedUrl(storagePath, attachmentType);
            if (signedUrl) {
              setAudioUrls(prev => ({ ...prev, [attachment.id]: signedUrl }));
            }
          } catch (error) {
            console.error('Error loading audio URL for attachment:', attachment.id, error);
          }
        }
      }
    };

    if (attachments.length > 0) {
      loadMediaUrls();
    }
  }, [attachments, imageUrls, audioUrls]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return '#EF4444';
      case 'triaged': return '#F59E0B';
      case 'in_progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return '#EF4444';
      case 2: return '#F59E0B';
      case 3: return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return 'High Priority';
      case 2: return 'Medium Priority';
      case 3: return 'Low Priority';
      default: return 'Unknown Priority';
    }
  };

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'reported':
        return ['triaged'];
      case 'triaged':
        return ['in_progress'];
      case 'in_progress':
        return ['completed'];
      default:
        return [];
    }
  };

  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Error',
            headerBackTitle: 'Back',
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
          }}
        />
        <ThemedView style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load ticket details</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </ThemedView>
      </>
    );
  }

  if (!ticket && !isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Not Found',
            headerBackTitle: 'Back',
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
          }}
        />
        <ThemedView style={styles.errorContainer}>
          <Text style={styles.errorText}>Ticket not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </ThemedView>
      </>
    );
  }

  const nextStatusOptions = ticket ? getNextStatusOptions(ticket.status) : [];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Job Card Details',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTitleStyle: {
            fontWeight: '600',
            color: '#111827',
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowTechnicianPicker(true)}
              style={{ marginRight: 16 }}
              disabled={assignTicketMutation.isPending}
            >
              {assignTicketMutation.isPending ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <IconSymbol 
                  name={(ticket?.assigned_to || ticket?.assignedTo) ? "arrow.triangle.2.circlepath" : "person.badge.plus"} 
                  size={24} 
                  color="#3B82F6" 
                />
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
        >
          {isLoading && !ticket && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading ticket details...</Text>
            </View>
          )}

        {ticket && (
          <>
            {/* Status Progress */}
            <View style={styles.section}>
              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>Service Progress</Text>
                <View style={styles.progressContainer}>
                  {['reported', 'triaged', 'in_progress', 'completed'].map((status, index) => {
                    const isActive = ['reported', 'triaged', 'in_progress', 'completed'].indexOf(ticket.status) >= index;
                    const isCurrent = ticket.status === status;
                    
                    return (
                      <View key={status} style={styles.progressStep}>
                        <View style={[
                          styles.progressDot, 
                          isActive && styles.progressDotActive,
                          isCurrent && styles.progressDotCurrent
                        ]}>
                          {isActive && (
                            <IconSymbol 
                              name={isCurrent ? "clock.fill" : "checkmark"} 
                              size={12} 
                              color={isCurrent ? "#3B82F6" : "#FFFFFF"} 
                            />
                          )}
                        </View>
                        <Text style={[
                          styles.progressLabel,
                          isActive && styles.progressLabelActive,
                          isCurrent && styles.progressLabelCurrent
                        ]}>
                          {status.replace('_', ' ')}
                        </Text>
                        {index < 3 && (
                          <View style={[
                            styles.progressLine,
                            isActive && styles.progressLineActive
                          ]} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Ticket Info */}
            <View style={styles.section}>
              <View style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketHeaderLeft}>
                    <View style={styles.ticketNumberContainer}>
                      <IconSymbol name="doc.text.fill" size={20} color="#3B82F6" />
                      <Text style={styles.ticketNumber}>{ticket.ticket_number || ticket.ticketNumber}</Text>
                    </View>
                    <View style={styles.ticketBadges}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                        <StatusIcon status={ticket.status as any} size="sm" />
                        <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                          {ticket.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Text style={styles.symptom}>{ticket.customer_complaint || ticket.symptom}</Text>
                {ticket.description && (
                  <Text style={styles.description}>{ticket.description}</Text>
                )}
              </View>
            </View>

            {/* Customer Info */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                <IconSymbol name="person.fill" size={18} color="#111827" /> Customer Information
              </ThemedText>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <IconSymbol name="person.circle" size={16} color="#6B7280" />
                    <Text style={styles.infoLabel}>Name</Text>
                  </View>
                  <Text style={styles.infoValue}>{ticket.customer?.name || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <IconSymbol name="phone.fill" size={16} color="#6B7280" />
                    <Text style={styles.infoLabel}>Contact</Text>
                  </View>
                  <Text style={styles.infoValue}>{ticket.customer?.contact || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <IconSymbol name="envelope.fill" size={16} color="#6B7280" />
                    <Text style={styles.infoLabel}>Email</Text>
                  </View>
                  <Text style={styles.infoValue}>{ticket.customer?.email || 'N/A'}</Text>
                </View>
                {(ticket.vehicle_reg_no || ticket.vehicleRegNo) && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <IconSymbol name="car.fill" size={16} color="#6B7280" />
                      <Text style={styles.infoLabel}>Vehicle</Text>
                    </View>
                    <Text style={styles.infoValue}>{ticket.vehicle_reg_no || ticket.vehicleRegNo}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Description */}
            {ticket.description && (
              <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  <IconSymbol name="doc.text" size={18} color="#111827" /> Description
                </ThemedText>
                <View style={styles.infoCard}>
                  <Text style={styles.descriptionText}>{ticket.description || ticket.customer_complaint}</Text>
                </View>
              </View>
            )}

            {/* Intake Media */}
            {attachments.length > 0 && (
              <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  <IconSymbol name="camera" size={18} color="#111827" /> Intake Media
                </ThemedText>
                <View style={styles.infoCard}>
                  <View style={styles.mediaStats}>
                    {attachments.filter(att => att.attachmentType === 'photo' || att.attachment_type === 'photo').length > 0 && (
                      <View style={styles.mediaStatItem}>
                        <IconSymbol name="photo" size={16} color="#6B7280" />
                        <Text style={styles.mediaStatText}>
                          {attachments.filter(att => att.attachmentType === 'photo' || att.attachment_type === 'photo').length} photos
                        </Text>
                      </View>
                    )}
                    {attachments.filter(att => att.attachmentType === 'audio' || att.attachment_type === 'audio').length > 0 && (
                      <View style={styles.mediaStatItem}>
                        <IconSymbol name="mic" size={16} color="#6B7280" />
                        <Text style={styles.mediaStatText}>
                          {attachments.filter(att => att.attachmentType === 'audio' || att.attachment_type === 'audio').length} audio files
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Media Grid */}
                  <View style={styles.mediaGrid}>
                    {attachments.map((attachment) => {
                      const isPhoto = attachment.attachmentType === 'photo' || attachment.attachment_type === 'photo';
                      const isAudio = attachment.attachmentType === 'audio' || attachment.attachment_type === 'audio';
                      const imageUrl = imageUrls[attachment.id];
                      const audioUrl = audioUrls[attachment.id];
                      const fileName = attachment.originalName || attachment.original_name || attachment.fileName || attachment.file_name;
                      const fileSize = attachment.fileSize || attachment.file_size;
                      
                      return (
                        <TouchableOpacity
                          key={attachment.id}
                          style={styles.mediaItem}
                          onPress={() => {
                            if (isPhoto) {
                              handleImageClick(attachment.id);
                            } else if (isAudio) {
                              handleAudioClick(attachment.id);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          {isPhoto ? (
                            <View style={styles.photoItem}>
                              {imageUrl ? (
                                <View style={styles.imageContainer}>
                                  <Image 
                                    source={{ uri: imageUrl }}
                                    style={styles.attachmentImage}
                                    resizeMode="cover"
                                  />
                                  <View style={styles.imageOverlay}>
                                    <IconSymbol name="eye.fill" size={16} color="#FFFFFF" />
                                  </View>
                                </View>
                              ) : (
                                <View style={styles.imagePlaceholder}>
                                  <IconSymbol name="photo.fill" size={24} color="#3B82F6" />
                                </View>
                              )}
                              <Text style={styles.mediaFileName} numberOfLines={2}>
                                {fileName}
                              </Text>
                              <Text style={styles.mediaFileSize}>
                                {fileSize ? (fileSize / (1024 * 1024)).toFixed(1) + ' MB' : 'Image'}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.audioItem}>
                              <View style={styles.audioIconContainer}>
                                <IconSymbol name="waveform" size={24} color="#10B981" />
                                <View style={styles.playIconOverlay}>
                                  <IconSymbol name="play.fill" size={12} color="#FFFFFF" />
                                </View>
                              </View>
                              <Text style={styles.mediaFileName} numberOfLines={2}>
                                {fileName}
                              </Text>
                              <Text style={styles.mediaFileSize}>
                                {attachment.duration ? `${attachment.duration}s` : 'Audio'}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* Triage Management - For Floor Managers */}
            <View style={styles.section}>
              <TriageManagement 
                ticket={ticket} 
                onRefresh={refetch}
              />
            </View>

            {/* Assignment Info */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                <IconSymbol name="person.badge.clock" size={18} color="#111827" /> Assignment Details
              </ThemedText>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <IconSymbol name="flag.fill" size={16} color={getStatusColor(ticket.status)} />
                    <Text style={styles.infoLabel}>Status</Text>
                  </View>
                  <Text style={[styles.infoValue, { color: getStatusColor(ticket.status) }]}>
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <IconSymbol name={(ticket.assigned_to || ticket.assignedTo) ? "person.fill" : "person.badge.plus"} size={16} color={(ticket.assigned_to || ticket.assignedTo) ? "#10B981" : "#F59E0B"} />
                    <Text style={styles.infoLabel}>Assigned to</Text>
                  </View>
                  <Text style={[styles.infoValue, { color: (ticket.assigned_to || ticket.assignedTo) ? '#10B981' : '#F59E0B' }]}>
                    {getTechnicianName(ticket.assigned_to || ticket.assignedTo || '')}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <IconSymbol name="person.crop.circle" size={16} color="#6B7280" />
                    <Text style={styles.infoLabel}>Created By</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {getCreatorName(ticket)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <IconSymbol name="calendar.badge.plus" size={16} color="#6B7280" />
                    <Text style={styles.infoLabel}>Created At</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {new Date(ticket.created_at || ticket.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </Text>
                </View>
                {(ticket.assigned_at || ticket.assignedAt) && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <IconSymbol name="calendar.badge.checkmark" size={16} color="#6B7280" />
                      <Text style={styles.infoLabel}>Assigned</Text>
                    </View>
                    <Text style={styles.infoValue}>
                      {new Date(ticket.assigned_at || ticket.assignedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {(ticket.due_date || ticket.dueDate) && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <IconSymbol name="clock" size={16} color={new Date(ticket.due_date || ticket.dueDate) < new Date() ? "#EF4444" : "#6B7280"} />
                      <Text style={styles.infoLabel}>Due Date</Text>
                    </View>
                    <Text style={[styles.infoValue, { color: new Date(ticket.due_date || ticket.dueDate) < new Date() ? '#EF4444' : '#111827' }]}>
                      {new Date(ticket.due_date || ticket.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Status Actions */}
            {nextStatusOptions.length > 0 && (
              <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  <IconSymbol name="arrow.forward.circle" size={18} color="#111827" /> Status Actions
                </ThemedText>
                <View style={styles.statusActions}>
                  {nextStatusOptions.map((status) => {
                    const getStatusIcon = (status: string) => {
                      switch (status) {
                        case 'triaged': return 'magnifyingglass';
                        case 'in_progress': return 'hammer';
                        case 'completed': return 'checkmark.circle.fill';
                        default: return 'arrow.forward';
                      }
                    };
                    
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusActionButton,
                          { backgroundColor: getStatusColor(status) + '20' },
                        ]}
                        onPress={() => handleStatusUpdate(status)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.statusActionContent}>
                          <IconSymbol 
                            name={getStatusIcon(status)} 
                            size={20} 
                            color={getStatusColor(status)} 
                          />
                          <Text style={[styles.statusActionText, { color: getStatusColor(status) }]}>
                            Mark as {status.replace('_', ' ')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Status Updates - Progress Timeline */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                <IconSymbol name="clock" size={18} color="#111827" /> Progress Updates
              </ThemedText>
              
              <View style={styles.statusUpdatesCard}>
                {/* Add Update Button */}
                <StatusUpdateInput
                  ticketId={ticketId}
                  currentStatus={ticket.status}
                  onUpdateAdded={() => {
                    refetchStatusUpdates();
                    refetch(); // Also refresh main ticket data
                  }}
                />
                
                {/* Updates Timeline */}
                <StatusUpdatesTimeline
                  updates={statusUpdates}
                  currentStatus={ticket.status}
                  canDelete={false} // For now, don't allow deletion
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Technician Picker Modal */}
      <TechnicianPickerModal
        visible={showTechnicianPicker}
        onClose={() => setShowTechnicianPicker(false)}
        onSelect={handleAssignTechnician}
        currentAssignee={ticket?.assigned_to || ticket?.assignedToId || ticket?.assignedTo}
        currentDueDate={ticket?.due_date || ticket?.dueDate}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        visible={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        images={attachments
          .filter(att => (att.attachmentType === 'photo' || att.attachment_type === 'photo') && imageUrls[att.id])
          .map(att => ({
            id: att.id,
            url: imageUrls[att.id],
            name: att.originalName || att.original_name || att.fileName || att.file_name || 'Image'
          }))}
        initialIndex={selectedImageIndex}
      />

      {/* Audio Player Modal */}
      <AudioPlayerModal
        visible={showAudioPlayer}
        onClose={() => setShowAudioPlayer(false)}
        audio={selectedAudio}
      />
    </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    padding: 20,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: '#10B981',
  },
  progressDotCurrent: {
    backgroundColor: '#3B82F6',
  },
  progressLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  progressLabelActive: {
    color: '#374151',
    fontWeight: '500',
  },
  progressLabelCurrent: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  progressLine: {
    position: 'absolute',
    top: 12,
    left: '50%',
    right: -50,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  progressLineActive: {
    backgroundColor: '#10B981',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  ticketHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  ticketNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  ticketNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  ticketBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reassignButton: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  reassignButtonText: {
    color: '#F59E0B',
  },
  symptom: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statusActions: {
    gap: 12,
  },
  statusActionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusActionText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusUpdatesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalSpacer: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  technicianOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  technicianOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  technicianAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  technicianInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  technicianDetails: {
    flex: 1,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  technicianEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Description styles
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  // Media styles
  mediaStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mediaStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mediaStatText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mediaItem: {
    width: '48%',
    minWidth: 120,
  },
  photoItem: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  audioItem: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  imageOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconOverlay: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#10B981',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaFileName: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  mediaFileSize: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginBottom: 6,
  },
  // Due Date Picker Styles
  assignmentSummary: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '700',
  },
  dueDateSection: {
    marginBottom: 24,
  },
  dueDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  dueDateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  quickDateOptions: {
    marginBottom: 20,
  },
  quickDateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quickDateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickDateButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickDateButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  assignButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Image Viewer Modal Styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imageViewerCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerTitle: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageViewerTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageViewerSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  imageViewerSpacer: {
    width: 44,
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  imageNavButtonLeft: {
    left: 20,
  },
  imageNavButtonRight: {
    right: 20,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1000,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  imageIndicatorActive: {
    backgroundColor: '#FFFFFF',
  },
  // Audio Player Modal Styles
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
    textAlign: 'center',
  },
  audioWarning: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  audioError: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
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
