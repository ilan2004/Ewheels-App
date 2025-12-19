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
import { useSales } from '@/hooks/useFinancial';
import { generateSalesPDF } from '@/lib/reportPDFGenerator';
import {
  PaymentMethodLabels,
  PaymentStatus,
  PaymentStatusLabels,
  Sale,
  SaleType,
  SaleTypeLabels,
  SalesFilters
} from '@/types/financial.types';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function SalesManagement() {
  const { sales, loading, error, pagination, fetchSales } = useSales();

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SalesFilters>({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadSales();
  }, [selectedMonth, selectedYear]);

  const loadSales = () => {
    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
    const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
    fetchSales({ ...filters, search: searchQuery, startDate, endDate }, 1, 1000);
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchQuery }));
    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
    const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
    fetchSales({ ...filters, search: searchQuery, startDate, endDate }, 1, 1000);
  };

  const handleExport = async () => {
    try {
      await generateSalesPDF(sales, selectedMonth, selectedYear);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return FinancialColors.completed;
      case 'partial': return FinancialColors.pending;
      case 'pending': return FinancialColors.pending;
      case 'overdue': return {
        primary: Colors.error[500],
        background: Colors.error[50],
        text: Colors.error[700]
      };
      case 'cancelled': return FinancialColors.cancelled;
      default: return {
        primary: Colors.neutral[500],
        background: Colors.neutral[50],
        text: Colors.neutral[700]
      };
    }
  };



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
          </View>
        </View>

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
          </View>
        }
      />


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  header: {
    padding: Spacing.base,
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    marginTop: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
  },
  addButton: {
    backgroundColor: BrandColors.primary,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  listContainer: {
    padding: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  saleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
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
    color: BrandColors.title,
    fontFamily: Typography.fontFamily.bold,
  },
});
