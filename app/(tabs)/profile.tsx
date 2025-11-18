import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { LocationSelector } from '@/components/location-selector';
import { getFeatureAccess, canBypassLocationFilter } from '@/lib/permissions';
import { BrandColors, Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/design-system';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';

interface ProfileItemProps {
  icon: string;
  title: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

const ProfileItem: React.FC<ProfileItemProps> = ({
  icon,
  title,
  value,
  onPress,
  showChevron = false,
}) => (
  <TouchableOpacity
    style={styles.profileItem}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.profileItemContent}>
      <IconSymbol name={icon} size={20} color={BrandColors.ink + '80'} />
      <View style={styles.profileItemText}>
        <Text style={styles.profileItemTitle}>{title}</Text>
        {value && <Text style={styles.profileItemValue}>{value}</Text>}
      </View>
    </View>
    {showChevron && (
      <IconSymbol name="chevron.right" size={16} color={BrandColors.ink + '60'} />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { activeLocation, availableLocations } = useLocationStore();
  
  const featureAccess = user ? getFeatureAccess(user.role) : null;
  const canAccessAllLocations = user ? canBypassLocationFilter(user.role) : false;

  // Fetch quick stats for floor managers
  const { data: quickStats } = useQuery({
    queryKey: ['profile-quick-stats', user?.role, activeLocation?.id],
    queryFn: () => dataService.getDashboardKPIs(user!.role, activeLocation?.id),
    enabled: !!user && user.role === 'floor_manager',
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

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'User';

  const roleDisplayName = {
    admin: 'Administrator',
    front_desk_manager: 'Front Desk Manager',
    floor_manager: 'Floor Manager',
    manager: 'Manager',
    technician: 'Technician',
  }[user?.role || ''] || 'User';

  const getPermissionSummary = () => {
    if (!featureAccess) return 'Loading...';
    
    const permissions = [];
    if (featureAccess.canCreateTickets) permissions.push('Create Tickets');
    if (featureAccess.canEditAllTickets) permissions.push('Edit All Tickets');
    if (featureAccess.canAssignTechnicians) permissions.push('Assign Tasks');
    if (featureAccess.canViewAnalytics) permissions.push('View Analytics');
    if (featureAccess.canManageUsers) permissions.push('Manage Users');
    if (featureAccess.canManageSettings) permissions.push('System Settings');
    
    return permissions.length > 0 ? `${permissions.length} permissions` : 'View Only';
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          </View>
          <ThemedText type="title" style={styles.userName}>
            {userName}
          </ThemedText>
          <Text style={styles.userRole}>{roleDisplayName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Floor Manager Quick Stats */}
        {user?.role === 'floor_manager' && quickStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{quickStats.totalTickets || 0}</Text>
                <Text style={styles.statLabel}>Active Tickets</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{quickStats.unassignedTickets || 0}</Text>
                <Text style={styles.statLabel}>Unassigned</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{quickStats.overdue || 0}</Text>
                <Text style={styles.statLabel}>Overdue</Text>
              </View>
            </View>
          </View>
        )}

        {/* Admin Quick Actions */}
        {user?.role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickActionCard}>
                <IconSymbol name="person.3.fill" size={20} color={BrandColors.primary} />
                <Text style={styles.quickActionText}>User Management</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard}>
                <IconSymbol name="gear" size={20} color={Colors.warning[600]} />
                <Text style={styles.quickActionText}>System Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard}>
                <IconSymbol name="chart.bar.fill" size={20} color={Colors.success[600]} />
                <Text style={styles.quickActionText}>Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard}>
                <IconSymbol name="server.rack" size={20} color={Colors.info[600]} />
                <Text style={styles.quickActionText}>System Health</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.profileCard}>
            <ProfileItem
              icon="person"
              title="Full Name"
              value={userName}
            />
            <ProfileItem
              icon="envelope"
              title="Email"
              value={user?.email}
            />
            <ProfileItem
              icon="briefcase"
              title="Role"
              value={roleDisplayName}
            />
            {user?.id && (
              <ProfileItem
                icon="number"
                title="User ID"
                value={user.id}
              />
            )}
            {user?.role === 'admin' && (
              <ProfileItem
                icon="checkmark.shield.fill"
                title="Admin Level"
                value="System Administrator"
              />
            )}
          </View>
        </View>

        {/* Location Context */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Access</Text>
          <View style={styles.profileCard}>
            {canAccessAllLocations ? (
              <ProfileItem
                icon="globe"
                title="Access Level"
                value="All Locations"
              />
            ) : (
              <ProfileItem
                icon="location.fill"
                title="Active Location"
                value={activeLocation?.name || 'No location selected'}
              />
            )}
            <ProfileItem
              icon="list.bullet"
              title="Available Locations"
              value={`${availableLocations.length} location${availableLocations.length !== 1 ? 's' : ''}`}
            />
            <ProfileItem
              icon="shield.checkered"
              title="Permissions"
              value={getPermissionSummary()}
            />
            {user?.role === 'admin' && (
              <ProfileItem
                icon="crown.fill"
                title="Admin Privileges"
                value="Full system access"
              />
            )}
          </View>
          {!canAccessAllLocations && availableLocations.length > 1 && (
            <LocationSelector style={styles.locationSelectorCard} />
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.profileCard}>
            <ProfileItem
              icon="bell"
              title="Notifications"
              onPress={() => console.log('Notifications settings')}
              showChevron
            />
            <ProfileItem
              icon="moon"
              title="Dark Mode"
              onPress={() => console.log('Dark mode toggle')}
              showChevron
            />
            <ProfileItem
              icon="globe"
              title="Language"
              value="English"
              onPress={() => console.log('Language settings')}
              showChevron
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.profileCard}>
            <ProfileItem
              icon="questionmark.circle"
              title="Help & Support"
              onPress={() => console.log('Help & Support')}
              showChevron
            />
            <ProfileItem
              icon="info.circle"
              title="About"
              onPress={() => console.log('About')}
              showChevron
            />
            <ProfileItem
              icon="shield.checkered"
              title="Privacy Policy"
              onPress={() => console.log('Privacy Policy')}
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

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>EV Wheels v1.0.0</Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    paddingTop: 80,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '20',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  avatarText: {
    color: BrandColors.surface,
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
  },
  userName: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginBottom: Spacing.xs,
  },
  userRole: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: BrandColors.primary + '20',
    borderRadius: BorderRadius.full,
  },
  userEmail: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
  },
  section: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginBottom: Spacing.base,
  },
  profileCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    ...Shadows.base,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
  },
  profileItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  profileItemTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: '#EF4444' + '30',
    padding: Spacing.base,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  signOutText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  versionText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '60',
  },
  locationSelectorCard: {
    marginTop: Spacing.md,
  },
  // Admin Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    ...Shadows.sm,
  },
  quickActionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    textAlign: 'center',
  },
  // Floor Manager Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.base,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    ...Shadows.base,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: BrandColors.primary + '10',
    borderRadius: BorderRadius.md,
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink + '80',
    textAlign: 'center',
  },
});
