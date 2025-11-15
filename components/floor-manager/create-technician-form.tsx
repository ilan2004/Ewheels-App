import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useLocationStore } from '@/stores/locationStore';
import { useAuthStore } from '@/stores/authStore';

interface CreateTechnicianFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateTechnicianForm: React.FC<CreateTechnicianFormProps> = ({
  onSuccess,
  onCancel,
}) => {
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
      // Get current session access token for Authorization header
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        Alert.alert('Error', 'Please log in to continue');
        return;
      }

      // Call the floor manager API endpoint
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/api/floor-manager/technicians`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          username: formData.username.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create technician');
      }

      // Success
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
      console.error('Error creating technician:', error);
      Alert.alert('Error', error.message || 'Failed to create technician');
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
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <IconSymbol name="person.badge.plus" size={28} color="#3B82F6" />
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
                    placeholderTextColor="#94A3B8"
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
                    placeholderTextColor="#94A3B8"
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
                    placeholderTextColor="#94A3B8"
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

          {/* Branch Assignment Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIconContainer}>
                <IconSymbol name="mappin" size={16} color="#065F46" />
              </View>
              <Text style={styles.infoTitle}>Branch Assignment</Text>
            </View>
            <Text style={styles.infoText}>
              This technician will be automatically assigned to your branch:
            </Text>
            <Text style={styles.branchName}>
              {activeLocation?.name || 'Current Branch'}
            </Text>
            <Text style={styles.infoSubtext}>
              They will only have access to job cards and resources from this location.
            </Text>
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
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <IconSymbol name="checkmark" size={18} color="#FFFFFF" />
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
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerIcon: {
    alignSelf: 'center',
    marginBottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  required: {
    color: '#DC2626',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputFocused: {
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 6,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    letterSpacing: -0.2,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  branchName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    textAlign: 'center',
    marginVertical: 8,
    letterSpacing: -0.2,
  },
  infoSubtext: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.05,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  buttonText: {
    fontSize: 16,
  },
});
