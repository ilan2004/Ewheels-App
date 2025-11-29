import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandColors, Colors } from '@/constants/design-system';
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
    const isOverdue = dueDate && new Date(dueDate) < new Date();
    const isDueToday = dueDate &&
        new Date(dueDate).toDateString() === new Date().toDateString();

    const getStatusColor = () => {
        switch (ticket.status) {
            case 'assigned': return '#3B82F6';
            case 'in_progress': return '#8B5CF6';
            case 'completed': return '#10B981';
            case 'reported': return Colors.warning[500];
            default: return '#6B7280';
        }
    };

    const getStatusIcon = () => {
        switch (ticket.status) {
            case 'assigned': return 'doc.text';
            case 'in_progress': return 'gearshape';
            case 'completed': return 'checkmark.circle';
            case 'reported': return 'exclamationmark.circle';
            default: return 'doc.text';
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
                    <IconSymbol
                        name={getStatusIcon()}
                        size={20}
                        color={getStatusColor()}
                    />
                    <Text style={styles.ticketNumber}>{ticket.ticket_number || ticket.ticketNumber}</Text>
                </View>
                <View style={styles.badges}>
                    {isOverdue && (
                        <View style={[styles.badge, styles.overdueBadge]}>
                            <Text style={[styles.badgeText, { color: '#DC2626' }]}>Overdue</Text>
                        </View>
                    )}
                    {isDueToday && !isOverdue && (
                        <View style={[styles.badge, styles.dueTodayBadge]}>
                            <Text style={[styles.badgeText, { color: '#D97706' }]}>Due Today</Text>
                        </View>
                    )}
                    {ticket.priority === 1 && (
                        <View style={[styles.badge, styles.highPriorityBadge]}>
                            <Text style={[styles.badgeText, { color: '#DC2626' }]}>High Priority</Text>
                        </View>
                    )}
                </View>
            </View>

            <Text style={styles.symptom} numberOfLines={2}>
                {ticket.customer_complaint || ticket.symptom}
            </Text>

            <View style={styles.meta}>
                <View style={styles.metaRow}>
                    <IconSymbol name="person" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>
                        {ticket.customer?.name || 'N/A'}
                    </Text>
                </View>
                {(ticket.vehicle_reg_no || ticket.vehicleRegNo) && (
                    <View style={styles.metaRow}>
                        <IconSymbol name="car" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{ticket.vehicle_reg_no || ticket.vehicleRegNo}</Text>
                    </View>
                )}
                {showTechnician && technicianName && (
                    <View style={styles.metaRow}>
                        <IconSymbol name="wrench.and.screwdriver" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{technicianName}</Text>
                    </View>
                )}
                {dueDate && (
                    <View style={styles.metaRow}>
                        <IconSymbol name="clock" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>
                            Due: {new Date(dueDate).toLocaleDateString()}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor() }]}>
                        {ticket.status.replace('_', ' ')}
                    </Text>
                </View>

                {actionButton}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        marginBottom: 12,
    },
    selectedContainer: {
        borderColor: BrandColors.primary,
        borderWidth: 1,
        backgroundColor: BrandColors.primary + '05',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    ticketNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    badges: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        maxWidth: '40%',
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    overdueBadge: {
        backgroundColor: '#FEE2E2',
    },
    dueTodayBadge: {
        backgroundColor: '#FEF3C7',
    },
    highPriorityBadge: {
        backgroundColor: '#FEE2E2',
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '600',
    },
    symptom: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 12,
        lineHeight: 20,
    },
    meta: {
        gap: 6,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    selectionCheckbox: {
        marginRight: 4,
    },
});
