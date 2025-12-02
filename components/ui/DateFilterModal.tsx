import { IconSymbol } from '@/components/ui/icon-symbol';
import {
    BorderRadius,
    BrandColors,
    Colors,
    Shadows,
    Spacing,
    Typography,
} from '@/constants/design-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

interface DateFilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (startDate: Date, endDate: Date) => void;
    initialStartDate: Date;
    initialEndDate: Date;
    mode: 'single' | 'range';
}

export default function DateFilterModal({
    visible,
    onClose,
    onApply,
    initialStartDate,
    initialEndDate,
    mode
}: DateFilterModalProps) {
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [activeDateSelection, setActiveDateSelection] = useState<'start' | 'end'>('start');

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setStartDate(initialStartDate);
            setEndDate(initialEndDate);
            setActiveDateSelection('start');
        }
    }, [visible, initialStartDate, initialEndDate]);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (!selectedDate) return;

        if (mode === 'single') {
            setStartDate(selectedDate);
            setEndDate(selectedDate); // For single mode, start and end are same
        } else {
            if (activeDateSelection === 'start') {
                setStartDate(selectedDate);
                // If start date is after end date, update end date to match
                if (selectedDate > endDate) {
                    setEndDate(selectedDate);
                }
            } else {
                setEndDate(selectedDate);
                // If end date is before start date, update start date to match
                if (selectedDate < startDate) {
                    setStartDate(selectedDate);
                }
            }
        }
    };

    const handleApply = () => {
        onApply(startDate, endDate);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.container}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>
                                    {mode === 'single' ? 'Select Date' : 'Select Date Range'}
                                </Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <IconSymbol name="xmark" size={20} color={Colors.neutral[500]} />
                                </TouchableOpacity>
                            </View>

                            {/* Range Selector Tabs (Only for Range Mode) */}
                            {mode === 'range' && (
                                <View style={styles.tabsContainer}>
                                    <TouchableOpacity
                                        style={[styles.tab, activeDateSelection === 'start' && styles.activeTab]}
                                        onPress={() => setActiveDateSelection('start')}
                                    >
                                        <Text style={styles.tabLabel}>Start Date</Text>
                                        <Text style={[styles.tabValue, activeDateSelection === 'start' && styles.activeTabValue]}>
                                            {startDate.toLocaleDateString()}
                                        </Text>
                                    </TouchableOpacity>
                                    <View style={styles.arrowContainer}>
                                        <IconSymbol name="arrow.right" size={16} color={Colors.neutral[400]} />
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.tab, activeDateSelection === 'end' && styles.activeTab]}
                                        onPress={() => setActiveDateSelection('end')}
                                    >
                                        <Text style={styles.tabLabel}>End Date</Text>
                                        <Text style={[styles.tabValue, activeDateSelection === 'end' && styles.activeTabValue]}>
                                            {endDate.toLocaleDateString()}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Date Picker */}
                            <View style={styles.pickerContainer}>
                                <DateTimePicker
                                    value={mode === 'single' ? startDate : (activeDateSelection === 'start' ? startDate : endDate)}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    style={styles.datePicker}
                                    textColor={BrandColors.ink}
                                    themeVariant="light"
                                />
                            </View>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                                    <Text style={styles.applyButtonText}>Apply</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
        ...Shadows.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[200],
    },
    title: {
        fontSize: Typography.fontSize.lg,
        fontFamily: Typography.fontFamily.bold,
        color: BrandColors.title,
    },
    closeButton: {
        padding: Spacing.xs,
    },
    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.base,
        backgroundColor: Colors.neutral[50],
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[200],
    },
    tab: {
        flex: 1,
        padding: Spacing.sm,
        borderRadius: BorderRadius.base,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.neutral[200],
        alignItems: 'center',
    },
    activeTab: {
        borderColor: BrandColors.primary,
        backgroundColor: BrandColors.surface,
    },
    tabLabel: {
        fontSize: Typography.fontSize.xs,
        color: Colors.neutral[500],
        marginBottom: 2,
    },
    tabValue: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.semibold,
        color: BrandColors.ink,
    },
    activeTabValue: {
        color: BrandColors.primary,
    },
    arrowContainer: {
        paddingHorizontal: Spacing.sm,
    },
    pickerContainer: {
        padding: Spacing.base,
        alignItems: 'center',
        justifyContent: 'center',
    },
    datePicker: {
        width: '100%',
        height: 200, // Fixed height for spinner
    },
    footer: {
        flexDirection: 'row',
        padding: Spacing.base,
        gap: Spacing.base,
        borderTopWidth: 1,
        borderTopColor: Colors.neutral[200],
    },
    cancelButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderRadius: BorderRadius.base,
        borderWidth: 1,
        borderColor: Colors.neutral[300],
    },
    cancelButtonText: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.neutral[600],
    },
    applyButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderRadius: BorderRadius.base,
        backgroundColor: BrandColors.primary,
        ...Shadows.sm,
    },
    applyButtonText: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.semibold,
        color: Colors.white,
    },
});
