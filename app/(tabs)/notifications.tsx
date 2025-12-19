import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, ComponentStyles, Shadows, Spacing, Typography } from '@/constants/design-system';
import { dataService } from '@/services/dataService';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { AlertItem } from '@/types';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';



interface AlertCardProps {
  alert: AlertItem;
  onPress: () => void;
  onMarkAsRead: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onPress, onMarkAsRead }) => {
  const getAlertColor = () => {
    switch (alert.type) {
      case 'critical': return Colors.error[500];
      case 'warning': return Colors.warning[500];
      case 'info': return Colors.info[500];
      case 'success': return Colors.success[500];
      default: return Colors.neutral[500];
    }
  };

  const getAlertIcon = () => {
    switch (alert.type) {
      case 'critical': return 'exclamationmark.triangle.fill';
      case 'warning': return 'exclamationmark.circle.fill';
      case 'info': return 'info.circle.fill';
      case 'success': return 'checkmark.circle.fill';
      default: return 'bell.fill';
    }
  };

  const getCategoryIcon = () => {
    switch (alert.category) {
      case 'system': return 'server.rack';
      case 'security': return 'lock.shield';
      case 'operations': return 'chart.bar';
      case 'maintenance': return 'wrench.and.screwdriver';
      default: return 'bell';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.alertCard, !alert.read && styles.alertCardUnread]}
      onPress={onPress}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertTypeIndicator}>
          <IconSymbol name={getAlertIcon()} size={16} color={getAlertColor()} />
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertTitleRow}>
            <Text style={[styles.alertTitle, !alert.read && styles.alertTitleUnread]}>
              {alert.title}
            </Text>
            <View style={styles.alertMeta}>
              <IconSymbol name={getCategoryIcon()} size={12} color={Colors.neutral[400]} />
              <Text style={styles.alertTime}>
                {alert.timestamp.toLocaleDateString()}
              </Text>
            </View>
          </View>
          <Text style={styles.alertMessage} numberOfLines={2}>
            {alert.message}
          </Text>
        </View>
        {!alert.read && (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={(e) => {
              e.stopPropagation();
              onMarkAsRead();
            }}
          >
            <IconSymbol name="checkmark" size={14} color={Colors.primary[500]} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const { activeLocation } = useLocationStore();
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [localReadState, setLocalReadState] = useState<Set<string>>(new Set());

  const {
    data: alerts = [],
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['dashboard-notifications', user?.role, activeLocation?.id],
    queryFn: async () => {
      if (!user) return [];
      const data = await dataService.getDashboardNotifications(user.role, activeLocation?.id);
      // Apply local read state
      return data.map(alert => ({
        ...alert,
        read: localReadState.has(alert.id)
      }));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const handleMarkAsRead = (alertId: string) => {
    setLocalReadState(prev => {
      const next = new Set(prev);
      next.add(alertId);
      return next;
    });
    // Optimistically update the query cache would be better, but refetching or local state masking works for now
    // Since we are mapping in queryFn, the next refetch will respect local state, 
    // but we need immediate feedback. The queryFn mapping handles the data prop, 
    // but we need to force a re-render or update the cache.
    // Actually, since 'alerts' comes from useQuery, we can't mutate it directly.
    // We rely on the queryFn to merge the state. 
    // To make it instant, we can invalidate or setQueryData, but for simplicity let's just trigger a refetch or let the next interval handle it?
    // No, user expects instant feedback.
    // Let's just use the derived state in the render.
  };

  // Merge alerts with local read state for rendering
  const displayedAlerts = React.useMemo(() => {
    return alerts.map(alert => ({
      ...alert,
      read: alert.read || localReadState.has(alert.id)
    }));
  }, [alerts, localReadState]);

  const handleAlertPress = (alert: AlertItem) => {
    if (!alert.read) {
      handleMarkAsRead(alert.id);
    }
  };

  const filteredAlerts = displayedAlerts.filter(alert => {
    switch (filter) {
      case 'unread': return !alert.read;
      case 'critical': return alert.type === 'critical';
      default: return true;
    }
  });

  const unreadCount = displayedAlerts.filter(alert => !alert.read).length;
  const criticalCount = displayedAlerts.filter(alert => alert.type === 'critical').length;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          {user?.role === 'admin' ? 'System Alerts' : 'Notifications'}
        </ThemedText>
        {user?.role === 'admin' && unreadCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{unreadCount} unread</Text>
          </View>
        )}
      </View>

      {user?.role === 'admin' && (
        <View style={styles.filterSection}>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
                All ({displayedAlerts.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
              onPress={() => setFilter('unread')}
            >
              <Text style={[styles.filterButtonText, filter === 'unread' && styles.filterButtonTextActive]}>
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'critical' && styles.filterButtonActive]}
              onPress={() => setFilter('critical')}
            >
              <Text style={[styles.filterButtonText, filter === 'critical' && styles.filterButtonTextActive]}>
                Critical ({criticalCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading || isRefetching} onRefresh={onRefresh} />
        }
      >
        {user?.role === 'admin' && filteredAlerts.length > 0 ? (
          <View style={styles.alertsList}>
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onPress={() => handleAlertPress(alert)}
                onMarkAsRead={() => handleMarkAsRead(alert.id)}
              />
            ))}
          </View>
        ) : user?.role === 'admin' && filteredAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="checkmark.seal" size={48} color={Colors.success[400]} />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>
              No {filter === 'critical' ? 'critical' : filter === 'unread' ? 'unread' : ''} alerts at the moment.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <IconSymbol name="bell" size={48} color={Colors.neutral[400]} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! Notifications will appear here.
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: 60,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
    ...Shadows.sm,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  headerBadge: {
    backgroundColor: Colors.error[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  headerBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.error[600],
  },
  filterSection: {
    backgroundColor: BrandColors.surface,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.ink + '05',
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
  },
  filterButtonActive: {
    backgroundColor: BrandColors.primary + '15',
    borderColor: BrandColors.primary,
  },
  filterButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '80',
  },
  filterButtonTextActive: {
    color: BrandColors.primary,
    fontFamily: Typography.fontFamily.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  alertsList: {
    gap: Spacing.md,
  },
  alertCard: {
    ...ComponentStyles.card,
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
  },
  alertCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: BrandColors.primary,
    backgroundColor: BrandColors.primary + '03',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  alertTypeIndicator: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
    gap: Spacing.sm,
  },
  alertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
    flex: 1,
    marginRight: Spacing.sm,
  },
  alertTitleUnread: {
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  alertTime: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  alertMessage: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
    lineHeight: Typography.lineHeight.sm,
  },
  markReadButton: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['3xl'],
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '60',
    textAlign: 'center',
  },
});
