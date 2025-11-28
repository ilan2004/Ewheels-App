import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandColors, Colors, Shadows } from '@/constants/design-system';
import { jobCardsService } from '@/services/jobCardsService';
import { useAuthStore } from '@/stores/authStore';
import { ServiceTicket } from '@/types';

interface MetricCardProps {
  title: string;
  value: number;
  icon: string;
  type: 'assigned' | 'in_progress' | 'due_today' | 'completed';
  onPress?: () => void;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  type,
  onPress,
  subtitle,
}) => {
  // Map types to colors
  const getColor = () => {
    switch (type) {
      case 'assigned': return Colors.neutral[500];
      case 'in_progress': return '#499588';
      case 'due_today': return BrandColors.primary;
      case 'completed': return BrandColors.title;
      default: return Colors.neutral[500];
    }
  };

  const color = getColor();

  return (
    <TouchableOpacity
      style={styles.metricCardContainer}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.metricCard}>
        <View style={styles.metricContent}>
          <View style={styles.metricHeader}>
            <IconSymbol name={icon as any} size={24} color={color} />
            <Text style={styles.metricTitle}>{title}</Text>
          </View>
          <Text style={[styles.metricValue, { color }]}>{value}</Text>
          {subtitle && (
            <Text style={styles.metricSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface TaskItemProps {
  ticket: ServiceTicket;
  onPress: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ ticket, onPress }) => {
  const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date();
  const isDueToday = ticket.dueDate &&
    new Date(ticket.dueDate).toDateString() === new Date().toDateString();

  const getStatusColor = () => {
    switch (ticket.status) {
      case 'assigned': return '#3B82F6';
      case 'in_progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = () => {
    switch (ticket.status) {
      case 'assigned': return 'doc.text';
      case 'in_progress': return 'gearshape';
      case 'completed': return 'checkmark.circle';
      default: return 'doc.text';
    }
  };

  return (
    <TouchableOpacity style={styles.taskItem} onPress={onPress}>
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleRow}>
          <IconSymbol
            name={getStatusIcon()}
            size={20}
            color={getStatusColor()}
          />
          <Text style={styles.taskNumber}>{ticket.ticketNumber}</Text>
        </View>
        <View style={styles.taskBadges}>
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
          {ticket.priority === 1 && (
            <View style={[styles.badge, styles.highPriorityBadge]}>
              <Text style={[styles.badgeText, { color: '#DC2626' }]}>High Priority</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.taskSymptom} numberOfLines={2}>
        {ticket.symptom}
      </Text>

      <View style={styles.taskMeta}>
        <View style={styles.taskMetaRow}>
          <IconSymbol name="person" size={14} color="#6B7280" />
          <Text style={styles.taskMetaText}>
            {ticket.customer?.name || 'N/A'}
          </Text>
        </View>
        {ticket.vehicleRegNo && (
          <View style={styles.taskMetaRow}>
            <IconSymbol name="car" size={14} color="#6B7280" />
            <Text style={styles.taskMetaText}>{ticket.vehicleRegNo}</Text>
          </View>
        )}
        {ticket.dueDate && (
          <View style={styles.taskMetaRow}>
            <IconSymbol name="clock" size={14} color="#6B7280" />
            <Text style={styles.taskMetaText}>
              Due: {new Date(ticket.dueDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.taskFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <Text style={[styles.statusBadgeText, { color: getStatusColor() }]}>
            {ticket.status.replace('_', ' ')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            // Handle quick action based on status
            if (ticket.status === 'assigned') {
              // Start work
              console.log('Start work on', ticket.id);
            } else if (ticket.status === 'in_progress') {
              // Update status
              console.log('Update status for', ticket.id);
            }
          }}
        >
          <Text style={styles.actionButtonText}>
            {ticket.status === 'assigned' ? 'Start' :
              ticket.status === 'in_progress' ? 'Update' : 'View'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function TechnicianScreen() {
  const { user } = useAuthStore();

  // Fetch technician's assigned tickets
  const {
    data: assignedTickets,
    isLoading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useQuery<ServiceTicket[]>({
    queryKey: ['technician-tickets', user?.id],
    queryFn: () => jobCardsService.getTickets(
      { assignedTo: user?.id || '', status: 'all' },
      1,
      50
    ).then(response => response.data),
    refetchInterval: 30000,
    enabled: !!user?.id,
  });

  const refreshing = ticketsLoading;

  const handleRefresh = async () => {
    await refetchTickets();
  };

  const handleTicketPress = (ticketId: string) => {
    router.push(`/jobcards/${ticketId}`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Technician';

  // Calculate metrics from assigned tickets
  const metrics = React.useMemo(() => {
    if (!assignedTickets) return { assigned: 0, inProgress: 0, completed: 0, dueToday: 0 };

    const today = new Date().toDateString();
    return {
      assigned: assignedTickets.filter(t => t.status === 'assigned').length,
      inProgress: assignedTickets.filter(t => t.status === 'in_progress').length,
      completed: assignedTickets.filter(t => t.status === 'completed').length,
      dueToday: assignedTickets.filter(t =>
        t.dueDate && new Date(t.dueDate).toDateString() === today
      ).length,
    };
  }, [assignedTickets]);

  // Organize tickets by status
  const ticketsByStatus = React.useMemo(() => {
    if (!assignedTickets) return { assigned: [], inProgress: [], completed: [] };

    return {
      assigned: assignedTickets.filter(t => t.status === 'assigned'),
      inProgress: assignedTickets.filter(t => t.status === 'in_progress'),
      completed: assignedTickets.filter(t => t.status === 'completed').slice(0, 5), // Show recent completed
    };
  }, [assignedTickets]);

  if (ticketsError) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load your tasks</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={styles.greeting}>
              {getGreeting()}, {userName}!
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <IconSymbol name="bell" size={24} color={BrandColors.ink} />
            {/* Badge for unread notifications could go here */}
          </TouchableOpacity>
        </View>

        {/* Metrics */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            My Work Summary
          </ThemedText>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Assigned"
              value={metrics.assigned}
              type="assigned"
              icon="doc.text"
              subtitle="New tasks"
            />
            <MetricCard
              title="In Progress"
              value={metrics.inProgress}
              type="in_progress"
              icon="gearshape"
              subtitle="Active work"
            />
            <MetricCard
              title="Due Today"
              value={metrics.dueToday}
              type="due_today"
              icon="clock"
              subtitle="Urgent tasks"
            />
            <MetricCard
              title="Completed"
              value={metrics.completed}
              type="completed"
              icon="checkmark.circle"
              subtitle="This week"
            />
          </View>
        </View>

        {/* Assigned Tasks */}
        {ticketsByStatus.assigned.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              New Assignments ({ticketsByStatus.assigned.length})
            </ThemedText>
            <View style={styles.tasksList}>
              {ticketsByStatus.assigned.map((ticket) => (
                <TaskItem
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() => handleTicketPress(ticket.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* In Progress Tasks */}
        {ticketsByStatus.inProgress.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              In Progress ({ticketsByStatus.inProgress.length})
            </ThemedText>
            <View style={styles.tasksList}>
              {ticketsByStatus.inProgress.map((ticket) => (
                <TaskItem
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() => handleTicketPress(ticket.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Recent Completed */}
        {ticketsByStatus.completed.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Recently Completed
            </ThemedText>
            <View style={styles.tasksList}>
              {ticketsByStatus.completed.map((ticket) => (
                <TaskItem
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() => handleTicketPress(ticket.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!ticketsLoading && assignedTickets && assignedTickets.length === 0 && (
          <View style={styles.emptyContainer}>
            <IconSymbol name="checkmark.circle" size={48} color="#10B981" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
              No tasks assigned to you right now.
            </Text>
          </View>
        )}
      </ScrollView>
    </ThemedView>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 0,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandColors.ink,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.ink,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCardContainer: {
    width: '48%',
    ...Shadows.sm,
  },
  metricCard: {
    backgroundColor: '#FFFFFF', // White
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
  },
  metricContent: {
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandColors.ink,
  },
  metricSubtitle: {
    fontSize: 12,
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    backgroundColor: '#FFFFFF', // White
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  taskNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  overdueBadge: {
    backgroundColor: '#FEE2E2',
  },
  dueTodayBadge: {
    backgroundColor: '#FEF3C7',
  },
  highPriorityBadge: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  taskSymptom: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskMeta: {
    gap: 6,
    marginBottom: 12,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: BrandColors.surface,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: BrandColors.primary,
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
    minHeight: 200,
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
});
