import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography, Spacing, BorderRadius, Shadows, BrandColors, StatusColors } from '@/constants/design-system';
import { useMediaHubStore, ServiceTicket } from '@/stores/mediaHubStore';
import { jobCardsService } from '@/services/jobCardsService';

interface TicketAssignmentDialogProps {
  visible: boolean;
  onClose: () => void;
  selectedMediaIds: string[];
  onAssignComplete?: () => void;
}

const TicketAssignmentDialog: React.FC<TicketAssignmentDialogProps> = ({
  visible,
  onClose,
  selectedMediaIds,
  onAssignComplete,
}) => {
  const { assignMediaToTicket } = useMediaHubStore();
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const modalAnimation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      loadTickets();
      Animated.spring(modalAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      // Reset state when closing
      setSearchQuery('');
      setStatusFilter('all');
      setSelectedTicketId(null);
    }
  }, [visible]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await jobCardsService.getRecentTickets(100);
      setTickets(response);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      Alert.alert('Error', 'Failed to load service tickets');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.ticket_number.toLowerCase().includes(query) ||
        ticket.customer_complaint.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    return filtered;
  }, [tickets, searchQuery, statusFilter]);

  const handleAssign = async () => {
    if (!selectedTicketId) {
      Alert.alert('Error', 'Please select a ticket');
      return;
    }

    try {
      setAssigning(true);
      await assignMediaToTicket(selectedMediaIds, selectedTicketId);
      
      Alert.alert('Success', 'Media files assigned successfully');
      onAssignComplete?.();
      onClose();
    } catch (error) {
      console.error('Failed to assign media:', error);
      Alert.alert('Error', 'Failed to assign media files');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusColor = (status: string) => {
    return StatusColors[status as keyof typeof StatusColors]?.primary || BrandColors.primary;
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'reported', label: 'Reported' },
    { value: 'triaged', label: 'Triaged' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  if (!visible) return null;
  
  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: modalAnimation,
            transform: [{
              scale: modalAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              })
            }],
          }
        ]}
      >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <IconSymbol name="doc.text" size={20} color={BrandColors.primary} />
              </View>
              <View>
                <Text style={styles.title}>Assign to Ticket</Text>
                <Text style={styles.subtitle}>
                  {selectedMediaIds.length} file{selectedMediaIds.length !== 1 ? 's' : ''} selected
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol name="xmark" size={20} color={Colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          {/* Search and Filters */}
          <View style={styles.filtersSection}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <IconSymbol name="magnifyingglass" size={16} color={Colors.neutral[500]} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by ticket number or complaint..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.neutral[400]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearch}
                  onPress={() => setSearchQuery('')}
                >
                  <IconSymbol name="xmark.circle.fill" size={16} color={Colors.neutral[400]} />
                </TouchableOpacity>
              )}
            </View>

            {/* Status Filter */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.statusFilters}
              contentContainerStyle={styles.statusFiltersContent}
            >
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusFilterButton,
                    statusFilter === option.value && styles.statusFilterButtonActive
                  ]}
                  onPress={() => setStatusFilter(option.value)}
                >
                  <Text style={[
                    styles.statusFilterText,
                    statusFilter === option.value && styles.statusFilterTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tickets List */}
          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={BrandColors.primary} />
                <Text style={styles.loadingText}>Loading tickets...</Text>
              </View>
            ) : filteredTickets.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="doc.text" size={48} color={Colors.neutral[300]} />
                <Text style={styles.emptyTitle}>No tickets found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'No service tickets available'}
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.ticketsList}
                showsVerticalScrollIndicator={false}
              >
                {filteredTickets.map((ticket) => (
                  <TouchableOpacity
                    key={ticket.id}
                    style={[
                      styles.ticketItem,
                      selectedTicketId === ticket.id && styles.ticketItemSelected
                    ]}
                    onPress={() => setSelectedTicketId(ticket.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.ticketContent}>
                      <View style={styles.ticketHeader}>
                        <Text style={styles.ticketNumber}>
                          #{ticket.ticket_number}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(ticket.status) + '20' }
                        ]}>
                          <Text style={[
                            styles.statusBadgeText,
                            { color: getStatusColor(ticket.status) }
                          ]}>
                            {ticket.status.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.ticketComplaint} numberOfLines={2}>
                        {ticket.customer_complaint}
                      </Text>
                      <View style={styles.ticketMeta}>
                        <IconSymbol name="calendar" size={12} color={Colors.neutral[500]} />
                        <Text style={styles.ticketDate}>
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </Text>
                        <View style={styles.priorityIndicator}>
                          <IconSymbol 
                            name={ticket.priority === 1 ? "exclamationmark.triangle.fill" : "circle.fill"} 
                            size={8} 
                            color={ticket.priority === 1 ? Colors.error[500] : Colors.neutral[400]} 
                          />
                        </View>
                      </View>
                    </View>
                    {selectedTicketId === ticket.id && (
                      <View style={styles.selectedIndicator}>
                        <IconSymbol name="checkmark.circle.fill" size={20} color={Colors.success[600]} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={assigning}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.assignButton,
                (!selectedTicketId || assigning) && styles.assignButtonDisabled
              ]}
              onPress={handleAssign}
              disabled={!selectedTicketId || assigning}
            >
              <LinearGradient
                colors={[BrandColors.primary, BrandColors.primary + 'E0']}
                style={styles.assignButtonGradient}
              >
                {assigning ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <IconSymbol name="paperclip" size={16} color={Colors.white} />
                    <Text style={styles.assignButtonText}>
                      Assign {selectedMediaIds.length} file{selectedMediaIds.length !== 1 ? 's' : ''}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent', // Let parent modal handle background
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.xl,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
    ...Shadows.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: BrandColors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersSection: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
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
  clearSearch: {
    padding: Spacing.xs,
  },
  statusFilters: {
    marginHorizontal: -Spacing.lg,
  },
  statusFiltersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  statusFilterButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  statusFilterButtonActive: {
    backgroundColor: BrandColors.primary + '15',
    borderColor: BrandColors.primary,
  },
  statusFilterText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  statusFilterTextActive: {
    color: BrandColors.primary,
    fontFamily: Typography.fontFamily.semibold,
  },
  listContainer: {
    flex: 1,
    minHeight: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[600],
    marginTop: Spacing.base,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[400],
    textAlign: 'center',
  },
  ticketsList: {
    flex: 1,
    padding: Spacing.lg,
  },
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  ticketItemSelected: {
    borderColor: Colors.success[600],
    backgroundColor: Colors.success[50],
  },
  ticketContent: {
    flex: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  ticketNumber: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'capitalize',
  },
  ticketComplaint: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[700],
    lineHeight: Typography.lineHeight.sm,
    marginBottom: Spacing.sm,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ticketDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  priorityIndicator: {
    marginLeft: 'auto',
  },
  selectedIndicator: {
    marginLeft: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[600],
  },
  assignButton: {
    flex: 2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  assignButtonDisabled: {
    opacity: 0.5,
  },
  assignButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
  },
  assignButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
});

export default TicketAssignmentDialog;
