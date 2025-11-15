import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface StatusUpdateNotificationProps {
  hasNewUpdates: boolean;
  updateCount: number;
  onPress?: () => void;
  onDismiss?: () => void;
}

export function StatusUpdateNotification({
  hasNewUpdates,
  updateCount,
  onPress,
  onDismiss,
}: StatusUpdateNotificationProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (hasNewUpdates) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasNewUpdates, fadeAnim, scaleAnim]);

  if (!hasNewUpdates) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.notification,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.notificationContent}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.notificationIcon}>
          <IconSymbol name="bell.fill" size={16} color="#3B82F6" />
          {updateCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {updateCount > 9 ? '9+' : updateCount}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>New Progress Updates</Text>
          <Text style={styles.notificationSubtitle}>
            {updateCount === 1 
              ? '1 new update available' 
              : `${updateCount} new updates available`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={(e) => {
            e.stopPropagation();
            onDismiss?.();
          }}
        >
          <IconSymbol name="xmark" size={14} color="#6B7280" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  notification: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 1000,
    elevation: 10,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationIcon: {
    position: 'relative',
    marginRight: 12,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  dismissButton: {
    padding: 8,
    marginLeft: 8,
  },
});

// Badge component for use in tab bars or headers
export function StatusUpdateBadge({ 
  count, 
  visible = true 
}: { 
  count: number; 
  visible?: boolean; 
}) {
  if (!visible || count === 0) {
    return null;
  }

  return (
    <View style={badgeStyles.badge}>
      <Text style={badgeStyles.badgeText}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 12,
  },
});
