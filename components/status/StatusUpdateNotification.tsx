import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors as DesignColors, Shadows, Spacing, Typography } from '@/constants/design-system';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
          <IconSymbol name="bell.fill" size={16} color={DesignColors.primary[600]} />
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
          <IconSymbol name="xmark" size={14} color={DesignColors.neutral[500]} />
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
    backgroundColor: DesignColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: DesignColors.neutral[200],
  },
  notificationIcon: {
    position: 'relative',
    marginRight: 12,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: DesignColors.error[500],
    borderRadius: BorderRadius.sm + 2,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DesignColors.white,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs - 2,
    fontWeight: Typography.fontWeight.bold,
    color: DesignColors.white,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: DesignColors.neutral[900],
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: DesignColors.neutral[500],
  },
  dismissButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
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
    backgroundColor: DesignColors.error[500],
    borderRadius: BorderRadius.sm + 2,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DesignColors.white,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs - 2,
    fontWeight: Typography.fontWeight.bold,
    color: DesignColors.white,
    lineHeight: 12,
  },
});
