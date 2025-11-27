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
import { useFinancialKPIs } from '@/hooks/useFinancial';
import { RecentTransaction } from '@/types/financial.types';
import React from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface FinancialOverviewProps {
  onRefresh: () => void;
}

export default function FinancialOverview({ onRefresh }: FinancialOverviewProps) {
  const { kpis, recentTransactions, loading, error, refreshKPIs } = useFinancialKPIs();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const handleTransactionPress = (transaction: RecentTransaction) => {
    Alert.alert(
      'Transaction Details',
      `${transaction.type === 'sale' ? 'Sale' : 'Expense'}: ${transaction.description}\nAmount: ${formatCurrency(transaction.amount)}\nDate: ${transaction.date}\nCategory: ${transaction.category}`,
      [{ text: 'OK' }]
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <IconSymbol size={48} name="exclamationmark.triangle" color={Colors.error[500]} />
        <Text style={styles.errorText}>Failed to load financial data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshKPIs}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refreshKPIs} />
      }
    >
      {/* Today's KPIs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: FinancialColors.income.primary }]}>
            <IconSymbol size={24} name="arrow.up.circle.fill" color={FinancialColors.income.primary} />
            <Text style={styles.kpiValue}>{formatCurrency(kpis?.today.sales || 0)}</Text>
            <Text style={styles.kpiLabel}>Sales</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: FinancialColors.expense.primary }]}>
            <IconSymbol size={24} name="arrow.down.circle.fill" color={FinancialColors.expense.primary} />
            <Text style={styles.kpiValue}>{formatCurrency(kpis?.today.expenses || 0)}</Text>
            <Text style={styles.kpiLabel}>Expenses</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: FinancialColors.profit.primary }]}>
            <IconSymbol size={24} name="chart.line.uptrend.xyaxis" color={FinancialColors.profit.primary} />
            <Text style={styles.kpiValue}>{formatCurrency(kpis?.today.profit || 0)}</Text>
            <Text style={styles.kpiLabel}>Profit</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: Colors.info[500] }]}>
            <IconSymbol size={24} name="banknote" color={Colors.info[500]} />
            <Text style={styles.kpiValue}>{formatCurrency(kpis?.today.cash_balance || 0)}</Text>
            <Text style={styles.kpiLabel}>Cash Balance</Text>
          </View>
        </View>
      </View>

      {/* This Month */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.monthlyCard}>
          <View style={styles.monthlyRow}>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyValue}>{formatCurrency(kpis?.this_month.sales || 0)}</Text>
              <Text style={styles.monthlyLabel}>Sales</Text>
            </View>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyValue}>{formatCurrency(kpis?.this_month.expenses || 0)}</Text>
              <Text style={styles.monthlyLabel}>Expenses</Text>
            </View>
          </View>

          <View style={styles.monthlyRow}>
            <View style={styles.monthlyItem}>
              <Text style={[styles.monthlyValue, { color: FinancialColors.profit.primary }]}>
                {formatCurrency(kpis?.this_month.profit || 0)}
              </Text>
              <Text style={styles.monthlyLabel}>Profit</Text>
            </View>
            <View style={styles.monthlyItem}>
              <Text style={[styles.monthlyValue, { color: FinancialColors.profit.primary }]}>
                {formatPercentage(kpis?.this_month.profit_margin || 0)}
              </Text>
              <Text style={styles.monthlyLabel}>Profit Margin</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Year to Date */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Year to Date</Text>
        <View style={styles.yearlyCard}>
          <View style={styles.yearlyRow}>
            <View style={styles.yearlyItem}>
              <IconSymbol size={20} name="arrow.up" color={FinancialColors.income.primary} />
              <View style={styles.yearlyContent}>
                <Text style={styles.yearlyValue}>{formatCurrency(kpis?.this_year.sales || 0)}</Text>
                <Text style={styles.yearlyLabel}>Total Sales</Text>
              </View>
            </View>
          </View>

          <View style={styles.yearlyRow}>
            <View style={styles.yearlyItem}>
              <IconSymbol size={20} name="arrow.down" color={FinancialColors.expense.primary} />
              <View style={styles.yearlyContent}>
                <Text style={styles.yearlyValue}>{formatCurrency(kpis?.this_year.expenses || 0)}</Text>
                <Text style={styles.yearlyLabel}>Total Expenses</Text>
              </View>
            </View>
          </View>

          <View style={styles.yearlyRow}>
            <View style={styles.yearlyItem}>
              <IconSymbol size={20} name="chart.bar.fill" color={FinancialColors.profit.primary} />
              <View style={styles.yearlyContent}>
                <Text style={[styles.yearlyValue, { color: FinancialColors.profit.primary }]}>
                  {formatCurrency(kpis?.this_year.profit || 0)}
                </Text>
                <Text style={styles.yearlyLabel}>Net Profit</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.transactionsContainer}>
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol size={48} name="doc.text" color={Colors.neutral[400]} />
              <Text style={styles.emptyStateText}>No recent transactions</Text>
            </View>
          ) : (
            recentTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                onPress={() => handleTransactionPress(transaction)}
                accessibilityLabel={`${transaction.type} transaction: ${transaction.description}`}
              >
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    {
                      backgroundColor: transaction.type === 'sale'
                        ? FinancialColors.income.background
                        : FinancialColors.expense.background
                    }
                  ]}>
                    <IconSymbol
                      size={16}
                      name={transaction.type === 'sale' ? 'arrow.up' : 'arrow.down'}
                      color={transaction.type === 'sale'
                        ? FinancialColors.income.primary
                        : FinancialColors.expense.primary}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription} numberOfLines={1}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionMeta}>
                      {transaction.category} • {transaction.date}
                      {transaction.status && ` • ${transaction.status}`}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  {
                    color: transaction.type === 'sale'
                      ? FinancialColors.income.primary
                      : FinancialColors.expense.primary
                  }
                ]}>
                  {transaction.type === 'sale' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: BrandColors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    alignItems: 'center',
    ...Shadows.sm,
  },
  kpiValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.ink,
    marginTop: Spacing.xs,
  },
  kpiLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
    marginTop: 2,
  },
  monthlyCard: {
    backgroundColor: BrandColors.surface,
    marginHorizontal: Spacing.base,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  monthlyRow: {
    flexDirection: 'row',
    marginBottom: Spacing.base,
  },
  monthlyItem: {
    flex: 1,
    alignItems: 'center',
  },
  monthlyValue: {
    fontSize: Typography.fontSize.xl2,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.ink,
  },
  monthlyLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
    marginTop: 4,
  },
  yearlyCard: {
    backgroundColor: BrandColors.surface,
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  yearlyRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    paddingVertical: Spacing.md,
  },
  yearlyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearlyContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  yearlyValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.ink,
  },
  yearlyLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
    marginTop: 2,
  },
  transactionsContainer: {
    backgroundColor: BrandColors.surface,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  transactionDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
  },
  transactionMeta: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  emptyStateText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.error[600],
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
    marginTop: Spacing.lg,
  },
  retryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
});
