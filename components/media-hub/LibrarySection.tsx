import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography, Spacing, BorderRadius, Shadows, BrandColors } from '@/constants/design-system';
import { useMediaHubStore, MediaFilters } from '@/stores/mediaHubStore';
import { jobCardsService } from '@/services/jobCardsService';
import { ServiceTicket } from '@/types';
import MediaItem from './MediaItem';
import MediaFilterBar from './MediaFilterBar';

const { width: screenWidth } = Dimensions.get('window');

export default function LibrarySection() {
  const {
    getFilteredItems,
    mediaTypeFilter,
    setMediaTypeFilter,
    selectedItems,
    toggleItemSelection,
    clearSelection,
    selectAll,
    deleteMediaItem,
    assignMediaToTicket,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    applyFilters,
    loadServiceTickets,
  } = useMediaHubStore();
  
  // New modal states
  const [jobCardModalVisible, setJobCardModalVisible] = useState(false);
  const [availableJobCards, setAvailableJobCards] = useState<ServiceTicket[]>([]);
  const [loadingJobCards, setLoadingJobCards] = useState(false);
  const [assignmentMediaIds, setAssignmentMediaIds] = useState<string[]>([]);
  const [previewMedia, setPreviewMedia] = useState<any | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);

  const jobCardModalSlide = useState(new Animated.Value(screenWidth))[0];
  
  const filteredItems = getFilteredItems();

  // Initialize data on mount
  useEffect(() => {
    loadServiceTickets();
    applyFilters(); // Apply initial filters
  }, []);
  
  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [filters]);


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

  const openPreview = useCallback((item: any) => {
    setPreviewMedia(item);
    setPreviewVisible(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewVisible(false);
    setPreviewMedia(null);
  }, []);

  const startAssign = useCallback(async (mediaIds: string[]) => {
    if (!mediaIds || mediaIds.length === 0) {
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

  // Bulk assign from library selection bar
  const handleAssignToJobCard = useCallback(() => {
    startAssign(selectedItems);
  }, [selectedItems, startAssign]);

  const closeJobCardModal = useCallback(() => {
    Animated.spring(jobCardModalSlide, {
      toValue: screenWidth,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setJobCardModalVisible(false);
    });
  }, []);
  
  const assignMediaToJobCard = useCallback(async (jobCard: ServiceTicket) => {
    if (assignmentMediaIds.length === 0) return;
    
    try {
      await assignMediaToTicket(assignmentMediaIds, jobCard.id);
      
      Alert.alert(
        'Success', 
        `Media assigned to job card ${jobCard.ticket_number || jobCard.ticketNumber}`
      );
      
      setAssignmentMediaIds([]);
      closeJobCardModal();
    } catch (error) {
      console.error('Error assigning media to job card:', error);
      Alert.alert('Error', 'Failed to assign media to job card');
    }
  }, [assignmentMediaIds, assignMediaToTicket, closeJobCardModal]);

  const handleItemPress = (item: any) => {
    if (selectedItems.length > 0) {
      // If in selection mode, toggle selection
      toggleItemSelection(item.id);
    } else {
      // Offer choice: View or Assign
      Alert.alert(
        'Media options',
        'What would you like to do?',
        [
          { text: 'View', onPress: () => openPreview(item) },
          { text: 'Assign', onPress: () => startAssign([item.id]) },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true },
      );
    }
  };

  const handleItemLongPress = (item: any) => {
    toggleItemSelection(item.id);
  };

  const filterButtons = [
    { id: 'all' as const, label: 'All', icon: 'square.stack.3d.up.fill' },
    { id: 'image' as const, label: 'Photos', icon: 'photo.fill' },
    { id: 'video' as const, label: 'Videos', icon: 'video.fill' },
    { id: 'audio' as const, label: 'Audio', icon: 'waveform' },
  ];

  return (
    <View style={styles.container}>
      {/* Top filter + view mode bar */}
      <View style={styles.filterContainer}>
        <View style={styles.filterTabsContainer}>
          {filterButtons.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                mediaTypeFilter === filter.id && styles.filterButtonActive
              ]}
              onPress={() => setMediaTypeFilter(filter.id)}
            >
              <IconSymbol
                name={filter.icon}
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
        </View>
        
        {/* View Mode Toggle + Filters button */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={styles.viewModeButton}
            onPress={() => setFiltersModalVisible(true)}
          >
            <IconSymbol 
              name="line.3.horizontal.decrease.circle" 
              size={16} 
              color={Colors.neutral[600]} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'grid' && styles.viewModeButtonActive
            ]}
            onPress={() => setViewMode('grid')}
          >
            <IconSymbol 
              name="grid" 
              size={16} 
              color={viewMode === 'grid' ? Colors.white : Colors.neutral[600]} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'list' && styles.viewModeButtonActive
            ]}
            onPress={() => setViewMode('list')}
          >
            <IconSymbol 
              name="list.bullet" 
              size={16} 
              color={viewMode === 'list' ? Colors.white : Colors.neutral[600]} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Bar */}
      {selectedItems.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={clearSelection}
          >
            <IconSymbol name="xmark" size={16} color={Colors.neutral[600]} />
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.selectedCount}>
            {selectedItems.length} selected
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAssignToJobCard}
            >
              <IconSymbol name="doc.text" size={16} color={Colors.primary[600]} />
              <Text style={[styles.actionButtonText, { color: Colors.primary[600] }]}>
                Assign
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                selectedItems.forEach(id => deleteMediaItem(id));
                clearSelection();
              }}
            >
              <IconSymbol name="trash" size={16} color={Colors.error[600]} />
              <Text style={[styles.actionButtonText, { color: Colors.error[600] }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Media Grid/List */}
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
            <IconSymbol
              name="photo.on.rectangle"
              size={64}
              color={Colors.neutral[300]}
            />
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

      {/* Simple preview modal */}
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
              <Image
                source={{ uri: previewMedia.localUri || previewMedia.remoteUrl }}
                style={styles.previewImage}
                contentFit="contain"
              />
            )}
            {previewMedia?.fileName && (
              <Text style={styles.previewTitle} numberOfLines={1}>
                {previewMedia.fileName}
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Enhanced Job Card Assignment Modal */}
      <Modal
        visible={jobCardModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeJobCardModal}
      >
        <View style={styles.jobCardModalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeJobCardModal}
          />
          
          <Animated.View
            style={[
              styles.modernJobCardModalContent,
              {
                transform: [{ translateX: jobCardModalSlide }],
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modernJobCardModalHeader}>
              <View style={styles.modalHandleBar} />
              <View style={styles.jobCardHeaderContent}>
                <Text style={styles.modernJobCardModalTitle}>Select Job Card</Text>
                <TouchableOpacity
                  onPress={closeJobCardModal}
                  style={styles.modernCloseModalButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconSymbol name="xmark" size={20} color={Colors.neutral[600]} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Modal Content */}
            {loadingJobCards ? (
              <View style={styles.modernLoadingContainer}>
                <View style={styles.loadingSpinner}>
                  <IconSymbol name="arrow.clockwise" size={24} color={Colors.primary[600]} />
                </View>
                <Text style={styles.modernLoadingText}>Loading job cards...</Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.modernJobCardsList} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.jobCardsScrollContent}
              >
                {availableJobCards.map((jobCard, index) => (
                  <TouchableOpacity
                    key={jobCard.id}
                    style={[
                      styles.modernJobCardItem,
                      index === availableJobCards.length - 1 && styles.lastJobCardItem,
                    ]}
                    onPress={() => assignMediaToJobCard(jobCard)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modernJobCardInfo}>
                      <View style={styles.jobCardNumberContainer}>
                        <Text style={styles.modernJobCardNumber}>
                          {jobCard.ticket_number || jobCard.ticketNumber}
                        </Text>
                        <View style={[
                          styles.modernStatusBadge,
                          { backgroundColor: getStatusColor(jobCard.status) + '20' }
                        ]}>
                          <Text style={[
                            styles.modernStatusText,
                            { color: getStatusColor(jobCard.status) }
                          ]}>
                            {jobCard.status.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={styles.modernJobCardComplaint} numberOfLines={2}>
                        {jobCard.customer_complaint || jobCard.symptom}
                      </Text>
                      
                      <View style={styles.customerInfoContainer}>
                        <IconSymbol name="person.circle" size={14} color={Colors.neutral[500]} />
                        <Text style={styles.modernJobCardCustomer}>
                          {jobCard.customer?.name || 'N/A'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.jobCardArrow}>
                      <IconSymbol name="chevron.right" size={16} color={Colors.neutral[400]} />
                    </View>
                  </TouchableOpacity>
                ))}
                
                {availableJobCards.length === 0 && (
                  <View style={styles.modernEmptyJobCards}>
                    <IconSymbol name="doc.text" size={48} color={Colors.neutral[300]} />
                    <Text style={styles.modernEmptyJobCardsText}>No job cards available</Text>
                    <Text style={styles.emptyJobCardsSubtext}>
                      Create a job card first to assign media
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Advanced Filters Modal */}
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
            <MediaFilterBar onFiltersChange={(newFilters: MediaFilters) => {
              console.log('Filters changed:', newFilters);
            }} />
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
    backgroundColor: BrandColors.surface,
  },
  
  // Filter tabs
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  filterTabsContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: Spacing.xs,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral[100],
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
    minWidth: 70,
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
  
  // View Mode Toggle
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.sm,
    padding: 2,
  },
  viewModeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.xs,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.primary[600],
  },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[200],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  selectedCount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary[700],
  },

  // Media list
  mediaList: {
    padding: Spacing.lg,
    paddingBottom: 100, // Space for FAB
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // iOS Photos-style Modal Styles
  iosModalOverlay: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  
  // iOS Top Navigation Bar
  iosTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60, // Status bar height
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.lg,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  iosBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosTopBarCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  iosTopBarTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
    textAlign: 'center',
  },
  iosTopBarDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.white,
    opacity: 0.7,
    marginTop: 2,
  },
  iosShareButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // iOS Image Container
  iosImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120, // Top bar space
    paddingBottom: 180, // Bottom bar space
  },
  iosFullImage: {
    width: screenWidth,
    height: '100%',
    maxHeight: screenWidth * 1.5, // Maintain aspect ratio
  },
  
  // iOS Bottom Action Bar
  iosBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingTop: Spacing.lg,
    paddingBottom: 40, // Safe area
    paddingHorizontal: Spacing.lg,
  },
  
  // Media Info Section
  iosMediaInfo: {
    marginBottom: Spacing.lg,
  },
  iosInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  iosInfoLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[400],
  },
  iosInfoValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
    flex: 1,
  },
  
  // iOS Action Buttons
  iosActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
  },
  iosActionButton: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iosActionButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  iosActionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
    textAlign: 'center',
  },

  // Enhanced Job Card Modal Styles
  jobCardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  modernJobCardModalContent: {
    width: screenWidth * 0.85,
    height: '75%',
    backgroundColor: BrandColors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    marginRight: Spacing.base,
    marginBottom: Spacing['5xl'],
    ...Shadows.xl,
  },
  modernJobCardModalHeader: {
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
  jobCardHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  modernJobCardModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  modernCloseModalButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  
  // Loading States
  modernLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingSpinner: {
    marginBottom: Spacing.base,
  },
  modernLoadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  
  // Job Cards List
  modernJobCardsList: {
    flex: 1,
  },
  jobCardsScrollContent: {
    padding: Spacing.lg,
  },
  modernJobCardItem: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.sm,
  },
  lastJobCardItem: {
    marginBottom: 0,
  },
  modernJobCardInfo: {
    flex: 1,
  },
  jobCardNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  modernJobCardNumber: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  modernStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  modernStatusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'capitalize',
  },
  modernJobCardComplaint: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[700],
    lineHeight: Typography.lineHeight.base,
    marginBottom: Spacing.sm,
  },
  customerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  modernJobCardCustomer: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  jobCardArrow: {
    marginLeft: Spacing.base,
  },

  // Preview modal
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    width: '90%',
    height: '70%',
    backgroundColor: Colors.black,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '85%',
    borderRadius: BorderRadius.md,
  },
  previewTitle: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
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
  
  // Empty States
  modernEmptyJobCards: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modernEmptyJobCardsText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[600],
    textAlign: 'center',
    marginTop: Spacing.base,
    marginBottom: Spacing.xs,
  },
  emptyJobCardsSubtext: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[400],
    textAlign: 'center',
  },
});
