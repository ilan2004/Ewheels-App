import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { BrandColors, Typography, Spacing, BorderRadius, ComponentStyles, StatusColors, Colors } from '@/constants/design-system';

interface StatusUpdate {
  id: string;
  ticket_id: string;
  status: string;
  update_text: string;
  created_by: string;
  created_at: string;
  user_name: string;
  is_system_update: boolean;
}

interface StatusUpdatesTimelineProps {
  updates: StatusUpdate[];
  currentStatus: string;
  onDeleteUpdate?: (updateId: string) => void;
  canDelete?: boolean;
}

export function StatusUpdatesTimeline({ 
  updates, 
  currentStatus, 
  onDeleteUpdate,
  canDelete = false 
}: StatusUpdatesTimelineProps) {
  
  const getStatusColor = (status: string) => {
    return StatusColors[status as keyof typeof StatusColors]?.primary || BrandColors.primary;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reported': return 'exclamationmark.circle';
      case 'triaged': return 'magnifyingglass';
      case 'in_progress': return 'hammer';
      case 'completed': return 'checkmark.circle';
      case 'delivered': return 'checkmark.circle.fill';
      default: return 'circle';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDeleteUpdate = (updateId: string, updateText: string) => {
    Alert.alert(
      'Delete Update',
      `Are you sure you want to delete this update?\n\n"${updateText.length > 50 ? updateText.substring(0, 50) + '...' : updateText}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteUpdate?.(updateId),
        },
      ]
    );
  };

  if (updates.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name="clock" size={24} color={Colors.neutral[400]} />
        <Text style={styles.emptyText}>No status updates yet</Text>
        <Text style={styles.emptySubtext}>
          Updates will appear here as work progresses
        </Text>
      </View>
    );
  }

  // Group updates by status
  const groupedUpdates = updates.reduce((groups, update) => {
    const status = update.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(update);
    return groups;
  }, {} as Record<string, StatusUpdate[]>);

  const statusOrder = ['reported', 'triaged', 'in_progress', 'completed', 'delivered'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {statusOrder.map((status) => {
        const statusUpdates = groupedUpdates[status];
        if (!statusUpdates || statusUpdates.length === 0) return null;

        const isCurrentStatus = status === currentStatus;
        
        return (
          <View key={status} style={styles.statusSection}>
            {/* Status Header */}
            <View style={styles.statusHeader}>
              <View style={[
                styles.statusIconContainer,
                { backgroundColor: getStatusColor(status) + '20' }
              ]}>
                <IconSymbol 
                  name={getStatusIcon(status)} 
                  size={16} 
                  color={getStatusColor(status)} 
                />
              </View>
              <View style={styles.statusHeaderText}>
                <Text style={[
                  styles.statusTitle,
                  { color: getStatusColor(status) }
                ]}>
                  {status.replace('_', ' ').toUpperCase()}
                </Text>
                {isCurrentStatus && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>CURRENT</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Status Updates */}
            <View style={styles.updatesContainer}>
              {statusUpdates.map((update, index) => (
                <View key={update.id} style={styles.updateItem}>
                  <View style={styles.updateTimeline}>
                    <View style={[
                      styles.timelineDot,
                      { backgroundColor: update.is_system_update ? Colors.neutral[400] : getStatusColor(status) }
                    ]} />
                    {index < statusUpdates.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>
                  
                  <View style={styles.updateContent}>
                    <View style={styles.updateHeader}>
                      <View style={styles.updateMeta}>
                        <Text style={styles.updateUser}>
                          {update.is_system_update ? '🤖 System' : `👤 ${update.user_name}`}
                        </Text>
                        <Text style={styles.updateTime}>
                          {formatRelativeTime(update.created_at)}
                        </Text>
                      </View>
                      
                      {canDelete && !update.is_system_update && onDeleteUpdate && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteUpdate(update.id, update.update_text)}
                        >
                          <IconSymbol name="trash" size={14} color={Colors.error[500]} />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <Text style={styles.updateText}>
                      {update.update_text}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink + '60',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '40',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  statusSection: {
    marginBottom: Spacing['2xl'],
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statusHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  currentBadge: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  currentBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.surface,
  },
  updatesContainer: {
    paddingLeft: Spacing.base,
  },
  updateItem: {
    flexDirection: 'row',
    marginBottom: Spacing.base,
  },
  updateTimeline: {
    alignItems: 'center',
    marginRight: Spacing.md,
    width: 20,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.xs,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: BrandColors.ink + '20',
    marginTop: Spacing.xs,
  },
  updateContent: {
    flex: 1,
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.primary + '40',
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  updateMeta: {
    flex: 1,
  },
  updateUser: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginBottom: 2,
  },
  updateTime: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  updateText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
    lineHeight: Typography.lineHeight.sm,
  },
});
