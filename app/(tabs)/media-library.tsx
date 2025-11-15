import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography, Spacing } from '@/constants/design-system';
import { useMediaStore } from '@/stores/mediaStore';

const { width: screenWidth } = Dimensions.get('window');
const itemWidth = (screenWidth - (Spacing.lg * 2) - (Spacing.base * 2)) / 3;

export default function MediaLibrary() {
  const { getAllMedia, refreshRecordings } = useMediaStore();
  const allMedia = getAllMedia();
  
  const [selectedMedia, setSelectedMedia] = useState<typeof allMedia[0] | null>(null);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'videos' | 'audio'>('all');
  const [modalVisible, setModalVisible] = useState(false);

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
  }, []);

  const openMedia = useCallback((item: typeof mockMedia[0]) => {
    setSelectedMedia(item);
    setModalVisible(true);
  }, []);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderGridItem = useCallback(({ item }: { item: typeof mockMedia[0] }) => (
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

  const renderListItem = useCallback(({ item }: { item: typeof mockMedia[0] }) => (
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
    </View>
  );
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
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    gap: Spacing.xs,
  },
  shareButton: {
    backgroundColor: Colors.primary[600],
  },
  deleteButton: {
    backgroundColor: Colors.danger[600],
  },
  closeButton: {
    backgroundColor: Colors.neutral[600],
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
});
