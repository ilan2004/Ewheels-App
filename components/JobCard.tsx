import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { jobCardsService } from '@/services/jobCardsService';
import { useMediaHubStore } from '@/stores/mediaHubStore';
import { ServiceTicket } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface JobCardProps {
    ticket: ServiceTicket;
    onPress: () => void;
    actionButton?: React.ReactNode;
    showSelection?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
    technicianName?: string;
    showTechnician?: boolean;
    variant?: 'default' | 'overdue';
    imageUrl?: string;
    imagePath?: string;
    imageSource?: string;
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
    variant = 'default',
    imageUrl,
    imagePath,
    imageSource,
}) => {
    const router = useRouter();
    const { setActiveTab, setTicketFilter } = useMediaHubStore();
    const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(imageUrl || null);

    useEffect(() => {
        if (imageUrl) {
            setResolvedImageUrl(imageUrl);
        } else if (imagePath) {
            // Fetch signed URL if we have a path but no direct URL
            let isMounted = true;
            const fetchUrl = async () => {
                try {
                    // Always use 'photo' or 'audio' type to determine bucket (media-photos/media-audio)
                    // ignoring source because media_hub items are copied to the same buckets.
                    const url = await jobCardsService.getAttachmentSignedUrl(imagePath, 'photo');
                    if (isMounted && url) {
                        setResolvedImageUrl(url);
                    }
                } catch (error) {
                    console.error('Failed to load job card image:', error);
                }
            };
            fetchUrl();
            return () => { isMounted = false; };
        } else {
            setResolvedImageUrl(null);
        }
    }, [imageUrl, imagePath]);

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
            style={[
                styles.container,
                isSelected && styles.selectedContainer,
                variant === 'overdue' && styles.overdueContainer
            ]}
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
                    {/* New Badge (Last 5 Days) */}
                    {(() => {
                        const createdDate = new Date(ticket.created_at || Date.now());
                        const today = new Date();
                        const diffTime = Math.abs(today.getTime() - createdDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays <= 6) { // 5 days + today
                            return (
                                <LinearGradient
                                    colors={['#34D399', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.badge, styles.newBadge]}
                                >
                                    <IconSymbol name="sparkles" size={12} color={Colors.white} />
                                    <Text style={[styles.badgeText, styles.newBadgeText]}>NEW</Text>
                                </LinearGradient>
                            );
                        }
                        return null;
                    })()}

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

            <View style={styles.contentRow}>
                <View style={styles.leftContent}>
                    <Text style={styles.symptom} numberOfLines={2}>
                        {(() => {
                            const rawComplaint = ticket.customer_complaint || ticket.symptom;
                            if (Array.isArray(rawComplaint)) return rawComplaint.join(', ');
                            if (typeof rawComplaint === 'string') {
                                try {
                                    const parsed = JSON.parse(rawComplaint);
                                    if (Array.isArray(parsed)) return parsed.join(', ');
                                } catch (e) {
                                    if ((rawComplaint as string).trim().startsWith('[') && (rawComplaint as string).trim().endsWith(']')) {
                                        try {
                                            const fixed = (rawComplaint as string).replace(/'/g, '"');
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
                    </View>
                </View>

                {/* Show image or Take Photo button */}
                <View style={styles.rightContent}>
                    {resolvedImageUrl ? (
                        <Image
                            source={{ uri: resolvedImageUrl }}
                            style={styles.cardImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <TouchableOpacity
                            style={styles.takePhotoButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                setTicketFilter(ticket.id); // Pre-select this job card
                                setActiveTab('capture');
                                router.push('/(tabs)/media-hub');
                            }}
                            activeOpacity={0.7}
                        >
                            <IconSymbol name="camera.fill" size={24} color={BrandColors.primary} />
                            <Text style={styles.takePhotoText}>Take Photo</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {actionButton && (
                <View style={styles.actionButtonContainer}>
                    {actionButton}
                </View>
            )}

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
    overdueContainer: {
        borderColor: Colors.error[500],
        borderWidth: 1,
        backgroundColor: Colors.error[50],
        shadowColor: Colors.error[500],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
    newBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 12,
        // Shadow for "glow" effect
        shadowColor: '#10B981',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    newBadgeText: {
        color: Colors.white,
        fontSize: 11,
        fontWeight: '800', // Extra bold
        letterSpacing: 1, // Premium letter spacing
        textTransform: 'uppercase',
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
    // Layout Styles
    contentRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    leftContent: {
        flex: 1,
    },
    rightContent: {
        width: 80,
        justifyContent: 'center',
    },
    cardImage: {
        width: '100%',
        height: 80,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.neutral[100],
    },
    takePhotoButton: {
        width: '100%',
        height: 80,
        borderRadius: BorderRadius.md,
        backgroundColor: BrandColors.primary + '10',
        borderWidth: 1.5,
        borderColor: BrandColors.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    takePhotoText: {
        fontSize: 10,
        fontWeight: Typography.fontWeight.semibold as any,
        color: BrandColors.primary,
        textAlign: 'center',
    },
    actionButtonContainer: {
        marginTop: Spacing.xs,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});
