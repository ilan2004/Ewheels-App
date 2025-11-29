import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { JobCard } from '@/components/JobCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, ComponentStyles, Spacing, Typography } from '@/constants/design-system';
import { jobCardsService } from '@/services/jobCardsService';
import { useAuthStore } from '@/stores/authStore';
import { TicketFilters } from '@/types';

interface TechnicianFilters {
  status: 'all' | 'assigned' | 'in_progress' | 'completed';
  priority: 'all' | '1' | '2' | '3';
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: TechnicianFilters;
  onFiltersChange: (filters: TechnicianFilters) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onFiltersChange,
}) => {
  const [localFilters, setLocalFilters] = useState<TechnicianFilters>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: TechnicianFilters = {
      status: 'all',
      priority: 'all',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            Filter My Jobs
          </ThemedText>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.modalClear}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Status</Text>
            <View style={styles.filterOptions}>
              {['all', 'assigned', 'in_progress', 'completed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    localFilters.status === status && styles.filterOptionSelected,
                  ]}
                  onPress={() => setLocalFilters({ ...localFilters, status: status as any })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      localFilters.status === status && styles.filterOptionTextSelected,
                    ]}
                  >
                    {status === 'all' ? 'All Status' : status.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Priority</Text>
            <View style={styles.filterOptions}>
              {['all', '1', '2', '3'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.filterOption,
                    localFilters.priority === priority && styles.filterOptionSelected,
                  ]}
                  onPress={() => setLocalFilters({ ...localFilters, priority: priority as any })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      localFilters.priority === priority && styles.filterOptionTextSelected,
                    ]}
                  >
                    {priority === 'all'
                      ? 'All Priority'
                      : priority === '1'
                        ? 'High Priority'
                        : priority === '2'
                          ? 'Medium Priority'
                          : 'Low Priority'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </Modal>
  );
};


// JobCardItem removed, replaced by JobCard usage below

