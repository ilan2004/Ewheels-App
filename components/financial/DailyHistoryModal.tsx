
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandColors, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { useCashManagement } from '@/hooks/useFinancial';
import { generateDailyReportPDF } from '@/lib/reportPDFGenerator';
import React, { useEffect } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TransactionList from './TransactionList';

interface DailyHistoryModalProps {
    visible: boolean;
    onClose: () => void;
    date: string;
}

export default function DailyHistoryModal({ visible, onClose, date }: DailyHistoryModalProps) {
    const { timeline, fetchData, loading, allDailySales, allDailyExpenses, dailyCash } = useCashManagement();

    const handleDownloadPDF = async () => {
        if (!date) return;
        try {
            await generateDailyReportPDF(date, allDailySales, allDailyExpenses, dailyCash);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
        }
    };

    useEffect(() => {
        if (visible && date) {
            fetchData(date);
        }
    }, [visible, date]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Transaction History</Text>
                    <TouchableOpacity onPress={handleDownloadPDF} style={styles.closeButton}>
                        <IconSymbol name="square.and.arrow.up" size={20} color={BrandColors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.dateHeader}>
                        <IconSymbol name="calendar" size={20} color={BrandColors.primary} />
                        <Text style={styles.dateText}>{formatDate(date)}</Text>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={BrandColors.primary} />
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            <TransactionList transactions={timeline} emptyMessage="No transactions for this date." />
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
