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
import { generateFinancialReportPDF } from '@/lib/reportPDFGenerator';
import { supabase } from '@/lib/supabase';
import {
    DailyCash,
    Expense,
    ReportData,
    Sale
} from '@/types/financial.types';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// --- Helper Functions ---

const formatMoney = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getMonthName = (monthIndex: number) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
};

// --- Component ---

export default function ReportsScreen({ onNavigateToTab }: { onNavigateToTab?: (tab: 'sales' | 'expenses') => void }) {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    const fetchReportData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Construct Date Range
            const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0]; // YYYY-MM-DD
            const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0]; // Last day of month

            console.log(`Fetching report for ${startDate} to ${endDate}`);

            // 2. Fetch Data
            const salesPromise = supabase
                .from('sales')
                .select('*')
                .gte('sale_date', startDate)
                .lte('sale_date', endDate);

            const expensesPromise = supabase
                .from('expenses')
                .select('*')
                .gte('expense_date', startDate)
                .lte('expense_date', endDate);

            const dailyCashPromise = supabase
                .from('daily_cash')
                .select('*')
                .gte('date', startDate)
                .lte('date', endDate);

            const [salesRes, expensesRes, dailyCashRes] = await Promise.all([
                salesPromise,
                expensesPromise,
                dailyCashPromise
            ]);

            if (salesRes.error) throw salesRes.error;
            if (expensesRes.error) throw expensesRes.error;

            const sales = (salesRes.data as Sale[]) || [];
            const expenses = (expensesRes.data as Expense[]) || [];
            const dailyCash = (dailyCashRes.data as DailyCash[]) || [];

            // 3. Calculate Totals
            const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
            const totalExpensesCalc = expenses.reduce((sum, e) => sum + (e.total_amount || e.amount || 0), 0);

            const netProfit = totalSales - totalExpensesCalc;

            // 4. Breakdowns

            // Sales by Category
            const salesCatMap = new Map<string, { amount: number; count: number }>();
            sales.forEach(s => {
                const cat = s.sale_type || 'Other';
                const curr = salesCatMap.get(cat) || { amount: 0, count: 0 };
                salesCatMap.set(cat, { amount: curr.amount + (s.total_amount || 0), count: curr.count + 1 });
            });
            const salesByCategory = Array.from(salesCatMap.entries())
                .map(([category, data]) => ({ category, ...data }))
                .sort((a, b) => b.amount - a.amount);

            // Expenses by Category
            const expCatMap = new Map<string, { amount: number; count: number }>();
            expenses.forEach(e => {
                const cat = e.category || 'Other';
                const curr = expCatMap.get(cat) || { amount: 0, count: 0 };
                expCatMap.set(cat, { amount: curr.amount + (e.total_amount || e.amount || 0), count: curr.count + 1 });
            });
            const expensesByCategory = Array.from(expCatMap.entries())
                .map(([category, data]) => ({ category, ...data }))
                .sort((a, b) => b.amount - a.amount);

            // Sales by Payment Method
            const salesPayMap = new Map<string, { amount: number; count: number }>();
            sales.forEach(s => {
                const method = s.payment_method || 'Unknown';
                const curr = salesPayMap.get(method) || { amount: 0, count: 0 };
                salesPayMap.set(method, { amount: curr.amount + (s.total_amount || 0), count: curr.count + 1 });
            });
            const salesByPaymentMethod = Array.from(salesPayMap.entries())
                .map(([method, data]) => ({ method, ...data }))
                .sort((a, b) => b.amount - a.amount);

            // Expenses by Payment Method
            const expPayMap = new Map<string, { amount: number; count: number }>();
            expenses.forEach(e => {
                const method = e.payment_method || 'Unknown';
                const curr = expPayMap.get(method) || { amount: 0, count: 0 };
                expPayMap.set(method, { amount: curr.amount + (e.total_amount || e.amount || 0), count: curr.count + 1 });
            });
            const expensesByPaymentMethod = Array.from(expPayMap.entries())
                .map(([method, data]) => ({ method, ...data }))
                .sort((a, b) => b.amount - a.amount);

            // Cash Summary
            const openingTotal = dailyCash.reduce((sum, d) => sum + (d.opening_cash || 0), 0);
            const closingTotal = dailyCash.reduce((sum, d) => sum + (d.closing_cash || 0), 0);
            const netChange = dailyCash.reduce((sum, d) => sum + ((d.closing_cash || 0) - (d.opening_cash || 0)), 0);

            setReportData({
                totalSales,
                totalExpenses: totalExpensesCalc,
                netProfit,
                salesCount: sales.length,
                expensesCount: expenses.length,
                salesByCategory,
                expensesByCategory,
                salesByPaymentMethod,
                expensesByPaymentMethod,
                cashSummary: {
                    openingTotal,
                    closingTotal,
                    netChange
                },
                // Raw data for PDF export
                rawSales: sales,
                rawExpenses: expenses,
                rawDailyCash: dailyCash,
                period: {
                    month: selectedMonth,
                    year: selectedYear,
                    startDate,
                    endDate
                }
            });

        } catch (error) {
            console.error('Error fetching report data:', error);
            Alert.alert('Error', 'Failed to fetch report data');
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

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

    const handleExport = async () => {
        if (!reportData) {
            Alert.alert('Error', 'No report data available to export.');
            return;
        }

        try {
            await generateFinancialReportPDF(reportData);
        } catch (error) {
            Alert.alert('Export Failed', 'An error occurred while generating the PDF.');
        }
    };

    if (!reportData && loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={BrandColors.primary} />
                <Text style={styles.loadingText}>Generating Report...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchReportData} />}
        >
            {/* Header Controls */}
            <View style={styles.controlsCard}>
                <View style={styles.monthSelector}>
                    <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
                        <IconSymbol name="chevron.left" size={24} color={BrandColors.primary} />
                    </TouchableOpacity>

                    <View style={styles.dateDisplay}>
                        <IconSymbol name="calendar" size={20} color={Colors.neutral[500]} style={{ marginRight: 8 }} />
                        <Text style={styles.dateText}>{getMonthName(selectedMonth)} {selectedYear}</Text>
                    </View>

                    <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
                        <IconSymbol name="chevron.right" size={24} color={BrandColors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.generateButton} onPress={fetchReportData}>
                        <Text style={styles.generateButtonText}>Refresh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                        <IconSymbol name="square.and.arrow.up" size={18} color={BrandColors.primary} />
                        <Text style={styles.exportButtonText}>Export PDF</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {reportData && (
                <>
                    {/* Summary Cards */}
                    {/* Summary Cards */}
                    <View style={styles.summaryGrid}>
                        <TouchableOpacity
                            style={[styles.summaryCard, { borderLeftColor: FinancialColors.income.primary }]}
                            onPress={() => onNavigateToTab?.('sales')}
                        >
                            <View style={styles.summaryHeader}>
                                <IconSymbol name="arrow.down.circle.fill" size={24} color={FinancialColors.income.primary} />
                                <Text style={styles.cardLabel}>Total Sales</Text>
                            </View>
                            <Text style={[styles.cardValue, { color: FinancialColors.income.text }]}>{formatMoney(reportData.totalSales)}</Text>
                            <Text style={styles.cardSubValue}>{reportData.salesCount} transactions</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.summaryCard, { borderLeftColor: FinancialColors.expense.primary }]}
                            onPress={() => onNavigateToTab?.('expenses')}
                        >
                            <View style={styles.summaryHeader}>
                                <IconSymbol name="arrow.up.circle.fill" size={24} color={FinancialColors.expense.primary} />
                                <Text style={styles.cardLabel}>Total Expenses</Text>
                            </View>
                            <Text style={[styles.cardValue, { color: FinancialColors.expense.text }]}>{formatMoney(reportData.totalExpenses)}</Text>
                            <Text style={styles.cardSubValue}>{reportData.expensesCount} transactions</Text>
                        </TouchableOpacity>

                        <View style={[styles.summaryCard, { borderLeftColor: reportData.netProfit >= 0 ? FinancialColors.income.primary : FinancialColors.expense.primary }]}>
                            <View style={styles.summaryHeader}>
                                <IconSymbol name="chart.bar.fill" size={24} color={reportData.netProfit >= 0 ? FinancialColors.income.primary : FinancialColors.expense.primary} />
                                <Text style={styles.cardLabel}>Net Profit</Text>
                            </View>
                            <Text style={[styles.cardValue, { color: reportData.netProfit >= 0 ? FinancialColors.income.text : FinancialColors.expense.text }]}>
                                {formatMoney(reportData.netProfit)}
                            </Text>
                            <Text style={styles.cardSubValue}>{reportData.netProfit >= 0 ? 'Profit' : 'Loss'}</Text>
                        </View>

                        <View style={[styles.summaryCard, { borderLeftColor: BrandColors.primary }]}>
                            <View style={styles.summaryHeader}>
                                <IconSymbol name="calendar" size={24} color={BrandColors.primary} />
                                <Text style={styles.cardLabel}>Period</Text>
                            </View>
                            <Text style={[styles.cardValue, { color: BrandColors.primary, fontSize: 16 }]}>
                                {getMonthName(selectedMonth)}
                            </Text>
                            <Text style={styles.cardSubValue}>{selectedYear}</Text>
                        </View>
                    </View>

                    {/* Detailed Summary - Horizontal Stats */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Key Metrics</Text>
                        <View style={styles.statsRowContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Avg Sale</Text>
                                <Text style={styles.statValue}>
                                    {formatMoney(reportData.salesCount > 0 ? reportData.totalSales / reportData.salesCount : 0)}
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Avg Expense</Text>
                                <Text style={styles.statValue}>
                                    {formatMoney(reportData.expensesCount > 0 ? reportData.totalExpenses / reportData.expensesCount : 0)}
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Margin</Text>
                                <Text style={[styles.statValue, { color: reportData.netProfit >= 0 ? FinancialColors.income.text : FinancialColors.expense.text }]}>
                                    {reportData.totalSales > 0 ? ((reportData.netProfit / reportData.totalSales) * 100).toFixed(1) : '0.0'}%
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Category Breakdown */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Category Breakdown</Text>
                        <View style={styles.stackedView}>
                            {/* Sales Categories */}
                            <View style={styles.splitCard}>
                                <View style={[styles.categoryHeader, { borderBottomColor: FinancialColors.income.primary }]}>
                                    <Text style={[styles.subHeader, { color: FinancialColors.income.text }]}>Sales</Text>
                                </View>
                                {reportData.salesByCategory.map((item, index) => (
                                    <View key={index} style={styles.breakdownRow}>
                                        <View style={styles.breakdownInfo}>
                                            <View style={styles.breakdownHeaderRow}>
                                                <Text style={styles.breakdownLabel}>{item.category}</Text>
                                                <Text style={styles.breakdownAmount}>{formatMoney(item.amount)}</Text>
                                            </View>
                                            <View style={styles.progressBarContainer}>
                                                <View style={[styles.progressBar, { width: `${(item.amount / reportData.totalSales) * 100}%`, backgroundColor: FinancialColors.income.primary }]} />
                                            </View>
                                            <Text style={styles.breakdownCount}>{item.count} txns • {((item.amount / reportData.totalSales) * 100).toFixed(1)}%</Text>
                                        </View>
                                    </View>
                                ))}
                                {reportData.salesByCategory.length === 0 && <Text style={styles.emptyText}>No sales data</Text>}
                            </View>

                            {/* Expenses Categories */}
                            <View style={styles.splitCard}>
                                <View style={[styles.categoryHeader, { borderBottomColor: FinancialColors.expense.primary }]}>
                                    <Text style={[styles.subHeader, { color: FinancialColors.expense.text }]}>Expenses</Text>
                                </View>
                                {reportData.expensesByCategory.map((item, index) => (
                                    <View key={index} style={styles.breakdownRow}>
                                        <View style={styles.breakdownInfo}>
                                            <View style={styles.breakdownHeaderRow}>
                                                <Text style={styles.breakdownLabel}>{item.category}</Text>
                                                <Text style={styles.breakdownAmount}>{formatMoney(item.amount)}</Text>
                                            </View>
                                            <View style={styles.progressBarContainer}>
                                                <View style={[styles.progressBar, { width: `${(item.amount / reportData.totalExpenses) * 100}%`, backgroundColor: FinancialColors.expense.primary }]} />
                                            </View>
                                            <Text style={styles.breakdownCount}>{item.count} txns • {((item.amount / reportData.totalExpenses) * 100).toFixed(1)}%</Text>
                                        </View>
                                    </View>
                                ))}
                                {reportData.expensesByCategory.length === 0 && <Text style={styles.emptyText}>No expense data</Text>}
                            </View>
                        </View>
                    </View>

                    {/* Payment & Cash Flow */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cash Flow Analysis</Text>

                        <View style={styles.cashFlowContainer}>
                            <View style={styles.detailCard}>
                                <Text style={[styles.subHeader, { marginBottom: Spacing.md }]}>Cash Management</Text>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Opening Balance</Text>
                                    <Text style={styles.detailValue}>{formatMoney(reportData.cashSummary.openingTotal)}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Closing Balance</Text>
                                    <Text style={styles.detailValue}>{formatMoney(reportData.cashSummary.closingTotal)}</Text>
                                </View>
                                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                                    <Text style={styles.detailLabel}>Net Change</Text>
                                    <Text style={[styles.detailValue, { color: reportData.cashSummary.netChange >= 0 ? FinancialColors.income.text : FinancialColors.expense.text }]}>
                                        {reportData.cashSummary.netChange >= 0 ? '+' : ''}{formatMoney(reportData.cashSummary.netChange)}
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.splitView, { marginTop: Spacing.lg }]}>
                                {/* Sales Methods */}
                                <View style={styles.splitCard}>
                                    <Text style={styles.subHeader}>Sales by Method</Text>
                                    {reportData.salesByPaymentMethod.map((item, index) => (
                                        <View key={index} style={styles.breakdownRow}>
                                            <Text style={styles.breakdownLabel}>{item.method}</Text>
                                            <Text style={styles.breakdownAmount}>{formatMoney(item.amount)}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Expenses Methods */}
                                <View style={styles.splitCard}>
                                    <Text style={styles.subHeader}>Expenses by Method</Text>
                                    {reportData.expensesByPaymentMethod.map((item, index) => (
                                        <View key={index} style={styles.breakdownRow}>
                                            <Text style={styles.breakdownLabel}>{item.method}</Text>
                                            <Text style={styles.breakdownAmount}>{formatMoney(item.amount)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                </>
            )}

            {!reportData && !loading && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No report generated yet.</Text>
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.surface,
    },
    contentContainer: {
        padding: Spacing.base,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: BrandColors.surface,
    },
    loadingText: {
        marginTop: Spacing.sm,
        color: Colors.neutral[600],
        fontFamily: Typography.fontFamily.medium,
    },
    controlsCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: 12,
        marginBottom: 12,
        ...Shadows.sm,
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.base,
        padding: Spacing.xs,
    },
    arrowButton: {
        padding: Spacing.sm,
    },
    dateDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: Typography.fontSize.lg,
        fontFamily: Typography.fontFamily.bold,
        color: BrandColors.title,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    generateButton: {
        flex: 1,
        backgroundColor: BrandColors.primary,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.base,
        alignItems: 'center',
    },
    generateButtonText: {
        color: '#fff',
        fontFamily: Typography.fontFamily.semibold,
        fontSize: Typography.fontSize.base,
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: BrandColors.primary,
        paddingVertical: Spacing.sm,
        paddingHorizontal: 12,
        borderRadius: BorderRadius.base,
        gap: Spacing.xs,
    },
    exportButtonText: {
        color: BrandColors.primary,
        fontFamily: Typography.fontFamily.medium,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    summaryCard: {
        width: '48%', // Approx half width
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: BorderRadius.xl,
        borderLeftWidth: 4,
        ...Shadows.md,
        justifyContent: 'space-between',
        minHeight: 110,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    cardLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.neutral[600],
        fontFamily: Typography.fontFamily.semibold,
    },
    cardValue: {
        fontSize: Typography.fontSize.lg,
        fontFamily: Typography.fontFamily.bold,
        marginBottom: 4,
    },
    cardSubValue: {
        fontSize: Typography.fontSize.xs,
        color: Colors.neutral[500],
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.xl,
        fontFamily: Typography.fontFamily.bold,
        color: BrandColors.title,
        marginBottom: Spacing.md,
        paddingHorizontal: 4,
    },
    statsRowContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.sm,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: Typography.fontSize.xs,
        color: Colors.neutral[500],
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.bold,
        color: BrandColors.ink,
    },
    statDivider: {
        width: 1,
        height: '80%',
        backgroundColor: Colors.neutral[200],
    },
    detailCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[100],
    },
    detailLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.neutral[600],
    },
    detailValue: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.semibold,
        color: BrandColors.ink,
    },
    splitView: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    stackedView: {
        flexDirection: 'column',
        gap: Spacing.md,
    },
    splitCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: 12,
        ...Shadows.sm,
    },
    categoryHeader: {
        borderBottomWidth: 2,
        marginBottom: Spacing.md,
        paddingBottom: Spacing.xs,
    },
    subHeader: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.bold,
        color: BrandColors.title,
    },
    breakdownRow: {
        marginBottom: Spacing.md,
    },
    breakdownInfo: {
        flex: 1,
    },
    breakdownHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    breakdownLabel: {
        fontSize: Typography.fontSize.sm,
        color: BrandColors.ink,
        fontFamily: Typography.fontFamily.medium,
        flex: 1,
        marginRight: 8,
    },
    breakdownAmount: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.semibold,
        color: BrandColors.ink,
    },
    progressBarContainer: {
        height: 4,
        backgroundColor: Colors.neutral[100],
        borderRadius: 2,
        marginBottom: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
    breakdownCount: {
        fontSize: 10,
        color: Colors.neutral[400],
    },
    emptyText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.neutral[400],
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    emptyState: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    emptyStateText: {
        color: Colors.neutral[500],
        fontFamily: Typography.fontFamily.medium,
    },
    cashFlowContainer: {
        gap: Spacing.md,
    },
});
