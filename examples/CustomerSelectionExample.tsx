import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { CustomerSelection } from '@/components/customers/CustomerSelection';
import { Customer } from '@/types/customer';
import { BrandColors } from '@/constants/design-system';

/**
 * Example Usage of CustomerSelection Component
 * 
 * This demonstrates the complete customer selection UI/UX flow that exactly
 * replicates web app behavior with:
 * 
 * 1. Customer Input Field Component
 * 2. Customer Picker Modal (Full Screen)
 * 3. Customer Quick Add Modal (Slides Over)
 * 4. Integration & State Management
 * 5. Auto-fill Behavior
 */

export const CustomerSelectionExample: React.FC = () => {
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer);
    Alert.alert('Customer Selected', `Selected: ${customer.name}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Selection Example</Text>
      
      {/* CustomerSelection Component */}
      <CustomerSelection
        value={customerName}
        onChangeText={setCustomerName}
        onCustomerSelected={handleCustomerSelected}
        initialCustomer={selectedCustomer}
        locationId="your-location-id" // Optional: for location filtering
        placeholder="Search or add customer..."
        label="Customer"
        style={styles.customerSelection}
      />

      {/* Display Selected Customer Info */}
      {selectedCustomer && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedTitle}>Selected Customer:</Text>
          <Text style={styles.selectedText}>Name: {selectedCustomer.name}</Text>
          {selectedCustomer.phone && (
            <Text style={styles.selectedText}>Phone: {selectedCustomer.phone}</Text>
          )}
          {selectedCustomer.email && (
            <Text style={styles.selectedText}>Email: {selectedCustomer.email}</Text>
          )}
          {selectedCustomer.address && (
            <Text style={styles.selectedText}>Address: {selectedCustomer.address}</Text>
          )}
          <Text style={styles.linkedText}>
            Customer ID: {selectedCustomer.id}
          </Text>
        </View>
      )}

      <Text style={styles.description}>
        The CustomerSelection component provides:
        {'\n\n'}• Touchable input field with search icon
        {'\n'}• Full-screen customer picker modal  
        {'\n'}• Real-time search with debouncing
        {'\n'}• Customer quick add modal for new customers
        {'\n'}• Auto-fill behavior when selecting existing customers
        {'\n'}• "Linked to" display with clear link option
        {'\n'}• Editable fields without breaking the link
        {'\n'}• Proper keyboard handling and touch interactions
        {'\n'}• Haptic feedback and smooth animations
        {'\n'}• Error handling and loading states
        {'\n'}• Accessibility support
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: BrandColors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandColors.title,
    marginBottom: 24,
    textAlign: 'center',
  },
  customerSelection: {
    marginBottom: 24,
  },
  selectedInfo: {
    backgroundColor: BrandColors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BrandColors.primary + '30',
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.title,
    marginBottom: 8,
  },
  selectedText: {
    fontSize: 14,
    color: BrandColors.ink,
    marginBottom: 4,
  },
  linkedText: {
    fontSize: 12,
    color: BrandColors.primary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: BrandColors.ink + '80',
    lineHeight: 20,
  },
});

export default CustomerSelectionExample;

/**
 * Usage in Invoice Creation or Similar Forms:
 * 
 * ```tsx
 * import { CustomerSelection } from '@/components/customers/CustomerSelection';
 * 
 * export default function CreateInvoiceScreen() {
 *   const [customerData, setCustomerData] = useState({
 *     name: '',
 *     email: '',
 *     phone: '',
 *     address: '',
 *   });
 *   const [linkedCustomerId, setLinkedCustomerId] = useState<string | null>(null);
 * 
 *   const handleCustomerSelected = (customer: Customer) => {
 *     // Auto-populate form fields
 *     setCustomerData({
 *       name: customer.name || '',
 *       email: customer.email || '',
 *       phone: customer.phone || customer.contact || '',
 *       address: customer.address || '',
 *     });
 *     setLinkedCustomerId(customer.id);
 *   };
 * 
 *   return (
 *     <ScrollView>
 *       <CustomerSelection
 *         value={customerData.name}
 *         onChangeText={(name) => setCustomerData(prev => ({ ...prev, name }))}
 *         onCustomerSelected={handleCustomerSelected}
 *         locationId={activeLocation?.id}
 *         placeholder="Search or add customer..."
 *         label="Customer Name *"
 *       />
 *       
 *       // Other form fields...
 *       <TextInput
 *         value={customerData.email}
 *         onChangeText={(email) => setCustomerData(prev => ({ ...prev, email }))}
 *         placeholder="Email"
 *       />
 *       
 *       // When saving, include linkedCustomerId for database relationships
 *       const saveData = {
 *         customer: customerData,
 *         linkedCustomerId,
 *         // ... other form data
 *       };
 *     </ScrollView>
 *   );
 * }
 * ```
 */
