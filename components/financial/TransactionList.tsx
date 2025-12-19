
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/design-system';
import { TransactionItem } from '@/types/financial.types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TransactionListProps {
    transactions: TransactionItem[];
    emptyMessage?: string;
}

export default function TransactionList({ transactions, emptyMessage = 'No transactions found.' }: TransactionListProps) {
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <View>
            <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, { width: 60 }]}>Time</Text>
                <Text style={[styles.columnHeader, { flex: 1 }]}>Description</Text>
                <Text style={[styles.columnHeader, { width: 70 }]}>Type</Text>
                <Text style={[styles.columnHeader, { width: 80, textAlign: 'right' }]}>Amount</Text>
                <Text style={[styles.columnHeader, { width: 80, textAlign: 'right' }]}>Balance</Text>
            </View>

            {transactions.length === 0 ? (
                <Text style={styles.emptyText}>{emptyMessage}</Text>
            ) : (
                transactions.map((item) => {
                    const isPositive = item.type === 'sale' || item.type === 'investment' || (item.type === 'drawing' && item.drawing_type === 'deposit');
                    const balance = item.method === 'cash' ? item.running_balance?.cash
                        : item.method === 'indian_bank' ? item.running_balance?.indian_bank
                            : item.running_balance?.hdfc;

                    return (
                        <View key={item.id} style={styles.tableRow}>
                            <Text style={[styles.cellText, { width: 60 }]}>
                                {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cellText} numberOfLines={1}>{item.description}</Text>
                                <Text style={[styles.cellText, { fontSize: 10, color: Colors.neutral[500] }]}>
                                    {item.method === 'hdfc' || item.method === 'hdfc_bank' ? 'HDFC'
                                        : item.method === 'indian_bank' ? 'Indian Bank'
                                            : 'Cash'}
                                </Text>
                            </View>
                            <View style={[styles.badgeContainer, {
                                backgroundColor: item.type === 'sale' ? '#DCFCE7'
                                    : item.type === 'expense' ? '#FEE2E2'
                                        : item.type === 'investment' ? '#DBEAFE'
                                            : '#F3E8FF'
                            }]}>
                                <Text style={[styles.badgeText, {
                                    color: item.type === 'sale' ? '#15803D'
                                        : item.type === 'expense' ? '#B91C1C'
                                            : item.type === 'investment' ? '#1D4ED8'
                                                : '#7E22CE'
                                }]}>
                                    {item.type === 'drawing' ? (item.drawing_type === 'deposit' ? 'Dep' : 'W/D') : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                </Text>
                            </View>
                            <Text style={[styles.cellText, { width: 80, textAlign: 'right', color: isPositive ? Colors.success[600] : Colors.error[600] }]}>
                                {isPositive ? '+' : '-'}{formatCurrency(item.amount)}
                            </Text>
                            <Text style={[styles.cellText, { width: 80, textAlign: 'right', fontWeight: 'bold' }]}>
                                {formatCurrency(balance || 0)}
                            </Text>
                        </View>
                    );
                })
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        backgroundColor: Colors.neutral[100],
        borderTopLeftRadius: BorderRadius.base,
        borderTopRightRadius: BorderRadius.base,
    },
    columnHeader: {
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.semibold,
        color: Colors.neutral[600],
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[100],
        backgroundColor: Colors.white,
        alignItems: 'center',
    },
    cellText: {
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.neutral[800], // Changed from BrandColors.ink (assuming it's similar, or I should import BrandColors)
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.neutral[500],
        marginTop: Spacing.md,
        fontFamily: Typography.fontFamily.medium,
    },
    badgeContainer: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
    }
});
