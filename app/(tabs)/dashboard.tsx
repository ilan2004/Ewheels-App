import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { dataService } from '@/services/dataService';
import { DashboardKPIs, ServiceTicket, TechnicianWorkload } from '@/types';
import { LocationSelector } from '@/components/location-selector';
import { getFeatureAccess, isFloorManager } from '@/lib/permissions';
import { Colors, Typography, Spacing, BorderRadius, ComponentStyles, Shadows, StatusColors } from '@/constants/design-system';
import { EmptyJobCards, StatusIcon } from '@/components/empty-states';
import { HeroImageCard } from '@/components/image-card';
import FloorManagerDashboard from './floor-manager-dashboard';

interface KPICardProps {
  title: string;
  value: number;
  color: string;
  backgroundColor: string;
  icon: string;
  onPress?: () => void;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  color,
  backgroundColor,
  icon,
  onPress,
  trend,
}) => (
  <TouchableOpacity
    style={[styles.kpiCard, { borderLeftColor: color, backgroundColor }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.kpiContent}>
      <View style={styles.kpiHeader}>
        <IconSymbol name={icon} size={24} color={color} />
        <Text style={styles.kpiTitle}>{title}</Text>
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      {trend && (
        <Text
          style={[
            styles.kpiTrend,
            { color: trend.isPositive ? '#10B981' : '#EF4444' },
          ]}
        >
          {trend.value}
        </Text>
      )}
    </View>
  </TouchableOpacity>
);

interface RecentTicketItemProps {
  ticket: ServiceTicket;
  onPress: () => void;
}

const RecentTicketItem: React.FC<RecentTicketItemProps> = ({ ticket, onPress }) => {
  const isOverdue = ticket.due_date && new Date(ticket.due_date) < new Date();
  const isDueToday = ticket.due_date && 
    new Date(ticket.due_date).toDateString() === new Date().toDateString();

  return (
    <TouchableOpacity style={styles.ticketCard} onPress={onPress}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketTitleRow}>
          <StatusIcon status={ticket.status as any} size="sm" />
          <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
        </View>
        <View style={styles.ticketBadges}>
          {isOverdue && (
            <View style={[styles.badge, styles.overdueBadge]}>
              <Text style={styles.badgeText}>Overdue</Text>
            </View>
          )}
          {isDueToday && !isOverdue && (
            <View style={[styles.badge, styles.dueTodayBadge]}>
              <Text style={styles.badgeText}>Due Today</Text>
            </View>
          )}
          <View style={[styles.badge, styles.statusBadge]}>
            <Text style={styles.badgeText}>{ticket.status.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.ticketSymptom} numberOfLines={2}>
        {ticket.customer_complaint}
      </Text>
      <View style={styles.ticketMeta}>
        <Text style={styles.ticketMetaText}>
          Customer: {ticket.customer?.name || 'N/A'}
        </Text>
        {ticket.vehicleRegNo && (
          <Text style={styles.ticketMetaText}>
            Vehicle: {ticket.vehicleRegNo}
          </Text>
        )}
        <Text style={styles.ticketMetaText}>
          Created: {new Date(ticket.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { activeLocation } = useLocationStore();
  
  const featureAccess = user ? getFeatureAccess(user.role) : null;
  
  // Show Floor Manager specific dashboard
  if (user && isFloorManager(user.role)) {
    return <FloorManagerDashboard />;
  }

  // Fetch dashboard KPIs
  const {
    data: kpis,
    isLoading: kpisLoading,
    error: kpisError,
    refetch: refetchKpis,
  } = useQuery<DashboardKPIs>({
    queryKey: ['dashboard-kpis', user?.role, activeLocation?.id],
    queryFn: () => dataService.getDashboardKPIs(user!.role, activeLocation?.id),
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent tickets
  const {
    data: recentTickets,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useQuery<ServiceTicket[]>({
    queryKey: ['recent-tickets', user?.role, user?.id, activeLocation?.id],
    queryFn: () => dataService.getRecentTickets(user!.role, user!.id, activeLocation?.id, 5),
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch team workload
  const {
    data: teamWorkload,
    isLoading: workloadLoading,
    refetch: refetchWorkload,
  } = useQuery<TechnicianWorkload[]>({
    queryKey: ['team-workload', user?.role, activeLocation?.id],
    queryFn: () => dataService.getTeamWorkload(user!.role, activeLocation?.id),
    enabled: !!user && featureAccess?.canViewAnalytics,
    refetchInterval: 30000,
  });

  const refreshing = kpisLoading || ticketsLoading || workloadLoading;

  const handleRefresh = async () => {
    await Promise.all([
      refetchKpis(),
      refetchTickets(),
      refetchWorkload(),
    ]);
  };

  const handleKPIPress = (type: string) => {
    switch (type) {
      case 'overdue':
        router.push('/(tabs)/jobcards?filter=overdue');
        break;
      case 'dueToday':
        router.push('/(tabs)/jobcards?filter=today');
        break;
      case 'unassigned':
        router.push('/(tabs)/jobcards?filter=unassigned');
        break;
      case 'inProgress':
        router.push('/(tabs)/jobcards?filter=in_progress');
        break;
      case 'weeklyCompleted':
        router.push('/(tabs)/jobcards?filter=completed');
        break;
      case 'openTickets':
        router.push('/(tabs)/jobcards');
        break;
      default:
        router.push('/(tabs)/jobcards');
    }
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
    : 'Manager';

  if (kpisError) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load dashboard</Text>
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
        {/* Header with Hero Image */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
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
            <View style={styles.headerActions}>
              <LocationSelector compact style={styles.locationSelector} />
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push('/notifications')}
              >
                <IconSymbol name="bell" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.heroImageContainer}>
            <HeroImageCard
              source={require('@/assets/images/custom/main-dashboard-hero.png')}
              style={styles.heroImage}
              borderRadius="lg"
            />
          </View>
        </View>

        {/* KPI Cards */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Today's Overview
          </ThemedText>
          <View style={styles.kpiGrid}>
            <KPICard
              title="Overdue"
              value={kpis?.overdue || 0}
              color="#EF4444"
              backgroundColor="#FEF2F2"
              icon="exclamationmark.triangle"
              onPress={() => handleKPIPress('overdue')}
              trend={{ value: '↑ 2 from yesterday', isPositive: false }}
            />
            <KPICard
              title="Due Today"
              value={kpis?.dueToday || 0}
              color="#F59E0B"
              backgroundColor="#FFFBEB"
              icon="clock"
              onPress={() => handleKPIPress('dueToday')}
            />
            <KPICard
              title="In Progress"
              value={kpis?.inProgressBatteries || 0}
              color="#8B5CF6"
              backgroundColor="#F5F3FF"
              icon="gearshape"
              onPress={() => handleKPIPress('inProgress')}
              trend={{ value: '↑ 15%', isPositive: true }}
            />
            <KPICard
              title="Unassigned"
              value={kpis?.unassigned || 0}
              color="#6B7280"
              backgroundColor="#F9FAFB"
              icon="person.badge.plus"
              onPress={() => handleKPIPress('unassigned')}
            />
          </View>
        </View>

        {/* Weekly Performance */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Weekly Performance
          </ThemedText>
          <View style={styles.performanceCard}>
            <View style={styles.performanceRow}>
              <TouchableOpacity 
                style={styles.performanceStat}
                onPress={() => handleKPIPress('weeklyCompleted')}
              >
                <Text style={styles.performanceValue}>
                  {kpis?.weeklyCompleted || 0}
                </Text>
                <Text style={styles.performanceLabel}>Completed</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.performanceStat}
                onPress={() => handleKPIPress('openTickets')}
              >
                <Text style={styles.performanceValue}>
                  {kpis?.openTickets || 0}
                </Text>
                <Text style={styles.performanceLabel}>Total Open</Text>
              </TouchableOpacity>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>
                  {kpis?.avgTatDays || 0}d
                </Text>
                <Text style={styles.performanceLabel}>Avg TAT</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Recent Job Cards
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/jobcards')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ticketsList}>
            {recentTickets?.map((ticket) => (
              <RecentTicketItem
                key={ticket.id}
                ticket={ticket}
                onPress={() => handleTicketPress(ticket.id)}
              />
            ))}
            {!ticketsLoading && !recentTickets?.length && (
              <View style={styles.emptyStateContainer}>
                <EmptyJobCards />
              </View>
            )}
          </View>
        </View>

        {/* Team Capacity */}
        {featureAccess?.canViewAnalytics && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Team Capacity
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/team')}>
                <Text style={styles.viewAllText}>View Team</Text>
              </TouchableOpacity>
            </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.teamRow}>
              {teamWorkload?.map((technician) => (
                <View
                  key={technician.assignee || 'unassigned'}
                  style={styles.teamCard}
                >
                  <Text style={styles.teamName}>
                    {technician.name || technician.assignee || 'Unassigned'}
                  </Text>
                  <Text style={styles.teamWorkload}>
                    {technician.count}/{technician.capacity}
                  </Text>
                  <View style={styles.capacityBar}>
                    <View
                      style={[
                        styles.capacityFill,
                        {
                          width: `${Math.min((technician.count / technician.capacity) * 100, 100)}%`,
                          backgroundColor:
                            technician.count >= technician.capacity
                              ? '#EF4444'
                              : technician.count / technician.capacity > 0.8
                              ? '#F59E0B'
                              : '#10B981',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {featureAccess?.canCreateTickets && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/jobcards/new')}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: Colors.white,
    ...ComponentStyles.header,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  heroImageContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    maxWidth: 300,
  },
  greeting: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    marginTop: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  locationSelector: {
    // Additional styling can be added here if needed
  },
  notificationButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.base,
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
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[900],
    marginBottom: Spacing.base,
  },
  viewAllText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[600],
  },
  kpiGrid: {
    gap: Spacing.md,
  },
  kpiCard: {
    ...ComponentStyles.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderLeftWidth: 4,
    ...Shadows.base,
  },
  kpiContent: {
    gap: Spacing.sm,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  kpiTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  kpiValue: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
  },
  kpiTrend: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  performanceCard: {
    ...ComponentStyles.card,
    padding: Spacing.lg,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceStat: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  performanceLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    marginTop: Spacing.xs,
  },
  ticketsList: {
    gap: Spacing.md,
  },
  ticketCard: {
    ...ComponentStyles.card,
    padding: Spacing.base,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ticketNumber: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[900],
  },
  ticketBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
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
  statusBadge: {
    backgroundColor: Colors.neutral[200],
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    textTransform: 'capitalize',
  },
  ticketSymptom: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.sm,
  },
  ticketMeta: {
    gap: Spacing.xs,
  },
  ticketMetaText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
  },
  emptyStateContainer: {
    minHeight: 200,
    justifyContent: 'center',
  },
  teamRow: {
    flexDirection: 'row',
    gap: 12,
  },
  teamCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  teamWorkload: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  capacityBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  capacityFill: {
    height: '100%',
    borderRadius: 2,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
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
});
