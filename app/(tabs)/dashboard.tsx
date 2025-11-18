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
import { DashboardKPIs, ServiceTicket } from '@/types';
import { LocationSelector } from '@/components/location-selector';
import { getFeatureAccess, isFloorManager } from '@/lib/permissions';
import { Colors, Typography, Spacing, BorderRadius, ComponentStyles, Shadows, StatusColors, BrandColors, FinancialColors, AdminPanelOverviewColors } from '@/constants/design-system';
import { LinearGradient } from 'expo-linear-gradient';
import { EmptyJobCards, StatusIcon } from '@/components/empty-states';
import FloorManagerDashboard from './floor-manager-dashboard';
import { useFinancialKPIs } from '@/hooks/useFinancial';

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

interface AdminOverviewCardProps {
  title: string;
  value: number | string;
  color: string;
  gradientColors: string[];
  icon: string;
  onPress?: () => void;
  subtitle?: string;
}

const AdminOverviewCard: React.FC<AdminOverviewCardProps> = ({
  title,
  value,
  color,
  gradientColors,
  icon,
  onPress,
  subtitle,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
  >
    <LinearGradient
      colors={gradientColors}
      style={styles.adminOverviewCard}
    >
      <View style={styles.adminCardContent}>
        <View style={styles.adminCardHeader}>
          <IconSymbol name={icon} size={20} color={color} />
          <Text style={[styles.adminCardTitle, { color }]}>{title}</Text>
        </View>
        <Text style={[styles.adminCardValue, { color }]}>{value}</Text>
        {subtitle && (
          <Text style={[styles.adminCardSubtitle, { color }]}>{subtitle}</Text>
        )}
      </View>
    </LinearGradient>
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

  // Fetch essential dashboard KPIs (overdue job cards)
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

  // Fetch today's financial data (sales and expenses)
  const {
    kpis: financialKpis,
    loading: financialLoading,
    error: financialError,
    refreshKPIs: refreshFinancialKpis,
  } = useFinancialKPIs();

  const refreshing = kpisLoading || financialLoading;

  const handleRefresh = async () => {
    await Promise.all([
      refetchKpis(),
      refreshFinancialKpis(),
    ]);
  };

  const handleKPIPress = (type: string) => {
    switch (type) {
      case 'overdue':
        router.push('/(tabs)/jobcards?filter=overdue');
        break;
      case 'sales':
        router.push('/(tabs)/financial?tab=sales');
        break;
      case 'expenses':
        router.push('/(tabs)/financial?tab=expenses');
        break;
      default:
        router.push('/(tabs)/jobcards');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.role === 'admin' ? 'Administrator' : 'Manager';

  if (kpisError || financialError) {
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
              {user?.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <IconSymbol name="crown.fill" size={14} color={BrandColors.primary} />
                  <Text style={styles.adminBadgeText}>System Administrator</Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              <LocationSelector compact style={styles.locationSelector} />
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push('/notifications')}
              >
                <IconSymbol name="bell" size={24} color={BrandColors.ink + '80'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Admin Overview or Essential Metrics */}
        {user?.role === 'admin' ? (
          // Assignment Overview for Admins
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Assignment Overview
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/(tabs)/jobcards')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.adminOverviewGrid}>
              <AdminOverviewCard
                title="Unassigned"
                value={kpis?.unassigned || 0}
                color={AdminPanelOverviewColors.unassigned.text}
                gradientColors={AdminPanelOverviewColors.unassigned.gradient}
                icon="exclamationmark.triangle"
                onPress={() => router.push('/(tabs)/jobcards?filter=unassigned')}
              />
              <AdminOverviewCard
                title="Today's Sales"
                value={`₹${financialKpis?.today?.sales || 0}`}
                color={AdminPanelOverviewColors.in_progress.text}
                gradientColors={AdminPanelOverviewColors.in_progress.gradient}
                icon="arrow.up.circle.fill"
                onPress={() => handleKPIPress('sales')}
              />
              <AdminOverviewCard
                title="Today's Expenses"
                value={`₹${financialKpis?.today?.expenses || 0}`}
                color={AdminPanelOverviewColors.due_today.text}
                gradientColors={AdminPanelOverviewColors.due_today.gradient}
                icon="arrow.down.circle.fill"
                onPress={() => handleKPIPress('expenses')}
              />
              <AdminOverviewCard
                title="Overdue"
                value={kpis?.overdue || 0}
                color={AdminPanelOverviewColors.overdue.text}
                gradientColors={AdminPanelOverviewColors.overdue.gradient}
                icon="clock.badge.exclamationmark"
                onPress={() => handleKPIPress('overdue')}
              />
            </View>
          </View>
        ) : (
          // Regular Essential Metrics for non-admin users
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Today's Essentials
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/(tabs)/financial')}>
                <Text style={styles.viewAllText}>View Financials</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.essentialGrid}>
              <KPICard
                title="Today's Sales"
                value={financialKpis?.today?.sales || 0}
                color={FinancialColors.income.primary}
                backgroundColor={FinancialColors.income.background}
                icon="arrow.up.circle.fill"
                onPress={() => handleKPIPress('sales')}
              />
              <KPICard
                title="Today's Expenses"
                value={financialKpis?.today?.expenses || 0}
                color={FinancialColors.expense.primary}
                backgroundColor={FinancialColors.expense.background}
                icon="arrow.down.circle.fill"
                onPress={() => handleKPIPress('expenses')}
              />
              <KPICard
                title="Overdue Job Cards"
                value={kpis?.overdue || 0}
                color={Colors.error[500]}
                backgroundColor={Colors.error[50]}
                icon="exclamationmark.triangle.fill"
                onPress={() => handleKPIPress('overdue')}
              />
            </View>
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
    backgroundColor: BrandColors.surface, // #f4f3ef
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: BrandColors.surface, // #f4f3ef
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
  greeting: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title, // #387868
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80', // #1e1d19 with 80% opacity
    marginTop: Spacing.xs,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  systemHealthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.success[200],
  },
  systemHealthText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.success[700],
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
    color: BrandColors.title, // #387868
    marginBottom: Spacing.base,
  },
  viewAllText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.primary, // #ff795b
  },
  kpiGrid: {
    gap: Spacing.md,
  },
  essentialGrid: {
    gap: Spacing.md,
  },
  adminOverviewGrid: {
    gap: Spacing.md,
  },
  adminOverviewCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadows.base,
  },
  adminCardContent: {
    gap: Spacing.sm,
  },
  adminCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  adminCardTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  adminCardValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
  },
  adminCardSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    opacity: 0.8,
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
    color: BrandColors.ink + '80', // #1e1d19 with 80% opacity
  },
  kpiValue: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
  },
  kpiTrend: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
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
