import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { jobCardsService } from '@/services/jobCardsService';
import { useMediaHubStore } from '@/stores/mediaHubStore';
import { ServiceTicket } from '@/types';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AudioPreview from './AudioPreview';
import MediaFilterBar from './MediaFilterBar';
import MediaItem from './MediaItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Filter configuration
const FILTER_BUTTONS = [
  { id: 'all' as const, label: 'All', icon: 'square.stack.3d.up.fill' },
  { id: 'image' as const, label: 'Photos', icon: 'photo.fill' },
  { id: 'video' as const, label: 'Videos', icon: 'video.fill' },
  { id: 'audio' as const, label: 'Audio', icon: 'waveform' },
];

// Status color helper
const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    reported: Colors.primary[600],
    assigned: Colors.warning[600],
    in_progress: Colors.info[600],
    completed: Colors.success[600],
  };
  return statusMap[status] || Colors.neutral[600];
};

export default function LibrarySection() {
  const {
    getFilteredItems,
    mediaTypeFilter,
    setMediaTypeFilter,
    selectedItems,
    toggleItemSelection,
    clearSelection,
    deleteMediaItem,
    assignMediaToTicket,
    viewMode,
    setViewMode,
    filters,
    applyFilters,
    loadServiceTickets,
  } = useMediaHubStore();

  // Modal states
  const [jobCardModalVisible, setJobCardModalVisible] = useState(false);
  const [availableJobCards, setAvailableJobCards] = useState<ServiceTicket[]>([]);
  const [loadingJobCards, setLoadingJobCards] = useState(false);
  const [assignmentMediaIds, setAssignmentMediaIds] = useState<string[]>([]);
  const [previewMedia, setPreviewMedia] = useState<any | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);
  const [jobCardSearchQuery, setJobCardSearchQuery] = useState('');

  const jobCardModalSlide = useState(new Animated.Value(SCREEN_WIDTH))[0];
  const filteredItems = getFilteredItems();

  // Initialize data
  useEffect(() => {
    loadServiceTickets();
    applyFilters();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters]);

  // Load job cards
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

  // Preview handlers
  const openPreview = useCallback((item: any) => {
    setPreviewMedia(item);
    setPreviewVisible(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewVisible(false);
    setPreviewMedia(null);
  }, []);

  // Assignment handlers
  const startAssign = useCallback(async (mediaIds: string[]) => {
    if (!mediaIds?.length) {
      Alert.alert('No Selection', 'Please select media files to assign');
      return;
    }

    setAssignmentMediaIds(mediaIds);
    await loadJobCards();
    setJobCardModalVisible(true);

    Animated.spring(jobCardModalSlide, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [jobCardModalSlide]);

  const handleAssignToJobCard = useCallback(() => {
    const selectedMediaItems = getFilteredItems().filter(item => selectedItems.includes(item.id));
    const alreadyAssigned = selectedMediaItems.filter(item => item.ticketId);

    if (alreadyAssigned.length > 0) {
      Alert.alert(
        'Invalid Selection',
        `Some selected items are already assigned to a job card. Please deselect them.`
      );
      return;
    }

    startAssign(selectedItems);
  }, [selectedItems, startAssign, getFilteredItems]);

  const closeJobCardModal = useCallback(() => {
    Animated.spring(jobCardModalSlide, {
      toValue: SCREEN_WIDTH,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setJobCardModalVisible(false);
    });
  }, [jobCardModalSlide]);

  const [isAssigning, setIsAssigning] = useState(false);

  const assignMediaToJobCard = useCallback(async (jobCard: ServiceTicket) => {
    if (!assignmentMediaIds.length) return;

    try {
      setIsAssigning(true);
      // Show immediate feedback if items are still syncing
      const syncingItems = getFilteredItems().filter(
        item => assignmentMediaIds.includes(item.id) && item.syncStatus === 'syncing'
      );

      if (syncingItems.length > 0) {
        Alert.alert(
          'Syncing Media',
          `Waiting for ${syncingItems.length} file(s) to finish uploading before assigning...`,
          [],
          { cancelable: false }
        );
      }

      await assignMediaToTicket(assignmentMediaIds, jobCard.id);
      Alert.alert('Success', `Media assigned to job card ${jobCard.ticket_number || jobCard.ticketNumber}`);
      setAssignmentMediaIds([]);
      closeJobCardModal();
    } catch (error) {
      console.error('Error assigning media to job card:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to assign media to job card');
    } finally {
      setIsAssigning(false);
    }
  }, [assignmentMediaIds, assignMediaToTicket, closeJobCardModal, getFilteredItems]);

  // Item interaction handlers
  const handleItemPress = (item: any) => {
    if (selectedItems.length > 0) {
      toggleItemSelection(item.id);
    } else {
      // Direct preview on tap - more intuitive
      openPreview(item);
    }
  };

  const handleItemLongPress = (item: any) => {
    toggleItemSelection(item.id);
  };

  const handleDelete = () => {
    selectedItems.forEach(id => deleteMediaItem(id));
    clearSelection();
  };

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterTabsContainer}
          contentContainerStyle={styles.filterTabsContent}
        >
          {FILTER_BUTTONS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                mediaTypeFilter === filter.id && styles.filterButtonActive
              ]}
              onPress={() => setMediaTypeFilter(filter.id)}
            >
              <IconSymbol
                name={filter.icon as any}
                size={16}
                color={mediaTypeFilter === filter.id ? Colors.white : Colors.neutral[600]}
              />
              <Text style={[
                styles.filterButtonText,
                mediaTypeFilter === filter.id && styles.filterButtonTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterActionButton}
          onPress={() => setFiltersModalVisible(true)}
        >
          <IconSymbol
            name="line.3.horizontal.decrease.circle"
            size={20}
            color={Colors.neutral[600]}
          />
        </TouchableOpacity>
      </View>

      {/* Action Bar */}
      {/* Action Bar */}
      {selectedItems.length > 0 && (
        <View style={styles.actionBar}>
          <View style={styles.actionLeft}>
            <TouchableOpacity style={styles.closeSelectionButton} onPress={clearSelection}>
              <IconSymbol name="xmark" size={16} color={Colors.neutral[600]} />
            </TouchableOpacity>
            <Text style={styles.selectedCount}>{selectedItems.length} selected</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={() => useMediaHubStore.getState().selectAll()}
            >
              <Text style={styles.selectAllText}>Select All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconActionButton, styles.assignButton]}
              onPress={handleAssignToJobCard}
            >
              <IconSymbol name="doc.text" size={20} color={Colors.white} />
              <Text style={styles.actionButtonLabel}>Assign</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconActionButton, styles.deleteActionButton]}
              onPress={handleDelete}
            >
              <IconSymbol name="trash" size={20} color={Colors.error[600]} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Media List */}
      <FlatList
        data={filteredItems}
        renderItem={({ item }) => (
          <MediaItem
            item={item}
            selected={selectedItems.includes(item.id)}
            onPress={() => handleItemPress(item)}
            onLongPress={() => handleItemLongPress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.mediaList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <IconSymbol name="photo.on.rectangle" size={64} color={Colors.neutral[300]} />
            <Text style={styles.emptyStateText}>No media files</Text>
            <Text style={styles.emptyStateSubtext}>
              Use the Capture or Audio tabs to create your first media
            </Text>
          </View>
        )}
      />

      {/* Floating Action Button */}
      {selectedItems.length === 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => useMediaHubStore.getState().setActiveTab('capture')}
        >
          <IconSymbol name="plus" size={24} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closePreview}
          />
          <View style={styles.previewContent}>
            {previewMedia && (
              <>
                {previewMedia.mediaType === 'audio' ? (
                  <AudioPreview uri={previewMedia.localUri || previewMedia.remoteUrl} />
                ) : (
                  <Image
                    source={{ uri: previewMedia.localUri || previewMedia.remoteUrl }}
                    style={styles.previewImage}
                    contentFit="contain"
                  />
                )}

                {/* Action buttons in preview */}
                <View style={styles.previewActions}>
                  <TouchableOpacity
                    style={styles.previewActionButton}
                    onPress={() => {
                      closePreview();
                      startAssign([previewMedia.id]);
                    }}
                  >
                    <IconSymbol name="doc.text" size={20} color={Colors.white} />
                    <Text style={styles.previewActionText}>Assign</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.previewActionButton, styles.deleteButton]}
                    onPress={() => {
                      Alert.alert(
                        'Delete Media',
                        'Are you sure you want to delete this file?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                              deleteMediaItem(previewMedia.id);
                              closePreview();
                            }
                          },
                        ]
                      );
                    }}
                  >
                    <IconSymbol name="trash" size={20} color={Colors.white} />
                    <Text style={styles.previewActionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {previewMedia?.fileName && (
              <Text style={styles.previewTitle} numberOfLines={1}>
                {previewMedia.fileName}
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Job Card Assignment Modal */}
      <Modal
        visible={jobCardModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeJobCardModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeJobCardModal}
          />

          <Animated.View
            style={[
              styles.jobCardModalContent,
              { transform: [{ translateX: jobCardModalSlide }] },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandleBar} />
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Select Job Card</Text>
                <TouchableOpacity
                  onPress={closeJobCardModal}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconSymbol name="xmark" size={20} color={Colors.neutral[600]} />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <IconSymbol name="magnifyingglass" size={16} color={Colors.neutral[500]} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search job cards..."
                  value={jobCardSearchQuery}
                  onChangeText={setJobCardSearchQuery}
                  placeholderTextColor={Colors.neutral[400]}
                  autoCapitalize="none"
                />
                {jobCardSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setJobCardSearchQuery('')}>
                    <IconSymbol name="xmark.circle.fill" size={16} color={Colors.neutral[400]} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Modal Content */}
            {loadingJobCards ? (
              <View style={styles.loadingContainer}>
                <IconSymbol name="arrow.clockwise" size={24} color={Colors.primary[600]} />
                <Text style={styles.loadingText}>Loading job cards...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.jobCardsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.jobCardsScrollContent}
              >
                {availableJobCards
                  .filter(card => {
                    const query = jobCardSearchQuery.toLowerCase();
                    return (
                      (card.ticket_number || card.ticketNumber || '').toLowerCase().includes(query) ||
                      (card.customer_complaint || card.symptom || '').toLowerCase().includes(query) ||
                      (card.customer?.name || '').toLowerCase().includes(query)
                    );
                  })
                  .map((jobCard, index, filteredArray) => (
                    <TouchableOpacity
                      key={jobCard.id}
                      style={[
                        styles.jobCardItem,
                        index === filteredArray.length - 1 && styles.lastJobCardItem,
                      ]}
                      onPress={() => assignMediaToJobCard(jobCard)}
                      activeOpacity={0.6}
                    >
                      <View style={styles.jobCardInfo}>
                        <View style={styles.jobCardHeader}>
                          <Text style={styles.jobCardNumber}>
                            {jobCard.ticket_number || jobCard.ticketNumber}
                          </Text>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(jobCard.status) + '20' }
                          ]}>
                            <Text style={[
                              styles.statusText,
                              { color: getStatusColor(jobCard.status) }
                            ]}>
                              {jobCard.status.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.jobCardComplaint} numberOfLines={2}>
                          {jobCard.customer_complaint || jobCard.symptom}
                        </Text>

                        <View style={styles.customerInfo}>
                          <IconSymbol name="person.circle" size={14} color={Colors.neutral[500]} />
                          <Text style={styles.customerName}>
                            {jobCard.customer?.name || 'N/A'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.chevronContainer}>
                        <IconSymbol name="chevron.right" size={20} color={Colors.primary[600]} />
                      </View>
                    </TouchableOpacity>
                  ))}

                {availableJobCards.length === 0 && (
                  <View style={styles.emptyState}>
                    <IconSymbol name="doc.text" size={48} color={Colors.neutral[300]} />
                    <Text style={styles.emptyStateText}>No job cards available</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Create a job card first to assign media
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={filtersModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltersModalVisible(false)}
      >
        <View style={styles.filtersModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setFiltersModalVisible(false)}
          />
          <View style={styles.filtersModalContent}>
            <MediaFilterBar onFiltersChange={() => { }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },

  // Filter Bar
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    gap: Spacing.sm,
  },
  filterTabsContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  filterTabsContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral[100],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
    ...Shadows.sm,
  },
  filterButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  filterButtonTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Filter Action
  filterActionButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    ...Shadows.sm,
    zIndex: 10,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  closeSelectionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  selectAllButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral[100],
    marginRight: Spacing.xs,
  },
  selectAllText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
  },
  iconActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
    minHeight: 36,
  },
  assignButton: {
    backgroundColor: BrandColors.primary,
  },
  deleteActionButton: {
    backgroundColor: Colors.error[50],
    borderWidth: 1,
    borderColor: Colors.error[200],
    paddingHorizontal: Spacing.sm, // Smaller padding for icon-only
  },
  actionButtonLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  primaryText: {
    color: BrandColors.primary,
  },
  errorText: {
    color: Colors.error[600],
  },
  selectedCount: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginLeft: Spacing.xs,
  },

  // Media List
  mediaList: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: Spacing.xl,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  // Preview Modal
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  previewImage: {
    width: '100%',
    height: '75%',
    borderRadius: BorderRadius.md,
  },
  previewTitle: {
    marginTop: Spacing.base,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
    textAlign: 'center',
  },
  previewActions: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.xl,
  },
  previewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: BrandColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
  },
  deleteButton: {
    backgroundColor: Colors.error[600],
  },
  previewActionText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },

  // Job Card Modal
  jobCardModalContent: {
    width: SCREEN_WIDTH * 0.85,
    height: '75%',
    backgroundColor: BrandColors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    marginRight: Spacing.base,
    marginBottom: Spacing['5xl'],
    ...Shadows.xl,
  },
  modalHeader: {
    paddingTop: Spacing.base,
    paddingHorizontal: Spacing.lg,
    backgroundColor: BrandColors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.base,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.base,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },

  // Job Cards List
  jobCardsList: {
    flex: 1,
  },
  jobCardsScrollContent: {
    padding: Spacing.lg,
  },
  jobCardItem: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.md,
  },
  lastJobCardItem: {
    marginBottom: 0,
  },
  jobCardInfo: {
    flex: 1,
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  jobCardNumber: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'capitalize',
  },
  jobCardComplaint: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[700],
    lineHeight: Typography.lineHeight.base,
    marginBottom: Spacing.sm,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  customerName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  chevronContainer: {
    marginLeft: Spacing.base,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.full,
  },

  // Filters Modal
  filtersModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  filtersModalContent: {
    backgroundColor: BrandColors.surface,
    paddingBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[900],
    padding: 0,
  },
});
