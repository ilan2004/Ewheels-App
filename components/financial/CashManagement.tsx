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
import { useCashManagement } from '@/hooks/useFinancial';
import { Expense, Sale } from '@/types/financial.types';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function CashManagement() {
    const { dailyCash, cashSales, cashExpenses, loading, error, fetchData, updateDailyCash } = useCashManagement();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'sales' | 'expenses'>('sales');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        opening_cash: '0',
        closing_cash: '0',
        notes: ''
    });

    useEffect(() => {
        fetchData(selectedDate.toISOString().split('T')[0]);
    }, [selectedDate]);

    useEffect(() => {
        if (dailyCash) {
            setEditFormData({
                opening_cash: dailyCash.opening_cash.toString(),
                closing_cash: dailyCash.closing_cash.toString(),
                notes: dailyCash.notes || ''
            });
        } else {
            setEditFormData({
                opening_cash: '0',
                closing_cash: '0',
                notes: ''
            });
        }
    }, [dailyCash]);

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const totalCashSales = cashSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const totalCashExpenses = cashExpenses.reduce((sum, expense) => sum + (expense.total_amount || 0), 0);
    const openingBalance = dailyCash?.opening_cash || 0;
    const closingBalance = dailyCash?.closing_cash || 0;
    const expectedClosing = openingBalance + totalCashSales - totalCashExpenses;
    const difference = closingBalance - expectedClosing;
    const isBalanced = Math.abs(difference) < 1;

    const handleSaveDailyCash = async () => {
        const opening = parseFloat(editFormData.opening_cash) || 0;
        const closing = parseFloat(editFormData.closing_cash) || 0;

        const result = await updateDailyCash(selectedDate.toISOString().split('T')[0], {
            opening_cash: opening,
            closing_cash: closing,
            notes: editFormData.notes
        });

        if (result.success) {
            Alert.alert('Success', 'Daily cash updated successfully');
            setShowEditModal(false);
        } else {
            Alert.alert('Error', result.error || 'Failed to update daily cash');
        }
    };

    const renderTransactionItem = ({ item }: { item: Sale | Expense }) => {
        const isSale = 'sale_number' in item;
        const amount = isSale ? (item as Sale).total_amount : (item as Expense).total_amount || (item as Expense).amount;
        const description = item.description;
        const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <View style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: isSale ? FinancialColors.income.background : FinancialColors.expense.background }]}>
                        <IconSymbol
                            size={20}
                            name={isSale ? 'arrow.down.left' : 'arrow.up.right'}
                            color={isSale ? FinancialColors.income.primary : FinancialColors.expense.primary}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.transactionTitle} numberOfLines={1} ellipsizeMode="tail">{description}</Text>
                        <Text style={styles.transactionTime}>{time}</Text>
                    </View>
                </View>
                <Text style={[styles.transactionAmount, { color: isSale ? FinancialColors.income.primary : FinancialColors.expense.primary }]}>
                    {isSale ? '+' : '-'}{formatCurrency(amount)}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.dateSelector}>
                    <TouchableOpacity onPress={() => changeDate(-1)} style={styles.arrowButton}>
                        <IconSymbol name="chevron.left" size={20} color={BrandColors.primary} />
                    </TouchableOpacity>
                    <View style={styles.dateDisplay}>
                        <IconSymbol name="calendar" size={16} color={Colors.neutral[500]} style={{ marginRight: 6 }} />
                        <Text style={styles.dateText}>{selectedDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</Text>
                    </View>
                    <TouchableOpacity onPress={() => changeDate(1)} style={styles.arrowButton}>
                        <IconSymbol name="chevron.right" size={20} color={BrandColors.primary} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={() => setShowEditModal(true)}>
                    <Text style={styles.editButtonText}>Edit Balances</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchData(selectedDate.toISOString().split('T')[0])} />}
            >
                {/* Summary Cards */}
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Opening Cash</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(openingBalance)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Closing Cash</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(closingBalance)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Cash Sales</Text>
                        <Text style={[styles.summaryValue, { color: FinancialColors.income.primary }]}>+{formatCurrency(totalCashSales)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Cash Expenses</Text>
                        <Text style={[styles.summaryValue, { color: FinancialColors.expense.primary }]}>-{formatCurrency(totalCashExpenses)}</Text>
                    </View>
                </View>

                {/* Discrepancy Card */}
                <View style={[styles.discrepancyCard, !isBalanced ? styles.discrepancyError : styles.discrepancySuccess]}>
                    <View style={styles.discrepancyRow}>
                        <Text style={styles.discrepancyLabel}>Expected Closing:</Text>
                        <Text style={styles.discrepancyValue}>{formatCurrency(expectedClosing)}</Text>
                    </View>
                    <View style={styles.discrepancyRow}>
                        <Text style={styles.discrepancyLabel}>Difference:</Text>
                        <Text style={[styles.discrepancyValue, !isBalanced ? { color: Colors.error[600] } : { color: Colors.success[600] }]}>
                            {formatCurrency(difference)}
                        </Text>
                    </View>
                    {!isBalanced && (
                        <Text style={styles.discrepancyWarning}>
                            <IconSymbol name="exclamationmark.triangle.fill" size={14} color={Colors.error[600]} /> Closing balance does not match expected value.
                        </Text>
                    )}
                </View>

                {/* Transactions List */}
                <View style={styles.transactionsContainer}>
                    <View style={styles.tabs}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
                            onPress={() => setActiveTab('sales')}
                        >
                            <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>Cash Sales ({cashSales.length})</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
                            onPress={() => setActiveTab('expenses')}
                        >
                            <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>Cash Expenses ({cashExpenses.length})</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.listContent}>
                        {activeTab === 'sales' ? (
                            cashSales.length > 0 ? (
                                cashSales.map(item => <View key={item.id}>{renderTransactionItem({ item })}</View>)
                            ) : (
                                <Text style={styles.emptyText}>No cash sales for this date</Text>
                            )
                        ) : (
                            cashExpenses.length > 0 ? (
                                cashExpenses.map(item => <View key={item.id}>{renderTransactionItem({ item })}</View>)
                            ) : (
                                <Text style={styles.emptyText}>No cash expenses for this date</Text>
                            )
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Edit Modal */}
            <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowEditModal(false)}>
                            <Text style={styles.cancelButton}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Edit Daily Cash</Text>
                        <TouchableOpacity onPress={handleSaveDailyCash}>
                            <Text style={styles.saveButton}>Save</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalContent}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Opening Cash</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editFormData.opening_cash}
                                onChangeText={(text) => setEditFormData(prev => ({ ...prev, opening_cash: text }))}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Closing Cash</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editFormData.closing_cash}
                                onChangeText={(text) => setEditFormData(prev => ({ ...prev, closing_cash: text }))}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Notes</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={editFormData.notes}
                                onChangeText={(text) => setEditFormData(prev => ({ ...prev, notes: text }))}
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.surface,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.base,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[200],
    },
    dateSelector: {
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
        minWidth: 140,
        justifyContent: 'center',
    },
    dateText: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.semibold,
        color: BrandColors.title,
    },
    editButton: {
        backgroundColor: BrandColors.primary + '15',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.base,
    },
    editButtonText: {
        color: BrandColors.primary,
        fontFamily: Typography.fontFamily.semibold,
        fontSize: Typography.fontSize.sm,
    },
    scrollContent: {
        padding: Spacing.base,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    summaryCard: {
        width: '48%',
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        ...Shadows.sm,
    },
    summaryLabel: {
        fontSize: Typography.fontSize.xs,
        color: Colors.neutral[500],
        fontFamily: Typography.fontFamily.medium,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: Typography.fontSize.lg,
        color: BrandColors.title,
        fontFamily: Typography.fontFamily.bold,
    },
    discrepancyCard: {
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        ...Shadows.sm,
    },
    discrepancySuccess: {
        borderColor: Colors.success[200],
        backgroundColor: Colors.success[50],
    },
    discrepancyError: {
        borderColor: Colors.error[200],
        backgroundColor: Colors.error[50],
    },
    discrepancyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    discrepancyLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.neutral[600],
        fontFamily: Typography.fontFamily.medium,
    },
    discrepancyValue: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.bold,
        color: BrandColors.title,
    },
    discrepancyWarning: {
        fontSize: Typography.fontSize.xs,
        color: Colors.error[600],
        marginTop: Spacing.xs,
        fontFamily: Typography.fontFamily.medium,
    },
    transactionsContainer: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        ...Shadows.sm,
        overflow: 'hidden',
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[200],
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: BrandColors.primary,
    },
    tabText: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.neutral[500],
    },
    activeTabText: {
        color: BrandColors.primary,
        fontFamily: Typography.fontFamily.semibold,
    },
    listContent: {
        padding: Spacing.base,
    },
    transactionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[100],
    },
    transactionLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginRight: Spacing.sm,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionTitle: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.medium,
        color: BrandColors.title,
    },
    transactionTime: {
        fontSize: Typography.fontSize.xs,
        color: Colors.neutral[500],
    },
    transactionAmount: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.bold,
        flexShrink: 0,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.neutral[500],
        padding: Spacing.lg,
        fontFamily: Typography.fontFamily.medium,
    },
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
        padding: Spacing.base,
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    inputLabel: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.medium,
        color: BrandColors.title,
        marginBottom: Spacing.xs,
    },
    textInput: {
        borderWidth: 1,
        borderColor: Colors.neutral[300],
        borderRadius: BorderRadius.base,
        padding: Spacing.sm,
        fontSize: Typography.fontSize.base,
        color: BrandColors.ink,
        backgroundColor: Colors.white,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
});
