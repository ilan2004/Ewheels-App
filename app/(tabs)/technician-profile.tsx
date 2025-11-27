import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, ComponentStyles, Shadows, Spacing, Typography } from '@/constants/design-system';
import { jobCardsService } from '@/services/jobCardsService';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';

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
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

const ProfileItem: React.FC<ProfileItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  destructive = false,
}) => (
  <TouchableOpacity
    style={styles.profileItem}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.profileItemLeft}>
      <View style={styles.profileItemIcon}>
        <IconSymbol name={icon} size={24} color={destructive ? Colors.error[600] : Colors.neutral[900]} />
      </View>
      <View style={styles.profileItemContent}>
        <Text style={[styles.profileItemTitle, destructive && styles.destructiveText]}>{title}</Text>
        {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {showChevron && onPress && (
      <IconSymbol name="chevron.right" size={20} color={Colors.neutral[400]} />
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
          new Date(t.updated_at || t.created_at).getTime() >= startOfWeek.getTime()
        ).length,
        completedThisMonth: tickets.filter(t =>
          t.status === 'completed' &&
          new Date(t.updated_at || t.created_at).getTime() >= startOfMonth.getTime()
        ).length,
        avgCompletionTime: '2.3 days',
        efficiency: '94%',
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

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <View style={styles.listContainer}>
            <ProfileItem
              icon="doc.text.magnifyingglass"
              title="View My Job Cards"
              subtitle="See all assigned tasks"
              onPress={() => router.push('/(tabs)/technician-jobcards')}
            />
            <ProfileItem
              icon="bell.fill"
              title="Notifications"
              subtitle="Check alerts and updates"
              onPress={() => router.push('/(tabs)/notifications')}
            />
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Profile Information
          </ThemedText>
          <View style={styles.listContainer}>
            <ProfileItem
              icon="person.fill"
              title="Name"
              subtitle={userName}
            />
            <ProfileItem
              icon="envelope.fill"
              title="Email"
              subtitle={user?.email || 'N/A'}
            />
            <ProfileItem
              icon="briefcase.fill"
              title="Role"
              subtitle="Technician"
            />
            <ProfileItem
              icon="calendar.badge.plus"
              title="Member Since"
              subtitle={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            />
            {activeLocation && (
              <ProfileItem
                icon="location.fill"
                title="Location"
                subtitle={activeLocation.name}
              />
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Settings
          </ThemedText>
          <View style={styles.listContainer}>
            <ProfileItem
              icon="lock.fill"
              title="Change Password"
              subtitle="Update your password"
              onPress={handleChangePassword}
            />
            <ProfileItem
              icon="bell.badge.fill"
              title="Notifications"
              subtitle="Manage notification preferences"
              onPress={handleNotificationSettings}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Account
          </ThemedText>
          <View style={styles.listContainer}>
            <ProfileItem
              icon="arrow.right.square.fill"
              title="Sign Out"
              subtitle="Log out of your account"
              onPress={handleSignOut}
              destructive
            />
          </View>
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
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing.md,
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
  listContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: Colors.white,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[900],
  },
  profileItemSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  destructiveText: {
    color: Colors.error[600],
  },
});
