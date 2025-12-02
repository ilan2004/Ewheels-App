import { IconSymbol } from '@/components/ui/icon-symbol';
import {
    BorderRadius,
    BrandColors,
    Colors,
    Spacing,
    Typography,
} from '@/constants/design-system';
import React, { useMemo, useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CustomCalendarProps {
    value: Date;
    onChange: (date: Date) => void;
}

export default function CustomCalendar({ value, onChange }: CustomCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateSelect = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        onChange(newDate);
    };

    const renderDays = useMemo(() => {
        const totalDays = daysInMonth(currentMonth);
        const startDay = firstDayOfMonth(currentMonth);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        // Days of current month
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const isSelected = date.toDateString() === value.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            days.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.dayCell,
                        isSelected && styles.selectedDayCell,
                        !isSelected && isToday && styles.todayCell
                    ]}
                    onPress={() => handleDateSelect(i)}
                >
                    <Text style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        !isSelected && isToday && styles.todayText
                    ]}>
                        {i}
                    </Text>
                </TouchableOpacity>
            );
        }

        return days;
    }, [currentMonth, value]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                    <IconSymbol name="chevron.left" size={20} color={Colors.neutral[600]} />
                </TouchableOpacity>
                <Text style={styles.monthText}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                    <IconSymbol name="chevron.right" size={20} color={Colors.neutral[600]} />
                </TouchableOpacity>
            </View>

            {/* Weekdays */}
            <View style={styles.weekRow}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
                {renderDays}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: Spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    navButton: {
        padding: Spacing.sm,
    },
    monthText: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.semibold,
        color: BrandColors.ink,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: Spacing.sm,
    },
    weekDayText: {
        width: 40,
        textAlign: 'center',
        fontSize: Typography.fontSize.xs,
        color: Colors.neutral[400],
        fontFamily: Typography.fontFamily.medium,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        // justifyContent: 'space-around', // Align with week rows
    },
    dayCell: {
        width: '14.28%', // 100% / 7
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BorderRadius.full,
    },
    selectedDayCell: {
        backgroundColor: BrandColors.primary,
    },
    todayCell: {
        borderWidth: 1,
        borderColor: BrandColors.primary,
    },
    dayText: {
        fontSize: Typography.fontSize.sm,
        color: BrandColors.ink,
        fontFamily: Typography.fontFamily.regular,
    },
    selectedDayText: {
        color: Colors.white,
        fontFamily: Typography.fontFamily.semibold,
    },
    todayText: {
        color: BrandColors.primary,
        fontFamily: Typography.fontFamily.medium,
    },
});
