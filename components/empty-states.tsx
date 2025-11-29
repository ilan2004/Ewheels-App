import { HeroImageCard } from '@/components/image-card';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, Typography } from '@/constants/design-system';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface EmptyStateProps {
  title: string;
  description?: string;
  image?: any; // Image source
  action?: React.ReactNode; // Optional button or action
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  image,
  action,
}) => {
  return (
    <View style={styles.container}>
      {image && (
        <HeroImageCard
          source={image}
          style={styles.imageContainer}
        />
      )}
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {description && (
        <ThemedText style={styles.description}>
          {description}
        </ThemedText>
      )}
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
};

// Specific empty states for your app
export const EmptyJobCards: React.FC = () => (
  <EmptyState
    image={require('@/assets/images/custom/empty-job-cards-state.png')}
    title="No Job Cards Yet"
    description="Job cards will appear here when customers create service requests."
  />
);

export const EmptyNotifications: React.FC = () => (
  <EmptyState
    image={require('@/assets/images/custom/no-notifications.png')}
    title="All Caught Up!"
    description="You have no new notifications at the moment."
  />
);

export const EmptySearchResults: React.FC = () => (
  <EmptyState
    image={require('@/assets/images/custom/no-search-results.png')}
    title="No Results Found"
    description="Try adjusting your search criteria or filters."
  />
);

// Status icons component
interface StatusIconProps {
  status: 'in_progress' | 'completed' | 'overdue' | 'assigned' | 'reported' | 'delivered';
  size?: 'sm' | 'md';
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status, size = 'sm' }) => {
  const { IconSymbol } = require('@/components/ui/icon-symbol'); // Lazy import to avoid cycle if any

  const getStatusIconName = () => {
    switch (status) {
      case 'reported':
        return 'exclamationmark.circle';
      case 'assigned':
        return 'person.fill';
      case 'in_progress':
        return 'hammer';
      case 'completed':
        return 'checkmark.circle.fill';
      case 'delivered':
        return 'checkmark.circle.fill';
      case 'overdue':
        return 'clock.badge.exclamationmark';
      default:
        return 'circle';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'reported':
        return '#EF4444'; // Red
      case 'assigned':
        return '#3B82F6'; // Blue
      case 'in_progress':
        return '#8B5CF6'; // Purple
      case 'completed':
        return '#10B981'; // Green
      case 'delivered':
        return '#059669'; // Darker Green
      case 'overdue':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <IconSymbol
      name={getStatusIconName() as any}
      size={iconSize}
      color={getStatusColor()}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  imageContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
    color: Colors.neutral[900],
  },
  description: {
    textAlign: 'center',
    color: Colors.neutral[600],
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.sm,
    maxWidth: 280,
    marginBottom: Spacing.lg,
  },
  actionContainer: {
    marginTop: Spacing.base,
  },
});

export default EmptyState;
