import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { EmptySearchResults, StatusIcon } from '@/components/empty-states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, ComponentStyles, PriorityColors, Spacing, StatusColors, Typography } from '@/constants/design-system';
import { jobCardsService } from '@/services/jobCardsService';
import { useAuthStore } from '@/stores/authStore';
import { ServiceTicket, TicketFilters } from '@/types';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: TicketFilters;
  onFiltersChange: (filters: TicketFilters) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onFiltersChange,
}) => {
  const [localFilters, setLocalFilters] = useState<TicketFilters>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: TicketFilters = {
      status: 'all',
      priority: 'all',
      assignedTo: 'all',
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
            Filters
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
              {['all', 'reported', 'assigned', 'in_progress', 'completed'].map((status) => (
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

          {/* Assignment Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Assignment</Text>
            <View style={styles.filterOptions}>
              {['all', 'unassigned'].map((assignedTo) => (
                <TouchableOpacity
                  key={assignedTo}
                  style={[
                    styles.filterOption,
                    localFilters.assignedTo === assignedTo && styles.filterOptionSelected,
                  ]}
                  onPress={() => setLocalFilters({ ...localFilters, assignedTo })}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      localFilters.assignedTo === assignedTo && styles.filterOptionTextSelected,
                    ]}
                  >
                    {assignedTo === 'all' ? 'All Assignments' : 'Unassigned'}
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

interface JobCardItemProps {
  ticket: ServiceTicket;
  onPress: () => void;
  onAssignPress: (ticketId: string) => void;
  bulkMode?: boolean;
  isSelected?: boolean;
  onSelect?: (ticketId: string) => void;
  getTechnicianName: (technicianId: string) => string;
}

const JobCardItem: React.FC<JobCardItemProps> = ({
  ticket,
  onPress,
  onAssignPress,
  bulkMode = false,
  isSelected = false,
  onSelect,
  getTechnicianName
}) => {
  const dueDate = ticket.due_date || ticket.dueDate;
  const isOverdue = dueDate && new Date(dueDate) < new Date();
  const isDueToday = dueDate &&
    new Date(dueDate).toDateString() === new Date().toDateString();

  const getStatusColor = () => {
    switch (ticket.status) {
      case 'reported':
        return StatusColors.reported;
      case 'assigned':
        return StatusColors.assigned;
      case 'in_progress':
        return StatusColors.in_progress;
      case 'completed':
        return StatusColors.completed;
      case 'delivered':
        return StatusColors.completed;
      case 'on_hold':
        return Colors.warning[500];
      case 'waiting_approval':
        return Colors.warning[600];
      case 'cancelled':
      case 'closed':
        return Colors.neutral[600];
      default:
        return Colors.neutral[600];
    }
  };

  const getPriorityColor = () => {
    if (!ticket.priority) return Colors.neutral[500];
    return PriorityColors[ticket.priority as 1 | 2 | 3] ?? Colors.neutral[500];
  };

  return (
    <TouchableOpacity
      style={[styles.jobCardItem, isSelected && styles.jobCardItemSelected]}
      onPress={() => {
        if (bulkMode && onSelect) {
          onSelect(ticket.id);
        } else {
          onPress();
        }
      }}
    >
      <View style={styles.jobCardHeader}>
        <View style={styles.jobCardTitleRow}>
          {bulkMode && (
            <View style={styles.selectionCheckbox}>
              <IconSymbol
                name={isSelected ? "checkmark.circle.fill" : "circle"}
                size={20}
                color={isSelected ? Colors.primary[600] : Colors.neutral[400]}
              />
            </View>
          )}
          <Text style={styles.jobCardNumber}>{ticket.ticket_number || ticket.ticketNumber}</Text>
        </View>
        <View style={styles.jobCardBadges}>
          {isOverdue && (
            <View style={[styles.badge, styles.overdueBadge]}>
              <Text style={[styles.badgeText, { color: BrandColors.primary }]}>Overdue</Text>
            </View>
          )}
          {isDueToday && !isOverdue && (
            <View style={[styles.badge, styles.dueTodayBadge]}>
              <Text style={[styles.badgeText, { color: BrandColors.title }]}>Due Today</Text>
            </View>
          )}
          {ticket.priority && (
            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor() }]} />
          )}
        </View>
      </View>

      <Text style={styles.jobCardSymptom} numberOfLines={2}>
        {ticket.customer_complaint || ticket.symptom}
      </Text>

      <View style={styles.jobCardMeta}>
        {/* Customer - Enhanced visibility */}
        <View style={styles.customerRow}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerLabel}>Customer</Text>
            <Text style={styles.customerName}>
              {ticket.customer?.name || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Vehicle Info */}
        {(ticket.vehicle_reg_no || ticket.vehicleRegNo) && (
          <View style={styles.jobCardMetaRow}>
            <Text style={styles.jobCardMetaLabel}>Vehicle:</Text>
            <Text style={styles.jobCardMetaValue}>{ticket.vehicle_reg_no || ticket.vehicleRegNo}</Text>
          </View>
        )}

        {/* Assigned To - Enhanced visibility */}
        {(ticket.assigned_to || ticket.assignedTo) && (
          <View style={styles.assignedRow}>
            <View style={styles.assignedInfo}>
              <Text style={styles.assignedLabel}>Assigned to</Text>
              <Text style={styles.assignedName}>{getTechnicianName(ticket.assigned_to || ticket.assignedTo || '')}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.jobCardFooter}>
        <View style={styles.jobCardFooterLeft}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <StatusIcon status={ticket.status as any} size="sm" />
            <Text style={[styles.statusBadgeText, { color: getStatusColor() }]}>
              {ticket.status.replace('_', ' ')}
            </Text>
          </View>
          <Text style={styles.jobCardDate}>
            {new Date(ticket.created_at || ticket.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Assign Technician Button - show for unassigned tickets */}
        {!(ticket.assigned_to || ticket.assignedTo) && (
          <TouchableOpacity
            style={styles.assignButton}
            onPress={(e) => {
              e.stopPropagation();
              onAssignPress(ticket.id);
            }}
          >
            <IconSymbol name="person.badge.plus" size={16} color={Colors.primary[500]} />
            <Text style={styles.assignButtonText}>
              Assign
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function JobCardsScreen() {
  const { user } = useAuthStore();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TicketFilters>({
    status: 'all',
    priority: 'all',
    assignedTo: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  // Fetch technicians for name lookup
  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => jobCardsService.getTechnicians(),
  });

  // Helper function to get technician name
  const getTechnicianName = (technicianId: string): string => {
    if (!technicianId) return 'Unassigned';
    const technician = technicians.find(t => t.id === technicianId);
    if (!technician) return technicianId;
    return `${technician.first_name || ''} ${technician.last_name || ''}`.trim() || technician.email || technicianId;
  };

  // Handle URL parameters for filtering
  useEffect(() => {
    if (params.filter) {
      const filterType = params.filter as string;
      let newFilters: TicketFilters = {
        status: 'all',
        priority: 'all',
        assignedTo: 'all',
      };

      switch (filterType) {
        case 'overdue':
          newFilters = { ...newFilters, dueDate: 'overdue' };
          break;
        case 'today':
          newFilters = { ...newFilters, dueDate: 'today' };
          break;
        case 'unassigned':
          newFilters = { ...newFilters, assignedTo: 'unassigned' };
          break;
        case 'in_progress':
          newFilters = { ...newFilters, statusGroup: 'active' };
          break;
        case 'reported':
          newFilters = { ...newFilters, status: 'reported' };
          break;
        case 'assigned':
          newFilters = { ...newFilters, status: 'assigned' };
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
    queryKey: ['job-cards', filters, searchQuery, page, params.filter],
    queryFn: () => {
      const queryFilters = { ...filters, search: searchQuery };
      return jobCardsService.getTickets(queryFilters, page, 20);
    },
    refetchInterval: 30000,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleJobCardPress = (ticketId: string) => {
    router.push(`/jobcards/${ticketId}`);
  };

  const handleAssignPress = (ticketId: string) => {
    router.push(`/jobcards/assign-technician?ticketId=${ticketId}`);
  };

  const handleBulkSelect = (ticketId: string) => {
    setSelectedTickets(prev => {
      if (prev.includes(ticketId)) {
        return prev.filter(id => id !== ticketId);
      } else {
        return [...prev, ticketId];
      }
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length;

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BrandColors.surface} />
      {/* Active Filter Indicator */}
      {params.filter && (
        <View style={styles.activeFilterIndicator}>
          <View style={styles.activeFilterContainer}>
            <Text style={styles.activeFilterText}>
              Showing: {params.filter === 'overdue' ? 'Overdue Tasks' :
                params.filter === 'today' ? 'Due Today' :
                  params.filter === 'unassigned' ? 'Unassigned Tasks' :
                    params.filter === 'in_progress' ? 'Active Tasks' :
                      (typeof params.filter === 'string' ? params.filter.replace('_', ' ') : '')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                router.replace('/jobcards');
                setFilters({ status: 'all', priority: 'all', assignedTo: 'all' });
              }}
              style={styles.clearFilterButton}
            >
              <IconSymbol name="xmark" size={16} color={Colors.neutral[500]} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Bar with Filter Button */}
      <View style={[styles.searchContainer, params.filter && styles.searchContainerWithFilter]}>
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={20} color={Colors.neutral[500]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search job cards, customers, vehicles..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.neutral[400]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color={Colors.neutral[500]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Admin Bulk Actions */}
        {user?.role === 'admin' && (
          <TouchableOpacity
            style={[styles.searchFilterButton, bulkMode && styles.bulkModeActive]}
            onPress={() => {
              setBulkMode(!bulkMode);
              setSelectedTickets([]);
            }}
          >
            <IconSymbol name="checkmark.circle" size={20} color={bulkMode ? Colors.white : Colors.neutral[500]} />
          </TouchableOpacity>
        )}

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.searchFilterButton}
          onPress={() => setShowFilters(true)}
        >
          <IconSymbol name="line.3.horizontal.decrease" size={20} color={Colors.neutral[500]} />
          {(activeFiltersCount > 0 || params.filter) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {activeFiltersCount + (params.filter ? 1 : 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats and Bulk Actions Bar */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {ticketsData?.count || 0} total cards • {ticketsData?.data.length || 0} shown
          {bulkMode && selectedTickets.length > 0 && (
            <Text style={styles.selectedText}> • {selectedTickets.length} selected</Text>
          )}
        </Text>
        {bulkMode && selectedTickets.length > 0 && user?.role === 'admin' && (
          <View style={styles.bulkActions}>
            <TouchableOpacity style={styles.bulkActionButton}>
              <IconSymbol name="person.badge.plus" size={14} color={Colors.primary[600]} />
              <Text style={styles.bulkActionText}>Assign</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bulkActionButton}>
              <IconSymbol name="arrow.2.squarepath" size={14} color={Colors.warning[600]} />
              <Text style={styles.bulkActionText}>Update Status</Text>
            </TouchableOpacity>
          </View>
        )}
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
            <Text style={styles.errorText}>Failed to load job cards</Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.jobCardsList}>
            {ticketsData?.data.map((ticket) => (
              <JobCardItem
                key={ticket.id}
                ticket={ticket}
                onPress={() => handleJobCardPress(ticket.id)}
                onAssignPress={handleAssignPress}
                bulkMode={bulkMode}
                isSelected={selectedTickets.includes(ticket.id)}
                onSelect={handleBulkSelect}
                getTechnicianName={getTechnicianName}
              />
            ))}
            {!isLoading && ticketsData?.data.length === 0 && (
              <View style={styles.emptyContainer}>
                <EmptySearchResults />
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
    backgroundColor: BrandColors.surface,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Account for status bar
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
  },
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary + '10',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.primary,
  },
  activeFilterText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    flex: 1,
  },
  clearFilterButton: {
    padding: Spacing.xs,
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.full,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: BrandColors.surface,
    fontSize: 10,
    fontFamily: Typography.fontFamily.semibold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 16, // Reduced from 40 for Android
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm, // Reduced from md
    backgroundColor: BrandColors.surface,
    gap: Spacing.md,
  },
  searchContainerWithFilter: {
    paddingTop: Spacing.sm, // Reduced top padding when filter indicator is present
  },
  searchBar: {
    ...ComponentStyles.input,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm, // Reduced gap
    paddingVertical: Platform.OS === 'android' ? 8 : Spacing.base, // Reduced vertical padding for Android
    height: 44, // Explicit height constraint
  },
  searchFilterButton: {
    padding: Spacing.md,
    backgroundColor: BrandColors.ink + '10',
    borderRadius: BorderRadius.md,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
  },
  statsText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '60',
  },
  selectedText: {
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
  },
  bulkActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
  },
  bulkActionText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink + '80',
  },
  bulkModeActive: {
    backgroundColor: BrandColors.primary,
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
    padding: Spacing.base,
  },
  jobCardItemSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primary + '05',
  },
  selectionCheckbox: {
    marginRight: Spacing.sm,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  jobCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  jobCardNumber: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
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
    backgroundColor: BrandColors.primary + '15',
  },
  dueTodayBadge: {
    backgroundColor: BrandColors.title + '15',
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.sm,
  },
  jobCardSymptom: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeight.sm,
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
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '60',
    flex: 1,
  },
  jobCardMetaValue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    flex: 2,
    textAlign: 'right',
  },
  // Enhanced customer styles
  customerRow: {
    marginBottom: Spacing.sm,
  },
  customerInfo: {
    backgroundColor: BrandColors.primary + '08',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.primary,
  },
  customerLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  customerName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  // Enhanced assigned person styles
  assignedRow: {
    marginBottom: Spacing.sm,
  },
  assignedInfo: {
    backgroundColor: BrandColors.title + '08',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.title,
  },
  assignedLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  assignedName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
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
  assignButton: {
    ...ComponentStyles.button.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  assignButtonText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  statusBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'capitalize',
  },
  jobCardDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '60',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.primary,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  retryButton: {
    ...ComponentStyles.button.primary,
  },
  retryText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.surface,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '60',
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing['5xl'],
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
  },
  modalCancel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '60',
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
  },
  modalClear: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.primary,
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
    color: BrandColors.title,
    marginBottom: Spacing.md,
  },
  filterOptions: {
    gap: Spacing.sm,
  },
  filterOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
    backgroundColor: BrandColors.surface,
  },
  filterOptionSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primary + '10',
  },
  filterOptionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
    textTransform: 'capitalize',
  },
  filterOptionTextSelected: {
    color: BrandColors.title,
    fontFamily: Typography.fontFamily.semibold,
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: BrandColors.ink + '10',
  },
  applyButton: {
    ...ComponentStyles.button.primary,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.surface,
  },
});