export default function TechnicianJobCardsScreen() {
  const { user } = useAuthStore();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TechnicianFilters>({
    status: 'all',
    priority: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Handle URL parameters for filtering
  useEffect(() => {
    if (params.filter) {
      const filterType = params.filter as string;
      let newFilters: TechnicianFilters = {
        status: 'all',
        priority: 'all',
      };

      switch (filterType) {
        case 'assigned':
          newFilters = { ...newFilters, status: 'assigned' };
          break;
        case 'in_progress':
          newFilters = { ...newFilters, status: 'in_progress' };
          break;
        case 'completed':
          newFilters = { ...newFilters, status: 'completed' };
          break;
      }

      setFilters(newFilters);
    }
  }, [params.filter]);

  const {
    data: ticketsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['technician-job-cards', user?.id, filters, searchQuery, page],
    queryFn: () => {
      const queryFilters: TicketFilters = {
        assignedTo: user!.id, // Only get tickets assigned to this technician
        status: filters.status === 'all' ? 'all' : filters.status,
        priority: filters.priority === 'all' ? 'all' : (parseInt(filters.priority) as any),
        search: searchQuery,
      };

      return jobCardsService.getTickets(queryFilters, page, 20);
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleJobCardPress = (ticketId: string) => {
    router.push(`/jobcards/${ticketId}`);
  };

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    try {
      await jobCardsService.updateTicketStatus(ticketId, status);
      refetch(); // Refresh the list after status update
      Alert.alert('Success', `Job card status updated to ${status.replace('_', ' ')}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length;

  const getFilterTitle = () => {
    if (params.filter) {
      switch (params.filter) {
        case 'assigned': return 'Assigned to Me';
        case 'in_progress': return 'In Progress';
        case 'completed': return 'Completed';
        default: return 'My Job Cards';
      }
    }
    return 'My Job Cards';
  };

  return (
    <ThemedView style={styles.container}>
      {/* Active Filter Indicator */}
      {params.filter && (
        <View style={styles.activeFilterIndicator}>
          <View style={styles.activeFilterContainer}>
            <Text style={styles.activeFilterText}>
              Showing: {getFilterTitle()}
            </Text>
            <TouchableOpacity
              onPress={() => {
                router.replace('/(tabs)/technician-jobcards');
                setFilters({ status: 'all', priority: 'all' });
              }}
              style={styles.clearFilterButton}
            >
              <IconSymbol name="xmark" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Bar with Filter Button */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search my job cards..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.searchFilterButton}
          onPress={() => setShowFilters(true)}
        >
          <IconSymbol name="line.3.horizontal.decrease" size={20} color="#6B7280" />
          {(activeFiltersCount > 0 || params.filter) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {activeFiltersCount + (params.filter ? 1 : 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {ticketsData?.count || 0} assigned to you • {ticketsData?.data.length || 0} shown
        </Text>
      </View>

      {/* Job Cards List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load your job cards</Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.jobCardsList}>
            {ticketsData?.data.map((ticket) => {
              const getNextStatus = () => {
                switch (ticket.status) {
                  case 'assigned': return 'in_progress';
                  case 'in_progress': return 'completed';
                  default: return null;
                }
              };

              const getNextStatusText = () => {
                switch (ticket.status) {
                  case 'assigned': return 'Start Work';
                  case 'in_progress': return 'Complete';
                  default: return null;
                }
              };

              const getStatusColor = () => {
                switch (ticket.status) {
                  case 'assigned': return '#3B82F6';
                  case 'in_progress': return '#8B5CF6';
                  case 'completed': return '#10B981';
                  default: return '#6B7280';
                }
              };

              const handleQuickAction = () => {
                const nextStatus = getNextStatus();
                if (nextStatus) {
                  const actionText = nextStatus === 'in_progress' ? 'start working on' : 'mark as completed';
                  Alert.alert(
                    'Update Status',
                    `Are you sure you want to ${actionText} this job card?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Confirm',
                        onPress: () => handleStatusUpdate(ticket.id, nextStatus),
                      },
                    ]
                  );
                }
              };

              return (
                <JobCard
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() => handleJobCardPress(ticket.id)}
                  actionButton={getNextStatus() ? (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: getStatusColor() + '20' }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleQuickAction();
                      }}
                    >
                      <Text style={[styles.actionButtonText, { color: getStatusColor() }]}>
                        {getNextStatusText()}
                      </Text>
                    </TouchableOpacity>
                  ) : undefined}
                />
              );
            })}
            {!isLoading && ticketsData?.data.length === 0 && (
              <View style={styles.emptyContainer}>
                <IconSymbol name="doc.text" size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Job Cards Found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Try adjusting your search terms' : 'No job cards are currently assigned to you'}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  activeFilterIndicator: {
    backgroundColor: '#FFFFFF', // White
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[600],
  },
  activeFilterText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[800],
    fontFamily: Typography.fontFamily.semibold,
    flex: 1,
  },
  clearFilterButton: {
    padding: Spacing.xs,
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.error[600],
    borderRadius: BorderRadius.full,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: Typography.fontFamily.semibold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? Spacing.lg : 16, // Reduced top padding for Android
    paddingBottom: Spacing.sm, // Reduced from md
    backgroundColor: BrandColors.surface,
    gap: Spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Platform.OS === 'android' ? 8 : Spacing.md, // Reduced vertical padding for Android
    gap: Spacing.sm, // Reduced gap
    height: 44, // Explicit height constraint
  },
  searchFilterButton: {
    padding: Spacing.md,
    backgroundColor: '#FFFFFF', // White
    borderRadius: BorderRadius.md,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.neutral[900],
    fontFamily: Typography.fontFamily.regular,
    textAlignVertical: 'center', // Fix for Android placeholder alignment
    paddingVertical: 0, // Ensure no extra padding affects alignment
  },
  stats: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  statsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[600],
    fontFamily: Typography.fontFamily.regular,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  jobCardsList: {
    gap: Spacing.base,
  },
  jobCardItem: {
    ...ComponentStyles.card,
    backgroundColor: '#FFFFFF', // White
    padding: Spacing.base,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  jobCardTitleRow: {
    flex: 1,
  },
  ticketNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  jobCardNumber: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[900],
  },
  jobCardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  overdueBadge: {
    backgroundColor: Colors.error[100],
  },
  dueTodayBadge: {
    backgroundColor: Colors.warning[100],
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.semibold,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  jobCardSymptom: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[700],
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeight.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  jobCardMeta: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  jobCardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobCardMetaLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[600],
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
  },
  jobCardMetaValue: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[900],
    fontFamily: Typography.fontFamily.medium,
    flex: 2,
    textAlign: 'right',
  },
  customerRow: {
    marginBottom: Spacing.sm,
  },
  customerInfo: {
    backgroundColor: Colors.primary[50],
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[600],
  },
  customerLabel: {
    fontSize: 10,
    color: Colors.primary[600],
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  customerName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[800],
    fontFamily: Typography.fontFamily.bold,
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobCardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  statusBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'capitalize',
  },
  jobCardDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[600],
    fontFamily: Typography.fontFamily.regular,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionButtonText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.error[600],
    marginBottom: Spacing.base,
    textAlign: 'center',
    fontFamily: Typography.fontFamily.regular,
  },
  retryButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
    minHeight: 200,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[900],
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[600],
    textAlign: 'center',
    fontFamily: Typography.fontFamily.regular,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  modalCancel: {
    fontSize: Typography.fontSize.base,
    color: Colors.neutral[600],
    fontFamily: Typography.fontFamily.regular,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[900],
  },
  modalClear: {
    fontSize: Typography.fontSize.base,
    color: Colors.error[600],
    fontFamily: Typography.fontFamily.regular,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing['2xl'],
  },
  filterTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[900],
    marginBottom: Spacing.md,
  },
  filterOptions: {
    gap: Spacing.sm,
  },
  filterOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  filterOptionSelected: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  filterOptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[700],
    textTransform: 'capitalize',
    fontFamily: Typography.fontFamily.regular,
  },
  filterOptionTextSelected: {
    color: Colors.primary[600],
    fontFamily: Typography.fontFamily.semibold,
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  applyButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});
