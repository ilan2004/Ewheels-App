import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ImageCard, HeroImageCard } from '@/components/image-card';
import { Colors, Typography, Spacing } from '@/constants/design-system';

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
  status: 'in_progress' | 'completed' | 'overdue' | 'assigned' | 'reported';
  size?: 'sm' | 'md';
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status, size = 'sm' }) => {
  const getStatusImage = () => {
    switch (status) {
      case 'in_progress':
        return require('@/assets/images/custom/in-progress-status.png');
      case 'completed':
        return require('@/assets/images/custom/completed-status.png');
      case 'overdue':
        return require('@/assets/images/custom/overdue-status.png');
      case 'assigned':
        return require('@/assets/images/custom/technical-support.png'); // Using tech support as assigned
      default:
        return null;
    }
  };

  const image = getStatusImage();
  if (!image) return null;

  // For chip usage, use a larger transparent container for better visibility
  const chipSize = size === 'sm' ? { width: 24, height: 24 } : { width: 28, height: 28 };

  return (
    <View style={[chipSize, { backgroundColor: 'transparent' }]}>
      <Image
        source={image}
        style={[chipSize]}
        resizeMode="contain"
      />
    </View>
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
