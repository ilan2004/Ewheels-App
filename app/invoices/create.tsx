import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { InvoiceService } from '@/services/invoiceService';
import { InvoiceItem, InvoiceCustomer, CreateInvoiceRequest } from '@/types/invoice';
import { Customer } from '@/types/customer';
import { BrandColors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/design-system';
import {
  createBlankInvoiceItem,
  updateInvoiceItemCalculations,
  calculateInvoiceTotals,
  formatCurrency,
  validateInvoiceItem,
} from '@/lib/invoiceCalculations';
import { mapCustomerForInvoice } from '@/lib/customerMapping';
import { CustomerSelection } from '@/components/customers/CustomerSelection';

interface LineItemRowProps {
  item: InvoiceItem;
  onUpdate: (item: InvoiceItem) => void;
  onDelete: () => void;
}

const LineItemRow: React.FC<LineItemRowProps> = ({ item, onUpdate, onDelete }) => {
  const handleFieldChange = (field: keyof InvoiceItem, value: string | number) => {
    const updatedItem = { ...item, [field]: value };
    const calculatedItem = updateInvoiceItemCalculations(updatedItem);
    onUpdate(calculatedItem);
  };

  return (
    <View style={styles.lineItemRow}>
      <View style={styles.lineItemHeader}>
        <Text style={styles.lineItemLabel}>Line Item</Text>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <IconSymbol name="trash" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.lineItemFields}>
        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={styles.textInput}
            value={item.description}
            onChangeText={(value) => handleFieldChange('description', value)}
            placeholder="Enter description"
            placeholderTextColor={BrandColors.ink + '60'}
            multiline
          />
        </View>

        {/* Quantity & Unit Price */}
        <View style={styles.twoColumnRow}>
          <View style={[styles.fieldContainer, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.fieldLabel}>Quantity</Text>
            <TextInput
              style={styles.numberInput}
              value={item.quantity.toString()}
              onChangeText={(value) => handleFieldChange('quantity', parseFloat(value) || 0)}
              placeholder="1"
              keyboardType="numeric"
              placeholderTextColor={BrandColors.ink + '60'}
            />
          </View>
          <View style={[styles.fieldContainer, { flex: 1, marginLeft: Spacing.sm }]}>
            <Text style={styles.fieldLabel}>Unit Price</Text>
            <TextInput
              style={styles.numberInput}
              value={item.unit_price.toString()}
              onChangeText={(value) => handleFieldChange('unit_price', parseFloat(value) || 0)}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor={BrandColors.ink + '60'}
            />
          </View>
        </View>

        {/* Discount & Tax Rate */}
        <View style={styles.twoColumnRow}>
          <View style={[styles.fieldContainer, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.fieldLabel}>Discount %</Text>
            <TextInput
              style={styles.numberInput}
              value={item.discount.toString()}
              onChangeText={(value) => handleFieldChange('discount', parseFloat(value) || 0)}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={BrandColors.ink + '60'}
            />
          </View>
          <View style={[styles.fieldContainer, { flex: 1, marginLeft: Spacing.sm }]}>
            <Text style={styles.fieldLabel}>Tax Rate %</Text>
            <TextInput
              style={styles.numberInput}
              value={item.tax_rate.toString()}
              onChangeText={(value) => handleFieldChange('tax_rate', parseFloat(value) || 0)}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={BrandColors.ink + '60'}
            />
          </View>
        </View>

        {/* Calculated totals */}
        <View style={styles.calculatedTotals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(item.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount:</Text>
            <Text style={styles.totalValue}>-{formatCurrency(item.discount_amount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text style={styles.totalValue}>{formatCurrency(item.tax_amount)}</Text>
          </View>
          <View style={[styles.totalRow, styles.finalTotal]}>
            <Text style={styles.finalTotalLabel}>Total:</Text>
            <Text style={styles.finalTotalValue}>{formatCurrency(item.total)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function CreateInvoiceScreen() {
  const { user } = useAuthStore();
  const { activeLocation } = useLocationStore();
  const queryClient = useQueryClient();

  // Form state
  const [customer, setCustomer] = useState<InvoiceCustomer>({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    },
  });
  
  // Customer management state - now managed by CustomerSelection component
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [linkedCustomerId, setLinkedCustomerId] = useState<string | undefined>(undefined);

  const [lineItems, setLineItems] = useState<InvoiceItem[]>([
    createBlankInvoiceItem(),
  ]);

  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Payment due within 30 days');
  const [currency] = useState('USD');

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: (request: CreateInvoiceRequest) => InvoiceService.createInvoice(request),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
        Alert.alert(
          'Success',
          'Invoice created successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to create invoice');
      }
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to create invoice');
      console.error('Error creating invoice:', error);
    },
  });

  // Handle customer selection from CustomerSelection component
  const handleCustomerSelected = (dbCustomer: Customer) => {
    const { invoiceCustomer, linkedCustomerId: customerId } = mapCustomerForInvoice(dbCustomer);
    setCustomer(invoiceCustomer);
    setSelectedCustomer(dbCustomer);
    setLinkedCustomerId(customerId);
  };

  const handleCustomerFieldChange = (field: keyof InvoiceCustomer, value: string) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
    // Clear linked customer when manually editing
    if (selectedCustomer) {
      setSelectedCustomer(null);
      setLinkedCustomerId(undefined);
    }
  };

  const handleAddressFieldChange = (field: keyof InvoiceCustomer['address'], value: string) => {
    setCustomer(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
    // Clear linked customer when manually editing
    if (selectedCustomer) {
      setSelectedCustomer(null);
      setLinkedCustomerId(undefined);
    }
  };

  const handleLineItemUpdate = (index: number, updatedItem: InvoiceItem) => {
    setLineItems(prev => 
      prev.map((item, i) => i === index ? updatedItem : item)
    );
  };

  const handleAddLineItem = () => {
    setLineItems(prev => [...prev, createBlankInvoiceItem()]);
  };

  const handleDeleteLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter((_, i) => i !== index));
    } else {
      Alert.alert('Error', 'At least one line item is required');
    }
  };

  const handleSave = () => {
    // Validate customer
    if (!customer.name.trim()) {
      Alert.alert('Validation Error', 'Customer name is required');
      return;
    }

    // Validate line items
    const validationErrors: string[] = [];
    lineItems.forEach((item, index) => {
      const itemErrors = validateInvoiceItem(item);
      if (itemErrors.length > 0) {
        validationErrors.push(`Line Item ${index + 1}: ${itemErrors.join(', ')}`);
      }
    });

    if (validationErrors.length > 0) {
      Alert.alert('Validation Errors', validationErrors.join('\n'));
      return;
    }

    if (!activeLocation?.id) {
      Alert.alert('Error', 'No active location selected');
      return;
    }

    const request: CreateInvoiceRequest = {
      customer: {
        ...customer,
        id: linkedCustomerId, // Include linked customer ID if available
      },
      items: lineItems.map(item => ({
        line_id: item.line_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        tax_rate: item.tax_rate,
        subtotal: item.subtotal,
        discount_amount: item.discount_amount,
        tax_amount: item.tax_amount,
        total: item.total,
      })),
      currency,
      due_date: dueDate.toISOString(),
      notes: notes.trim() || undefined,
      terms: terms.trim() || undefined,
      location_id: activeLocation.id,
    };

    createMutation.mutate(request);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const totals = calculateInvoiceTotals(lineItems);

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={BrandColors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Invoice</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, createMutation.isPending && styles.disabledButton]}
            disabled={createMutation.isPending}
          >
            <Text style={styles.saveButtonText}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Customer Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            
            <View style={styles.card}>
              <CustomerSelection
                value={customer.name}
                onChangeText={(value) => setCustomer(prev => ({ ...prev, name: value }))}
                onCustomerSelected={handleCustomerSelected}
                initialCustomer={selectedCustomer}
                locationId={activeLocation?.id}
                placeholder="Search or add customer..."
                label="Customer Name *"
              />
              
              <View style={styles.twoColumnRow}>
                <View style={[styles.fieldContainer, { flex: 1, marginRight: Spacing.sm }]}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customer.email}
                    onChangeText={(value) => handleCustomerFieldChange('email', value)}
                    placeholder="email@example.com"
                    keyboardType="email-address"
                    placeholderTextColor={BrandColors.ink + '60'}
                  />
                </View>
                <View style={[styles.fieldContainer, { flex: 1, marginLeft: Spacing.sm }]}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customer.phone}
                    onChangeText={(value) => handleCustomerFieldChange('phone', value)}
                    placeholder="+1 (555) 123-4567"
                    keyboardType="phone-pad"
                    placeholderTextColor={BrandColors.ink + '60'}
                  />
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Street Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={customer.address?.street}
                  onChangeText={(value) => handleAddressFieldChange('street', value)}
                  placeholder="123 Main Street"
                  placeholderTextColor={BrandColors.ink + '60'}
                />
              </View>

              <View style={styles.twoColumnRow}>
                <View style={[styles.fieldContainer, { flex: 1, marginRight: Spacing.sm }]}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customer.address?.city}
                    onChangeText={(value) => handleAddressFieldChange('city', value)}
                    placeholder="City"
                    placeholderTextColor={BrandColors.ink + '60'}
                  />
                </View>
                <View style={[styles.fieldContainer, { flex: 1, marginLeft: Spacing.sm }]}>
                  <Text style={styles.fieldLabel}>State/Province</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customer.address?.state}
                    onChangeText={(value) => handleAddressFieldChange('state', value)}
                    placeholder="State"
                    placeholderTextColor={BrandColors.ink + '60'}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Line Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Line Items</Text>
              <TouchableOpacity onPress={handleAddLineItem} style={styles.addItemButton}>
                <IconSymbol name="plus" size={16} color={BrandColors.primary} />
                <Text style={styles.addItemText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {lineItems.map((item, index) => (
              <LineItemRow
                key={item.line_id}
                item={item}
                onUpdate={(updatedItem) => handleLineItemUpdate(index, updatedItem)}
                onDelete={() => handleDeleteLineItem(index)}
              />
            ))}
          </View>

          {/* Invoice Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={styles.card}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Due Date</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {dueDate.toLocaleDateString()}
                  </Text>
                  <IconSymbol name="calendar" size={16} color={BrandColors.ink + '60'} />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Terms</Text>
                <TextInput
                  style={styles.textInput}
                  value={terms}
                  onChangeText={setTerms}
                  placeholder="Payment terms"
                  multiline
                  placeholderTextColor={BrandColors.ink + '60'}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Additional notes (optional)"
                  multiline
                  placeholderTextColor={BrandColors.ink + '60'}
                />
              </View>
            </View>
          </View>

          {/* Totals Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invoice Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totals.subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Discount:</Text>
                <Text style={styles.summaryValue}>-{formatCurrency(totals.totalDiscount)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Tax:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totals.totalTax)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.finalSummaryRow]}>
                <Text style={styles.finalSummaryLabel}>Total Amount:</Text>
                <Text style={styles.finalSummaryValue}>{formatCurrency(totals.total)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
        
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  saveButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.surface,
  },
  disabledButton: {
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
    paddingBottom: 0,
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
    color: BrandColors.title,
    marginBottom: Spacing.base,
  },
  card: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  fieldContainer: {
    marginBottom: Spacing.base,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
    backgroundColor: BrandColors.surface,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
    backgroundColor: BrandColors.surface,
    textAlign: 'right',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  twoColumnRow: {
    flexDirection: 'row',
    marginBottom: Spacing.base,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    backgroundColor: BrandColors.surface,
  },
  datePickerText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  addItemText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
  },
  lineItemRow: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  lineItemLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  lineItemFields: {
    gap: Spacing.base,
  },
  calculatedTotals: {
    backgroundColor: BrandColors.primary + '08',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  totalLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '80',
  },
  totalValue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: BrandColors.ink + '20',
    paddingTop: 4,
    marginTop: 4,
  },
  finalTotalLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  finalTotalValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  summaryCard: {
    backgroundColor: BrandColors.primary + '08',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.primary + '20',
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '80',
  },
  summaryValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
  },
  finalSummaryRow: {
    borderTopWidth: 2,
    borderTopColor: BrandColors.primary,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  finalSummaryLabel: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  finalSummaryValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  // Customer Selection Styles
  selectCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  selectCustomerText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
  },
  selectedCustomerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.primary + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: BrandColors.primary + '30',
  },
  selectedCustomerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  customerDetails: {
    flex: 1,
  },
  selectedCustomerName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginBottom: 2,
  },
  selectedCustomerContact: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.primary,
  },
  clearCustomerButton: {
    padding: Spacing.xs,
  },
  // Smart Customer Input Styles
  customerInputContainer: {
    position: 'relative',
  },
  searchIndicator: {
    position: 'absolute',
    right: Spacing.sm,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  searchResultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: BrandColors.surface,
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    maxHeight: 200,
    zIndex: 1000,
    ...Shadows.md,
  },
  searchResultsList: {
    maxHeight: 150,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
  },
  resultIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BrandColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginBottom: 2,
  },
  resultContact: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.primary,
  },
  createNewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    backgroundColor: BrandColors.primary + '08',
    borderTopWidth: 1,
    borderTopColor: BrandColors.ink + '10',
  },
  createNewIcon: {
    marginRight: Spacing.sm,
  },
  createNewInfo: {
    flex: 1,
  },
  createNewTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
    marginBottom: 2,
  },
  createNewSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
  },
});
