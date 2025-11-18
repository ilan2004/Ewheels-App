import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography, Spacing, BorderRadius, BrandColors } from '@/constants/design-system';
import { MediaFilters, useMediaHubStore } from '@/stores/mediaHubStore';

interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (range: { from: string; to: string } | undefined) => void;
  currentRange?: { from: string; to: string };
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ visible, onClose, onSelect, currentRange }) => {
  const [fromDate, setFromDate] = useState(currentRange?.from || '');
  const [toDate, setToDate] = useState(currentRange?.to || '');

  const handleApply = () => {
    if (fromDate && toDate) {
      onSelect({ from: fromDate, to: toDate });
    } else {
      onSelect(undefined);
    }
    onClose();
  };

  const handleClear = () => {
    setFromDate('');
    setToDate('');
    onSelect(undefined);
    onClose();
  };

  const formatDateForInput = (date: string) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <Text style={styles.datePickerTitle}>Filter by Date Range</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="xmark" size={20} color={Colors.neutral[600]} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateInputsContainer}>
            <View style={styles.dateInputGroup}>
              <Text style={styles.dateInputLabel}>From</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                value={formatDateForInput(fromDate)}
                onChangeText={(text) => setFromDate(text)}
                placeholderTextColor={Colors.neutral[400]}
              />
            </View>
            
            <View style={styles.dateInputGroup}>
              <Text style={styles.dateInputLabel}>To</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                value={formatDateForInput(toDate)}
                onChangeText={(text) => setToDate(text)}
                placeholderTextColor={Colors.neutral[400]}
              />
            </View>
          </View>
          
          <View style={styles.datePickerFooter}>
            <TouchableOpacity style={styles.datePickerButton} onPress={handleClear}>
              <Text style={[styles.datePickerButtonText, { color: Colors.neutral[600] }]}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.datePickerButton, styles.datePickerPrimaryButton]} 
              onPress={handleApply}
            >
              <Text style={[styles.datePickerButtonText, { color: Colors.white }]}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface MediaFilterBarProps {
  onFiltersChange?: (filters: MediaFilters) => void;
}

