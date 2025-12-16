import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Typography } from '@/constants/design-system';
import { jobCardsService } from '@/services/jobCardsService';
import { useMediaHubStore } from '@/stores/mediaHubStore';
import { useMediaStore } from '@/stores/mediaStore';
import { ServiceTicket } from '@/types';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import * as ExpoMediaLibrary from 'expo-media-library';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const itemWidth = (screenWidth - (Spacing.lg * 2) - (Spacing.base * 2)) / 3;

export default function MediaLibrary() {
  const { getAllMedia, refreshRecordings } = useMediaStore();
  const { assignToTicket } = useMediaHubStore();
  const allMedia = getAllMedia();

  const [selectedMedia, setSelectedMedia] = useState<typeof allMedia[0] | null>(null);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'videos' | 'audio'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [jobCardModalVisible, setJobCardModalVisible] = useState(false);
  const [availableJobCards, setAvailableJobCards] = useState<ServiceTicket[]>([]);
  const [loadingJobCards, setLoadingJobCards] = useState(false);
  const [hasMediaLibraryPermissions, setHasMediaLibraryPermissions] = useState(false);

  const filteredMedia = allMedia.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'images') return item.type === 'image';
    if (filterType === 'videos') return item.type === 'video';
    if (filterType === 'audio') return item.type === 'audio';
    return true;
  });

  // Refresh recordings when component mounts and when tab is focused
  React.useEffect(() => {
    refreshRecordings();
    requestMediaLibraryPermissions();
  }, []);

  const requestMediaLibraryPermissions = async () => {
    try {
      const { status } = await ExpoMediaLibrary.requestPermissionsAsync();
      setHasMediaLibraryPermissions(status === 'granted');
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
    }
  };

  const loadJobCards = async () => {
    try {
      setLoadingJobCards(true);
      const response = await jobCardsService.getRecentTickets(50);
      setAvailableJobCards(response);
    } catch (error) {
      console.error('Error loading job cards:', error);
      Alert.alert('Error', 'Failed to load job cards');
    } finally {
      setLoadingJobCards(false);
    }
  };

  const openMedia = useCallback((item: typeof allMedia[0]) => {
    console.log('Opening media:', item.name, 'Modal visible:', modalVisible);
    setSelectedMedia(item);
    setModalVisible(true);
    console.log('Set modal visible to true');
  }, [modalVisible]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedMedia(null);
  }, []);

  const deleteMedia = useCallback((itemId: string) => {
    Alert.alert(
      'Delete Media',
      'Are you sure you want to delete this media file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Here you would delete from actual storage
            console.log('Deleting media:', itemId);
            closeModal();
          },
        },
      ]
    );
  }, [closeModal]);

  const shareMedia = useCallback((item: typeof allMedia[0]) => {
    // Here you would implement sharing functionality
    console.log('Sharing media:', item.name);
  }, []);

  const downloadMedia = useCallback(async (item: typeof allMedia[0]) => {
    if (!hasMediaLibraryPermissions) {
      Alert.alert(
        'Permission Required',
        'Media library access is needed to download images.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Grant Permission',
            onPress: requestMediaLibraryPermissions
          }
        ]
      );
      return;
    }

    try {
      if (item.type === 'image') {
        // For images, save to the Photos album
        await ExpoMediaLibrary.saveToLibraryAsync(item.uri);
        Alert.alert('Success', 'Image saved to Photos');
      } else {
        // For other media types, copy to Downloads folder
        const downloadPath = `${(FileSystem as any).documentDirectory || ''}Downloads/`;

        // Ensure Downloads directory exists
        const dirInfo = await FileSystem.getInfoAsync(downloadPath);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(downloadPath, { intermediates: true });
        }

        const fileName = item.name || `media_${Date.now()}.${item.type === 'video' ? 'mp4' : 'm4a'}`;
        const filePath = downloadPath + fileName;

        await FileSystem.copyAsync({
          from: item.uri,
          to: filePath
        });

        Alert.alert('Success', `File saved to Downloads folder as ${fileName}`);
      }
    } catch (error) {
      console.error('Error downloading media:', error);
      Alert.alert('Error', 'Failed to download media file');
    }
  }, [hasMediaLibraryPermissions]);

  const handleAssignToJobCard = useCallback(() => {
    loadJobCards();
    setJobCardModalVisible(true);
  }, []);

  const assignMediaToJobCard = useCallback(async (jobCard: ServiceTicket) => {
    if (!selectedMedia) return;

    try {
      // Convert selectedMedia to MediaItem format for the store
      const mediaItemId = selectedMedia.id;

      await assignToTicket([mediaItemId], jobCard.id);

      Alert.alert(
        'Success',
        `Media assigned to job card ${jobCard.ticket_number || jobCard.ticketNumber}`
      );

      setJobCardModalVisible(false);
      closeModal();
    } catch (error) {
      console.error('Error assigning media to job card:', error);
      Alert.alert('Error', 'Failed to assign media to job card');
    }
  }, [selectedMedia, assignToTicket]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderGridItem = useCallback(({ item }: { item: typeof allMedia[0] }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => openMedia(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.thumbnail || item.uri }}
        style={styles.gridImage}
        contentFit="cover"
      />

      {/* Media Type Indicator */}
      <View style={styles.typeIndicator}>
        <IconSymbol
          name={
            item.type === 'video' ? 'play.circle.fill' :
              item.type === 'audio' ? 'mic.fill' :
                'photo.fill'
          }
          size={16}
          color={Colors.white}
        />
      </View>

      {/* File Info */}
      <View style={styles.gridInfo}>
        <Text style={styles.gridFileName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.gridFileSize}>{formatFileSize(item.size)}</Text>
      </View>
    </TouchableOpacity>
  ), [openMedia]);

  const renderListItem = useCallback(({ item }: { item: typeof allMedia[0] }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => openMedia(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.thumbnail || item.uri }}
        style={styles.listImage}
        contentFit="cover"
      />

      <View style={styles.listInfo}>
        <Text style={styles.listFileName}>{item.name}</Text>
        <Text style={styles.listFileDate}>{new Date(item.createdAt).toLocaleString()}</Text>
        <Text style={styles.listFileTicket}>Ticket: {item.ticketId}</Text>
      </View>

      <View style={styles.listMeta}>
        <IconSymbol
          name={
            item.type === 'video' ? 'video.fill' :
              item.type === 'audio' ? 'waveform' :
                'photo.fill'
          }
          size={20}
          color={Colors.neutral[500]}
        />
        <Text style={styles.listFileSize}>{formatFileSize(item.size)}</Text>
      </View>
    </TouchableOpacity>
  ), [openMedia]);

  return (
    <View style={styles.container}>
      {/* Header Controls */}
      <View style={styles.header}>
        <Text style={styles.title}>Media Library</Text>

        {/* Filter and View Controls */}
        <View style={styles.controls}>
          {/* Filter Buttons */}
          <View style={styles.filterButtons}>
            {['all', 'images', 'videos', 'audio'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  filterType === filter && styles.filterButtonActive
                ]}
                onPress={() => setFilterType(filter as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterType === filter && styles.filterButtonTextActive
                ]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewType === 'grid' && styles.viewButtonActive]}
              onPress={() => setViewType('grid')}
            >
              <IconSymbol
                name="square.grid.3x3.fill"
                size={18}
                color={viewType === 'grid' ? Colors.primary[600] : Colors.neutral[500]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewButton, viewType === 'list' && styles.viewButtonActive]}
              onPress={() => setViewType('list')}
            >
              <IconSymbol
                name="list.bullet"
                size={18}
                color={viewType === 'list' ? Colors.primary[600] : Colors.neutral[500]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Media Grid/List */}
      <FlatList
        data={filteredMedia}
        renderItem={viewType === 'grid' ? renderGridItem : renderListItem}
        keyExtractor={(item) => item.id}
        numColumns={viewType === 'grid' ? 3 : 1}
        key={viewType} // Force re-render when view type changes
        contentContainerStyle={styles.mediaList}
        showsVerticalScrollIndicator={false}
      />

      {/* Media Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMedia && (
              <>
                {/* Media Preview */}
                <Image
                  source={{ uri: selectedMedia.uri }}
                  style={styles.modalImage}
                  contentFit="contain"
                />

                {/* Media Info */}
                <View style={styles.modalInfo}>
                  <Text style={styles.modalFileName}>{selectedMedia.name}</Text>
                  <Text style={styles.modalFileDate}>{new Date(selectedMedia.createdAt).toLocaleString()}</Text>
                  <Text style={styles.modalFileTicket}>Ticket: {selectedMedia.ticketId}</Text>
                  <Text style={styles.modalFileSize}>Size: {formatFileSize(selectedMedia.size)}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.assignButton]}
                    onPress={handleAssignToJobCard}
                  >
                    <IconSymbol name="folder.badge.plus" size={20} color={Colors.white} />
                    <Text style={styles.modalButtonText}>Assign to Job Card</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.downloadButton]}
                    onPress={() => downloadMedia(selectedMedia)}
                  >
                    <IconSymbol name="arrow.down.circle.fill" size={20} color={Colors.white} />
                    <Text style={styles.modalButtonText}>Download</Text>
                  </TouchableOpacity>
                </View>

                {/* Secondary Action Buttons */}
                <View style={styles.modalSecondaryActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.shareButton]}
                    onPress={() => shareMedia(selectedMedia)}
                  >
                    <IconSymbol name="square.and.arrow.up.fill" size={20} color={Colors.white} />
                    <Text style={styles.modalButtonText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={() => deleteMedia(selectedMedia.id)}
                  >
                    <IconSymbol name="trash.fill" size={20} color={Colors.white} />
                    <Text style={styles.modalButtonText}>Delete</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.closeButton]}
                    onPress={closeModal}
                  >
                    <IconSymbol name="xmark.circle.fill" size={20} color={Colors.white} />
                    <Text style={styles.modalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Job Card Selection Modal */}
      <Modal
        visible={jobCardModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setJobCardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.jobCardModalContent}>
            <View style={styles.jobCardModalHeader}>
              <Text style={styles.jobCardModalTitle}>Select Job Card</Text>
              <TouchableOpacity
                onPress={() => setJobCardModalVisible(false)}
                style={styles.closeModalButton}
              >
                <IconSymbol name="xmark" size={24} color={Colors.neutral[400]} />
              </TouchableOpacity>
            </View>

            {loadingJobCards ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading job cards...</Text>
              </View>
            ) : (
              <ScrollView style={styles.jobCardsList} showsVerticalScrollIndicator={false}>
                {availableJobCards.map((jobCard) => (
                  <TouchableOpacity
                    key={jobCard.id}
                    style={styles.jobCardItem}
                    onPress={() => assignMediaToJobCard(jobCard)}
                  >
                    <View style={styles.jobCardInfo}>
                      <Text style={styles.jobCardNumber}>
                        {jobCard.ticket_number || jobCard.ticketNumber}
                      </Text>
                      <Text style={styles.jobCardComplaint} numberOfLines={2}>
                        {jobCard.customer_complaint || jobCard.symptom}
                      </Text>
                      <Text style={styles.jobCardCustomer}>
                        Customer: {jobCard.customer?.name || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.jobCardStatus}>
                      <Text style={[styles.statusText, { color: getStatusColor(jobCard.status) }]}>
                        {jobCard.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {availableJobCards.length === 0 && (
                  <View style={styles.emptyJobCards}>
                    <Text style={styles.emptyJobCardsText}>No job cards available</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );

  // Helper function to get status color
  function getStatusColor(status: string) {
    switch (status) {
      case 'reported': return Colors.primary[600];
      case 'assigned': return Colors.warning[600];
      case 'in_progress': return Colors.info[600];
      case 'completed': return Colors.success[600];
      default: return Colors.neutral[600];
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing.base,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    backgroundColor: Colors.neutral[100],
  },
  filterButtonActive: {
    backgroundColor: Colors.primary[600],
  },
  filterButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    padding: Spacing.xs,
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: Colors.white,
  },
  mediaList: {
    padding: Spacing.lg,
  },
  // Grid View Styles
  gridItem: {
    width: itemWidth,
    marginRight: Spacing.base,
    marginBottom: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gridImage: {
    width: '100%',
    height: itemWidth,
  },
  typeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  gridInfo: {
    padding: Spacing.xs,
  },
  gridFileName: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  gridFileSize: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  // List View Styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.base,
    marginBottom: Spacing.xs,
    borderRadius: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  listInfo: {
    flex: 1,
    marginLeft: Spacing.base,
  },
  listFileName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  listFileDate: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    marginBottom: 2,
  },
  listFileTicket: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primary[600],
  },
  listMeta: {
    alignItems: 'center',
  },
  listFileSize: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth - (Spacing.xl * 2),
    maxHeight: '80%',
    backgroundColor: Colors.neutral[900],
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: 300,
  },
  modalInfo: {
    padding: Spacing.lg,
  },
  modalFileName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  modalFileDate: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[300],
    marginBottom: Spacing.xs,
  },
  modalFileTicket: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[400],
    marginBottom: Spacing.xs,
  },
  modalFileSize: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[400],
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[700],
    gap: Spacing.md,
  },
  modalSecondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    gap: Spacing.xs,
  },
  assignButton: {
    backgroundColor: Colors.success[600],
    flex: 1,
  },
  downloadButton: {
    backgroundColor: Colors.primary[600],
    flex: 1,
  },
  shareButton: {
    backgroundColor: Colors.warning[600],
    flex: 1,
  },
  deleteButton: {
    backgroundColor: Colors.danger[600],
    flex: 1,
  },
  closeButton: {
    backgroundColor: Colors.neutral[600],
    flex: 1,
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  // Job Card Modal Styles
  jobCardModalContent: {
    width: screenWidth - (Spacing.xl * 2),
    maxHeight: '70%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  jobCardModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[50],
  },
  jobCardModalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  closeModalButton: {
    padding: Spacing.sm,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  jobCardsList: {
    maxHeight: 400,
  },
  jobCardItem: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    alignItems: 'center',
  },
  jobCardInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  jobCardNumber: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing.xs,
  },
  jobCardComplaint: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[700],
    lineHeight: Typography.lineHeight.sm,
    marginBottom: Spacing.xs,
  },
  jobCardCustomer: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  jobCardStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'capitalize',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    backgroundColor: Colors.neutral[100],
  },
  emptyJobCards: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyJobCardsText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
});
