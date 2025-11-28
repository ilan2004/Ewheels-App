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
import {
  AssignmentOverviewColors,
  BorderRadius,
  BrandColors,
  Shadows,
  Spacing,
  Typography
} from '@/constants/design-system';
import { floorManagerService } from '@/services/floorManagerService';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';

interface QuickStatProps {
  title: string;
  value: number | string;
  color: string;
  backgroundColor?: string;
  gradientColors?: string[] | readonly string[];
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
        <IconSymbol name={icon as any} size={20} color={color} />
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
          colors={gradientColors as any}
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

export default function FrontDeskDashboard() {
  const { user } = useAuthStore();
  const { activeLocation } = useLocationStore();

  // Fetch dashboard stats - reusing floor manager service for now as it has similar stats
  // In a real app, we might want a dedicated frontDeskService
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['front-desk-stats', user?.id, activeLocation?.id],
    queryFn: () => floorManagerService.getDashboardStats(user!.id, activeLocation?.id),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const handleRefresh = async () => {
    await refetchStats();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Front Desk Manager';

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
          <RefreshControl refreshing={statsLoading} onRefresh={handleRefresh} />
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
                Front Desk Dashboard
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
                <Text style={styles.quickStatValue}>{stats?.dueToday || 0}</Text>
                <Text style={styles.quickStatLabel}>Due Today</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats / KPI Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Overview
          </Text>
          <View style={styles.statsGrid}>
            <QuickStat
              title="Unassigned"
              value={stats?.unassignedTickets || 0}
              color={AssignmentOverviewColors.unassigned.text}
              gradientColors={[...AssignmentOverviewColors.unassigned.gradient]}
              icon="exclamationmark.triangle"
              onPress={() => router.push('/jobcards?filter=unassigned')}
            />
            <QuickStat
              title="In Progress"
              value={stats?.inProgressTickets || 0}
              color={AssignmentOverviewColors.in_progress.text}
              gradientColors={[...AssignmentOverviewColors.in_progress.gradient]}
              icon="gearshape.2"
              onPress={() => router.push('/jobcards?filter=in_progress')}
            />
            <QuickStat
              title="Due Today"
              value={stats?.dueToday || 0}
              color={AssignmentOverviewColors.due_today.text}
              gradientColors={[...AssignmentOverviewColors.due_today.gradient]}
              icon="clock"
              onPress={() => router.push('/jobcards?filter=today')}
            />
            <QuickStat
              title="Overdue"
              value={stats?.overdue || 0}
              color={AssignmentOverviewColors.overdue.text}
              gradientColors={[...AssignmentOverviewColors.overdue.gradient]}
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
            {/* Create Job Card Button */}
            <TouchableOpacity
              style={[styles.actionCard, styles.primaryActionCard]}
              onPress={() => router.push('/jobcards')} // Navigating to jobcards list as create might be there or modal
            >
              <IconSymbol name="doc.text.fill.viewfinder" size={28} color={BrandColors.primary} />
              <Text style={styles.actionTitle}>Create Job Card</Text>
              <Text style={styles.actionSubtitle}>New service ticket</Text>
            </TouchableOpacity>

            {/* Create Invoice Button */}
            <TouchableOpacity
              style={[styles.actionCard, styles.greenActionCard]}
              onPress={() => router.push('/invoices/create')}
            >
              <IconSymbol name="doc.text" size={28} color={BrandColors.title} />
              <Text style={styles.actionTitle}>Create Invoice</Text>
              <Text style={styles.actionSubtitle}>Bill a customer</Text>
            </TouchableOpacity>

            {/* Check This Month Report Button */}
            <TouchableOpacity
              style={[styles.actionCard, styles.blueActionCard]}
              onPress={() => router.push('/financial')} // Assuming reports are in financial or similar
            >
              <IconSymbol name="chart.bar.fill" size={28} color="#0284C7" />
              <Text style={styles.actionTitle}>Check Reports</Text>
              <Text style={styles.actionSubtitle}>This month's stats</Text>
            </TouchableOpacity>
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
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginBottom: Spacing.base,
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
    minWidth: '47%', // Slightly reduced to ensure consistent wrapping on Android
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.base, // Increased shadow for better visibility on Android
  },
  primaryActionCard: {
    borderColor: BrandColors.primary + '20',
    backgroundColor: BrandColors.primary + '05',
  },
  greenActionCard: {
    borderColor: BrandColors.title + '20',
    backgroundColor: BrandColors.title + '05',
  },
  blueActionCard: {
    borderColor: '#0284C7' + '20',
    backgroundColor: '#0284C7' + '05',
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
