import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AssignmentOverviewColors, BorderRadius, BrandColors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { floorManagerService } from '@/services/floorManagerService';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';

interface QuickStatProps {
  title: string;
  value: number | string;
  color: string;
  backgroundColor?: string;
  gradientColors?: string[];
  icon: string;
  onPress?: () => void;
}

const QuickStat: React.FC<QuickStatProps> = ({
  title,
  value,
  color,
  backgroundColor,
  gradientColors,
  icon,
  onPress,
}) => {
  const cardContent = (
    <View style={styles.statContent}>
      <View style={styles.statHeader}>
        <IconSymbol name={icon} size={20} color={color} />
        <Text style={[styles.statTitle, { color }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  if (gradientColors) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.statCard}
        >
          {cardContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor }]}
      onPress={onPress}
      disabled={!onPress}
    >
      {cardContent}
    </TouchableOpacity>
  );
};

interface TechnicianCardProps {
  technician: {
    id: string;
    name: string;
    email: string;
    activeTickets: number;
    capacity: number;
    oldestTicketDays?: number;
  };
  onPress: () => void;
}

const TechnicianCard: React.FC<TechnicianCardProps> = ({ technician, onPress }) => {
  const utilizationPercent = (technician.activeTickets / technician.capacity) * 100;
  const utilizationColor =
    utilizationPercent >= 100 ? '#EF4444' :
      utilizationPercent >= 75 ? BrandColors.primary :
        BrandColors.title;

  return (
    <TouchableOpacity style={styles.technicianCard} onPress={onPress}>
      <View style={styles.technicianHeader}>
        <View style={styles.technicianInfo}>
          <Text style={styles.technicianName}>{technician.name}</Text>
          <Text style={styles.technicianEmail}>{technician.email}</Text>
        </View>
        <View style={styles.workloadBadge}>
          <Text style={styles.workloadText}>
            {technician.activeTickets}/{technician.capacity}
          </Text>
        </View>
      </View>
      <View style={styles.technicianDetails}>
        {technician.oldestTicketDays && technician.oldestTicketDays > 0 && (
          <Text style={styles.oldestTicket}>
            Oldest job: {technician.oldestTicketDays} days ago
          </Text>
        )}
        <View style={styles.utilizationSection}>
          <Text style={styles.utilizationLabel}>Capacity</Text>
          <View style={styles.utilizationIndicator}>
            <View
              style={[
                styles.utilizationBar,
                {
                  width: `${Math.min(utilizationPercent, 100)}%`,
                  backgroundColor: utilizationColor,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function FloorManagerDashboard() {
  const { user } = useAuthStore();
  const { activeLocation } = useLocationStore();

  // Fetch dashboard stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['floor-manager-stats', user?.id, activeLocation?.id],
    queryFn: () => floorManagerService.getDashboardStats(user!.id, activeLocation?.id),
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch technician overview
  const {
    data: technicians,
    isLoading: techniciansLoading,
    refetch: refetchTechnicians,
  } = useQuery({
    queryKey: ['technicians-overview', activeLocation?.id],
    queryFn: () => floorManagerService.getTechnicianOverview(activeLocation?.id),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const refreshing = statsLoading || techniciansLoading;

  const handleRefresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchTechnicians(),
    ]);
  };

  const handleTechnicianPress = (technicianId: string) => {
    router.push(`/technician-details/${technicianId}`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Floor Manager';

  if (statsError) {
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
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>
                {getGreeting()}, {userName}!
              </Text>
              <Text style={styles.subtitle}>
                Floor Manager Dashboard
              </Text>
              {activeLocation && (
                <View style={styles.locationRow}>
                  <IconSymbol name="location" size={14} color={BrandColors.title} />
                  <Text style={styles.location}>
                    {activeLocation.name}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerStats}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{stats?.inProgressTickets || 0}</Text>
                <Text style={styles.quickStatLabel}>Active</Text>
              </View>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{technicians?.length || 0}</Text>
                <Text style={styles.quickStatLabel}>Technicians</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Assignment Overview
          </Text>
          <View style={styles.statsGrid}>
            <QuickStat
              title="Unassigned"
              value={stats?.unassignedTickets || 0}
              color={AssignmentOverviewColors.unassigned.text}
              gradientColors={AssignmentOverviewColors.unassigned.gradient}
              icon="exclamationmark.triangle"
              onPress={() => router.push('/jobcards?filter=unassigned')}
            />
            <QuickStat
              title="In Progress"
              value={stats?.inProgressTickets || 0}
              color={AssignmentOverviewColors.in_progress.text}
              gradientColors={AssignmentOverviewColors.in_progress.gradient}
              icon="gearshape.2"
              onPress={() => router.push('/jobcards?filter=in_progress')}
            />
            <QuickStat
              title="Due Today"
              value={stats?.dueToday || 0}
              color={AssignmentOverviewColors.due_today.text}
              gradientColors={AssignmentOverviewColors.due_today.gradient}
              icon="clock"
              onPress={() => router.push('/jobcards?filter=today')}
            />
            <QuickStat
              title="Overdue"
              value={stats?.overdue || 0}
              color={AssignmentOverviewColors.overdue.text}
              gradientColors={AssignmentOverviewColors.overdue.gradient}
              icon="clock.badge.exclamationmark"
              onPress={() => router.push('/jobcards?filter=overdue')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.primaryActionCard]}
              onPress={() => router.push('/jobcards')}
            >
              <View style={[styles.iconContainer, styles.primaryIconContainer]}>
                <IconSymbol name="doc.text.magnifyingglass" size={28} color={BrandColors.primary} />
              </View>
              <Text style={styles.actionTitle}>View Job Cards</Text>
              <Text style={styles.actionSubtitle}>Assign & manage tickets</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.greenActionCard]}
              onPress={() => router.push('/create-technician')}
            >
              <View style={[styles.iconContainer, styles.greenIconContainer]}>
                <IconSymbol name="person.badge.plus" size={28} color={BrandColors.title} />
              </View>
              <Text style={styles.actionTitle}>Add Technician</Text>
              <Text style={styles.actionSubtitle}>Create new team member</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Technician Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Team Overview
            </Text>
            <TouchableOpacity onPress={() => router.push('/team')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.techniciansContainer}>
            {technicians?.slice(0, 4).map((technician) => (
              <TechnicianCard
                key={technician.id}
                technician={technician}
                onPress={() => handleTechnicianPress(technician.id)}
              />
            ))}

            {!techniciansLoading && !technicians?.length && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No technicians found</Text>
              </View>
            )}
          </View>
        </View>
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
    paddingBottom: Spacing['2xl'],
  },
  // Header Card (similar to invoice cards)
  headerCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    margin: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.base,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  location: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.title,
  },
  headerStats: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  quickStatLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '60',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginBottom: Spacing.base,
  },
  viewAllText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.primary,
  },
  statsGrid: {
    gap: Spacing.md,
  },
  statCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    padding: Spacing.base,
    ...Shadows.sm,
  },
  statContent: {
    gap: Spacing.sm,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '80',
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%', // Slightly reduced to ensure 2 columns fit well
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    padding: Spacing.lg,
    alignItems: 'center',
    // Removed shadow for flat design on Android
  },
  primaryActionCard: {
    borderColor: BrandColors.primary + '30', // Stronger border
    backgroundColor: BrandColors.surface,
  },
  greenActionCard: {
    borderColor: BrandColors.title + '30', // Stronger border
    backgroundColor: BrandColors.surface,
  },
  // New Icon Container Styles
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  primaryIconContainer: {
    backgroundColor: BrandColors.primary + '10',
  },
  greenIconContainer: {
    backgroundColor: BrandColors.title + '10',
  },
  actionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  techniciansContainer: {
    gap: Spacing.md,
  },
  technicianCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    padding: Spacing.base,
    ...Shadows.sm,
  },
  technicianHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  technicianInfo: {
    flex: 1,
  },
  technicianName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginBottom: 2,
  },
  technicianEmail: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
  },
  workloadBadge: {
    backgroundColor: BrandColors.primary + '10',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  workloadText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
  },
  technicianDetails: {
    gap: Spacing.xs,
  },
  oldestTicket: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: '#DC2626',
  },
  utilizationSection: {
    gap: Spacing.xs,
  },
  utilizationLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '80',
  },
  utilizationIndicator: {
    height: 4,
    backgroundColor: BrandColors.ink + '20',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  utilizationBar: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  emptyCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    padding: Spacing['2xl'],
    alignItems: 'center',
    ...Shadows.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
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
    color: '#EF4444',
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  retryText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.surface,
  },
});
