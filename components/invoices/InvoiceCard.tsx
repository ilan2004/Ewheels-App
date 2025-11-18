import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { BrandColors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/design-system';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatCurrency } from '@/lib/invoiceCalculations';

interface InvoiceCardProps {
  invoice: Invoice;
  onPress: (invoice: Invoice) => void;
  onStatusPress?: (invoice: Invoice) => void;
}

interface StatusBadgeProps {
  status: InvoiceStatus;
  onPress?: () => void;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, onPress }) => {
  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return {
          color: BrandColors.ink,
          backgroundColor: BrandColors.ink + '20',
          icon: 'doc.text',
          label: 'Draft',
        };
      case 'sent':
        return {
          color: BrandColors.primary,
          backgroundColor: BrandColors.primary + '20',
          icon: 'paperplane.fill',
          label: 'Sent',
        };
      case 'paid':
        return {
          color: '#10B981',
          backgroundColor: '#10B981' + '20',
          icon: 'checkmark.circle.fill',
          label: 'Paid',
        };
      case 'void':
        return {
          color: '#EF4444',
          backgroundColor: '#EF4444' + '20',
          icon: 'xmark.circle.fill',
          label: 'Void',
        };
      default:
        return {
          color: BrandColors.ink,
          backgroundColor: BrandColors.ink + '20',
          icon: 'doc.text',
          label: status,
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <TouchableOpacity
      style={[
        styles.statusBadge,
        { backgroundColor: config.backgroundColor }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <IconSymbol name={config.icon} size={12} color={config.color} />
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.label}
      </Text>
    </TouchableOpacity>
  );
};

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ 
  invoice, 
  onPress, 
  onStatusPress 
}) => {
  const isOverdue = invoice.status !== 'paid' && 
    new Date(invoice.due_date) < new Date();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(invoice)}>
      <View style={styles.cardHeader}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>{invoice.number}</Text>
          <Text style={styles.customerName}>{invoice.customer.name}</Text>
        </View>
        <StatusBadge 
          status={invoice.status} 
          onPress={() => onStatusPress?.(invoice)} 
        />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amount}>
            {formatCurrency(invoice.totals.total, invoice.currency)}
          </Text>
        </View>

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
              color={isOverdue ? '#EF4444' : BrandColors.ink + '60'} 
            />
            <Text style={[styles.dateLabel, isOverdue && styles.overdueText]}>
              Due
            </Text>
            <Text style={[styles.dateValue, isOverdue && styles.overdueText]}>
              {formatDate(invoice.due_date)}
            </Text>
          </View>
        </View>
      </View>

      {isOverdue && (
        <View style={styles.overdueIndicator}>
          <IconSymbol name="exclamationmark.triangle.fill" size={12} color="#EF4444" />
          <Text style={styles.overdueLabel}>Overdue</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>
            {invoice.items?.length || 0} item{(invoice.items?.length || 0) !== 1 ? 's' : ''}
          </Text>
          {invoice.balance_due > 0 && (
            <>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.metaText}>
                {formatCurrency(invoice.balance_due, invoice.currency)} due
              </Text>
            </>
          )}
        </View>
        <IconSymbol name="chevron.right" size={16} color={BrandColors.ink + '40'} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.ink + '10',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: {
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
  cardBody: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  overdueLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: '#EF4444',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: BrandColors.ink + '10',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '60',
  },
  metaSeparator: {
    fontSize: Typography.fontSize.xs,
    color: BrandColors.ink + '40',
  },
});

export default InvoiceCard;
