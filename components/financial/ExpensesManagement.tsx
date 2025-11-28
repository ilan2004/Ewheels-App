import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  BorderRadius,
  BrandColors,
  Colors,
  FinancialColors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/design-system';
import { useExpenses } from '@/hooks/useFinancial';
import { generateExpensesPDF } from '@/lib/reportPDFGenerator';
import {
  ApprovalStatus,
  ApprovalStatusLabels,
  Expense,
  ExpenseCategoryLabels,
  ExpenseForm,
  ExpensesFilters,
  PaymentMethodLabels
} from '@/types/financial.types';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ExpensesManagement() {
  const { expenses, loading, error, pagination, fetchExpenses, createExpense, updateExpense, deleteExpense } = useExpenses();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ExpensesFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const getMonthName = (monthIndex: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  };

  const changeMonth = (increment: number) => {
    let newMonth = selectedMonth + increment;
    let newYear = selectedYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // Form state
  const [formData, setFormData] = useState<ExpenseForm>({
    expense_number: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: 'office_supplies',
    amount: 0,
    tax_amount: 0,
    total_amount: 0,
    payment_method: 'cash',
    payment_reference: '',
    vendor_name: '',
    vendor_contact: '',
    invoice_number: '',
    description: '',
    purpose: '',
    notes: '',
    approval_status: 'pending',
    receipt_number: '',
    document_path: '',
  });

  useEffect(() => {
    loadExpenses();
  }, [selectedMonth, selectedYear]);

  const loadExpenses = () => {
    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
    const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
    fetchExpenses({ ...filters, search: searchQuery, startDate, endDate });
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchQuery }));
    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
    const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
    fetchExpenses({ ...filters, search: searchQuery, startDate, endDate });
  };

  const handleExport = async () => {
    try {
      await generateExpensesPDF(expenses, selectedMonth, selectedYear);
    } catch (error) {
      Alert.alert('Export Failed', 'An error occurred while generating the PDF.');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return FinancialColors.completed;
      case 'pending': return FinancialColors.pending;
      case 'rejected': return {
        primary: Colors.error[500],
        background: Colors.error[50],
        text: Colors.error[700]
      };
      default: return {
        primary: Colors.neutral[500],
        background: Colors.neutral[50],
        text: Colors.neutral[700]
      };
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setFormData({
      expense_number: `EXP-${Date.now()}`,
      expense_date: new Date().toISOString().split('T')[0],
      category: 'office_supplies',
      amount: 0,
      tax_amount: 0,
      total_amount: 0,
      payment_method: 'cash',
      payment_reference: '',
      vendor_name: '',
      vendor_contact: '',
      invoice_number: '',
      description: '',
      purpose: '',
      notes: '',
      approval_status: 'pending',
      receipt_number: '',
      document_path: '',
    });
    setShowAddModal(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      expense_number: expense.expense_number,
      expense_date: expense.expense_date,
      category: expense.category,
      amount: expense.amount,
      tax_amount: expense.tax_amount,
      total_amount: expense.total_amount,
      payment_method: expense.payment_method,
      payment_reference: expense.payment_reference || '',
      vendor_name: expense.vendor_name || '',
      vendor_contact: expense.vendor_contact || '',
      invoice_number: expense.invoice_number || '',
      description: expense.description,
      purpose: expense.purpose || '',
      notes: expense.notes || '',
      approval_status: expense.approval_status as ApprovalStatus,
      approved_by: expense.approved_by,
      receipt_number: expense.receipt_number || '',
      document_path: expense.document_path || '',
    });
    setShowAddModal(true);
  };

  const calculateTotal = () => {
    const total = formData.amount + formData.tax_amount;
    setFormData(prev => ({ ...prev, total_amount: Math.max(0, total) }));
  };

  useEffect(() => {
    calculateTotal();
  }, [formData.amount, formData.tax_amount]);

  const handleSaveExpense = async () => {
    if (!formData.vendor_name || !formData.description || formData.total_amount <= 0) {
      Alert.alert('Error', 'Please fill in all required fields and ensure total amount is greater than 0');
      return;
    }

    try {
      if (editingExpense) {
        const result = await updateExpense(editingExpense.id, formData);
        if (result.success) {
          Alert.alert('Success', 'Expense updated successfully');
          setShowAddModal(false);
          loadExpenses();
        } else {
          Alert.alert('Error', result.error || 'Failed to update expense');
        }
      } else {
        const result = await createExpense(formData);
        if (result.success) {
          Alert.alert('Success', 'Expense created successfully');
          setShowAddModal(false);
          loadExpenses();
        } else {
          Alert.alert('Error', result.error || 'Failed to create expense');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete expense ${expense.expense_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteExpense(expense.id);
            if (result.success) {
              Alert.alert('Success', 'Expense deleted successfully');
              loadExpenses();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete expense');
            }
          }
        }
      ]
    );
  };

  const handleApprovalAction = (expense: Expense, action: 'approve' | 'reject') => {
    const actionText = action === 'approve' ? 'approve' : 'reject';
    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Expense`,
      `Are you sure you want to ${actionText} expense ${expense.expense_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          onPress: async () => {
            const result = await updateExpense(expense.id, {
              approval_status: action === 'approve' ? 'approved' : 'rejected'
            });
            if (result.success) {
              Alert.alert('Success', `Expense ${actionText}d successfully`);
              loadExpenses();
            } else {
              Alert.alert('Error', result.error || `Failed to ${actionText} expense`);
            }
          }
        }
      ]
    );
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const statusColor = getApprovalStatusColor(item.approval_status);

    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseNumber}>{item.expense_number}</Text>
            <Text style={styles.expenseVendor}>{item.vendor_name || 'N/A'}</Text>
          </View>
          <View style={styles.expenseActions}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.background }]}>
              <Text style={[styles.statusText, { color: statusColor.primary }]}>
                {ApprovalStatusLabels[item.approval_status as ApprovalStatus] || item.approval_status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.expenseBody}>
          <Text style={styles.expenseDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {item.purpose && (
            <Text style={styles.expensePurpose} numberOfLines={1}>
              Purpose: {item.purpose}
            </Text>
          )}

          <View style={styles.expenseDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{new Date(item.expense_date).toLocaleDateString()}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{ExpenseCategoryLabels[item.category] || item.category}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment:</Text>
              <Text style={styles.detailValue}>{PaymentMethodLabels[item.payment_method] || item.payment_method}</Text>
            </View>

            {item.invoice_number && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Invoice:</Text>
                <Text style={styles.detailValue}>{item.invoice_number}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.expenseFooter}>
          <View style={styles.amountContainer}>
            <Text style={styles.totalAmount}>{formatCurrency(item.total_amount)}</Text>
            {item.tax_amount > 0 && (
              <Text style={styles.taxAmount}>
                Tax: {formatCurrency(item.tax_amount)}
              </Text>
            )}
          </View>

          <View style={styles.actionButtons}>
            {item.approval_status === 'pending' && (
              <>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleApprovalAction(item, 'approve')}
                >
                  <IconSymbol size={16} name="checkmark" color={FinancialColors.completed.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleApprovalAction(item, 'reject')}
                >
                  <IconSymbol size={16} name="xmark" color={Colors.error[500]} />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditExpense(item)}
            >
              <IconSymbol size={16} name="pencil" color={BrandColors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteExpense(item)}
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
        <View style={styles.headerTopRow}>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
              <IconSymbol name="chevron.left" size={20} color={BrandColors.primary} />
            </TouchableOpacity>

            <View style={styles.dateDisplay}>
              <IconSymbol name="calendar" size={16} color={Colors.neutral[500]} style={{ marginRight: 6 }} />
              <Text style={styles.dateText}>{getMonthName(selectedMonth)} {selectedYear}</Text>
            </View>

            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
              <IconSymbol name="chevron.right" size={20} color={BrandColors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
              <IconSymbol name="square.and.arrow.up" size={18} color={BrandColors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleAddExpense}>
              <IconSymbol size={20} name="plus" color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <IconSymbol size={20} name="magnifyingglass" color={Colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      {/* Expenses List */}
      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadExpenses} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol size={48} name="doc.text" color={Colors.neutral[400]} />
            <Text style={styles.emptyStateText}>No expenses found</Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddExpense}>
              <Text style={styles.emptyStateButtonText}>Add First Expense</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add/Edit Expense Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </Text>
            <TouchableOpacity onPress={handleSaveExpense}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Vendor Information */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Vendor Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vendor Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.vendor_name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, vendor_name: text }))}
                  placeholder="Enter vendor name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vendor Contact</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.vendor_contact}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, vendor_contact: text }))}
                  placeholder="Phone number or email"
                />
              </View>
            </View>

            {/* Expense Details */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Expense Details</Text>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                  <Text style={styles.inputLabel}>Expense Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.expense_number}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, expense_number: text }))}
                    placeholder="EXP-001"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.expense_date}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, expense_date: text }))}
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
                  placeholder="Describe the expense..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Purpose</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.purpose}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, purpose: text }))}
                  placeholder="Business purpose of this expense"
                />
              </View>
            </View>

            {/* Financial Details */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Financial Details</Text>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                  <Text style={styles.inputLabel}>Amount</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.amount.toString()}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, amount: parseFloat(text) || 0 }))}
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

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Total Amount</Text>
                <TextInput
                  style={[styles.textInput, styles.totalInput]}
                  value={formatCurrency(formData.total_amount)}
                  editable={false}
                />
              </View>
            </View>

            {/* Payment & Documentation */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Payment & Documentation</Text>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                  <Text style={styles.inputLabel}>Invoice Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.invoice_number}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, invoice_number: text }))}
                    placeholder="Vendor invoice number"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
                  <Text style={styles.inputLabel}>Receipt Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.receipt_number}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, receipt_number: text }))}
                    placeholder="Receipt number"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Reference</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.payment_reference}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, payment_reference: text }))}
                  placeholder="Transaction ID or reference"
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
    padding: Spacing.base,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    ...Shadows.sm,
    gap: Spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.base,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  arrowButton: {
    padding: Spacing.xs,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    minWidth: 120,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  exportButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
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
  expenseCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.base,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseNumber: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginBottom: 2,
  },
  expenseVendor: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  expenseActions: {
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
  expenseBody: {
    marginBottom: Spacing.md,
  },
  expenseDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
    lineHeight: Typography.lineHeight.base,
    marginBottom: Spacing.sm,
  },
  expensePurpose: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  expenseDetails: {
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
  expenseFooter: {
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
    color: FinancialColors.expense.primary,
  },
  taxAmount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  approveButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: FinancialColors.completed.background,
  },
  rejectButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.error[50],
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
    backgroundColor: BrandColors.surface,
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
    color: FinancialColors.expense.primary,
    fontFamily: Typography.fontFamily.bold,
  },
});
