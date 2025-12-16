import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Typography } from '@/constants/design-system';
import { useMediaHubStore } from '@/stores/mediaHubStore';

interface JobCardSelectorProps {
  onClose: () => void;
  showUnassignOption?: boolean;
}

export default function JobCardSelector({ onClose, showUnassignOption }: JobCardSelectorProps) {
  const {
    serviceTickets,
    ticketFilter,
    setTicketFilter,
    selectedItems,
    assignToTicket,
    clearSelection,
  } = useMediaHubStore();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredTickets = serviceTickets.filter((ticket: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (ticket.ticket_number?.toLowerCase() || '').includes(query) ||
      (ticket.customer_complaint?.toLowerCase() || '').includes(query) ||
      (ticket.customer?.name?.toLowerCase() || '').includes(query)
    );
  });

  console.log(`JobCardSelector: ${serviceTickets.length} total tickets, ${filteredTickets.length} filtered tickets`);

  const handleTicketSelect = async (ticketId: string | null) => {
    try {
      // If we have selected items, assign them to the ticket
      if (selectedItems.length > 0) {
        await assignToTicket(selectedItems, ticketId);
        clearSelection();
      } else {
        // Otherwise, just set the filter for future captures
        setTicketFilter(ticketId);
      }
      onClose();
    } catch (error) {
      console.error('Failed to select ticket:', error);
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return Colors.error[500];
      case 2:
        return Colors.warning[500];
      case 3:
        return Colors.success[500];
      default:
        return Colors.neutral[500];
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1:
        return 'High';
      case 2:
        return 'Medium';
      case 3:
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  const renderTicketItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.ticketItem,
        ticketFilter === item.id && styles.ticketItemSelected
      ]}
      onPress={() => handleTicketSelect(item.id)}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketNumber}>{item.ticket_number || 'No Ticket #'}</Text>
          <View style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(item.priority) }
          ]}>
            <Text style={styles.priorityText}>{getPriorityText(item.priority)}</Text>
          </View>
        </View>

        {ticketFilter === item.id && (
          <IconSymbol
            name="checkmark.circle.fill"
            size={20}
            color={Colors.success[500]}
          />
        )}
      </View>

      <Text style={styles.ticketComplaint} numberOfLines={2}>
        {item.customer_complaint || 'No complaint details'}
      </Text>

      <View style={styles.ticketFooter}>
        <View style={styles.customerInfo}>
          <IconSymbol name="person.circle" size={14} color={Colors.neutral[500]} />
          <Text style={styles.customerName} numberOfLines={1}>
            {item.customer?.name || 'Unknown Customer'}
          </Text>
        </View>
        <Text style={styles.ticketDate}>
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.primary[600], Colors.primary[700]]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>
            {selectedItems.length > 0
              ? `Assign ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}`
              : 'Select Job Card'
            }
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <IconSymbol
              name="xmark.circle.fill"
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
        </LinearGradient>

        {/* Search */}
        <View style={styles.searchContainer}>
          <IconSymbol
            name="magnifyingglass"
            size={18}
            color={Colors.neutral[400]}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search job cards..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.neutral[400]}
          />
        </View>

        {/* Unassign Option */}
        {showUnassignOption && (
          <TouchableOpacity
            style={[
              styles.unassignOption,
              ticketFilter === null && styles.unassignOptionSelected
            ]}
            onPress={() => handleTicketSelect(null)}
          >
            <View style={styles.unassignContent}>
              <IconSymbol
                name="xmark.circle"
                size={20}
                color={Colors.neutral[600]}
              />
              <Text style={styles.unassignText}>
                {selectedItems.length > 0 ? 'Unassign from job cards' : 'No job card (unassigned)'}
              </Text>
            </View>

            {ticketFilter === null && (
              <IconSymbol
                name="checkmark.circle.fill"
                size={20}
                color={Colors.success[500]}
              />
            )}
          </TouchableOpacity>
        )}

        {/* Job Cards List */}
        <FlatList
          data={filteredTickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id}
          style={styles.ticketsList}
          contentContainerStyle={styles.ticketsListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <IconSymbol
                name="doc.text"
                size={48}
                color={Colors.neutral[300]}
              />
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No job cards found' : 'No job cards available'}
              </Text>
              {searchQuery && (
                <Text style={styles.emptyStateSubtext}>
                  Try adjusting your search terms
                </Text>
              )}
            </View>
          )}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {filteredTickets.length} job card{filteredTickets.length !== 1 ? 's' : ''} available
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%', // Fixed height
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    paddingTop: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.base,
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

  // Unassign Option
  unassignOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral[50],
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
    padding: Spacing.base,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  unassignOptionSelected: {
    borderColor: Colors.success[500],
    backgroundColor: Colors.success[50],
  },
  unassignContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unassignText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[700],
    marginLeft: Spacing.sm,
  },

  // Tickets List
  ticketsList: {
    flex: 1,
  },
  ticketsListContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  ticketItem: {
    backgroundColor: Colors.white,
    padding: Spacing.base,
    marginBottom: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketItemSelected: {
    borderColor: Colors.success[500],
    backgroundColor: Colors.success[50],
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ticketNumber: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[900],
    marginRight: Spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
  ticketComplaint: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  customerName: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
    marginLeft: 4,
  },
  ticketDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
    marginTop: Spacing.base,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[400],
    textAlign: 'center',
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.neutral[50],
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
});
