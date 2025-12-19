
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandColors, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { generatePaymentMethodReportPDF } from '@/lib/reportPDFGenerator';
import { financialService } from '@/services/financialService';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { TransactionItem } from '@/types/financial.types';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TransactionList from './TransactionList';

interface PaymentMethodHistoryModalProps {
    visible: boolean;
    onClose: () => void;
    method: 'cash' | 'hdfc' | 'indian_bank';
    startDate: Date;
    endDate: Date;
}

export default function PaymentMethodHistoryModal({ visible, onClose, method, startDate, endDate }: PaymentMethodHistoryModalProps) {
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();
    const { activeLocation } = useLocationStore();

    const handleDownloadPDF = async () => {
        if (!transactions.length) return;
        try {
            await generatePaymentMethodReportPDF(
                getTitle(),
                startDate,
                endDate,
                transactions
            );
        } catch (error) {
            console.error('Failed to generate PDF:', error);
        }
    };

    useEffect(() => {
        if (visible && user) {
            fetchTransactions();
        }
    }, [visible, user, method, startDate, endDate]);

    const fetchTransactions = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const response = await financialService.getTransactionsByMethod(
                startStr,
                endStr,
                method,
                user.role,
                activeLocation?.id
            );

            if (response.success && response.data) {
                setTransactions(response.data);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (method) {
            case 'hdfc': return 'HDFC Bank History';
            case 'indian_bank': return 'Indian Bank History';
            case 'cash': return 'Cash Transaction History';
            default: return 'Transaction History';
        }
    };

    const formatDateRange = () => {
        if (startDate.toDateString() === endDate.toDateString()) {
            return startDate.toLocaleDateString();
        }
        return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{getTitle()}</Text>
                    <TouchableOpacity onPress={handleDownloadPDF} style={styles.closeButton}>
                        <IconSymbol name="square.and.arrow.up" size={20} color={BrandColors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.dateHeader}>
                        <IconSymbol name="calendar" size={20} color={BrandColors.primary} />
                        <Text style={styles.dateText}>{formatDateRange()}</Text>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={BrandColors.primary} />
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            <TransactionList
                                transactions={transactions}
                                emptyMessage={`No ${method.replace('_', ' ')} transactions found for this period.`}
                            />
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[200],
        backgroundColor: Colors.white,
    },
    closeButton: {
        padding: Spacing.sm,
    },
    closeButtonText: {
        color: BrandColors.primary,
        fontFamily: Typography.fontFamily.medium,
        fontSize: Typography.fontSize.base,
    },
    title: {
        fontSize: Typography.fontSize.lg,
        fontFamily: Typography.fontFamily.bold,
        color: BrandColors.title,
    },
    placeholder: {
        width: 50,
    },
    content: {
        flex: 1,
        backgroundColor: Colors.neutral[50],
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.white,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    dateText: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.semibold,
        color: BrandColors.ink,
        marginLeft: Spacing.sm,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: Spacing.base,
        paddingBottom: Spacing.xl,
    }
});
