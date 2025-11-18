import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography, Spacing, BrandColors } from '@/constants/design-system';
import { useMediaHubStore } from '@/stores/mediaHubStore';
import JobCardSelector from './JobCardSelector';
import MediaItem from './MediaItem';

export default function SearchSection() {
  const {
    getFilteredItems,
    searchQuery,
    setSearchQuery,
    dateRangeFilter,
    setDateRangeFilter,
    ticketFilter,
    setTicketFilter,
    serviceTickets,
    selectedItems,
    clearSelection,
  } = useMediaHubStore();
  
  const [showJobCardSelector, setShowJobCardSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showStats, setShowStats] = useState(false);
  
  const filteredItems = getFilteredItems();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate && showDatePicker) {
      const dateString = selectedDate.toISOString();
      setDateRangeFilter({
        ...dateRangeFilter,
        [showDatePicker]: dateString,
      });
    }
    setShowDatePicker(null);
  };

  const clearDateRange = () => {
    setDateRangeFilter({});
  };

  const clearTicketFilter = () => {
    setTicketFilter(null);
  };

  const getSelectedTicket = () => {
    return serviceTickets.find(ticket => ticket.id === ticketFilter);
  };

  const getStats = () => {
    const all = filteredItems;
    const images = all.filter(item => item.mediaType === 'image');
    const videos = all.filter(item => item.mediaType === 'video');
    const audio = all.filter(item => item.mediaType === 'audio');
    const assigned = all.filter(item => item.ticketId);
    const unassigned = all.filter(item => !item.ticketId);
    
    return { all, images, videos, audio, assigned, unassigned };
  };

  const stats = getStats();
  const selectedTicket = getSelectedTicket();

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <IconSymbol
            name="magnifyingglass"
            size={20}
            color={Colors.neutral[400]}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search media files..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.neutral[400]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <IconSymbol name="xmark.circle.fill" size={20} color={Colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters Section */}
      <View style={styles.filtersSection}>
        {/* Date Range Filter */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Date Range</Text>
          <View style={styles.dateFilters}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker('start')}
            >
              <IconSymbol name="calendar" size={16} color={Colors.primary[600]} />
              <Text style={styles.dateButtonText}>
                {dateRangeFilter.start 
                  ? new Date(dateRangeFilter.start).toLocaleDateString()
                  : 'From'
                }
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker('end')}
            >
              <IconSymbol name="calendar" size={16} color={Colors.primary[600]} />
              <Text style={styles.dateButtonText}>
                {dateRangeFilter.end 
                  ? new Date(dateRangeFilter.end).toLocaleDateString()
                  : 'To'
                }
              </Text>
            </TouchableOpacity>
            
            {(dateRangeFilter.start || dateRangeFilter.end) && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={clearDateRange}
              >
                <IconSymbol name="xmark" size={14} color={Colors.error[600]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Job Card Filter */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Job Card</Text>
          <View style={styles.ticketFilters}>
            <TouchableOpacity
              style={[styles.ticketButton, ticketFilter && styles.ticketButtonActive]}
              onPress={() => setShowJobCardSelector(true)}
            >
              <IconSymbol 
                name="doc.text.fill" 
                size={16} 
                color={ticketFilter ? Colors.white : Colors.primary[600]} 
              />
              <Text style={[
                styles.ticketButtonText,
                ticketFilter && styles.ticketButtonTextActive
              ]}>
                {selectedTicket ? selectedTicket.ticket_number : 'Select Job Card'}
              </Text>
            </TouchableOpacity>
            
            {ticketFilter && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={clearTicketFilter}
              >
                <IconSymbol name="xmark" size={14} color={Colors.error[600]} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Stats Toggle */}
      <TouchableOpacity
        style={styles.statsToggle}
        onPress={() => setShowStats(!showStats)}
      >
        <IconSymbol 
          name="chart.bar.fill" 
          size={18} 
          color={Colors.primary[600]} 
        />
        <Text style={styles.statsToggleText}>
          {showStats ? 'Hide' : 'Show'} Statistics
        </Text>
        <IconSymbol 
          name={showStats ? "chevron.up" : "chevron.down"} 
          size={16} 
          color={Colors.primary[600]} 
        />
      </TouchableOpacity>

      {/* Statistics */}
      {showStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.all.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.images.length}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.videos.length}</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.audio.length}</Text>
              <Text style={styles.statLabel}>Audio</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.success[600] }]}>
                {stats.assigned.length}
              </Text>
              <Text style={styles.statLabel}>Assigned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.warning[600] }]}>
                {stats.unassigned.length}
              </Text>
              <Text style={styles.statLabel}>Unassigned</Text>
            </View>
          </View>
        </View>
      )}

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} found
        </Text>
        {selectedItems.length > 0 && (
          <TouchableOpacity
            style={styles.clearSelectionButton}
            onPress={clearSelection}
          >
            <Text style={styles.clearSelectionText}>
              Clear selection ({selectedItems.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Media List */}
      <FlatList
        data={filteredItems}
        renderItem={({ item }) => (
          <MediaItem
            item={item}
            selected={selectedItems.includes(item.id)}
            onPress={() => useMediaHubStore.getState().toggleItemSelection(item.id)}
            onLongPress={() => useMediaHubStore.getState().toggleItemSelection(item.id)}
            size="small"
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.mediaList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <IconSymbol
              name="magnifyingglass"
              size={64}
              color={Colors.neutral[300]}
            />
            <Text style={styles.emptyStateText}>
              {searchQuery || dateRangeFilter.start || dateRangeFilter.end || ticketFilter
                ? 'No matching results'
                : 'Start searching'
              }
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || dateRangeFilter.start || dateRangeFilter.end || ticketFilter
                ? 'Try adjusting your filters or search terms'
                : 'Enter a search term or apply filters to find media'
              }
            </Text>
          </View>
        )}
      />

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
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
    backgroundColor: BrandColors.surface,
  },
  
  // Search header
  searchHeader: {
    backgroundColor: BrandColors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    paddingHorizontal: Spacing.base,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[900],
  },
  clearButton: {
    padding: Spacing.xs,
  },

  // Filters
  filtersSection: {
    backgroundColor: BrandColors.surface,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  filterRow: {
    marginBottom: Spacing.base,
  },
  filterLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[700],
    marginBottom: Spacing.xs,
  },
  dateFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    gap: Spacing.xs,
  },
  dateButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[700],
  },
  ticketFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    gap: Spacing.xs,
    flex: 1,
  },
  ticketButtonActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  ticketButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[700],
    flex: 1,
  },
  ticketButtonTextActive: {
    color: Colors.white,
  },
  clearFilterButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error[50],
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats
  statsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  statsToggleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[600],
    flex: 1,
  },
  statsContainer: {
    backgroundColor: Colors.primary[50],
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary[200],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.base,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[700],
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[600],
    marginTop: 2,
  },

  // Results
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  resultsCount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[700],
  },
  clearSelectionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clearSelectionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error[600],
  },

  // Media list
  mediaList: {
    padding: Spacing.lg,
  },
  emptyState: {
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
    paddingHorizontal: Spacing.xl,
  },
});
