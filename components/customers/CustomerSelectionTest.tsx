import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { CustomerSelection } from './CustomerSelection';
import { Customer } from '@/types/customer';
import { BrandColors } from '@/constants/design-system';

/**
 * Test component to debug CustomerSelection touch handling
 * Use this to test if clicking anywhere on the customer field opens the picker
 */
export const CustomerSelectionTest: React.FC = () => {
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer);
    Alert.alert('Customer Selected', `Selected: ${customer.name}`);
    console.log('Customer selected in test:', customer);
  };

  const handleNameChange = (text: string) => {
    setCustomerName(text);
    console.log('Customer name changed:', text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Selection Touch Test</Text>
      
      <Text style={styles.instruction}>
        Tap anywhere on the customer field below to open the picker modal
      </Text>
      
      <CustomerSelection
        value={customerName}
        onChangeText={handleNameChange}
        onCustomerSelected={handleCustomerSelected}
        initialCustomer={selectedCustomer}
        locationId="test-location" 
        placeholder="Search or add customer..."
        label="Customer Name *"
        style={styles.customerSelection}
      />

      <Text style={styles.debug}>
        Current value: {customerName}
        {selectedCustomer && `\nLinked customer: ${selectedCustomer.name}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: BrandColors.surface,
    paddingTop: 100, // Account for status bar
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandColors.title,
    marginBottom: 16,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 14,
    color: BrandColors.ink + '80',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  customerSelection: {
    marginBottom: 24,
  },
  debug: {
    fontSize: 12,
    color: BrandColors.ink + '60',
    fontFamily: 'monospace',
    backgroundColor: BrandColors.ink + '05',
    padding: 12,
    borderRadius: 8,
  },
});

export default CustomerSelectionTest;
