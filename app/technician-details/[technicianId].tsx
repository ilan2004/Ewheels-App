import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { floorManagerService } from '@/services/floorManagerService';
import { jobCardsService } from '@/services/jobCardsService';
import { StatusIcon } from '@/components/empty-states';

export default function TechnicianDetailsScreen() {
  const { technicianId } = useLocalSearchParams<{ technicianId: string }>();
  const queryClient = useQueryClient();

  // Fetch technician details
  const {
    data: technician,
    isLoading: technicianLoading,
    error: technicianError,
    refetch: refetchTechnician,
  } = useQuery({
    queryKey: ['technician-details', technicianId],
    queryFn: () => floorManagerService.getTechnicianDetails(technicianId!),
    enabled: !!technicianId,
  });

  // Fetch technician's active tickets
  const {
    data: tickets,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ['technician-tickets', technicianId],
    queryFn: () => jobCardsService.getTicketsByTechnician(technicianId!),
    enabled: !!technicianId,
    refetchInterval: 30000,
  });

  // Mutation for reassigning tickets
  const reassignTicketMutation = useMutation({
    mutationFn: ({ ticketId, newTechnicianId }: { ticketId: string; newTechnicianId: string }) =>
      floorManagerService.reassignTicket(ticketId, newTechnicianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-tickets', technicianId] });
      queryClient.invalidateQueries({ queryKey: ['technician-details', technicianId] });
      queryClient.invalidateQueries({ queryKey: ['floor-manager-stats'] });
    },
  });

  const refreshing = technicianLoading || ticketsLoading;

  const handleRefresh = async () => {
    await Promise.all([
      refetchTechnician(),
      refetchTickets(),
    ]);
  };

  const handleTicketPress = (ticketId: string) => {
    router.push(`/jobcards/${ticketId}`);
  };

  const handleReassignTicket = (ticketId: string, ticketTitle: string) => {
    Alert.alert(
      'Reassign Ticket',
      `Do you want to reassign "${ticketTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reassign',
          onPress: () => {
            // In a real app, you'd show a technician picker
            // For now, we'll just unassign it
            reassignTicketMutation.mutate({
              ticketId,
              newTechnicianId: '', // Unassign
            });
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return '#EF4444';
      case 'assigned': return '#3B82F6';
      case 'in_progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return '#EF4444';
      case 2: return '#F59E0B';
      case 3: return '#6B7280';
      default: return '#6B7280';
    }
  };


  if (technicianError) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load technician details</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (technicianLoading && !technician) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Loading...',
            headerBackTitle: 'Back',
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
          }}
        />
        <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <View style={styles.loadingAvatar} />
            <View style={styles.loadingTextLarge} />
            <View style={styles.loadingTextSmall} />
          </View>
          <View style={styles.loadingStatsContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.loadingStatItem}>
                <View style={styles.loadingStatValue} />
                <View style={styles.loadingStatLabel} />
              </View>
            ))}
          </View>
        </View>
      </ThemedView>
      </>
    );
  }

  if (!technician && !technicianLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Not Found',
            headerBackTitle: 'Back',
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
          }}
        />
        <ThemedView style={styles.errorContainer}>
        <IconSymbol name="person.slash" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Technician not found</Text>
        <Text style={styles.errorSubtext}>This technician may have been removed or the ID is invalid.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </ThemedView>
      </>
    );
  }


  return (
    <>
      <Stack.Screen
        options={{
          title: 'Technician Details',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTitleStyle: {
            fontWeight: '600',
            color: '#111827',
          },
        }}
      />
      <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >

        {technician && (
          <>
            {/* Technician Info */}
            <View style={styles.section}>
              <View style={styles.technicianCard}>
                <View style={styles.technicianHeader}>
                  <View style={styles.technicianAvatar}>
                    <Text style={styles.technicianInitials}>
                      {technician.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.technicianInfo}>
                    <Text style={styles.technicianName}>{technician.name}</Text>
                    <Text style={styles.technicianEmail}>{technician.email}</Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={[styles.statItem, styles.statItemActive]}>
                    <View style={styles.statIcon}>
                      <IconSymbol name="gearshape.2.fill" size={24} color="#10B981" />
                    </View>
                    <View style={styles.statContent}>
                      <Text style={styles.statLabel}>Active Tasks</Text>
                      <Text style={[styles.statValue, { color: '#10B981' }]}>{technician.activeTickets}</Text>
                    </View>
                  </View>
                </View>


                {/* Performance Metrics */}
                <View style={styles.performanceSection}>
                  <Text style={styles.performanceSectionTitle}>Performance Overview</Text>
                  <View style={styles.performanceGrid}>
                    <View style={styles.performanceItem}>
                      <IconSymbol name="clock" size={16} color="#F59E0B" />
                      <Text style={styles.performanceValue}>
                        {technician.oldestTicketDays || 0} days
                      </Text>
                      <Text style={styles.performanceLabel}>Oldest Task</Text>
                    </View>
                    <View style={styles.performanceItem}>
                      <IconSymbol name="checkmark.circle" size={16} color="#3B82F6" />
                      <Text style={styles.performanceValue}>12</Text>
                      <Text style={styles.performanceLabel}>Completed</Text>
                    </View>
                  </View>
                </View>

                {technician.oldestTicketDays && technician.oldestTicketDays > 5 && (
                  <View style={styles.warningBanner}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#EF4444" />
                    <Text style={styles.warningText}>
                      ⚠️ Attention Required: Tasks pending for {technician.oldestTicketDays} days
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Active Tickets */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Active Tickets ({tickets?.length || 0})
                </ThemedText>
                <TouchableOpacity onPress={() => router.push('/jobcards')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {tickets && tickets.length > 0 ? (
                <View style={styles.ticketsList}>
                  {tickets.map((ticket) => {
                    const dueDate = ticket.due_date || ticket.dueDate;
                    const isOverdue = dueDate && new Date(dueDate) < new Date();
                    const isDueToday = dueDate && 
                      new Date(dueDate).toDateString() === new Date().toDateString();
                    
                    return (
                      <TouchableOpacity
                        key={ticket.id}
                        style={styles.ticketCard}
                        onPress={() => handleTicketPress(ticket.id)}
                      >
                        <View style={styles.ticketHeader}>
                          <Text style={styles.ticketNumber}>{ticket.ticket_number || ticket.ticketNumber}</Text>
                          <View style={styles.ticketBadges}>
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
                              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(ticket.priority) }]} />
                            )}
                            <TouchableOpacity
                              onPress={() => handleReassignTicket(ticket.id, ticket.customer_complaint || ticket.symptom)}
                              style={styles.reassignButton}
                            >
                              <IconSymbol name="arrow.triangle.2.circlepath" size={14} color="#6B7280" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <Text style={styles.ticketSymptom} numberOfLines={2}>
                          {ticket.customer_complaint || ticket.symptom}
                        </Text>

                        <View style={styles.ticketMeta}>
                          {/* Customer - Enhanced visibility */}
                          <View style={styles.customerRow}>
                            <View style={styles.customerInfo}>
                              <Text style={styles.customerLabel}>Customer</Text>
                              <Text style={styles.customerName}>
                                {ticket.customer?.name || 'Unknown Customer'}
                              </Text>
                            </View>
                          </View>
                          
                          {/* Vehicle Info */}
                          {(ticket.vehicle_reg_no || ticket.vehicleRegNo) && (
                            <View style={styles.ticketMetaRow}>
                              <Text style={styles.ticketMetaLabel}>Vehicle:</Text>
                              <Text style={styles.ticketMetaValue}>{ticket.vehicle_reg_no || ticket.vehicleRegNo}</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.ticketFooter}>
                          <View style={styles.ticketFooterLeft}>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                              <StatusIcon status={ticket.status as any} size="sm" />
                              <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                                {ticket.status.replace('_', ' ')}
                              </Text>
                            </View>
                            <Text style={styles.ticketDate}>
                              {new Date(ticket.created_at || ticket.createdAt || Date.now()).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <IconSymbol name="checkmark.circle" size={48} color="#10B981" />
                  <Text style={styles.emptyTitle}>No Active Tickets</Text>
                  <Text style={styles.emptySubtitle}>
                    This technician has completed all assigned tasks
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  technicianCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  technicianHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  technicianAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  technicianInitials: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  technicianInfo: {
    flex: 1,
  },
  technicianName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  technicianEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    flex: 1,
    maxWidth: '100%',
  },
  statItemActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  statIcon: {
    marginRight: 12,
  },
  statContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  performanceSection: {
    marginBottom: 16,
  },
  performanceSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  performanceItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  performanceLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '500',
  },
  ticketsList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  ticketBadges: {
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
  reassignButton: {
    padding: 4,
  },
  ticketSymptom: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  ticketMeta: {
    gap: 6,
    marginBottom: 12,
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
  ticketMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketMetaLabel: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  ticketMetaValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ticketDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
  loadingContainer: {
    padding: 20,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  loadingTextLarge: {
    width: 120,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  loadingTextSmall: {
    width: 80,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  loadingStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  loadingStatItem: {
    alignItems: 'center',
  },
  loadingStatValue: {
    width: 40,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  loadingStatLabel: {
    width: 60,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
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
});
