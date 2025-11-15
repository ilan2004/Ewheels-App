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
      <IconSymbol name={icon} size={20} color="#6B7280" />
      <View style={styles.profileItemText}>
        <Text style={styles.profileItemTitle}>{title}</Text>
        {value && <Text style={styles.profileItemValue}>{value}</Text>}
      </View>
    </View>
    {showChevron && (
      <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { activeLocation, availableLocations } = useLocationStore();
  
  const featureAccess = user ? getFeatureAccess(user.role) : null;
  const canAccessAllLocations = user ? canBypassLocationFilter(user.role) : false;

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
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    padding: 32,
    paddingTop: 80,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  section: {
    padding: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemText: {
    marginLeft: 12,
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  locationSelectorCard: {
    marginTop: 12,
  },
});
