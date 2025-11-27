import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useAuthStore } from '@/stores/authStore';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ProfileItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  rightElement?: React.ReactNode;
}

const ProfileItem: React.FC<ProfileItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  destructive = false,
  rightElement,
}) => (
  <TouchableOpacity
    style={styles.profileItem}
    onPress={onPress}
    disabled={!onPress && !rightElement}
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
    {rightElement ? (
      rightElement
    ) : (
      showChevron && onPress && (
        <IconSymbol name="chevron.right" size={20} color={Colors.neutral[400]} />
      )
    )}
  </TouchableOpacity>
);

export default function FrontDeskProfile() {
  const { user, signOut } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState(user?.firstName || 'John');
  const [lastName, setLastName] = useState(user?.lastName || 'Doe');
  const [email, setEmail] = useState(user?.email || 'john.doe@ewheels.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [employeeId, setEmployeeId] = useState('EW-FD-001');

  // Settings states
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleSave = () => {
    // Here you would save the profile data
    console.log('Saving profile data:', {
      firstName,
      lastName,
      email,
      phone,
      employeeId,
    });

    Alert.alert('Profile Updated', 'Your profile has been successfully updated.');
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form to original values
    setFirstName(user?.firstName || 'John');
    setLastName(user?.lastName || 'Doe');
    setEmail(user?.email || 'john.doe@ewheels.com');
    setPhone('+1 (555) 123-4567');
    setEmployeeId('EW-FD-001');
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change functionality would be implemented here.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Account deletion requested');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://ui-avatars.com/api/?name=John+Doe&background=3B82F6&color=fff&size=120' }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.cameraButton}>
            <IconSymbol name="camera.fill" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{firstName} {lastName}</Text>
        <Text style={styles.role}>Front Desk Manager</Text>
        <Text style={styles.employeeIdText}>Employee ID: {employeeId}</Text>
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <IconSymbol
              name={isEditing ? 'xmark.circle.fill' : 'pencil.circle.fill'}
              size={24}
              color={Colors.primary[600]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={firstName}
                onChangeText={setFirstName}
                editable={isEditing}
                placeholder="First Name"
              />
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={lastName}
                onChangeText={setLastName}
                editable={isEditing}
                placeholder="Last Name"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={email}
              onChangeText={setEmail}
              editable={isEditing}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={phone}
              onChangeText={setPhone}
              editable={isEditing}
              placeholder="Phone"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Employee ID</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={employeeId}
              onChangeText={setEmployeeId}
              editable={isEditing}
              placeholder="Employee ID"
            />
          </View>

          {isEditing && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.listContainer}>
          <ProfileItem
            icon="bell.fill"
            title="Push Notifications"
            subtitle="Receive alerts for new tickets"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: Colors.neutral[300], true: Colors.primary[200] }}
                thumbColor={notifications ? Colors.primary[600] : Colors.neutral[400]}
              />
            }
          />
          <ProfileItem
            icon="envelope.fill"
            title="Email Alerts"
            subtitle="Get email notifications"
            rightElement={
              <Switch
                value={emailAlerts}
                onValueChange={setEmailAlerts}
                trackColor={{ false: Colors.neutral[300], true: Colors.primary[200] }}
                thumbColor={emailAlerts ? Colors.primary[600] : Colors.neutral[400]}
              />
            }
          />
          <ProfileItem
            icon="arrow.clockwise.circle.fill"
            title="Auto Sync"
            subtitle="Automatically sync data"
            rightElement={
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: Colors.neutral[300], true: Colors.primary[200] }}
                thumbColor={autoSync ? Colors.primary[600] : Colors.neutral[400]}
              />
            }
          />
          <ProfileItem
            icon="moon.fill"
            title="Dark Mode"
            subtitle="Use dark theme"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: Colors.neutral[300], true: Colors.primary[200] }}
                thumbColor={darkMode ? Colors.primary[600] : Colors.neutral[400]}
              />
            }
          />
        </View>
      </View>

      {/* Security & Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security & Privacy</Text>
        <View style={styles.listContainer}>
          <ProfileItem
            icon="key.fill"
            title="Change Password"
            subtitle="Update your login password"
            onPress={handleChangePassword}
          />
          <ProfileItem
            icon="shield.fill"
            title="Privacy Policy"
            subtitle="Read our privacy policy"
            onPress={() => { }}
          />
          <ProfileItem
            icon="doc.text.fill"
            title="Terms of Service"
            subtitle="Read our terms of service"
            onPress={() => { }}
          />
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <View style={styles.listContainer}>
          <ProfileItem
            icon="arrow.right.square.fill"
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            destructive
          />
          <ProfileItem
            icon="trash.fill"
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
            destructive
          />
        </View>
      </View>

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>E-Wheels App v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.base,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary[600],
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  name: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing.xs,
  },
  role: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary[600],
    marginBottom: Spacing.xs,
  },
  employeeIdText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  section: {
    marginTop: Spacing.base,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing.md,
  },
  editButton: {
    padding: Spacing.xs,
  },
  formContainer: {
    gap: Spacing.base,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  inputHalf: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: Spacing.xs,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[700],
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[900],
    backgroundColor: Colors.white,
  },
  inputDisabled: {
    backgroundColor: Colors.neutral[50],
    color: Colors.neutral[600],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.base,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.neutral[200],
    paddingVertical: Spacing.base,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[700],
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary[600],
    paddingVertical: Spacing.base,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
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
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  versionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
});
