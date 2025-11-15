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
    switch (status) {
      case 'reported': return '#EF4444';
      case 'triaged': return '#F59E0B';
      case 'in_progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      case 'delivered': return '#06B6D4';
      default: return '#6B7280';
    }
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
        <IconSymbol name="clock" size={24} color="#9CA3AF" />
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
                      { backgroundColor: update.is_system_update ? '#9CA3AF' : getStatusColor(status) }
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
                          <IconSymbol name="trash" size={14} color="#EF4444" />
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
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  statusSection: {
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  updatesContainer: {
    paddingLeft: 16,
  },
  updateItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  updateTimeline: {
    alignItems: 'center',
    marginRight: 12,
    width: 20,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  updateContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  updateMeta: {
    flex: 1,
  },
  updateUser: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  updateTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 4,
  },
  updateText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
