import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography, Spacing, BrandColors } from '@/constants/design-system';
import { useMediaHubStore } from '@/stores/mediaHubStore';
import { useAuthStore } from '@/stores/authStore';

// Import sections
import CaptureSection from '@/components/media-hub/CaptureSection';
import AudioSection from '@/components/media-hub/AudioSection';
import LibrarySection from '@/components/media-hub/LibrarySection';
import SearchSection from '@/components/media-hub/SearchSection';

export default function MediaHubScreen() {
  const { user } = useAuthStore();
  const {
    activeTab,
    setActiveTab,
    loadMediaItems,
    loadServiceTickets,
    ticketFilter,
    serviceTickets,
    loading,
  } = useMediaHubStore();

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadMediaItems();
        loadServiceTickets();
      }
    }, [user?.id, loadMediaItems, loadServiceTickets])
  );

  const tabs = [
    {
      id: 'capture' as const,
      label: 'Capture',
      icon: 'camera.fill',
    },
    {
      id: 'audio' as const,
      label: 'Audio',
      icon: 'mic.fill',
    },
    {
      id: 'library' as const,
      label: 'Library',
      icon: 'photo.on.rectangle',
    },
    {
      id: 'search' as const,
      label: 'Search',
      icon: 'magnifyingglass',
    },
  ];

  const getCurrentTicket = () => {
    if (!ticketFilter) return null;
    return serviceTickets.find(ticket => ticket.id === ticketFilter);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'capture':
        return <CaptureSection />;
      case 'audio':
        return <AudioSection />;
      case 'library':
        return <LibrarySection />;
      case 'search':
        return <SearchSection />;
      default:
        return <CaptureSection />;
    }
  };

  const currentTicket = getCurrentTicket();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BrandColors.surface} />
      
      {/* Full Header */}
      <LinearGradient
        colors={[BrandColors.surface, BrandColors.surface]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Media Hub</Text>
            {currentTicket && (
              <Text style={styles.headerSubtitle}>
                📋 {currentTicket.ticket_number}
              </Text>
            )}
          </View>
          
          {/* Quick Stats */}
          <View style={styles.headerStats}>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>
                {useMediaHubStore.getState().getFilteredItems().length}
              </Text>
              <Text style={styles.statLabel}>Items</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.tabButtonActive
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <IconSymbol
                name={tab.icon}
                size={20}
                color={BrandColors.ink}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.tabLabelActive
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Content Area */}
      <View style={styles.contentArea}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  
  // Header styles
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Account for status bar
    paddingBottom: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl2,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.title,
    marginTop: 2,
  },
  headerStats: {
    alignItems: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: BrandColors.ink,
    // React Native doesn't support true dotted borders cross-platform,
    // but this mimics a subtle dotted look via reduced opacity.
    borderStyle: 'dotted',
  },
  statNumber: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.ink,
    marginRight: 4,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
  },

  // Tab navigation
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    gap: Spacing.xs,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: BrandColors.primary,
  },
  tabLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
  },
  tabLabelActive: {
    color: BrandColors.ink,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Content
  contentArea: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
});
