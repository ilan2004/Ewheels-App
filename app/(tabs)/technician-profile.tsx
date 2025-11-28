import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, ComponentStyles, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';



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
        <IconSymbol name={icon} size={24} color={destructive ? Colors.error[600] : BrandColors.ink} />
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

        {/* Sign Out */}
        <View style={styles.section}>
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
    backgroundColor: BrandColors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: BrandColors.surface,
    ...ComponentStyles.header,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
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
    backgroundColor: BrandColors.primary,
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
    color: BrandColors.ink,
  },
  role: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.primary,
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
    color: BrandColors.ink,
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
    borderLeftColor: BrandColors.primary,
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
    color: BrandColors.ink,
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
