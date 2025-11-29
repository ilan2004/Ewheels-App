import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  BorderRadius,
  BrandColors,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/design-system';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';

interface CreateTechnicianFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateTechnicianForm: React.FC<CreateTechnicianFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const { activeLocation } = useLocationStore();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const createTechnicianDirectly = async () => {
    const { user: currentUser } = useAuthStore.getState();

    console.log('Creating technician directly with Supabase...');

    try {
      // Step 1: Create auth user using signup (since admin.createUser requires service role)
      // We'll use the signup method which creates both auth user and can trigger profile creation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            username: formData.username.trim(),
            role: 'technician'
          },
          emailRedirectTo: undefined, // Disable email confirmation redirect
        }
      });

      if (authError) {
        console.error('Auth creation error:', authError);
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      if (!authData.user?.id) {
        throw new Error('User creation succeeded but no user ID returned');
      }

      const newUserId = authData.user.id;
      console.log('Created auth user with ID:', newUserId);
      console.log('User email confirmed:', authData.user.email_confirmed_at ? 'Yes' : 'No - will need confirmation');

      // Note: Even if email confirmation is required, we can still create profile and role
      // The technician can confirm email later to fully activate their account
      console.log('User email confirmed:', authData.user.email_confirmed_at);

      // Note: Even if email is not confirmed, we can still create profile and role
      // The technician can confirm email later if needed

      // Step 2: Check if profile already exists (might be created by trigger)
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', newUserId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', checkError);
        throw new Error('Failed to check existing profile');
      }

      if (existingProfile) {
        console.log('Profile already exists (created by trigger), updating it...');
        // Profile exists, update it with our data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username: formData.username.trim(),
            first_name: formData.username.trim(),
            location_id: activeLocation?.id || null,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', newUserId);

        if (updateError) {
          console.error('Profile update error:', updateError);
          console.warn('Profile update failed, continuing with existing profile');
        } else {
          console.log('Updated existing profile successfully');
        }
      } else {
        console.log('Profile does not exist, creating new one...');
        // Profile doesn't exist, create it
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: newUserId,
            username: formData.username.trim(),
            email: formData.email.trim(),
            first_name: formData.username.trim(),
            location_id: activeLocation?.id || null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(`Failed to create profile: ${profileError.message}`);
        } else {
          console.log('Created new profile successfully');
        }
      }

      // Step 3: Assign technician role
      const { error: roleError } = await supabase
        .from('app_roles')
        .insert({
          user_id: newUserId,
          role: 'technician',
          location_id: activeLocation?.id || null,
          created_by: currentUser?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        throw new Error(`Failed to assign technician role: ${roleError.message}`);
      }

      console.log('Successfully assigned technician role');

      // Success!
      Alert.alert(
        'Success',
        `Technician "${formData.username}" has been created successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFormData({
                email: '',
                password: '',
                username: '',
              });
              setErrors({});
              onSuccess?.();
            },
          },
        ]
      );

    } catch (error: any) {
      console.error('Direct technician creation error:', error);
      throw error; // Re-throw to be handled by the main try-catch
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Get current session to ensure user is authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        Alert.alert('Error', 'Please log in to continue');
        return;
      }

      // Create technician using direct Supabase operations
      await createTechnicianDirectly();
      // Success handling is done within createTechnicianDirectly function
    } catch (error: any) {
      console.error('Error creating technician:', error);

      // Show the specific error message to help with debugging
      const errorMessage = error.message || 'Failed to create technician';

      if (errorMessage.includes('Failed to assign role')) {
        Alert.alert(
          'Role Assignment Error',
          `Cannot assign technician role to the new user.\n\nThis indicates a backend database configuration issue. The server cannot insert the role into the app_roles table.\n\nPlease contact your system administrator to:\n• Check database permissions\n• Verify app_roles table structure\n• Review backend role assignment logic`,
          [{ text: 'OK', style: 'default' }]
        );
      } else if (errorMessage.includes('User already exists') || errorMessage.includes('email')) {
        Alert.alert(
          'User Already Exists',
          'A user with this email address already exists. Please use a different email address.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Error Creating Technician',
          errorMessage,
          [{ text: 'OK', style: 'default' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: '',
      password: '',
      username: '',
    });
    setErrors({});
    onCancel?.();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Enhanced Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
          <View style={styles.headerIcon}>
            <IconSymbol name="person.badge.plus" size={28} color={BrandColors.primary} />
          </View>
          <ThemedText type="title" style={styles.title}>
            Create New Technician
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Add a new team member to your branch
          </ThemedText>
        </View>

        <View style={styles.content}>
          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Personal Details</Text>
              {/* Username Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Username <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.username ? styles.inputError : null,
                      focusedField === 'username' ? styles.inputFocused : null,
                    ]}
                    value={formData.username}
                    onChangeText={(text) => {
                      setFormData({ ...formData, username: text });
                      if (errors.username) {
                        setErrors({ ...errors, username: '' });
                      }
                    }}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. john_doe"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    placeholderTextColor={Colors.neutral[400]}
                  />
                </View>
                {errors.username && (
                  <Text style={styles.errorText}>{errors.username}</Text>
                )}
              </View>

              {/* Email Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Email Address <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.email ? styles.inputError : null,
                      focusedField === 'email' ? styles.inputFocused : null,
                    ]}
                    value={formData.email}
                    onChangeText={(text) => {
                      setFormData({ ...formData, email: text });
                      if (errors.email) {
                        setErrors({ ...errors, email: '' });
                      }
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="technician@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    placeholderTextColor={Colors.neutral[400]}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Password <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.password ? styles.inputError : null,
                      focusedField === 'password' ? styles.inputFocused : null,
                    ]}
                    value={formData.password}
                    onChangeText={(text) => {
                      setFormData({ ...formData, password: text });
                      if (errors.password) {
                        setErrors({ ...errors, password: '' });
                      }
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Minimum 8 characters"
                    secureTextEntry
                    editable={!loading}
                    placeholderTextColor={Colors.neutral[400]}
                  />
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
                <Text style={styles.helperText}>
                  The technician will receive login credentials via email
                </Text>
              </View>
            </View>
          </View>

          {/* Branch Assignment Info Card - Quick Action Style */}
          <View style={[styles.actionCard, styles.primaryActionCard]}>
            <View style={[styles.iconContainer, styles.primaryIconContainer]}>
              <IconSymbol name="mappin" size={28} color={BrandColors.primary} />
            </View>
            <Text style={styles.actionTitle}>Branch Assignment</Text>
            <Text style={styles.actionSubtitle}>
              Technician will be assigned to:
            </Text>
            <View style={styles.branchNameTag}>
              <Text style={styles.branchNameText}>
                {activeLocation?.name || 'Current Branch'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.cancelButtonText]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.submitButton,
              loading ? styles.submitButtonDisabled : null,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <IconSymbol name="checkmark" size={18} color={Colors.white} />
                <Text style={[styles.buttonText, styles.submitButtonText]}>
                  Create Technician
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: BrandColors.surface,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  headerIcon: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold as any,
    color: BrandColors.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.neutral[500],
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  formCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: BrandColors.ink,
    marginBottom: Spacing.lg,
    letterSpacing: -0.3,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
    letterSpacing: 0.1,
  },
  required: {
    color: Colors.error[500],
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    backgroundColor: Colors.white,
    color: BrandColors.ink,
    fontWeight: Typography.fontWeight.medium as any,
    ...Shadows.sm,
  },
  inputFocused: {
    borderColor: BrandColors.primary,
    ...Shadows.md,
  },
  inputError: {
    borderColor: Colors.error[500],
    backgroundColor: Colors.error[50],
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error[500],
    marginTop: 6,
    fontWeight: Typography.fontWeight.medium as any,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[500],
    marginTop: 6,
    lineHeight: 18,
  },

  actions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  cancelButtonText: {
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.semibold as any,
    fontSize: Typography.fontSize.base,
  },
  submitButton: {
    backgroundColor: BrandColors.primary,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.neutral[400],
    shadowOpacity: 0.05,
  },
  submitButtonText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold as any,
    fontSize: Typography.fontSize.base,
    letterSpacing: 0.2,
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
  },
  // Quick Actions Style for Branch Assignment
  actionCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    padding: Spacing.lg,
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadows.sm,
  },
  primaryActionCard: {
    borderColor: BrandColors.primary + '30',
    backgroundColor: BrandColors.surface,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  primaryIconContainer: {
    backgroundColor: BrandColors.primary + '10',
  },
  actionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
    marginTop: 2,
    textAlign: 'center',
  },
  branchNameTag: {
    marginTop: Spacing.sm,
    backgroundColor: BrandColors.primary + '10',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  branchNameText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
  },
});
