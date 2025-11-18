import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { CustomerQuickAddProps, CustomerFormData } from '@/types/customer';
import { CustomerService } from '@/services/customerService';
import { BrandColors, Typography, Spacing, BorderRadius, Shadows, Colors } from '@/constants/design-system';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface FormFieldProps {
  label: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  control: any;
  name: string;
  errors: any;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  placeholder,
  required = false,
  multiline = false,
  keyboardType = 'default',
  control,
  name,
  errors,
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={styles.requiredMark}> *</Text>}
    </Text>
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextInput
          style={[
            styles.textInput,
            multiline && styles.multilineInput,
            errors[name] && styles.inputError,
          ]}
          placeholder={placeholder}
          placeholderTextColor={BrandColors.ink + '60'}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      )}
    />
    {errors[name] && (
      <Text style={styles.errorText}>{errors[name]?.message}</Text>
    )}
  </View>
);

export const CustomerQuickAddModal: React.FC<CustomerQuickAddProps> = ({
  visible,
  onClose,
  onCustomerCreated,
  locationId,
}) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    defaultValues: {
      name: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      gst_number: '',
      city: '',
      state: '',
      postal_code: '',
      alt_contact: '',
      notes: '',
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: CustomerService.createCustomer,
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        onCustomerCreated(response.data);
        reset();
        onClose();
        Alert.alert('Success', 'Customer created successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to create customer');
      }
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Error creating customer:', error);
      Alert.alert('Error', 'Failed to create customer');
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);

    // Check if customer already exists
    const existingCustomer = await CustomerService.checkCustomerExists(
      data.phone || undefined,
      data.email || undefined
    );

    if (existingCustomer) {
      Alert.alert(
        'Customer Exists',
        `A customer with this ${existingCustomer.phone === data.phone ? 'phone number' : 'email'} already exists: ${existingCustomer.name}`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsSubmitting(false) },
          {
            text: 'Use Existing',
            onPress: () => {
              onCustomerCreated(existingCustomer);
              reset();
              onClose();
              setIsSubmitting(false);
            },
          },
        ]
      );
      return;
    }

    // Create new customer
    createCustomerMutation.mutate({
      name: data.name.trim(),
      contact: data.contact?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
      address: data.address?.trim() || undefined,
      gst_number: data.gst_number?.trim() || undefined,
      city: data.city?.trim() || undefined,
      state: data.state?.trim() || undefined,
      postal_code: data.postal_code?.trim() || undefined,
      alt_contact: data.alt_contact?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      location_id: locationId,
    });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={BrandColors.ink} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Add Customer</Text>
            <Text style={styles.subtitle}>Quickly add a new customer</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <FormField
              label="Name"
              placeholder="Enter full name"
              required
              control={control}
              name="name"
              errors={errors}
            />

            <FormField
              label="Phone"
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              control={control}
              name="phone"
              errors={errors}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Contact</Text>
              <Text style={styles.fieldSubtitle}>Alternate contact</Text>
              <Controller
                control={control}
                name="contact"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.textInput, errors.contact && styles.inputError]}
                    placeholder="Alternative contact"
                    placeholderTextColor={BrandColors.ink + '60'}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.contact && (
                <Text style={styles.errorText}>{errors.contact?.message}</Text>
              )}
            </View>

            <FormField
              label="Email"
              placeholder="email@example.com"
              keyboardType="email-address"
              control={control}
              name="email"
              errors={errors}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Address</Text>
              <Controller
                control={control}
                name="address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.textInput, styles.multilineInput, errors.address && styles.inputError]}
                    placeholder="Street address"
                    placeholderTextColor={BrandColors.ink + '60'}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                )}
              />
              {errors.address && (
                <Text style={styles.errorText}>{errors.address?.message}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>GST Number</Text>
              <Text style={styles.fieldSubtitle}>GST / Tax ID</Text>
              <Controller
                control={control}
                name="gst_number"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.textInput, errors.gst_number && styles.inputError]}
                    placeholder="GST/Tax ID"
                    placeholderTextColor={BrandColors.ink + '60'}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.gst_number && (
                <Text style={styles.errorText}>{errors.gst_number?.message}</Text>
              )}
            </View>
          </View>
        </ScrollView>
        
        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            style={[styles.saveButton, isSubmitting && styles.disabledButton]}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
    backgroundColor: BrandColors.surface,
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.title,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: BrandColors.ink + '80',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.ink,
    marginBottom: 4,
  },
  fieldSubtitle: {
    fontSize: 12,
    color: BrandColors.ink + '60',
    marginBottom: 8,
  },
  requiredMark: {
    color: Colors.error[500],
  },
  textInput: {
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: BrandColors.ink,
    backgroundColor: BrandColors.surface,
    minHeight: 48,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputError: {
    borderColor: Colors.error[500],
  },
  errorText: {
    fontSize: 12,
    color: Colors.error[500],
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: BrandColors.ink + '10',
    backgroundColor: BrandColors.surface,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: BrandColors.ink + '40',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: BrandColors.ink,
  },
  saveButton: {
    flex: 1,
    backgroundColor: BrandColors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.surface,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default CustomerQuickAddModal;
