import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { formatCurrency } from '@/lib/invoiceCalculations';
import { InvoiceService } from '@/services/invoiceService';
import { useAuthStore } from '@/stores/authStore';
import {
  InvoiceStatus,
  InvoiceStatusColors,
  PaymentMethod,
  PaymentMethodNames
} from '@/types/invoice';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', color: InvoiceStatusColors.draft };
      case 'sent':
        return { label: 'Sent', color: InvoiceStatusColors.sent };
      case 'paid':
        return { label: 'Paid', color: InvoiceStatusColors.paid };
      case 'void':
        return { label: 'Void', color: InvoiceStatusColors.void };
      default:
        return { label: status, color: BrandColors.ink };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.label.toUpperCase()}
      </Text>
    </View>
  );
};

interface SectionHeaderProps {
  title: string;
  icon: any;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <IconSymbol name={icon} size={20} color={BrandColors.primary} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

interface InfoRowProps {
  label: string;
  value: string;
  isMultiline?: boolean;
  useGreenTheme?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, isMultiline = false, useGreenTheme = false }) => (
  <View style={[styles.infoRow, isMultiline && styles.multilineRow]}>
    <Text style={[styles.infoLabel, useGreenTheme && styles.greenThemeLabel]}>{label}</Text>
    <Text style={[
      styles.infoValue,
      isMultiline && styles.multilineValue,
      useGreenTheme && styles.greenThemeValue
    ]}>
      {value}
    </Text>
  </View>
);

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isActionsVisible, setIsActionsVisible] = useState(false);

  // Fetch invoice with payments
  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => InvoiceService.getInvoiceWithPayments(id!),
    enabled: !!id,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) =>
      InvoiceService.updateInvoiceStatus(invoiceId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      Alert.alert('Success', 'Invoice status updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update invoice status');
    },
  });

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: (invoiceId: string) => InvoiceService.deleteInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      Alert.alert('Success', 'Invoice deleted successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete invoice');
    },
  });

  // Duplicate invoice mutation
  const duplicateMutation = useMutation({
    mutationFn: (invoiceId: string) => InvoiceService.duplicateInvoice(invoiceId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (response.success && response.data) {
        Alert.alert('Success', 'Invoice duplicated successfully', [
          {
            text: 'View Copy',
            onPress: () => router.push(`/invoices/${response.data!.id}`)
          },
          { text: 'OK' }
        ]);
      }
    },
    onError: () => {
      Alert.alert('Error', 'Failed to duplicate invoice');
    },
  });

  const handleMarkAsPaid = () => {
    if (!invoice) return;

    Alert.alert(
      'Mark as Paid',
      'Are you sure you want to mark this invoice as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: () => updateStatusMutation.mutate({
            invoiceId: invoice.id,
            status: 'paid'
          })
        }
      ]
    );
  };

  const handleAddPayment = () => {
    if (!invoice) return;
    router.push(`/invoices/${invoice.id}/payment`);
  };

  const handleEditInvoice = () => {
    if (!invoice) return;
    router.push(`/invoices/${invoice.id}/edit`);
  };

  const handleShare = async () => {
    if (!invoice) return;

    try {
      await Share.share({
        message: `Invoice ${invoice.number}\nCustomer: ${invoice.customer.name}\nTotal: ${formatCurrency(invoice.totals.grand_total)}\nStatus: ${invoice.status}`,
        title: `Invoice ${invoice.number}`,
      });
    } catch (error) {
      console.error('Error sharing invoice:', error);
    }
  };

  const handleStatusChange = () => {
    if (!invoice) return;

    const statusOptions = [
      { label: 'Mark as Draft', value: 'draft' as InvoiceStatus },
      { label: 'Mark as Sent', value: 'sent' as InvoiceStatus },
      { label: 'Mark as Paid', value: 'paid' as InvoiceStatus },
      { label: 'Mark as Void', value: 'void' as InvoiceStatus },
    ].filter(option => option.value !== invoice.status);

    const buttons = statusOptions.map(option => ({
      text: option.label,
      onPress: () => updateStatusMutation.mutate({
        invoiceId: invoice.id,
        status: option.value,
      }),
    }));

    Alert.alert(
      'Change Status',
      `Current status: ${invoice.status.replace('_', ' ')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...buttons,
      ]
    );
  };

  const handleDuplicate = () => {
    if (!invoice) return;

    Alert.alert(
      'Duplicate Invoice',
      'This will create a new draft invoice with the same details.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: () => duplicateMutation.mutate(invoice.id)
        }
      ]
    );
  };

  const handleDelete = () => {
    if (!invoice) return;

    Alert.alert(
      'Delete Invoice',
      'This action cannot be undone. Are you sure you want to delete this invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(invoice.id)
        }
      ]
    );
  };

  const isOverdue = () => {
    if (!invoice || invoice.status === 'paid' || invoice.status === 'void') return false;
    return new Date(invoice.due_date) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAddress = (address: any) => {
    if (!address) return 'No address provided';
    const parts = [address.street, address.city, address.state, address.zip].filter(Boolean);
    return parts.join(', ') || 'No address provided';
  };

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorState}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to Load Invoice</Text>
          <Text style={styles.errorText}>Please check your connection and try again</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (isLoading || !invoice) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
          <Text style={styles.loadingText}>Loading invoice...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Invoice Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.invoiceHeaderTop}>
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoiceNumber}>{invoice.number}</Text>
              <Text style={styles.customerName}>{invoice.customer.name}</Text>
            </View>
            <View style={styles.headerActions}>
              <StatusBadge status={invoice.status} />
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setIsActionsVisible(!isActionsVisible)}
              >
                <IconSymbol name="ellipsis" size={20} color={BrandColors.ink} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount highlight */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Invoice Total</Text>
            <Text style={styles.amount}>
              {formatCurrency(invoice.totals.grand_total)}
            </Text>
          </View>

          {/* Key dates */}
          <View style={styles.dateSection}>
            <View style={styles.dateItem}>
              <IconSymbol name="calendar" size={14} color={BrandColors.ink + '60'} />
              <Text style={styles.dateLabel}>Created</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.created_at)}</Text>
            </View>
            <View style={styles.dateItem}>
              <IconSymbol
                name="clock"
                size={14}
                color={isOverdue() ? '#EF4444' : BrandColors.ink + '60'}
              />
              <Text style={[styles.dateLabel, isOverdue() && styles.overdueText]}>
                Due
              </Text>
              <Text style={[styles.dateValue, isOverdue() && styles.overdueText]}>
                {formatDate(invoice.due_date)}
              </Text>
            </View>
          </View>

          {isOverdue() && (
            <View style={styles.overdueIndicator}>
              <IconSymbol name="exclamationmark.triangle.fill" size={12} color="#EF4444" />
              <Text style={styles.overdueLabel}>Invoice is overdue</Text>
            </View>
          )}
        </View>

        {/* Actions Menu */}
        {isActionsVisible && (
          <View style={styles.actionsMenu}>
            <TouchableOpacity style={styles.actionItem} onPress={handleEditInvoice}>
              <IconSymbol name="pencil" size={16} color={BrandColors.ink} />
              <Text style={styles.actionText}>Edit Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
              <IconSymbol name="square.and.arrow.up" size={16} color={BrandColors.ink} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleDuplicate}>
              <IconSymbol name="doc.on.doc" size={16} color={BrandColors.ink} />
              <Text style={styles.actionText}>Duplicate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleStatusChange}>
              <IconSymbol name="arrow.triangle.2.circlepath" size={16} color={BrandColors.ink} />
              <Text style={styles.actionText}>Change Status</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionItem, styles.deleteAction]} onPress={handleDelete}>
              <IconSymbol name="trash" size={16} color="#EF4444" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Quick Actions */}
        {invoice.status !== 'paid' && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, styles.primaryAction]}
              onPress={handleMarkAsPaid}
            >
              <IconSymbol name="checkmark.circle" size={20} color={BrandColors.surface} />
              <Text style={styles.primaryActionText}>Mark as Paid</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleAddPayment}
            >
              <IconSymbol name="plus.circle" size={20} color={BrandColors.primary} />
              <Text style={styles.secondaryActionText}>Add Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Invoice Details */}
        <View style={styles.section}>
          <SectionHeader title="Invoice Details" icon="doc.text" />
          <View style={styles.card}>
            <InfoRow label="Created Date" value={formatDate(invoice.created_at)} />
            <InfoRow label="Due Date" value={formatDate(invoice.due_date)} />
            <InfoRow label="Currency" value={invoice.currency} />
            {invoice.source_quote_id && (
              <InfoRow label="Source Quote" value={invoice.source_quote_id} />
            )}
            {invoice.notes && (
              <InfoRow label="Notes" value={invoice.notes} isMultiline />
            )}
            {invoice.terms && (
              <InfoRow label="Terms & Conditions" value={invoice.terms} isMultiline />
            )}
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <SectionHeader title="Customer Information" icon="person" />
          <View style={[styles.card, styles.customerCard]}>
            <InfoRow label="Name" value={invoice.customer.name} useGreenTheme />
            {invoice.customer.email && (
              <InfoRow label="Email" value={invoice.customer.email} useGreenTheme />
            )}
            {invoice.customer.phone && (
              <InfoRow label="Phone" value={invoice.customer.phone} useGreenTheme />
            )}
            <InfoRow
              label="Address"
              value={formatAddress(invoice.customer.address)}
              isMultiline
              useGreenTheme
            />
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <SectionHeader title="Line Items" icon="list.bullet" />
          <View style={styles.card}>
            {invoice.items?.map((item, index) => (
              <View key={item.id || index} style={styles.lineItem}>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <View style={styles.itemDetails}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>Qty: {item.quantity}</Text>
                    <Text style={styles.itemLabel}>
                      Unit Price: {formatCurrency(item.unit_price)}
                    </Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>Discount: {item.discount}%</Text>
                    <Text style={styles.itemLabel}>Tax: {item.sgst_rate + item.cgst_rate}%</Text>
                  </View>
                  <View style={styles.itemTotalRow}>
                    <Text style={styles.itemTotal}>
                      Total: {formatCurrency(item.total)}
                    </Text>
                  </View>
                </View>
                {index < (invoice.items?.length || 0) - 1 && (
                  <View style={styles.itemSeparator} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Totals Breakdown */}
        <View style={styles.section}>
          <SectionHeader title="Invoice Summary" icon="chart.bar" />
          <View style={[styles.card, styles.summaryCard]}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.totals.subtotal)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Discount</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(invoice.totals.discount_total)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Tax</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.totals.sgst_total + invoice.totals.cgst_total)}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(invoice.totals.grand_total)}
              </Text>
            </View>

            {invoice.total_payments > 0 && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Payments</Text>
                  <Text style={styles.paidValue}>
                    -{formatCurrency(invoice.total_payments)}
                  </Text>
                </View>
                <View style={[styles.totalRow, styles.balanceRow]}>
                  <Text style={styles.balanceLabel}>Balance Due</Text>
                  <Text style={styles.balanceValue}>
                    {formatCurrency(invoice.balance_due)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Payment History" icon="creditcard" />
            <View style={styles.card}>
              {invoice.payments.map((payment, index) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(payment.amount)}
                    </Text>
                    <Text style={styles.paymentDate}>
                      {formatDate(payment.received_at)}
                    </Text>
                  </View>
                  <View style={styles.paymentDetails}>
                    <Text style={styles.paymentMethod}>
                      {PaymentMethodNames[payment.method as PaymentMethod]}
                    </Text>
                    {payment.reference && (
                      <Text style={styles.paymentReference}>
                        Ref: {payment.reference}
                      </Text>
                    )}
                  </View>
                  {payment.notes && (
                    <Text style={styles.paymentNotes}>{payment.notes}</Text>
                  )}
                  {index < invoice.payments!.length - 1 && (
                    <View style={styles.paymentSeparator} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
  },
  // Standard card
  card: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    marginHorizontal: Spacing.lg,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  // Customer card with green theme
  customerCard: {
    backgroundColor: BrandColors.title + '08', // Green with opacity
    borderColor: BrandColors.title + '20',
  },
  // Summary card with subtle accent
  summaryCard: {
    backgroundColor: BrandColors.surface,
    borderColor: BrandColors.primary + '20',
  },
  // Header Card (similar to invoice list cards)
  headerCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    margin: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  invoiceHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginBottom: 2,
  },
  customerName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: BrandColors.primary + '08',
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  amountLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '80',
  },
  amount: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.base,
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dateLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '60',
  },
  dateValue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
  },
  overdueText: {
    color: '#EF4444',
  },
  overdueIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    backgroundColor: '#EF4444' + '10',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  overdueLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: '#EF4444',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
  moreButton: {
    padding: 4,
  },
  actionsMenu: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadows.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  actionText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
  },
  deleteAction: {
    borderTopWidth: 1,
    borderTopColor: BrandColors.ink + '10',
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  deleteText: {
    color: '#EF4444',
  },
  // Info Rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  multilineRow: {
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '80',
    flex: 1,
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
    flex: 2,
    textAlign: 'right',
  },
  multilineValue: {
    textAlign: 'left',
    marginTop: 2,
  },
  // Green theme for customer card
  greenThemeLabel: {
    color: BrandColors.title + '90',
  },
  greenThemeValue: {
    color: BrandColors.title,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.primary,
    gap: Spacing.xs,
  },
  primaryAction: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  primaryActionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.surface,
  },
  secondaryActionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
  },
  // Line Items
  lineItem: {
    paddingVertical: Spacing.sm,
  },
  itemDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginBottom: Spacing.xs,
  },
  itemDetails: {
    gap: Spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: BrandColors.ink + '10',
  },
  itemLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
  },
  itemTotal: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: BrandColors.ink + '10',
    marginTop: Spacing.sm,
  },
  // Totals
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
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
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: BrandColors.ink + '20',
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
  },

  // Loading and Error States
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '80',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  errorTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: '#EF4444',
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  retryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.surface,
  },
  grandTotalLabel: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  grandTotalValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  paidValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: '#10B981',
  },
  balanceRow: {
    backgroundColor: BrandColors.primary + '10',
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  balanceLabel: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  balanceValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.primary,
  },
  paymentItem: {
    paddingVertical: Spacing.sm,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: '#10B981',
  },
  paymentDate: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '80',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
  },
  paymentReference: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
  },
  paymentNotes: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '60',
    fontStyle: 'italic',
  },
  paymentSeparator: {
    height: 1,
    backgroundColor: BrandColors.ink + '10',
    marginTop: Spacing.sm,
  },
  bottomPadding: {
    height: Spacing.xl,
  },
});
