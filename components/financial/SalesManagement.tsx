import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSales } from '@/hooks/useFinancial';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  BrandColors,
  FinancialColors,
} from '@/constants/design-system';
import {
  Sale,
  SaleForm,
  SalesFilters,
  SaleType,
  PaymentStatus,
  PaymentMethod,
  SaleTypeLabels,
  PaymentStatusLabels,
  PaymentMethodLabels,
} from '@/types/financial.types';

export default function SalesManagement() {
  const { sales, loading, error, pagination, fetchSales, createSale, updateSale, deleteSale } = useSales();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SalesFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [formData, setFormData] = useState<SaleForm>({
    invoice_id: '',
    customer_id: '',
    customer_name: '',
    sale_number: '',
    sale_date: new Date().toISOString().split('T')[0],
    sale_type: 'service',
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    payment_method: 'cash',
    payment_status: 'pending',
    paid_amount: 0,
    description: '',
    notes: '',
  });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = () => {
    fetchSales({ ...filters, search: searchQuery });
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchQuery }));
    fetchSales({ ...filters, search: searchQuery });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return FinancialColors.completed;
      case 'partial': return FinancialColors.pending;
      case 'pending': return FinancialColors.pending;
      case 'overdue': return Colors.error;
      case 'cancelled': return FinancialColors.cancelled;
      default: return Colors.neutral;
    }
  };

  const handleAddSale = () => {
    setEditingSale(null);
    setFormData({
      invoice_id: `INV-${Date.now()}`,
      customer_id: '',
      customer_name: '',
      sale_number: `SALE-${Date.now()}`,
      sale_date: new Date().toISOString().split('T')[0],
      sale_type: 'service',
      subtotal: 0,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 0,
      payment_method: 'cash',
      payment_status: 'pending',
      paid_amount: 0,
      description: '',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      invoice_id: sale.invoice_id,
      service_ticket_id: sale.service_ticket_id,
      customer_id: sale.customer_id,
      customer_name: sale.customer_name || '',
      sale_number: sale.sale_number,
      sale_date: sale.sale_date,
      sale_type: sale.sale_type as SaleType,
      subtotal: sale.subtotal,
      tax_amount: sale.tax_amount,
      discount_amount: sale.discount_amount,
      total_amount: sale.total_amount,
      payment_method: sale.payment_method,
      payment_status: sale.payment_status as PaymentStatus,
      paid_amount: sale.paid_amount,
      description: sale.description,
      notes: sale.notes || '',
    });
    setShowAddModal(true);
  };

  const calculateTotal = () => {
    const total = formData.subtotal + formData.tax_amount - formData.discount_amount;
    setFormData(prev => ({ ...prev, total_amount: Math.max(0, total) }));
  };

  useEffect(() => {
    calculateTotal();
  }, [formData.subtotal, formData.tax_amount, formData.discount_amount]);

  const handleSaveSale = async () => {
    if (!formData.customer_name || !formData.description || formData.total_amount <= 0) {
      Alert.alert('Error', 'Please fill in all required fields and ensure total amount is greater than 0');
      return;
    }

    try {
      if (editingSale) {
        const result = await updateSale(editingSale.id, formData);
        if (result.success) {
          Alert.alert('Success', 'Sale updated successfully');
          setShowAddModal(false);
          loadSales();
        } else {
          Alert.alert('Error', result.error || 'Failed to update sale');
        }
      } else {
        const result = await createSale(formData);
        if (result.success) {
          Alert.alert('Success', 'Sale created successfully');
          setShowAddModal(false);
          loadSales();
        } else {
          Alert.alert('Error', result.error || 'Failed to create sale');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleDeleteSale = (sale: Sale) => {
    Alert.alert(
      'Delete Sale',
      `Are you sure you want to delete sale ${sale.sale_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteSale(sale.id);
            if (result.success) {
              Alert.alert('Success', 'Sale deleted successfully');
              loadSales();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete sale');
            }
          }
        }
      ]
    );
  };

  const renderSaleItem = ({ item }: { item: Sale }) => {
    const statusColor = getStatusColor(item.payment_status);
    
    return (
      <View style={styles.saleCard}>
        <View style={styles.saleHeader}>
          <View style={styles.saleInfo}>
            <Text style={styles.saleNumber}>{item.sale_number}</Text>
            <Text style={styles.saleCustomer}>{item.customer_name || 'N/A'}</Text>
          </View>
          <View style={styles.saleActions}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.background }]}>
              <Text style={[styles.statusText, { color: statusColor.primary }]}>
                {PaymentStatusLabels[item.payment_status as PaymentStatus] || item.payment_status}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.saleBody}>
          <Text style={styles.saleDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.saleDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{new Date(item.sale_date).toLocaleDateString()}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{SaleTypeLabels[item.sale_type as SaleType] || item.sale_type}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment:</Text>
              <Text style={styles.detailValue}>{PaymentMethodLabels[item.payment_method] || item.payment_method}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.saleFooter}>
          <View style={styles.amountContainer}>
            <Text style={styles.totalAmount}>{formatCurrency(item.total_amount)}</Text>
            <Text style={styles.paidAmount}>
              Paid: {formatCurrency(item.paid_amount)}
            </Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditSale(item)}
            >
              <IconSymbol size={16} name="pencil" color={BrandColors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteSale(item)}
            >
              <IconSymbol size={16} name="trash" color={Colors.error[500]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Search and Add Button */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <IconSymbol size={20} name="magnifyingglass" color={Colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sales..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={handleAddSale}>
          <IconSymbol size={20} name="plus" color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Sales List */}
      <FlatList
        data={sales}
        renderItem={renderSaleItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadSales} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol size={48} name="doc.text" color={Colors.neutral[400]} />
            <Text style={styles.emptyStateText}>No sales found</Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddSale}>
              <Text style={styles.emptyStateButtonText}>Add First Sale</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add/Edit Sale Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingSale ? 'Edit Sale' : 'Add New Sale'}
            </Text>
            <TouchableOpacity onPress={handleSaveSale}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Customer Information */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Customer Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.customer_name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, customer_name: text }))}
                  placeholder="Enter customer name"
                />
              </View>
            </View>

            {/* Sale Details */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Sale Details</Text>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                  <Text style={styles.inputLabel}>Sale Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.sale_number}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, sale_number: text }))}
                    placeholder="SALE-001"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.sale_date}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, sale_date: text }))}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Describe the sale..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Financial Details */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Financial Details</Text>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                  <Text style={styles.inputLabel}>Subtotal</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.subtotal.toString()}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, subtotal: parseFloat(text) || 0 }))}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
                  <Text style={styles.inputLabel}>Tax Amount</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.tax_amount.toString()}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, tax_amount: parseFloat(text) || 0 }))}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                  <Text style={styles.inputLabel}>Discount</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.discount_amount.toString()}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(text) || 0 }))}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
                  <Text style={styles.inputLabel}>Total Amount</Text>
                  <TextInput
                    style={[styles.textInput, styles.totalInput]}
                    value={formatCurrency(formData.total_amount)}
                    editable={false}
                  />
                </View>
              </View>
            </View>

            {/* Payment Information */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Paid Amount</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.paid_amount.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, paid_amount: parseFloat(text) || 0 }))}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                  placeholder="Additional notes..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
  },
  addButton: {
    backgroundColor: BrandColors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  listContainer: {
    padding: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  saleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.base,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  saleInfo: {
    flex: 1,
  },
  saleNumber: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginBottom: 2,
  },
  saleCustomer: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  saleActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'uppercase',
  },
  saleBody: {
    marginBottom: Spacing.md,
  },
  saleDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
    lineHeight: Typography.lineHeight.base,
    marginBottom: Spacing.md,
  },
  saleDetails: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    paddingTop: Spacing.md,
  },
  amountContainer: {
    flex: 1,
  },
  totalAmount: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  paidAmount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: FinancialColors.income.primary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: BrandColors.primary + '15',
  },
  deleteButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.error[50],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[500],
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  emptyStateButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    backgroundColor: BrandColors.surface,
  },
  cancelButton: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[600],
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  saveButton: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.base,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.base,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: Spacing.base,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
    backgroundColor: Colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  totalInput: {
    backgroundColor: Colors.neutral[50],
    color: BrandColors.title,
    fontFamily: Typography.fontFamily.bold,
  },
});
