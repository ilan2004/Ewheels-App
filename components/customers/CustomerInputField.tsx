import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/design-system';
import { CustomerInputFieldProps } from '@/types/customer';

export const CustomerInputField: React.FC<CustomerInputFieldProps> = ({
  value,
  onChangeText,
  linkedCustomer,
  onPress,
  onClearLink,
  placeholder = 'Search or add customer...',
  label = 'Customer',
  style,
}) => {
  const hasLinkedCustomer = Boolean(linkedCustomer);

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Input Field */}
      <TouchableOpacity
        style={[
          styles.inputContainer,
          hasLinkedCustomer && styles.inputContainerLinked,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Customer selection field. ${hasLinkedCustomer ? `Currently linked to ${linkedCustomer?.name}` : 'Tap to search or add customer'}`}
      >
        <View style={styles.inputContent}>
          <Text style={[
            styles.inputText, 
            hasLinkedCustomer && styles.inputLinked,
            (!hasLinkedCustomer && !value) && styles.placeholderText
          ]}>
            {hasLinkedCustomer 
              ? linkedCustomer.name 
              : value || placeholder
            }
          </Text>
          
          <Ionicons
            name="search"
            size={20}
            color={hasLinkedCustomer ? BrandColors.primary : BrandColors.ink + '80'}
            style={styles.searchIcon}
          />
        </View>
      </TouchableOpacity>

      {/* Linked Customer Subtitle */}
      {hasLinkedCustomer && linkedCustomer && (
        <View style={styles.linkedCustomerContainer}>
          <View style={styles.linkedCustomerInfo}>
            <Ionicons
              name="link"
              size={16}
              color={BrandColors.primary}
              style={styles.linkIcon}
            />
            <Text style={styles.linkedCustomerText}>
              Linked to: {linkedCustomer.name}
            </Text>
            {linkedCustomer.phone && (
              <Text style={styles.linkedCustomerSubtext}>
                {linkedCustomer.phone}
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.clearLinkButton}
            onPress={onClearLink}
            activeOpacity={0.7}
          >
            <Text style={styles.clearLinkText}>Clear link</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.ink,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: BrandColors.surface,
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    // Ensure it captures touches
    overflow: 'visible',
    position: 'relative',
  },
  inputContainerLinked: {
    borderColor: BrandColors.primary + '40',
    backgroundColor: BrandColors.primary + '08',
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: BrandColors.ink,
    paddingVertical: 12,
  },
  placeholderText: {
    color: BrandColors.ink + '60',
  },
  inputLinked: {
    color: BrandColors.primary,
    fontWeight: '500',
  },
  searchIcon: {
    marginLeft: 8,
  },
  linkedCustomerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  linkedCustomerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkIcon: {
    marginRight: 6,
  },
  linkedCustomerText: {
    fontSize: 12,
    color: BrandColors.primary,
    fontWeight: '500',
  },
  linkedCustomerSubtext: {
    fontSize: 12,
    color: BrandColors.ink + '80',
    marginLeft: 8,
  },
  clearLinkButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearLinkText: {
    fontSize: 12,
    color: BrandColors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default CustomerInputField;
