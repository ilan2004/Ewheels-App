import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { CustomerSelection } from '@/components/customers/CustomerSelection';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { mapCustomerForInvoice } from '@/lib/customerMapping';
import {
  calculateInvoiceTotals,
  createBlankInvoiceItem,
  formatCurrency,
  updateInvoiceItemCalculations,
  validateInvoiceItem,
} from '@/lib/invoiceCalculations';
import { generateAndShareInvoicePDF } from '@/lib/pdfGenerator';
import { InvoiceService } from '@/services/invoiceService';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { Customer } from '@/types/customer';
import { CreateInvoiceRequest, InvoiceCustomer, InvoiceItem } from '@/types/invoice';

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
          <View style={[styles.fieldContainer, { flex: 1 }]}>
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
          <View style={[styles.fieldContainer, { flex: 1 }]}>
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

        {/* Discount & Tax Rates */}
        <View style={styles.threeColumnRow}>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Disc %</Text>
            <TextInput
              style={styles.numberInput}
              value={item.discount.toString()}
              onChangeText={(value) => handleFieldChange('discount', parseFloat(value) || 0)}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>SGST %</Text>
            <TextInput
              style={styles.numberInput}
              value={item.sgst_rate.toString()}
              onChangeText={(value) => handleFieldChange('sgst_rate', parseFloat(value) || 0)}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.fieldContainer, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>CGST %</Text>
            <TextInput
              style={styles.numberInput}
              value={item.cgst_rate.toString()}
              onChangeText={(value) => handleFieldChange('cgst_rate', parseFloat(value) || 0)}
              keyboardType="numeric"
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
            <Text style={styles.totalLabel}>Tax (SGST+CGST):</Text>
            <Text style={styles.totalValue}>{formatCurrency(item.sgst_amount + item.cgst_amount)}</Text>
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
    address: '',
    gstNumber: '',
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
  const [currency] = useState('INR');

  const [shippingAmount, setShippingAmount] = useState(0);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);

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

  const totals = calculateInvoiceTotals(lineItems, shippingAmount, adjustmentAmount);

  const handlePreviewPDF = async () => {
    await generateAndShareInvoicePDF({
      invoiceNumber: 'DRAFT',
      date: new Date(),
      dueDate,
      customer,
      items: lineItems,
      totals,
      notes,
      terms
    });
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
      items: lineItems,
      currency,
      due_date: dueDate.toISOString(),
      notes: notes.trim() || undefined,
      terms: terms.trim() || undefined,
      shipping_amount: shippingAmount,
      adjustment_amount: adjustmentAmount,
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
                <View style={[styles.fieldContainer, { flex: 1 }]}>
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
                <View style={[styles.fieldContainer, { flex: 1 }]}>
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
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput
                  style={[styles.textInput, { height: 80 }]}
                  value={customer.address || ''}
                  onChangeText={(value) => handleCustomerFieldChange('address', value)}
                  placeholder="Enter full address"
                  multiline
                  placeholderTextColor={BrandColors.ink + '60'}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>GST Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={customer.gstNumber || ''}
                  onChangeText={(value) => handleCustomerFieldChange('gstNumber', value)}
                  placeholder="GSTIN"
                  placeholderTextColor={BrandColors.ink + '60'}
                />
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
                key={item.id || index}
                item={item}
                onUpdate={(updatedItem) => handleLineItemUpdate(index, updatedItem)}
                onDelete={() => handleDeleteLineItem(index)}
              />
            ))}
          </View>

          {/* Additional Costs Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Costs</Text>
            <View style={styles.card}>
              <View style={styles.twoColumnRow}>
                <View style={[styles.fieldContainer, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Shipping Amount</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={shippingAmount.toString()}
                    onChangeText={(v) => setShippingAmount(parseFloat(v) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.fieldContainer, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Adjustment (+/-)</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={adjustmentAmount.toString()}
                    onChangeText={(v) => setAdjustmentAmount(parseFloat(v) || 0)}
                    keyboardType="numeric"
                    placeholder="-0.00"
                  />
                </View>
              </View>
            </View>
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
                <Text style={styles.summaryValue}>-{formatCurrency(totals.discount_total)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>SGST:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totals.sgst_total)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>CGST:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totals.cgst_total)}</Text>
              </View>
              {totals.shipping_amount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping:</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totals.shipping_amount)}</Text>
                </View>
              )}
              {totals.adjustment_amount !== 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Adjustment:</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totals.adjustment_amount)}</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.finalSummaryRow]}>
                <Text style={styles.finalSummaryLabel}>Total Amount:</Text>
                <Text style={styles.finalSummaryValue}>{formatCurrency(totals.grand_total)}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={handlePreviewPDF} style={styles.pdfButton}>
              <IconSymbol name="doc.text" size={20} color={BrandColors.primary} />
              <Text style={styles.pdfButtonText}>Preview PDF</Text>
            </TouchableOpacity>
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
    paddingBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
    backgroundColor: BrandColors.surface,
    minHeight: 48, // Better touch target
  },
  numberInput: {
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
    backgroundColor: BrandColors.surface,
    textAlign: 'right',
    minHeight: 48, // Better touch target
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  twoColumnRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  threeColumnRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    backgroundColor: BrandColors.surface,
    minHeight: 48,
  },
  datePickerText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm, // Increase touch area
  },
  addItemText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
  },
  lineItemRow: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '05',
  },
  lineItemLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  lineItemFields: {
    gap: Spacing.md,
  },
  calculatedTotals: {
    backgroundColor: BrandColors.primary + '08',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '80',
  },
  totalValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: BrandColors.ink + '20',
    paddingTop: 8,
    marginTop: 8,
  },
  finalTotalLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  finalTotalValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  summaryCard: {
    backgroundColor: BrandColors.primary + '08',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.primary + '20',
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
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
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  finalSummaryLabel: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  finalSummaryValue: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: BrandColors.primary + '10',
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: BrandColors.primary + '30',
  },
  pdfButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
  },
});
