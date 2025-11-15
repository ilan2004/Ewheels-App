import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { jobCardsService } from '@/services/jobCardsService';
import { ServiceTicket, TicketFilters } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { EmptySearchResults, StatusIcon } from '@/components/empty-states';
import { HeroImageCard } from '@/components/image-card';
import { Colors, Typography, Spacing, BorderRadius, ComponentStyles } from '@/constants/design-system';

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
}

const JobCardItem: React.FC<JobCardItemProps> = ({ ticket, onPress, onAssignPress }) => {
  const dueDate = ticket.due_date || ticket.dueDate;
  const isOverdue = dueDate && new Date(dueDate) < new Date();
  const isDueToday = dueDate && 
    new Date(dueDate).toDateString() === new Date().toDateString();

  const getStatusColor = () => {
    switch (ticket.status) {
      case 'reported': return '#EF4444';
      case 'assigned': return '#3B82F6';
      case 'in_progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = () => {
    switch (ticket.priority) {
      case 1: return '#EF4444';
      case 2: return '#F59E0B';
      case 3: return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <TouchableOpacity style={styles.jobCardItem} onPress={onPress}>
      <View style={styles.jobCardHeader}>
        <View style={styles.jobCardTitleRow}>
          <Text style={styles.jobCardNumber}>{ticket.ticket_number || ticket.ticketNumber}</Text>
        </View>
        <View style={styles.jobCardBadges}>
          {isOverdue && (
            <View style={[styles.badge, styles.overdueBadge]}>
              <Text style={[styles.badgeText, { color: '#DC2626' }]}>Overdue</Text>
            </View>
          )}
          {isDueToday && !isOverdue && (
            <View style={[styles.badge, styles.dueTodayBadge]}>
              <Text style={[styles.badgeText, { color: '#D97706' }]}>Due Today</Text>
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
              <Text style={styles.assignedName}>{ticket.assigned_to || ticket.assignedTo}</Text>
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
            <IconSymbol name="person.badge.plus" size={16} color="#3B82F6" />
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
          // For overdue, we'll need to add this to the query logic
          newFilters = { ...newFilters, status: 'all' }; // Will be handled in query
          break;
        case 'today':
          // For due today, we'll need to add this to the query logic
          newFilters = { ...newFilters, status: 'all' }; // Will be handled in query
          break;
        case 'unassigned':
          newFilters = { ...newFilters, assignedTo: 'unassigned' };
          break;
        case 'in_progress':
          newFilters = { ...newFilters, status: 'in_progress' };
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
      
      // Add special filters from URL params
      if (params.filter) {
        const filterType = params.filter as string;
        if (filterType === 'overdue') {
          queryFilters.dueDate = 'overdue';
        } else if (filterType === 'today') {
          queryFilters.dueDate = 'today';
        }
      }
      
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

  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length;

  return (
    <ThemedView style={styles.container}>
      {/* Active Filter Indicator */}
      {params.filter && (
        <View style={styles.activeFilterIndicator}>
          <View style={styles.activeFilterContainer}>
            <Text style={styles.activeFilterText}>
              Showing: {params.filter === 'overdue' ? 'Overdue Tasks' : 
                       params.filter === 'today' ? 'Due Today' :
                       params.filter === 'unassigned' ? 'Unassigned Tasks' :
                       params.filter === 'in_progress' ? 'In Progress' :
                       params.filter.replace('_', ' ')}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                router.replace('/jobcards');
                setFilters({ status: 'all', priority: 'all', assignedTo: 'all' });
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
            placeholder="Search job cards, customers, vehicles..."
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
          {ticketsData?.count || 0} total cards • {ticketsData?.data.length || 0} shown
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
    backgroundColor: '#F9FAFB',
  },
  activeFilterIndicator: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  activeFilterText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
    flex: 1,
  },
  clearFilterButton: {
    padding: 4,
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchFilterButton: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  stats: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  jobCardsList: {
    gap: 16,
  },
  jobCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobCardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  jobCardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueBadge: {
    backgroundColor: '#FEE2E2',
  },
  dueTodayBadge: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  jobCardSymptom: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  jobCardMeta: {
    gap: 6,
    marginBottom: 12,
  },
  jobCardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobCardMetaLabel: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  jobCardMetaValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  // Enhanced customer styles
  customerRow: {
    marginBottom: 8,
  },
  customerInfo: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  customerLabel: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '700',
  },
  // Enhanced assigned person styles
  assignedRow: {
    marginBottom: 8,
  },
  assignedInfo: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },
  assignedLabel: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  assignedName: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '700',
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobCardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  assignButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  jobCardDate: {
    fontSize: 12,
    color: '#6B7280',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
  modalClear: {
    fontSize: 16,
    color: '#EF4444',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
  },
  filterOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
