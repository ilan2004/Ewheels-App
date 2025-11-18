import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/stores/authStore';
import { BrandColors, Colors, Typography, Spacing, BorderRadius, ComponentStyles, Shadows } from '@/constants/design-system';

interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'system' | 'security' | 'operations' | 'maintenance';
}

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
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  // Mock admin alerts data
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: '1',
      type: 'critical',
      title: 'System Performance Alert',
      message: 'Server response time is above threshold (2.5s). Immediate attention required.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      category: 'system'
    },
    {
      id: '2',
      type: 'warning',
      title: 'High Technician Workload',
      message: '3 technicians are over capacity. Consider redistributing assignments.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false,
      category: 'operations'
    },
    {
      id: '3',
      type: 'info',
      title: 'Scheduled Maintenance',
      message: 'System maintenance is scheduled for tonight at 2:00 AM - 4:00 AM.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      read: true,
      category: 'maintenance'
    },
    {
      id: '4',
      type: 'success',
      title: 'Backup Completed',
      message: 'Daily system backup completed successfully at 3:15 AM.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      read: true,
      category: 'system'
    }
  ]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleMarkAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const handleAlertPress = (alert: AlertItem) => {
    if (!alert.read) {
      handleMarkAsRead(alert.id);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'unread': return !alert.read;
      case 'critical': return alert.type === 'critical';
      default: return true;
    }
  });

  const unreadCount = alerts.filter(alert => !alert.read).length;
  const criticalCount = alerts.filter(alert => alert.type === 'critical').length;

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
                All ({alerts.length})
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
