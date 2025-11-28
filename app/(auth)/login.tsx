import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, ComponentStyles, Shadows, Spacing, Typography } from '@/constants/design-system';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Location, useLocationStore } from '@/stores/locationStore';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(1, 'Please enter your email or username'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  location: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { signIn, loading } = useAuthStore();
  const { switchLocation } = useLocationStore();
  const [showPassword, setShowPassword] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      location: '',
    },
  });

  // Load locations when email is entered (or when form loads)
  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoadingLocations(true);
      const { data: locations, error } = await supabase
        .from('locations')
        .select('id, name, code')
        .order('name', { ascending: true });

      if (error) {
        console.warn('Could not load locations:', error);
        // Fallback to default location
        const defaultLocation = { id: 'default', name: 'Default Location', code: 'DEFAULT' };
        setAvailableLocations([defaultLocation]);
        setSelectedLocation(defaultLocation);
        setValue('location', defaultLocation.id);
      } else {
        setAvailableLocations(locations || []);
        if (locations && locations.length > 0) {
          // Auto-select first location if only one available
          if (locations.length === 1) {
            setSelectedLocation(locations[0]);
            setValue('location', locations[0].id);
          }
        }
      }
    } catch (error) {
      console.warn('Error loading locations:', error);
      const defaultLocation = { id: 'default', name: 'Default Location', code: 'DEFAULT' };
      setAvailableLocations([defaultLocation]);
      setSelectedLocation(defaultLocation);
      setValue('location', defaultLocation.id);
    } finally {
      setLoadingLocations(false);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    try {
      // Check if location is required and not selected
      if (availableLocations.length > 1 && !selectedLocation) {
        Alert.alert('Location Required', 'Please select your branch location.');
        return;
      }

      // Sign in with selected location
      await signIn(data.email, data.password, selectedLocation?.id);

      // The location will be initialized automatically by the auth store

      // Navigation will be handled automatically by the auth layout
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'Please check your credentials and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setValue('location', location.id);
    setShowLocationModal(false);
  };

  const renderLocationItem = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={[
        styles.locationItem,
        selectedLocation?.id === item.id && styles.activeLocationItem
      ]}
      onPress={() => handleLocationSelect(item)}
    >
      <View style={styles.locationInfo}>
        <Text style={[
          styles.locationName,
          selectedLocation?.id === item.id && styles.activeLocationName
        ]}>
          {item.name}
        </Text>
        {item.code && (
          <Text style={[
            styles.locationCode,
            selectedLocation?.id === item.id && styles.activeLocationCode
          ]}>
            {item.code}
          </Text>
        )}
      </View>
      {selectedLocation?.id === item.id && (
        <IconSymbol name="checkmark.circle.fill" size={20} color="#3B82F6" />
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.content}>
          {/* Logo and Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>EV</Text>
              </View>
            </View>
            <ThemedText type="title" style={styles.title}>
              EV Wheels
            </ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>
              Sign in to your account
            </ThemedText>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            {/* Email/Username Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email or Username</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Enter your email or username"
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                )}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.passwordInput,
                        errors.password && styles.inputError,
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View>

            {/* Branch/Location Selection */}
            {availableLocations.length > 1 && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Branch Location</Text>
                <TouchableOpacity
                  style={[
                    styles.locationSelector,
                    !selectedLocation && styles.inputError
                  ]}
                  onPress={() => setShowLocationModal(true)}
                  disabled={loadingLocations}
                >
                  <View style={styles.locationSelectorContent}>
                    <IconSymbol
                      name="location.fill"
                      size={20}
                      color={selectedLocation ? BrandColors.primary : BrandColors.ink + '60'}
                    />
                    <Text style={[
                      styles.locationSelectorText,
                      !selectedLocation && styles.placeholderText
                    ]}>
                      {loadingLocations
                        ? 'Loading locations...'
                        : selectedLocation?.name || 'Select your branch'}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.down" size={16} color="#9CA3AF" />
                </TouchableOpacity>
                {!selectedLocation && availableLocations.length > 1 && (
                  <Text style={styles.errorText}>Please select your branch location</Text>
                )}
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

          </View>
        </ThemedView>
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLocationModal}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Branch Location</Text>
              <TouchableOpacity
                onPress={() => setShowLocationModal(false)}
                style={styles.closeButton}
              >
                <IconSymbol name="xmark" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Choose your branch location to access location-specific data and services.
            </Text>

            <FlatList
              data={availableLocations}
              keyExtractor={(item) => item.id}
              renderItem={renderLocationItem}
              style={styles.locationList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  logoText: {
    color: Colors.white,
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.base,
  },
  form: {
    gap: Spacing.xl,
  },
  inputContainer: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
  },
  input: {
    ...ComponentStyles.input,
    height: 52,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    ...Shadows.sm,
  },
  inputError: {
    borderColor: Colors.error[500],
    borderWidth: 2,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    ...ComponentStyles.input,
    flex: 1,
    height: 52,
    paddingRight: 60,
    fontFamily: Typography.fontFamily.regular,
    ...Shadows.sm,
  },
  showPasswordButton: {
    position: 'absolute',
    right: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  showPasswordText: {
    color: BrandColors.primary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error[600],
  },
  loginButton: {
    ...ComponentStyles.button.primary,
    height: 52,
    marginTop: Spacing.sm,
  },
  loginButtonDisabled: {
    backgroundColor: BrandColors.ink + '40', // 25% opacity
    opacity: 0.6,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  // Location Selector Styles
  locationSelector: {
    ...ComponentStyles.input,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    ...Shadows.sm,
  },
  locationSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  locationSelectorText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[900],
    flex: 1,
  },
  placeholderText: {
    color: Colors.neutral[400],
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '70%',
    paddingBottom: Spacing.lg,
    ...Shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[900],
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    lineHeight: 20,
  },
  locationList: {
    paddingHorizontal: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: '#F9FAFB',
  },
  activeLocationItem: {
    backgroundColor: '#EBF4FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  activeLocationName: {
    color: '#1D4ED8',
  },
  locationCode: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  activeLocationCode: {
    color: '#3B82F6',
  },
});
