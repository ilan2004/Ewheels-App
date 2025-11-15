import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography, Spacing } from '@/constants/design-system';
import { MediaItem as MediaItemType } from '@/stores/mediaHubStore';

interface MediaItemProps {
  item: MediaItemType;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  showTicket?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const { width: screenWidth } = Dimensions.get('window');

export default function MediaItem({ 
  item, 
  onPress, 
  onLongPress, 
  selected = false,
  showTicket = true,
  size = 'medium'
}: MediaItemProps) {
  const getItemSize = () => {
    switch (size) {
      case 'small':
        return 60;
      case 'large':
        return 120;
      default:
        return 80;
    }
  };

  const getMediaIcon = () => {
    switch (item.mediaType) {
      case 'video':
        return 'play.circle.fill';
      case 'audio':
        return 'waveform';
      default:
        return 'photo.fill';
    }
  };

  const getMediaColor = () => {
    switch (item.mediaType) {
      case 'video':
        return Colors.error[500];
      case 'audio':
        return Colors.success[500];
      default:
        return Colors.primary[500];
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSyncStatusColor = () => {
    switch (item.syncStatus) {
      case 'synced':
        return Colors.success[500];
      case 'syncing':
        return Colors.warning[500];
      case 'failed':
        return Colors.error[500];
      default:
        return Colors.neutral[400];
    }
  };

  const getSyncStatusIcon = () => {
    switch (item.syncStatus) {
      case 'synced':
        return 'checkmark.circle.fill';
      case 'syncing':
        return 'clock.fill';
      case 'failed':
        return 'exclamationmark.triangle.fill';
      default:
        return 'cloud.fill';
    }
  };

  const itemSize = getItemSize();
  const isCompact = size === 'small';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.containerSelected,
        isCompact && styles.containerCompact
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Media Preview */}
      <View style={[styles.mediaPreview, { width: itemSize, height: itemSize }]}>
        {item.mediaType === 'image' && item.localUri ? (
          <Image
            source={{ uri: item.localUri }}
            style={styles.mediaImage}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[getMediaColor(), `${getMediaColor()}CC`]}
            style={styles.mediaPlaceholder}
          >
            <IconSymbol
              name={getMediaIcon()}
              size={isCompact ? 20 : 24}
              color={Colors.white}
            />
          </LinearGradient>
        )}
        
        {/* Duration Badge */}
        {item.durationSeconds && item.durationSeconds > 0 && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(item.durationSeconds)}
            </Text>
          </View>
        )}
        
        {/* Selection Indicator */}
        {selected && (
          <View style={styles.selectionIndicator}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={20}
              color={Colors.success[500]}
            />
          </View>
        )}
      </View>

      {/* Media Info */}
      <View style={styles.mediaInfo}>
        <Text style={[
          styles.mediaTitle,
          isCompact && styles.mediaTitleCompact
        ]} numberOfLines={1}>
          {item.fileName.replace(/\.(jpg|jpeg|png|mp4|m4a)$/i, '')}
        </Text>
        
        {!isCompact && (
          <>
            <Text style={styles.mediaDate}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
            
            <View style={styles.mediaMetaRow}>
              {item.fileSize && (
                <Text style={styles.mediaMeta}>
                  {formatFileSize(item.fileSize)}
                </Text>
              )}
              
              {showTicket && item.ticketId && (
                <View style={styles.ticketBadge}>
                  <IconSymbol
                    name="doc.text.fill"
                    size={12}
                    color={Colors.primary[600]}
                  />
                  <Text style={styles.ticketText}>Assigned</Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {/* Sync Status */}
      <View style={styles.syncStatus}>
        <IconSymbol
          name={getSyncStatusIcon()}
          size={isCompact ? 14 : 16}
          color={getSyncStatusColor()}
        />
        {!isCompact && item.uploadProgress !== undefined && item.uploadProgress < 100 && (
          <Text style={styles.uploadProgress}>
            {Math.round(item.uploadProgress)}%
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.base,
    marginBottom: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  containerSelected: {
    borderColor: Colors.success[500],
    backgroundColor: Colors.success[50],
  },
  containerCompact: {
    padding: Spacing.sm,
    marginBottom: Spacing.xs / 2,
  },

  // Media preview
  mediaPreview: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.mono,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 2,
  },

  // Media info
  mediaInfo: {
    flex: 1,
    marginLeft: Spacing.base,
  },
  mediaTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  mediaTitleCompact: {
    fontSize: Typography.fontSize.sm,
    marginBottom: 0,
  },
  mediaDate: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    marginBottom: 4,
  },
  mediaMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mediaMeta: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  ticketText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[600],
  },

  // Sync status
  syncStatus: {
    alignItems: 'center',
    gap: 2,
  },
  uploadProgress: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.mono,
    color: Colors.warning[600],
  },
});