const MediaFilterBar: React.FC<MediaFilterBarProps> = ({ onFiltersChange }) => {
  const { filters, setFilters, resetFilters, serviceTickets } = useMediaHubStore();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTicketDropdown, setShowTicketDropdown] = useState(false);

  const updateFilter = (key: keyof MediaFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters({ [key]: value });
    onFiltersChange?.(newFilters);
  };

  const handleDateRangeSelect = (range: { from: string; to: string } | undefined) => {
    updateFilter('dateRange', range);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.mediaType) count++;
    if (filters.ticketId) count++;
    if (filters.syncStatus) count++;
    if (filters.dateRange) count++;
    if (filters.searchQuery?.trim()) count++;
    return count;
  };

  const mediaTypeOptions = [
    { value: undefined, label: 'All Types', icon: 'square.stack.3d.up.fill' },
    { value: 'image', label: 'Photos', icon: 'photo.fill' },
    { value: 'video', label: 'Videos', icon: 'video.fill' },
    { value: 'audio', label: 'Audio', icon: 'waveform' },
  ];

  const syncStatusOptions = [
    { value: undefined, label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'synced', label: 'Synced' },
    { value: 'failed', label: 'Failed' },
  ];

  const ticketOptions = [
    { value: undefined, label: 'All Tickets' },
    { value: 'unassigned', label: 'Unassigned' },
    ...serviceTickets.slice(0, 10).map(ticket => ({
      value: ticket.id,
      label: `#${ticket.ticket_number}`,
    })),
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={16} color={Colors.neutral[500]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search media files..."
          value={filters.searchQuery || ''}
          onChangeText={(text) => updateFilter('searchQuery', text)}
          placeholderTextColor={Colors.neutral[400]}
        />
        {filters.searchQuery && (
          <TouchableOpacity onPress={() => updateFilter('searchQuery', undefined)}>
            <IconSymbol name="xmark.circle.fill" size={16} color={Colors.neutral[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersScrollContent}
      >
        {/* Media Type Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {mediaTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.filterChip,
                  filters.mediaType === option.value && styles.filterChipActive
                ]}
                onPress={() => updateFilter('mediaType', option.value)}
              >
                <IconSymbol 
                  name={option.icon} 
                  size={14} 
                  color={filters.mediaType === option.value ? Colors.white : Colors.neutral[600]} 
                />
                <Text style={[
                  styles.filterChipText,
                  filters.mediaType === option.value && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sync Status Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {syncStatusOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.filterChip,
                  filters.syncStatus === option.value && styles.filterChipActive
                ]}
                onPress={() => updateFilter('syncStatus', option.value)}
              >
                <View style={[
                  styles.syncStatusDot,
                  { 
                    backgroundColor: option.value === 'synced' ? Colors.success[500] :
                                   option.value === 'pending' ? Colors.warning[500] :
                                   option.value === 'failed' ? Colors.error[500] :
                                   Colors.neutral[400]
                  }
                ]} />
                <Text style={[
                  styles.filterChipText,
                  filters.syncStatus === option.value && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Ticket Assignment Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Assignment</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {ticketOptions.slice(0, 5).map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.filterChip,
                  filters.ticketId === option.value && styles.filterChipActive
                ]}
                onPress={() => updateFilter('ticketId', option.value)}
              >
                <IconSymbol 
                  name={option.value === 'unassigned' ? 'exclamationmark.circle' : 'doc.text'} 
                  size={12} 
                  color={filters.ticketId === option.value ? Colors.white : Colors.neutral[600]} 
                />
                <Text style={[
                  styles.filterChipText,
                  filters.ticketId === option.value && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Date Range Filter */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.dateRange && styles.filterChipActive
          ]}
          onPress={() => setShowDatePicker(true)}
        >
          <IconSymbol 
            name="calendar" 
            size={14} 
            color={filters.dateRange ? Colors.white : Colors.neutral[600]} 
          />
          <Text style={[
            styles.filterChipText,
            filters.dateRange && styles.filterChipTextActive
          ]}>
            {filters.dateRange ? 'Date Range' : 'All Dates'}
          </Text>
        </TouchableOpacity>

        {/* Clear Filters */}
        {getActiveFiltersCount() > 0 && (
          <TouchableOpacity
            style={styles.clearFiltersChip}
            onPress={() => {
              resetFilters();
              onFiltersChange?.({});
            }}
          >
            <IconSymbol name="xmark" size={14} color={Colors.error[600]} />
            <Text style={styles.clearFiltersText}>
              Clear ({getActiveFiltersCount()})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Date Range Picker Modal */}
      <DateRangePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={handleDateRangeSelect}
        currentRange={filters.dateRange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: BrandColors.surface,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[900],
  },
  filtersScroll: {
    paddingLeft: Spacing.base,
  },
  filtersScrollContent: {
    paddingRight: Spacing.base,
    gap: Spacing.lg,
  },
  filterGroup: {
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  filterGroupLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    marginRight: Spacing.sm,
    gap: Spacing.xs,
  },
  filterChipActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[700],
  },
  filterChipTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },
  syncStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  clearFiltersChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.error[50],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.error[200],
    gap: Spacing.xs,
  },
  clearFiltersText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.error[600],
  },
  // Date Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  datePickerContainer: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  datePickerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  dateInputsContainer: {
    gap: Spacing.base,
    marginBottom: Spacing.lg,
  },
  dateInputGroup: {
    gap: Spacing.sm,
  },
  dateInputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[700],
  },
  dateInput: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[900],
    backgroundColor: BrandColors.surface,
  },
  datePickerFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  datePickerPrimaryButton: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  datePickerButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});

export default MediaFilterBar;
