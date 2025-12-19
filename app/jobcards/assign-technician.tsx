import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import DateFilterModal from '@/components/ui/DateFilterModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import { jobCardsService } from '@/services/jobCardsService';

interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  name?: string;
}

interface TechnicianCardProps {
  technician: Technician;
  isSelected: boolean;
  onSelect: (technician: Technician) => void;
  workload?: number;
}

const TechnicianCard: React.FC<TechnicianCardProps> = ({
  technician,
  isSelected,
  onSelect,
  workload = 0
}) => {
  const displayName = technician.name || `${technician.first_name} ${technician.last_name}`.trim();
  const workloadPercentage = Math.min((workload / 8) * 100, 100);

  const getWorkloadColor = () => {
    if (workloadPercentage < 60) return Colors.success[500];
    if (workloadPercentage < 80) return Colors.warning[500];
    return Colors.error[500];
  };

  return (
    <TouchableOpacity
      style={[
        styles.technicianCard,
        isSelected && styles.technicianCardSelected,
      ]}
      onPress={() => onSelect(technician)}
      activeOpacity={0.7}
    >
      <View style={styles.technicianHeader}>
        <View style={styles.technicianInfo}>
          <Text style={[
            styles.technicianName,
            isSelected && styles.technicianNameSelected,
          ]}>
            {displayName}
          </Text>
          <Text style={[
            styles.technicianEmail,
            isSelected && styles.technicianEmailSelected,
          ]}>
            {technician.email}
          </Text>
        </View>

        <View style={styles.workloadContainer}>
          <Text style={[
            styles.workloadText,
            isSelected && styles.workloadTextSelected,
          ]}>
            {workload}/8 tasks
          </Text>
          <View style={styles.workloadBar}>
            <View
              style={[
                styles.workloadProgress,
                {
                  width: `${workloadPercentage}%`,
                  backgroundColor: getWorkloadColor(),
                }
              ]}
            />
          </View>
        </View>
      </View>

      {isSelected && (
        <View style={styles.selectedIndicator}>
          <IconSymbol name="checkmark.circle.fill" size={24} color={BrandColors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function AssignTechnicianScreen() {
  const { ticketId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [step, setStep] = useState<'technician' | 'duedate'>('technician');
  const [dueDate, setDueDate] = useState<Date>(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    return defaultDate;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch ticket details
  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket-detail', ticketId],
    queryFn: () => jobCardsService.getTicketById(ticketId as string),
    enabled: !!ticketId,
  });

  // Fetch technicians
  const {
    data: technicians = [],
    isLoading: techniciansLoading,
    error: techniciansError
  } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => jobCardsService.getTechnicians(),
  });

  // Fetch team workload for display
  const { data: workload = [] } = useQuery({
    queryKey: ['team-workload'],
    queryFn: () => jobCardsService.getTeamWorkload(),
  });

  // Assignment mutation
  const assignMutation = useMutation({
    mutationFn: ({ ticketId, technicianId, dueDate }: { ticketId: string; technicianId: string; dueDate?: string }) =>
      jobCardsService.assignTicket(ticketId, technicianId, dueDate),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['team-workload'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] });

      Alert.alert(
        'Success',
        'Ticket has been assigned successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Assignment Failed',
        error.message || 'Failed to assign the ticket. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Assignment error:', error);
    },
  });

  const handleTechnicianSelect = (technician: Technician) => {
    setSelectedTechnician(technician);
    setStep('duedate');
  };

  const handleAssign = () => {
    if (!selectedTechnician) {
      Alert.alert('No Selection', 'Please select a technician first.');
      return;
    }

    if (!ticketId) {
      Alert.alert('Error', 'No ticket ID provided.');
      return;
    }

    assignMutation.mutate({
      ticketId: ticketId as string,
      technicianId: selectedTechnician.id,
      dueDate: dueDate.toISOString(),
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getWorkloadForTechnician = (technicianId: string): number => {
    const techWorkload = workload.find(w => w.assignee === technicianId);
    return techWorkload?.count || 0;
  };

  const handleBack = () => {
    if (step === 'duedate') {
      setStep('technician');
    } else {
      router.back();
    }
  };

  if (ticketLoading || techniciansLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </ThemedView>
    );
  }

  if (techniciansError) {
    return (
      <ThemedView style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={Colors.error[500]} />
        <Text style={styles.errorTitle}>Failed to load technicians</Text>
        <Text style={styles.errorText}>Please check your connection and try again.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <IconSymbol name="chevron.left" size={24} color={BrandColors.ink} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {step === 'technician' ? 'Assign Technician' : 'Set Due Date'}
          </Text>
          {ticket && (
            <Text style={styles.headerSubtitle}>
              {ticket.ticket_number || ticket.ticketNumber}
            </Text>
          )}
        </View>
      </View>

      {/* Ticket Info - Only show in Technician step */}
      {step === 'technician' && ticket && (
        <View style={styles.ticketInfo}>
          <View style={styles.ticketInfoRow}>
            <Text style={styles.ticketInfoLabel}>Customer:</Text>
            <Text style={styles.ticketInfoValue}>
              {ticket.customer?.name || 'N/A'}
            </Text>
          </View>
          <View style={styles.ticketInfoRow}>
            <Text style={styles.ticketInfoLabel}>Issue:</Text>
            <Text style={styles.ticketInfoValue} numberOfLines={2}>
              {ticket.customer_complaint || ticket.symptom || 'N/A'}
            </Text>
          </View>
          {(ticket.vehicle_reg_no || ticket.vehicleRegNo) && (
            <View style={styles.ticketInfoRow}>
              <Text style={styles.ticketInfoLabel}>Vehicle:</Text>
              <Text style={styles.ticketInfoValue}>
                {ticket.vehicle_reg_no || ticket.vehicleRegNo}
              </Text>
            </View>
          )}
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {step === 'technician' ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Select Technician</Text>
              <Text style={styles.sectionSubtitle}>
                {technicians.length} available technicians
              </Text>
            </View>

            {technicians.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="person.3" size={48} color={Colors.neutral[400]} />
                <Text style={styles.emptyTitle}>No Technicians Available</Text>
                <Text style={styles.emptySubtitle}>
                  Please contact your administrator.
                </Text>
              </View>
            ) : (
              <View style={styles.techniciansList}>
                {technicians.map((technician) => (
                  <TechnicianCard
                    key={technician.id}
                    technician={technician}
                    isSelected={selectedTechnician?.id === technician.id}
                    onSelect={handleTechnicianSelect}
                    workload={getWorkloadForTechnician(technician.id)}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.dueDateContainer}>
            {/* Assignment Summary */}
            <View style={styles.assignmentSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Technician:</Text>
                <Text style={styles.summaryValue}>
                  {selectedTechnician?.name || `${selectedTechnician?.first_name} ${selectedTechnician?.last_name}`}
                </Text>
              </View>
            </View>

            {/* Due Date Section */}
            <View style={styles.dueDateSection}>
              <Text style={styles.dueDateTitle}>Set Due Date</Text>
              <Text style={styles.dueDateSubtitle}>
                When should this job card be completed?
              </Text>

              {/* Date Display */}
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <IconSymbol name="calendar" size={24} color={BrandColors.primary} />
                <Text style={styles.dateButtonText}>{formatDate(dueDate)}</Text>
                <IconSymbol name="pencil" size={16} color={Colors.neutral[500]} />
              </TouchableOpacity>

              {/* Quick Date Options */}
              <View style={styles.quickDateOptions}>
                <Text style={styles.quickDateTitle}>Quick Options:</Text>
                <View style={styles.quickDateButtons}>
                  {[1, 3, 7, 14].map((days) => {
                    const quickDate = new Date();
                    quickDate.setDate(quickDate.getDate() + days);
                    return (
                      <TouchableOpacity
                        key={days}
                        style={styles.quickDateButton}
                        onPress={() => setDueDate(quickDate)}
                      >
                        <Text style={styles.quickDateButtonText}>
                          {days === 1 ? 'Tomorrow' : `${days} days`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Assign Button */}
            <TouchableOpacity
              style={[
                styles.assignButton,
                assignMutation.isPending && styles.assignButtonDisabled,
              ]}
              onPress={handleAssign}
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol name="person.badge.plus" size={20} color="#FFFFFF" />
                  <Text style={styles.assignButtonText}>
                    Assign with Due Date
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Custom Date Filter Modal */}
      <DateFilterModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onApply={(start) => {
          setDueDate(start);
          setShowDatePicker(false);
        }}
        initialStartDate={dueDate}
        initialEndDate={dueDate}
        mode="single"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.neutral[600],
    fontFamily: Typography.fontFamily.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: BrandColors.background,
  },
  errorTitle: {
    fontSize: Typography.fontSize.lg,
    color: BrandColors.title,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.neutral[600],
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontFamily: Typography.fontFamily.regular,
  },
  retryButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.lg + (StatusBar.currentHeight || 0),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    fontFamily: Typography.fontFamily.medium,
    marginTop: 2,
  },
  ticketInfo: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  ticketInfoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  ticketInfoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    width: 80,
    fontFamily: Typography.fontFamily.medium,
  },
  ticketInfoValue: {
    fontSize: Typography.fontSize.sm,
    color: BrandColors.ink,
    flex: 1,
    fontFamily: Typography.fontFamily.semibold,
  },
  sectionHeader: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    fontFamily: Typography.fontFamily.regular,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 0,
    paddingBottom: Spacing['3xl'],
  },
  techniciansList: {
    gap: Spacing.md,
  },
  technicianCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  technicianCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primary + '05',
    ...Shadows.md,
  },
  technicianHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  technicianInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  technicianName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginBottom: 2,
  },
  technicianNameSelected: {
    color: BrandColors.primary,
  },
  technicianEmail: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[500],
  },
  technicianEmailSelected: {
    color: BrandColors.primary + 'CC',
  },
  workloadContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  workloadText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[500],
    marginBottom: 6,
    fontFamily: Typography.fontFamily.medium,
  },
  workloadTextSelected: {
    color: BrandColors.primary,
  },
  workloadBar: {
    width: 60,
    height: 6,
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.full,
  },
  workloadProgress: {
    height: 6,
    borderRadius: BorderRadius.full,
  },
  selectedIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    textAlign: 'center',
    fontFamily: Typography.fontFamily.regular,
  },
  dueDateContainer: {
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  assignmentSummary: {
    backgroundColor: BrandColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    fontFamily: Typography.fontFamily.medium,
  },
  summaryValue: {
    fontSize: Typography.fontSize.base,
    color: BrandColors.title,
    fontFamily: Typography.fontFamily.bold,
  },
  dueDateSection: {
    backgroundColor: BrandColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  dueDateTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginBottom: Spacing.xs,
  },
  dueDateSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    marginBottom: Spacing.lg,
    fontFamily: Typography.fontFamily.regular,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  dateButtonText: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    color: BrandColors.title,
    fontFamily: Typography.fontFamily.semibold,
  },
  quickDateOptions: {
    gap: Spacing.sm,
  },
  quickDateTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.neutral[600],
    marginBottom: Spacing.xs,
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  quickDateButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: BrandColors.primary + '10',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: BrandColors.primary + '20',
  },
  quickDateButtonText: {
    fontSize: Typography.fontSize.sm,
    color: BrandColors.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  assignButton: {
    backgroundColor: BrandColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    ...Shadows.md,
  },
  assignButtonDisabled: {
    backgroundColor: Colors.neutral[400],
    elevation: 0,
  },
  assignButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },
});
