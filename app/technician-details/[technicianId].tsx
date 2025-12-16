import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { StatusIcon } from '@/components/empty-states';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { floorManagerService } from '@/services/floorManagerService';
import { jobCardsService } from '@/services/jobCardsService';

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
      case 'reported': return Colors.error[500];
      case 'assigned': return BrandColors.primary;
      case 'in_progress': return Colors.info[500];
      case 'completed': return Colors.success[500];
      default: return Colors.neutral[500];
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return Colors.error[500];
      case 2: return Colors.warning[500];
      case 3: return Colors.neutral[500];
      default: return Colors.neutral[500];
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
              backgroundColor: BrandColors.surface,
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
              backgroundColor: BrandColors.surface,
            },
          }}
        />
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="person.slash" size={48} color={Colors.error[500]} />
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
            backgroundColor: BrandColors.surface,
          },
          headerTitleStyle: {
            fontWeight: '600',
            color: BrandColors.ink,
          },
          headerTintColor: BrandColors.primary,
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
                        <IconSymbol name="gearshape.2.fill" size={24} color={Colors.success[600]} />
                      </View>
                      <View style={styles.statContent}>
                        <Text style={styles.statLabel}>Active Tasks</Text>
                        <Text style={[styles.statValue, { color: Colors.success[600] }]}>{technician.activeTickets}</Text>
                      </View>
                    </View>
                  </View>


                  {/* Performance Metrics */}
                  <View style={styles.performanceSection}>
                    <Text style={styles.performanceSectionTitle}>Performance Overview</Text>
                    <View style={styles.performanceGrid}>
                      <View style={styles.performanceItem}>
                        <IconSymbol name="clock" size={16} color={Colors.warning[600]} />
                        <Text style={styles.performanceValue}>
                          {technician.oldestTicketDays || 0} days
                        </Text>
                        <Text style={styles.performanceLabel}>Oldest Task</Text>
                      </View>
                      <View style={styles.performanceItem}>
                        <IconSymbol name="checkmark.circle" size={16} color={BrandColors.primary} />
                        <Text style={styles.performanceValue}>12</Text>
                        <Text style={styles.performanceLabel}>Completed</Text>
                      </View>
                    </View>
                  </View>

                  {technician.oldestTicketDays && technician.oldestTicketDays > 5 && (
                    <View style={styles.warningBanner}>
                      <IconSymbol name="exclamationmark.triangle.fill" size={16} color={Colors.warning[700]} />
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
                      const dueDate = ticket.due_date;
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
                            <Text style={styles.ticketNumber}>{ticket.ticket_number}</Text>
                            <View style={styles.ticketBadges}>
                              {isOverdue && (
                                <View style={[styles.badge, styles.overdueBadge]}>
                                  <Text style={[styles.badgeText, { color: Colors.error[600] }]}>Overdue</Text>
                                </View>
                              )}
                              {isDueToday && !isOverdue && (
                                <View style={[styles.badge, styles.dueTodayBadge]}>
                                  <Text style={[styles.badgeText, { color: Colors.warning[600] }]}>Due Today</Text>
                                </View>
                              )}
                              {ticket.priority && (
                                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(ticket.priority) }]} />
                              )}
                              <TouchableOpacity
                                onPress={() => handleReassignTicket(ticket.id, Array.isArray(ticket.customer_complaint) ? ticket.customer_complaint[0] : ticket.customer_complaint)}
                                style={styles.reassignButton}
                              >
                                <IconSymbol name="arrow.triangle.2.circlepath" size={14} color={Colors.neutral[500]} />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <Text style={styles.ticketSymptom} numberOfLines={2}>
                            {ticket.customer_complaint}
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
                            {ticket.vehicle_reg_no && (
                              <View style={styles.ticketMetaRow}>
                                <Text style={styles.ticketMetaLabel}>Vehicle:</Text>
                                <Text style={styles.ticketMetaValue}>{ticket.vehicle_reg_no}</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.ticketFooter}>
                            <View style={styles.ticketFooterLeft}>
                              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                                <StatusIcon status={ticket.status as any} size="sm" />
                                <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                                  {(ticket.status || 'Unknown').replace('_', ' ')}
                                </Text>
                              </View>
                              <Text style={styles.ticketDate}>
                                {new Date(ticket.created_at || Date.now()).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <IconSymbol name="checkmark.circle" size={48} color={Colors.success[500]} />
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
    backgroundColor: BrandColors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['2xl'],
  },
  section: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: BrandColors.ink,
  },
  viewAllText: {
    fontSize: Typography.fontSize.sm,
    color: BrandColors.primary,
    fontWeight: Typography.fontWeight.medium as any,
  },
  technicianCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  technicianHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  technicianAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BrandColors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  technicianInitials: {
    color: BrandColors.primary,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
  },
  technicianInfo: {
    flex: 1,
  },
  technicianName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold as any,
    color: BrandColors.ink,
    marginBottom: 4,
  },
  technicianEmail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: BrandColors.surface,
    flex: 1,
    maxWidth: '100%',
  },
  statItemActive: {
    backgroundColor: Colors.success[50],
    borderWidth: 1,
    borderColor: Colors.success[200],
  },
  statIcon: {
    marginRight: Spacing.sm,
  },
  statContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold as any,
    color: BrandColors.ink,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[500],
    fontWeight: Typography.fontWeight.medium as any,
    marginBottom: 2,
  },
  performanceSection: {
    marginBottom: Spacing.md,
  },
  performanceSectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.md,
  },
  performanceItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  performanceValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: BrandColors.ink,
    marginTop: 4,
  },
  performanceLabel: {
    fontSize: 10,
    color: Colors.neutral[500],
    marginTop: 2,
    textAlign: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  warningText: {
    color: Colors.warning[800],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as any,
  },
  ticketsList: {
    gap: Spacing.md,
  },
  ticketCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ticketNumber: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: BrandColors.ink,
  },
  ticketBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  overdueBadge: {
    backgroundColor: Colors.error[50],
  },
  dueTodayBadge: {
    backgroundColor: Colors.warning[50],
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.semibold as any,
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
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  ticketMeta: {
    gap: 6,
    marginBottom: Spacing.sm,
  },
  // Enhanced customer styles
  customerRow: {
    marginBottom: Spacing.xs,
  },
  customerInfo: {
    backgroundColor: BrandColors.primary + '05',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.primary,
  },
  customerLabel: {
    fontSize: 10,
    color: BrandColors.primary,
    fontWeight: Typography.fontWeight.semibold as any,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  customerName: {
    fontSize: Typography.fontSize.sm,
    color: BrandColors.ink,
    fontWeight: Typography.fontWeight.bold as any,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketMetaLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[500],
    flex: 1,
  },
  ticketMetaValue: {
    fontSize: Typography.fontSize.xs,
    color: BrandColors.ink,
    fontWeight: Typography.fontWeight.medium as any,
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
    gap: Spacing.sm,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.semibold as any,
    textTransform: 'capitalize',
  },
  ticketDate: {
    fontSize: 10,
    color: Colors.neutral[400],
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: BrandColors.ink,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  loadingContainer: {
    padding: Spacing.lg,
  },
  loadingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  loadingAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.neutral[200],
    marginBottom: Spacing.md,
  },
  loadingTextLarge: {
    width: 120,
    height: 20,
    backgroundColor: Colors.neutral[200],
    borderRadius: 4,
    marginBottom: 8,
  },
  loadingTextSmall: {
    width: 80,
    height: 16,
    backgroundColor: Colors.neutral[200],
    borderRadius: 4,
  },
  loadingStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  loadingStatItem: {
    alignItems: 'center',
  },
  loadingStatValue: {
    width: 40,
    height: 24,
    backgroundColor: Colors.neutral[200],
    borderRadius: 4,
    marginBottom: 8,
  },
  loadingStatLabel: {
    width: 60,
    height: 12,
    backgroundColor: Colors.neutral[200],
    borderRadius: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: BrandColors.surface,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.error[500],
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.semibold as any,
  },
  errorSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold as any,
  },
});
