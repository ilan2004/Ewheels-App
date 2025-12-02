import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, ComponentStyles, Spacing, StatusColors, Typography } from '@/constants/design-system';
import { jobCardsService } from '@/services/jobCardsService';
import { CustomerBringingType, ServiceTicket } from '@/types';

interface TriageManagementProps {
  ticket: ServiceTicket;
  onTriageComplete: () => void;
}

interface TriageOption {
  value: CustomerBringingType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const TRIAGE_OPTIONS: TriageOption[] = [
  {
    value: 'battery',
    label: 'Battery Only',
    description: 'Issue reported with battery',
    icon: 'battery.100',
    color: Colors.success[500],
  },
  {
    value: 'vehicle',
    label: 'Vehicle Only',
    description: 'Issue reported with vehicle',
    icon: 'car.fill',
    color: Colors.primary[500],
  },
  {
    value: 'both',
    label: 'Both Vehicle & Battery',
    description: 'Issues reported with both vehicle and battery',
    icon: 'wrench.and.screwdriver.fill',
    color: BrandColors.primary,
  },
];

export const TriageManagement: React.FC<TriageManagementProps> = ({
  ticket,
  onTriageComplete,
}) => {
  const [selectedOption, setSelectedOption] = useState<CustomerBringingType | null>(
    ticket.customer_bringing || null
  );
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  const triageMutation = useMutation({
    mutationFn: async (params: {
      ticketId: string;
      routeTo: CustomerBringingType;
      note?: string;
    }) => {
      return jobCardsService.triageTicket(params);
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticket.id] });
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-record'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-case'] });
      queryClient.invalidateQueries({ queryKey: ['battery-records'] });
      queryClient.invalidateQueries({ queryKey: ['battery-cases'] });

      Alert.alert(
        'Triage Complete',
        'Job card has been successfully triaged and service cases created.',
        [
          {
            text: 'OK',
            onPress: () => {
              onTriageComplete();
            },
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Triage Failed',
        error.message || 'Failed to complete triage. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleTriage = () => {
    if (!selectedOption) {
      Alert.alert('Selection Required', 'Please select a triage option before continuing.');
      return;
    }

    Alert.alert(
      'Confirm Triage',
      `Triage this job card as "${TRIAGE_OPTIONS.find(opt => opt.value === selectedOption)?.label}"?\n\nThis will create the appropriate service cases and update the ticket status.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Triage',
          style: 'default',
          onPress: () => {
            triageMutation.mutate({
              ticketId: ticket.id,
              routeTo: selectedOption,
              note: notes.trim() || undefined,
            });
          },
        },
      ]
    );
  };

  const getOptionIcon = (option: TriageOption) => {
    return (
      <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
        <IconSymbol name={option.icon} size={24} color={option.color} />
      </View>
    );
  };

  const isTriageReady = selectedOption && ticket.status === 'reported';

  return (
    <>
      {/* Section Title */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        <IconSymbol name="stethoscope" size={18} color={BrandColors.title} /> Triage & Case Management
      </ThemedText>

      {/* Content Card */}
      <View style={styles.infoCard}>
        {/* Status Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <IconSymbol name="flag.fill" size={16} color={ticket.status === 'reported' ? StatusColors.reported.primary : StatusColors.triaged.primary} />
            <Text style={styles.infoLabel}>Status</Text>
          </View>
          <Text style={[styles.infoValue, { color: ticket.status === 'reported' ? StatusColors.reported.primary : StatusColors.triaged.primary }]}>
            {ticket.status === 'reported' ? 'Pending Triage' : 'Triaged'}
          </Text>
        </View>

        {ticket.status === 'reported' ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Instructions */}
            <View style={styles.instructionsCard}>
              <IconSymbol name="info.circle.fill" size={16} color={BrandColors.ink + '60'} />
              <Text style={styles.instructionsText}>
                Identify which components have issues to create the appropriate service cases and route the job card.
              </Text>
            </View>

            {/* Triage Options */}
            <Text style={styles.subSectionTitle}>Issue Identification</Text>
            <View style={styles.optionsContainer}>
              {TRIAGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    selectedOption === option.value && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedOption(option.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionHeader}>
                    {getOptionIcon(option)}
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{option.label}</Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>
                    {selectedOption === option.value && (
                      <IconSymbol name="checkmark.circle.fill" size={20} color={option.color} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes Input */}
            <Text style={styles.subSectionTitle}>Triage Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any initial observations or notes..."
              placeholderTextColor={BrandColors.ink + '40'}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.triageButton,
                !isTriageReady && styles.triageButtonDisabled,
              ]}
              onPress={handleTriage}
              disabled={!isTriageReady || triageMutation.isPending}
              activeOpacity={0.8}
            >
              {triageMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                  <Text style={styles.triageButtonText}>
                    Complete Triage & Create Cases
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* Already Triaged - Show Summary */
          <>
            {/* Service Type Row */}
            {ticket.customer_bringing && (
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
                  <Text style={styles.infoLabel}>Service Type</Text>
                </View>
                <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '600' }]}>
                  {ticket.customer_bringing === 'both' ? 'Vehicle & Battery' :
                    ticket.customer_bringing === 'vehicle' ? 'Vehicle Only' : 'Battery Only'}
                </Text>
              </View>
            )}

            {/* Triaged Date Row */}
            {ticket.triaged_at && (
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <IconSymbol name="calendar.badge.checkmark" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>Triaged At</Text>
                </View>
                <Text style={styles.infoValue}>
                  {new Date(ticket.triaged_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}

            {/* Notes Row */}
            {ticket.triage_notes && (
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <IconSymbol name="doc.text" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>Notes</Text>
                </View>
                <Text style={styles.infoValue}>{ticket.triage_notes}</Text>
              </View>
            )}

            {/* Cases Created Row */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <IconSymbol name="folder.badge.plus" size={16} color="#6B7280" />
                <Text style={styles.infoLabel}>Cases Created</Text>
              </View>
              <Text style={styles.infoValue}>
                {[ticket.vehicle_case_id && 'Vehicle', ticket.battery_case_id && 'Battery'].filter(Boolean).join(', ') || 'None'}
              </Text>
            </View>
          </>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginBottom: Spacing.base,
  },
  infoCard: {
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    gap: Spacing.base,
    ...ComponentStyles.card.shadowColor && {
      shadowColor: ComponentStyles.card.shadowColor,
      shadowOffset: ComponentStyles.card.shadowOffset,
      shadowOpacity: ComponentStyles.card.shadowOpacity,
      shadowRadius: ComponentStyles.card.shadowRadius,
      elevation: ComponentStyles.card.elevation,
    },
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '60',
  },
  infoValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink,
    flex: 2,
    textAlign: 'right',
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: BrandColors.ink + '05',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  instructionsText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
    lineHeight: Typography.lineHeight.sm,
  },
  subSectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginBottom: Spacing.base,
    marginTop: Spacing.lg,
  },
  optionsContainer: {
    gap: Spacing.base,
    marginBottom: Spacing['2xl'],
  },
  optionCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  optionCardSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
    borderWidth: 2,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginBottom: Spacing.sm,
  },
  optionDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.neutral[600],
    lineHeight: Typography.lineHeight.sm,
  },
  notesInput: {
    ...ComponentStyles.input,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Spacing['2xl'],
  },
  triageButton: {
    ...ComponentStyles.button.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.success[500],
    marginTop: Spacing.base,
  },
  triageButtonDisabled: {
    backgroundColor: Colors.neutral[400],
  },
  triageButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
});
