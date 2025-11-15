import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography, Spacing } from '@/constants/design-system';
import { useMediaHubStore } from '@/stores/mediaHubStore';
import JobCardSelector from './JobCardSelector';
import MediaItem from './MediaItem';

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
  } = useMediaHubStore();
  
  const [showJobCardSelector, setShowJobCardSelector] = useState(false);
  const [viewType, setViewType] = useState<'list' | 'grid'>('list');
  
  const filteredItems = getFilteredItems();

  const handleItemPress = (item: any) => {
    if (selectedItems.length > 0) {
      // If in selection mode, toggle selection
      toggleItemSelection(item.id);
    } else {
      // Normal press - view item details
      console.log('View item:', item.fileName);
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
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
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
              onPress={() => setShowJobCardSelector(true)}
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
  
  // Filter tabs
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral[100],
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    gap: Spacing.xs,
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
});
