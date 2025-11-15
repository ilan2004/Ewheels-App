import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { jobCardsService } from '@/services/jobCardsService';
import { Colors, Typography, Spacing, BorderRadius, ComponentStyles, Shadows } from '@/constants/design-system';

interface StatCardProps {
  title: string;
  value: number | string;
  color: string;
  backgroundColor: string;
  icon: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  color,
  backgroundColor,
  icon,
  subtitle,
}) => (
  <View style={[styles.statCard, { backgroundColor }]}>
    <View style={styles.statContent}>
      <View style={styles.statHeader}>
        <IconSymbol name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && (
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      )}
    </View>
  </View>
);

interface ProfileItemProps {
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
  showChevron?: boolean;
}

const ProfileItem: React.FC<ProfileItemProps> = ({
  icon,
  label,
  value,
  onPress,
  showChevron = false,
}) => (
  <TouchableOpacity
    style={styles.profileItem}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.profileItemLeft}>
      <View style={styles.profileItemIcon}>
        <IconSymbol name={icon} size={20} color="#6B7280" />
      </View>
      <View style={styles.profileItemContent}>
        <Text style={styles.profileItemLabel}>{label}</Text>
        <Text style={styles.profileItemValue}>{value}</Text>
      </View>
    </View>
    {showChevron && onPress && (
      <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
    )}
  </TouchableOpacity>
);

export default function TechnicianProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { activeLocation } = useLocationStore();

  // Fetch technician's work statistics
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['technician-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Get all tickets assigned to this technician
      const response = await jobCardsService.getTickets(
        { assignedTo: user.id, status: 'all' },
        1,
        100
      );
      
      const tickets = response.data;
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      return {
        totalAssigned: tickets.length,
        completed: tickets.filter(t => t.status === 'completed').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        pending: tickets.filter(t => t.status === 'assigned').length,
        completedThisWeek: tickets.filter(t => 
          t.status === 'completed' && 
          new Date(t.updated_at || t.updatedAt || t.created_at || t.createdAt) >= startOfWeek
        ).length,
        completedThisMonth: tickets.filter(t => 
          t.status === 'completed' && 
          new Date(t.updated_at || t.updatedAt || t.created_at || t.createdAt) >= startOfMonth
        ).length,
        avgCompletionTime: '2.3 days', // This would be calculated from actual data
        efficiency: '94%', // This would be calculated from actual performance metrics
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleNotificationSettings = () => {
    Alert.alert(
      'Notification Settings',
      'This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const refreshing = statsLoading;

  const handleRefresh = async () => {
    await refetchStats();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'Technician';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.[0] || user?.email?.[0] || 'T'}
                </Text>
              </View>
            </View>
            <View style={styles.headerInfo}>
              <ThemedText type="title" style={styles.greeting}>
                {getGreeting()}, {userName}!
              </ThemedText>
              <ThemedText style={styles.role}>
                Technician
              </ThemedText>
              {activeLocation && (
                <ThemedText style={styles.location}>
                  📍 {activeLocation.name}
                </ThemedText>
              )}
            </View>
          </View>
        </View>

        {/* Performance Stats */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Performance Overview
          </ThemedText>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Jobs"
              value={stats?.totalAssigned || 0}
              color="#3B82F6"
              backgroundColor="#EFF6FF"
              icon="doc.text.fill"
              subtitle="All time"
            />
            <StatCard
              title="Completed"
              value={stats?.completed || 0}
              color="#10B981"
              backgroundColor="#F0FDF4"
              icon="checkmark.circle.fill"
              subtitle="Successfully finished"
            />
            <StatCard
              title="In Progress"
              value={stats?.inProgress || 0}
              color="#8B5CF6"
              backgroundColor="#F5F3FF"
              icon="gearshape.fill"
              subtitle="Currently working"
            />
            <StatCard
              title="Pending"
              value={stats?.pending || 0}
              color="#F59E0B"
              backgroundColor="#FFFBEB"
              icon="clock.fill"
              subtitle="Assigned to you"
            />
          </View>
        </View>

        {/* This Week/Month Stats */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recent Performance
          </ThemedText>
          <View style={styles.performanceCard}>
            <View style={styles.performanceRow}>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>
                  {stats?.completedThisWeek || 0}
                </Text>
                <Text style={styles.performanceLabel}>This Week</Text>
              </View>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>
                  {stats?.completedThisMonth || 0}
                </Text>
                <Text style={styles.performanceLabel}>This Month</Text>
              </View>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>
                  {stats?.efficiency || 'N/A'}
                </Text>
                <Text style={styles.performanceLabel}>Efficiency</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Profile Information
          </ThemedText>
          <View style={styles.profileCard}>
            <ProfileItem
              icon="person.fill"
              label="Name"
              value={userName}
            />
            <ProfileItem
              icon="envelope.fill"
              label="Email"
              value={user?.email || 'N/A'}
            />
            <ProfileItem
              icon="briefcase.fill"
              label="Role"
              value="Technician"
            />
            <ProfileItem
              icon="calendar.badge.plus"
              label="Member Since"
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            />
            {activeLocation && (
              <ProfileItem
                icon="location.fill"
                label="Location"
                value={activeLocation.name}
              />
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/(tabs)/technician-jobcards')}
            >
              <View style={styles.actionIconContainer}>
                <IconSymbol name="doc.text.magnifyingglass" size={24} color="#3B82F6" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>View My Job Cards</Text>
                <Text style={styles.actionSubtitle}>See all assigned tasks</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/(tabs)/notifications')}
            >
              <View style={styles.actionIconContainer}>
                <IconSymbol name="bell.fill" size={24} color="#F59E0B" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Notifications</Text>
                <Text style={styles.actionSubtitle}>Check alerts and updates</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Settings
          </ThemedText>
          <View style={styles.settingsCard}>
            <ProfileItem
              icon="lock.fill"
              label="Change Password"
              value="Update your password"
              onPress={handleChangePassword}
              showChevron
            />
            <ProfileItem
              icon="bell.badge.fill"
              label="Notifications"
              value="Manage notification preferences"
              onPress={handleNotificationSettings}
              showChevron
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <IconSymbol name="arrow.right.square" size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: Colors.white,
    ...ComponentStyles.header,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  avatarContainer: {
    marginRight: Spacing.base,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'uppercase',
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  role: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[600],
    marginTop: Spacing.xs,
  },
  location: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.success[600],
    marginTop: Spacing.xs,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[900],
    marginBottom: Spacing.base,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '48%',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[600],
    ...Shadows.base,
  },
  statContent: {
    gap: Spacing.sm,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
  },
  statSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  performanceCard: {
    ...ComponentStyles.card,
    padding: Spacing.lg,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceStat: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  performanceLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    marginTop: Spacing.xs,
  },
  profileCard: {
    ...ComponentStyles.card,
    padding: 0,
    overflow: 'hidden',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  profileItemValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[900],
    marginTop: 2,
  },
  actionsCard: {
    ...ComponentStyles.card,
    padding: 0,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[900],
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    marginTop: 2,
  },
  settingsCard: {
    ...ComponentStyles.card,
    padding: 0,
    overflow: 'hidden',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error[200],
    ...Shadows.sm,
  },
  signOutText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.error[600],
  },
});
