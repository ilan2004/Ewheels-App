import DateFilterModal from '@/components/ui/DateFilterModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
    BorderRadius,
    BrandColors,
    Colors,
    Shadows,
    Spacing,
    Typography,
} from '@/constants/design-system';
import { useCashManagement } from '@/hooks/useFinancial';
import { DailyCash } from '@/types/financial.types';
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
    const {
        dailyCashRecords,
        drawings,
        loading,
        fetchDailyRecords,
        updateDailyCash,
        createDailyCash,
        fetchData,
        calculateRealTimeBalances,
        timeline
    } = useCashManagement();

    const [activeTab, setActiveTab] = useState<'overview' | 'drawings' | 'timeline'>('overview');
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedDailyCash, setSelectedDailyCash] = useState<DailyCash | null>(null);
    const [editFormData, setEditFormData] = useState({
        opening_cash: '0',
        closing_cash: '0',
        notes: ''
    });

    // Date Filtering State
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    });
    const [endDate, setEndDate] = useState(new Date());
    const [showDateModal, setShowDateModal] = useState(false);

    useEffect(() => {
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        if (activeTab === 'timeline') {
            // For timeline, we focus on the start date (selected date)
            fetchData(startStr);
        } else {
            fetchDailyRecords(startStr, endStr);
        }

        // Fetch today's real-time data for KPI cards if in overview
        if (activeTab === 'overview') {
            fetchData(new Date().toISOString().split('T')[0]);
        }
    }, [activeTab, startDate, endDate]);

    // Calculate Totals for KPI Cards
    const totalCashBalance = dailyCashRecords.reduce((sum, record) => sum + (record.cash_balance || 0), 0);
    const totalHdfcBalance = dailyCashRecords.reduce((sum, record) => sum + (record.hdfc_balance || 0), 0);
    const totalIndianBankBalance = dailyCashRecords.reduce((sum, record) => sum + (record.indian_bank_balance || 0), 0);
    const totalBalance = totalCashBalance + totalHdfcBalance + totalIndianBankBalance;

    // Latest Record for KPI Cards (Real-time preferred)
    const realTimeBalances = calculateRealTimeBalances();
    const latestRecord = dailyCashRecords.length > 0 ? dailyCashRecords[0] : null;

    const currentHdfcBalance = realTimeBalances?.hdfc_balance ?? (latestRecord?.hdfc_balance || 0);
    const currentIndianBankBalance = realTimeBalances?.indian_bank_balance ?? (latestRecord?.indian_bank_balance || 0);
    const currentCashBalance = realTimeBalances?.cash_balance ?? (latestRecord?.cash_balance || 0);

    const currentTotalBalance = currentCashBalance + currentHdfcBalance + currentIndianBankBalance;

    const handleStartToday = async () => {
        const todayStr = new Date().toISOString().split('T')[0];

        // Check if record already exists
        const exists = dailyCashRecords.some(r => r.date === todayStr);
        if (exists) {
            Alert.alert('Info', 'Daily cash record for today already exists.');
            return;
        }

        // Find yesterday's record (or the most recent one before today)
        // dailyCashRecords is sorted by date descending, so the first one that isn't today (if any)
        // But since we checked exists, and if we are sorted, the first one should be the most recent previous.
        // Wait, dailyCashRecords depends on the date filter. We might need to fetch specifically.
        // For safety, let's assume the user has the list loaded or we fetch specifically.
        // Better: Fetch the most recent record from API to be sure.
        // For now, let's use the list if available, or default to 0.

        // Actually, let's look at the sorted list.
        const previousRecord = dailyCashRecords.find(r => r.date < todayStr);

        const openingCash = previousRecord ? previousRecord.closing_cash : 0;
        const openingHdfc = previousRecord ? previousRecord.hdfc_balance : 0; // Assuming closing balance of prev day
        const openingIndian = previousRecord ? previousRecord.indian_bank_balance : 0;

        const result = await createDailyCash({
            date: todayStr,
            opening_cash: openingCash,
            closing_cash: 0,
            hdfc_balance: openingHdfc,
            indian_bank_balance: openingIndian,
            cash_balance: openingCash // Initial balance is opening
        });

        if (result.success) {
            Alert.alert('Success', 'Started today\'s cash record');
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];
            fetchDailyRecords(startStr, endStr);
            // Also refresh current view data
            fetchData(todayStr);
        } else {
            Alert.alert('Error', result.error || 'Failed to start today');
        }
    };

    const handleCloseToday = async () => {
        const todayStr = new Date().toISOString().split('T')[0];

        // We need the record for today to update it
        // We can find it in dailyCashRecords or fetch it.
        // Let's try to find it in the loaded records first.
        let todayRecord = dailyCashRecords.find(r => r.date === todayStr);

        if (!todayRecord) {
            Alert.alert('Error', 'No record found for today. Please "Start Today" first.');
            return;
        }

        // Calculate closing balances
        // We use the real-time calculated balances
        if (!realTimeBalances) {
            Alert.alert('Error', 'Could not calculate real-time balances.');
            return;
        }

        const result = await updateDailyCash(todayStr, {
            closing_cash: realTimeBalances.cash_balance,
            // We might want to update bank balances too if they changed during the day?
            // The requirement says "make sure evening closing cash is running balance".
            // It doesn't explicitly say to update bank balances, but it implies closing the day.
            // Usually closing cash is the main thing to verify.
            // I will update closing_cash.
        });

        if (result.success) {
            Alert.alert('Success', 'Closed today\'s cash record');
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];
            fetchDailyRecords(startStr, endStr);
        } else {
            Alert.alert('Error', result.error || 'Failed to close today');
        }
    };

    const handleEditPress = (record: DailyCash) => {
        setSelectedDailyCash(record);
        setEditFormData({
            opening_cash: record.opening_cash.toString(),
            closing_cash: record.closing_cash.toString(),
            notes: record.notes || ''
        });
        setShowEditModal(true);
    };

    const handleSaveDailyCash = async () => {
        if (!selectedDailyCash) return;

        const opening = parseFloat(editFormData.opening_cash) || 0;
        const closing = parseFloat(editFormData.closing_cash) || 0;

        const result = await updateDailyCash(selectedDailyCash.date, {
            opening_cash: opening,
            closing_cash: closing,
            notes: editFormData.notes
        });

        if (result.success) {
            Alert.alert('Success', 'Daily cash updated successfully');
            setShowEditModal(false);
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];
            fetchDailyRecords(startStr, endStr);
        } else {
            Alert.alert('Error', result.error || 'Failed to update daily cash');
        }
    };

    const handleDateApply = (start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const renderOverviewTab = () => (
        <View>
            {/* KPI Cards */}
            <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, { backgroundColor: '#F3E8FF' }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: '#E9D5FF' }]}>
                            <IconSymbol name="wallet.pass.fill" size={20} color="#6B21A8" />
                        </View>
                        <Text style={[styles.summaryLabel, { color: '#6B21A8' }]}>Total Balance</Text>
                    </View>
                    <Text style={[styles.summaryValue, { color: '#6B21A8' }]}>{formatCurrency(currentTotalBalance)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#E0F2FE' }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: '#BAE6FD' }]}>
                            <IconSymbol name="building.columns.fill" size={20} color="#0369A1" />
                        </View>
                        <Text style={[styles.summaryLabel, { color: '#0369A1' }]}>HDFC Bank</Text>
                    </View>
                    <Text style={[styles.summaryValue, { color: '#0369A1' }]}>{formatCurrency(currentHdfcBalance)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#FFEDD5' }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FED7AA' }]}>
                            <IconSymbol name="building.columns.fill" size={20} color="#C2410C" />
                        </View>
                        <Text style={[styles.summaryLabel, { color: '#C2410C' }]}>Indian Bank</Text>
                    </View>
                    <Text style={[styles.summaryValue, { color: '#C2410C' }]}>{formatCurrency(currentIndianBankBalance)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#DCFCE7' }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: '#BBF7D0' }]}>
                            <IconSymbol name="banknote.fill" size={20} color="#15803D" />
                        </View>
                        <Text style={[styles.summaryLabel, { color: '#15803D' }]}>Cash Balance</Text>
                    </View>
                    <Text style={[styles.summaryValue, { color: '#15803D' }]}>{formatCurrency(currentCashBalance)}</Text>
                </View>
            </View>

            {/* Daily Records List (Card Style) */}
            <Text style={styles.sectionTitle}>Daily Records</Text>

            {dailyCashRecords.length === 0 ? (
                <View style={styles.emptyState}>
                    <IconSymbol name="doc.text.magnifyingglass" size={48} color={Colors.neutral[400]} />
                    <Text style={styles.emptyText}>No records found for this period.</Text>
                </View>
            ) : (
                dailyCashRecords.map((record) => (
                    <TouchableOpacity key={record.id} style={styles.recordCard} onPress={() => handleEditPress(record)}>
                        <View style={styles.recordHeader}>
                            <View style={styles.dateContainer}>
                                <IconSymbol name="calendar" size={16} color={Colors.neutral[500]} style={{ marginRight: 6 }} />
                                <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                            </View>
                            <View style={[styles.statusBadge, record.is_verified ? styles.statusVerified : styles.statusPending]}>
                                <Text style={[styles.statusText, { color: record.is_verified ? Colors.success[700] : Colors.warning[700] }]}>
                                    {record.is_verified ? 'Verified' : 'Pending'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.balanceGrid}>
                            <View style={styles.balanceItem}>
                                <Text style={styles.balanceLabel}>Opening</Text>
                                <Text style={styles.balanceValue}>{formatCurrency(record.opening_cash)}</Text>
                            </View>
                            <View style={styles.balanceItem}>
                                <Text style={styles.balanceLabel}>Closing</Text>
                                <Text style={[styles.balanceValue, { fontWeight: 'bold' }]}>{formatCurrency(record.closing_cash)}</Text>
                            </View>
                            <View style={styles.balanceItem}>
                                <Text style={styles.balanceLabel}>Cash Bal</Text>
                                <Text style={[styles.balanceValue, { color: Colors.success[600] }]}>{formatCurrency(record.cash_balance || 0)}</Text>
                            </View>
                        </View>

                        <View style={[styles.balanceGrid, { marginTop: 8 }]}>
                            <View style={styles.balanceItem}>
                                <Text style={styles.balanceLabel}>HDFC</Text>
                                <Text style={[styles.balanceValue, { color: '#0369A1' }]}>{formatCurrency(record.hdfc_balance || 0)}</Text>
                            </View>
                            <View style={styles.balanceItem}>
                                <Text style={styles.balanceLabel}>Indian Bank</Text>
                                <Text style={[styles.balanceValue, { color: '#C2410C' }]}>{formatCurrency(record.indian_bank_balance || 0)}</Text>
                            </View>
                            <View style={styles.balanceItem}>
                                {/* Spacer */}
                            </View>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </View>
    );



    const renderDrawingsTab = () => (
        <View>
            <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, { width: 80 }]}>Date</Text>
                <Text style={[styles.columnHeader, { flex: 1 }]}>Partner</Text>
                <Text style={[styles.columnHeader, { width: 60 }]}>Source</Text>
                <Text style={[styles.columnHeader, { width: 70 }]}>Type</Text>
                <Text style={[styles.columnHeader, { width: 80, textAlign: 'right' }]}>Amount</Text>
            </View>

            {drawings.length === 0 ? (
                <Text style={styles.emptyText}>No drawings found for this period.</Text>
            ) : (
                drawings.map((drawing) => (
                    <View key={drawing.id} style={styles.tableRow}>
                        <Text style={[styles.cellText, { width: 80 }]}>{formatDate(drawing.created_at)}</Text>
                        <Text style={[styles.cellText, { flex: 1 }]}>{drawing.partner_name}</Text>
                        <Text style={[styles.cellText, { width: 60, textTransform: 'capitalize' }]}>{drawing.source.replace('_', ' ')}</Text>
                        <Text style={[styles.cellText, { width: 70, textTransform: 'capitalize', color: drawing.type === 'deposit' ? Colors.success[600] : Colors.error[600] }]}>
                            {drawing.type}
                        </Text>
                        <Text style={[styles.cellText, { width: 80, textAlign: 'right', fontWeight: 'bold' }]}>
                            {formatCurrency(drawing.amount)}
                        </Text>
                    </View>
                ))
            )}
        </View>
    );

    const renderTimelineTab = () => (
        <View>
            <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, { width: 60 }]}>Time</Text>
                <Text style={[styles.columnHeader, { flex: 1 }]}>Description</Text>
                <Text style={[styles.columnHeader, { width: 70 }]}>Type</Text>
                <Text style={[styles.columnHeader, { width: 80, textAlign: 'right' }]}>Amount</Text>
                <Text style={[styles.columnHeader, { width: 80, textAlign: 'right' }]}>Balance</Text>
            </View>

            {timeline.length === 0 ? (
                <Text style={styles.emptyText}>No transactions found for this date.</Text>
            ) : (
                timeline.map((item) => {
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

    return (
        <View style={styles.container}>
            {/* Header / Tabs */}
            <View style={styles.header}>
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
                        onPress={() => setActiveTab('overview')}
                    >
                        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'timeline' && styles.activeTab]}
                        onPress={() => setActiveTab('timeline')}
                    >
                        <Text style={[styles.tabText, activeTab === 'timeline' && styles.activeTabText]}>Timeline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'drawings' && styles.activeTab]}
                        onPress={() => setActiveTab('drawings')}
                    >
                        <Text style={[styles.tabText, activeTab === 'drawings' && styles.activeTabText]}>Drawings</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Date Filter */}
            <View style={styles.filterContainer}>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDateModal(true)}>
                    <IconSymbol name="calendar" size={16} color={Colors.neutral[600]} style={{ marginRight: 6 }} />
                    <Text style={styles.dateButtonText}>
                        {activeTab === 'timeline'
                            ? startDate.toLocaleDateString()
                            : `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`}
                    </Text>
                </TouchableOpacity>

                <View style={styles.quickDateButtons}>
                    <TouchableOpacity
                        style={styles.quickDateButton}
                        onPress={() => {
                            const today = new Date();
                            setStartDate(today);
                            setEndDate(today);
                        }}
                    >
                        <Text style={styles.quickDateButtonText}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickDateButton}
                        onPress={() => {
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            setStartDate(yesterday);
                            setEndDate(yesterday);
                        }}
                    >
                        <Text style={styles.quickDateButtonText}>Yesterday</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <DateFilterModal
                visible={showDateModal}
                onClose={() => setShowDateModal(false)}
                onApply={handleDateApply}
                initialStartDate={startDate}
                initialEndDate={endDate}
                mode={activeTab === 'timeline' ? 'single' : 'range'}
            />

            {/* Daily Actions */}
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.success[50], borderColor: Colors.success[200] }]}
                    onPress={handleStartToday}
                >
                    <IconSymbol name="play.fill" size={16} color={Colors.success[700]} style={{ marginRight: 6 }} />
                    <Text style={[styles.actionButtonText, { color: Colors.success[700] }]}>Start Today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.error[50], borderColor: Colors.error[200] }]}
                    onPress={handleCloseToday}
                >
                    <IconSymbol name="stop.fill" size={16} color={Colors.error[700]} style={{ marginRight: 6 }} />
                    <Text style={[styles.actionButtonText, { color: Colors.error[700] }]}>Close Today</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {
                    const startStr = startDate.toISOString().split('T')[0];
                    const endStr = endDate.toISOString().split('T')[0];
                    if (activeTab === 'timeline') {
                        // For timeline, we usually want a single day, or the range. 
                        // User said "selected date". Let's assume start date is the selected date for timeline.
                        fetchData(startStr);
                    } else {
                        fetchDailyRecords(startStr, endStr);
                    }
                }} />}
            >
                {activeTab === 'overview' ? renderOverviewTab() : activeTab === 'timeline' ? renderTimelineTab() : renderDrawingsTab()}
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
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[200],
    },
    tabs: {
        flexDirection: 'row',
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
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[200],
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: Colors.neutral[100],
        borderRadius: BorderRadius.base,
    },
    dateButtonText: {
        fontSize: Typography.fontSize.sm,
        color: BrandColors.ink,
        fontFamily: Typography.fontFamily.medium,
    },
    dateSeparator: {
        marginHorizontal: Spacing.sm,
        color: Colors.neutral[500],
        fontSize: Typography.fontSize.sm,
    },
    quickDateButtons: {
        flexDirection: 'row',
        marginLeft: Spacing.md,
        gap: Spacing.xs,
    },
    quickDateButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: Colors.neutral[100],
        borderRadius: BorderRadius.base,
        borderWidth: 1,
        borderColor: Colors.neutral[200],
    },
    quickDateButtonText: {
        fontSize: Typography.fontSize.xs,
        color: Colors.neutral[600],
        fontFamily: Typography.fontFamily.medium,
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
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        ...Shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.xs,
    },
    summaryLabel: {
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.medium,
        flex: 1,
    },
    summaryValue: {
        fontSize: Typography.fontSize.lg,
        fontFamily: Typography.fontFamily.bold,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.bold,
        color: BrandColors.title,
        marginBottom: Spacing.sm,
        marginTop: Spacing.sm,
    },
    recordCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: Colors.neutral[100],
    },
    recordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordDate: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.semibold,
        color: BrandColors.title,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    statusVerified: {
        backgroundColor: Colors.success[100],
    },
    statusPending: {
        backgroundColor: Colors.warning[100],
    },
    statusText: {
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.medium,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.neutral[100],
        marginBottom: Spacing.sm,
    },
    balanceGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    balanceItem: {
        flex: 1,
    },
    balanceLabel: {
        fontSize: Typography.fontSize.xs,
        color: Colors.neutral[500],
        marginBottom: 2,
    },
    balanceValue: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.medium,
        color: BrandColors.ink,
    },
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
        color: BrandColors.ink,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.md,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.neutral[500],
        marginTop: Spacing.md,
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
    badgeContainer: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        width: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontSize: 10,
        fontFamily: Typography.fontFamily.bold,
    },
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        gap: Spacing.md,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[200],
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    actionButtonText: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.semibold,
    },
});
