import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Location, useLocationStore } from '@/stores/locationStore';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  FlatList,
  Image,
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
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.content}>
          {/* Logo and Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/ewheels-logo app.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <ThemedText type="title" style={styles.title}>
              Welcome Back
            </ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>
              Sign in to continue to EV Wheels
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
                  <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
                    <IconSymbol name="envelope.fill" size={20} color={BrandColors.ink + '60'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
                <IconSymbol name="lock.fill" size={20} color={BrandColors.ink + '60'} style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
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
                  <IconSymbol
                    name={showPassword ? "eye.slash.fill" : "eye.fill"}
                    size={20}
                    color={BrandColors.ink + '60'}
                  />
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
                    !selectedLocation && styles.inputWrapperError
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
              {!loading && <IconSymbol name="arrow.right" size={20} color={Colors.white} />}
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
    paddingBottom: Spacing['4xl'], // Added extra padding for better scrolling
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
    ...Shadows.md, // Added shadow to logo container
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.white,
    padding: Spacing.sm,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.base,
    opacity: 0.7,
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
    marginLeft: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    height: 56,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  inputWrapperError: {
    borderColor: Colors.error[500],
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
  },
  showPasswordButton: {
    padding: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error[600],
    marginLeft: Spacing.xs,
    marginTop: 2,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
    height: 56,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  loginButtonDisabled: {
    backgroundColor: BrandColors.ink + '40',
    opacity: 0.7,
    ...Shadows.none,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
  },
  // Location Selector Styles
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    height: 56,
    paddingHorizontal: Spacing.md,
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
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: '80%',
    paddingBottom: Spacing.xl,
    ...Shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
  },
  closeButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.full,
  },
  modalDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    lineHeight: 20,
  },
  locationList: {
    paddingHorizontal: Spacing.xl,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginVertical: Spacing.xs,
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.transparent,
  },
  activeLocationItem: {
    backgroundColor: BrandColors.primary + '10',
    borderColor: BrandColors.primary,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginBottom: 2,
  },
  activeLocationName: {
    color: BrandColors.primary,
  },
  locationCode: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[500],
    fontFamily: Typography.fontFamily.medium,
  },
  activeLocationCode: {
    color: BrandColors.primary,
  },
});
