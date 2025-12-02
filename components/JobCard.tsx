import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { ServiceTicket } from '@/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface JobCardProps {
    ticket: ServiceTicket;
    onPress: () => void;
    actionButton?: React.ReactNode;
    showSelection?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
    technicianName?: string;
    showTechnician?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
    ticket,
    onPress,
    actionButton,
    showSelection,
    isSelected,
    onSelect,
    technicianName,
    showTechnician = false,
}) => {
    const dueDate = ticket.due_date || ticket.dueDate;
    const now = new Date();
    const due = dueDate ? new Date(dueDate) : null;

    // Calculate days remaining
    let daysRemaining = null;
    let isOverdue = false;
    let isDueToday = false;
    let isDueTomorrow = false;

    if (due) {
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        daysRemaining = diffDays;
        isOverdue = diffTime < 0;
        isDueToday = new Date(due).toDateString() === now.toDateString();
        isDueTomorrow = !isDueToday && diffDays === 1;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'assigned': return BrandColors.primary;
            case 'in_progress': return Colors.info[500];
            case 'completed': return Colors.success[500];
            case 'reported': return Colors.error[500];
            default: return Colors.neutral[500];
        }
    };

    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 1: return Colors.error[500];
            case 2: return Colors.warning[500];
            case 3: return Colors.neutral[500];
            default: return Colors.neutral[500];
        }
    };

    return (
        <TouchableOpacity
            style={[styles.container, isSelected && styles.selectedContainer]}
            onPress={() => {
                if (showSelection && onSelect) {
                    onSelect();
                } else {
                    onPress();
                }
            }}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    {showSelection && (
                        <View style={styles.selectionCheckbox}>
                            <IconSymbol
                                name={isSelected ? "checkmark.circle.fill" : "circle"}
                                size={20}
                                color={isSelected ? BrandColors.primary : Colors.neutral[400]}
                            />
                        </View>
                    )}
                    <Text style={styles.ticketNumber}>{ticket.ticket_number || ticket.ticketNumber}</Text>
                </View>

                <View style={styles.badges}>
                    {/* Due Date Badge */}
                    {dueDate && (
                        <View style={[
                            styles.badge,
                            (isOverdue || isDueToday || isDueTomorrow) ? styles.overdueBadge : styles.dueFutureBadge
                        ]}>
                            <IconSymbol
                                name="calendar"
                                size={10}
                                color={(isOverdue || isDueToday || isDueTomorrow) ? Colors.error[600] : Colors.neutral[600]}
                            />
                            <Text style={[
                                styles.badgeText,
                                { color: (isOverdue || isDueToday || isDueTomorrow) ? Colors.error[600] : Colors.neutral[600] }
                            ]}>
                                {isOverdue ? 'Overdue' :
                                    isDueToday ? 'Due Today' :
                                        isDueTomorrow ? 'Due Tomorrow' :
                                            `Due in ${daysRemaining} days`}
                            </Text>
                        </View>
                    )}
                    {ticket.priority && (
                        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(ticket.priority) }]} />
                    )}
                </View>
            </View>

            <Text style={styles.symptom} numberOfLines={2}>
                {(() => {
                    const rawComplaint = ticket.customer_complaint || ticket.symptom;
                    if (Array.isArray(rawComplaint)) return rawComplaint.join(', ');
                    if (typeof rawComplaint === 'string') {
                        try {
                            const parsed = JSON.parse(rawComplaint);
                            if (Array.isArray(parsed)) return parsed.join(', ');
                        } catch (e) {
                            if (rawComplaint.trim().startsWith('[') && rawComplaint.trim().endsWith(']')) {
                                try {
                                    const fixed = rawComplaint.replace(/'/g, '"');
                                    const parsed = JSON.parse(fixed);
                                    if (Array.isArray(parsed)) return parsed.join(', ');
                                } catch (e2) { }
                            }
                        }
                        return rawComplaint;
                    }
                    return '';
                })()}
            </Text>

            <View style={styles.meta}>
                {/* Customer - Enhanced visibility */}
                <View style={styles.infoRow}>
                    <View style={styles.customerInfo}>
                        <Text style={styles.customerLabel}>Customer</Text>
                        <Text style={styles.customerName}>
                            {ticket.customer?.name || 'Unknown Customer'}
                        </Text>
                    </View>
                </View>

                {/* Vehicle Info - Highlighted */}
                {(ticket.vehicle_reg_no || ticket.vehicleRegNo) && (
                    <View style={styles.infoRow}>
                        <View style={styles.vehicleInfo}>
                            <Text style={styles.vehicleLabel}>Vehicle</Text>
                            <Text style={styles.vehicleValue}>
                                {ticket.vehicle_reg_no || ticket.vehicleRegNo}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Technician Info - Highlighted */}
                {showTechnician && technicianName && (
                    <View style={styles.infoRow}>
                        <View style={styles.technicianInfo}>
                            <Text style={styles.technicianLabel}>Technician</Text>
                            <Text style={styles.technicianValue}>
                                {technicianName}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <View style={styles.footerLeft}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusColor(ticket.status) }]}>
                            {(ticket.status || 'Unknown').replace('_', ' ')}
                        </Text>
                    </View>
                    <Text style={styles.dateText}>
                        {new Date(ticket.created_at || Date.now()).toLocaleDateString()}
                    </Text>
                </View>

                {actionButton}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        ...Shadows.sm,
        marginBottom: Spacing.md,
    },
    selectedContainer: {
        borderColor: BrandColors.primary,
        borderWidth: 1,
        backgroundColor: BrandColors.primary + '05',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    ticketNumber: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold as any,
        color: BrandColors.ink,
    },
    badges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    badge: {
        paddingHorizontal: Spacing.xs,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    overdueBadge: {
        backgroundColor: Colors.error[50],
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dueTodayBadge: {
        backgroundColor: Colors.warning[50],
    },
    dueFutureBadge: {
        backgroundColor: Colors.neutral[100],
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: Typography.fontWeight.semibold as any,
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    symptom: {
        fontSize: Typography.fontSize.sm,
        color: Colors.neutral[600],
        marginBottom: Spacing.sm,
        lineHeight: 20,
    },
    meta: {
        gap: 8,
        marginBottom: Spacing.sm,
    },
    infoRow: {
        marginBottom: 2,
    },
    // Customer Styles
    customerInfo: {
        backgroundColor: BrandColors.primary + '08',
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: BrandColors.primary,
    },
    customerLabel: {
        fontSize: 10,
        color: BrandColors.primary,
        fontWeight: Typography.fontWeight.semibold as any,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    customerName: {
        fontSize: Typography.fontSize.sm,
        color: BrandColors.ink,
        fontWeight: Typography.fontWeight.bold as any,
    },
    // Vehicle Styles
    vehicleInfo: {
        backgroundColor: BrandColors.title + '08',
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: BrandColors.title,
    },
    vehicleLabel: {
        fontSize: 10,
        color: BrandColors.title,
        fontWeight: Typography.fontWeight.semibold as any,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    vehicleValue: {
        fontSize: Typography.fontSize.sm,
        color: BrandColors.ink,
        fontWeight: Typography.fontWeight.bold as any,
    },
    // Technician Styles
    technicianInfo: {
        backgroundColor: Colors.info[50],
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: Colors.info[600],
    },
    technicianLabel: {
        fontSize: 10,
        color: Colors.info[600],
        fontWeight: Typography.fontWeight.semibold as any,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    technicianValue: {
        fontSize: Typography.fontSize.sm,
        color: BrandColors.ink,
        fontWeight: Typography.fontWeight.bold as any,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.xs,
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: Typography.fontWeight.semibold as any,
        textTransform: 'capitalize',
    },
    dateText: {
        fontSize: 10,
        color: Colors.neutral[400],
    },
    selectionCheckbox: {
        marginRight: Spacing.xs,
    },
});
