import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { jobCardsService } from '@/services/jobCardsService';

interface TriageManagementProps {
  ticket: any;
  onRefresh?: () => void;
}

const triageTemplates = [
  'Check fault codes',
  'Test ride recommended',
  'Battery diagnostics needed',
  'Visual inspection complete',
  'Customer complaint verified',
  'Parts required for repair',
  'Software update needed',
  'Mechanical adjustment required',
];

export function TriageManagement({ ticket, onRefresh }: TriageManagementProps) {
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [routeTo, setRouteTo] = useState<'vehicle' | 'battery' | 'both'>('vehicle');
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const hasLinkedCases = ticket.battery_case_id || ticket.vehicle_case_id;
  const hasVehicleCase = ticket.vehicle_case_id;
  const hasBatteryCase = ticket.battery_case_id;

  // Determine default route based on what cases don't exist yet
  const getDefaultRoute = () => {
    if (!hasVehicleCase && !hasBatteryCase) return 'vehicle';
    if (!hasVehicleCase) return 'vehicle';
    if (!hasBatteryCase) return 'battery';
    return 'vehicle'; // fallback
  };

  React.useEffect(() => {
    setRouteTo(getDefaultRoute());
  }, [hasVehicleCase, hasBatteryCase]);

  const triageMutation = useMutation({
    mutationFn: (params: { routeTo: 'vehicle' | 'battery' | 'both'; note: string }) =>
      jobCardsService.triageTicket({
        ticketId: ticket.id,
        routeTo: params.routeTo,
        note: params.note,
      }),
    onSuccess: () => {
      setShowTriageModal(false);
      setNote('');
      onRefresh?.();
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticket.id] });
      Alert.alert(
        'Triage Complete',
        'The ticket has been successfully triaged and cases have been created.',
        [{ text: 'OK' }]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Triage Failed',
        error.message || 'Failed to triage ticket. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleTriage = () => {
    if (hasVehicleCase && hasBatteryCase) {
      Alert.alert(
        'Already Triaged',
        'This ticket has already been fully triaged with both vehicle and battery cases created.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setShowTriageModal(true);
  };

  const submitTriage = () => {
    triageMutation.mutate({ routeTo, note });
  };

  const addTemplate = (template: string) => {
    const separator = note ? '\n' : '';
    setNote(note + separator + template);
  };

  if (ticket.status === 'completed' || ticket.status === 'delivered' || ticket.status === 'closed') {
    return null; // Don't show triage for completed tickets
  }

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        <IconSymbol name="arrow.triangle.branch" size={18} color="#111827" /> Triage & Case Management
      </ThemedText>
      
      {/* Current Status */}
      <View style={styles.card}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Triage Status</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: ticket.status === 'triaged' ? '#10B981' : '#F59E0B' }
          ]}>
            <Text style={styles.statusBadgeText}>
              {ticket.status === 'triaged' ? 'Triaged' : 'Pending Triage'}
            </Text>
          </View>
        </View>

        {/* Linked Cases Overview */}
        <View style={styles.casesContainer}>
          <Text style={styles.casesTitle}>Linked Cases</Text>
          
          <View style={styles.casesGrid}>
            {/* Vehicle Case */}
            <View style={[
              styles.caseItem,
              hasVehicleCase ? styles.caseActive : styles.caseInactive
            ]}>
              <IconSymbol 
                name="car" 
                size={20} 
                color={hasVehicleCase ? "#10B981" : "#9CA3AF"} 
              />
              <Text style={[
                styles.caseText,
                hasVehicleCase ? styles.caseTextActive : styles.caseTextInactive
              ]}>
                Vehicle Case
              </Text>
              {hasVehicleCase && (
                <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
              )}
            </View>

            {/* Battery Case */}
            <View style={[
              styles.caseItem,
              hasBatteryCase ? styles.caseActive : styles.caseInactive
            ]}>
              <IconSymbol 
                name="battery.100" 
                size={20} 
                color={hasBatteryCase ? "#10B981" : "#9CA3AF"} 
              />
              <Text style={[
                styles.caseText,
                hasBatteryCase ? styles.caseTextActive : styles.caseTextInactive
              ]}>
                Battery Case
              </Text>
              {hasBatteryCase && (
                <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
              )}
            </View>
          </View>
        </View>

        {/* Triage Action */}
        {!hasLinkedCases || (!hasVehicleCase || !hasBatteryCase) ? (
          <TouchableOpacity
            style={styles.triageButton}
            onPress={handleTriage}
            disabled={triageMutation.isPending}
          >
            {triageMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="magnifyingglass" size={16} color="#FFFFFF" />
                <Text style={styles.triageButtonText}>
                  {!hasLinkedCases ? 'Start Triage' : 'Create Additional Cases'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.completedContainer}>
            <IconSymbol name="checkmark.circle.fill" size={24} color="#10B981" />
            <Text style={styles.completedText}>Triage Complete</Text>
            <Text style={styles.completedSubtext}>
              All necessary cases have been created
            </Text>
          </View>
        )}
      </View>

      {/* Triage Modal */}
      <Modal 
        visible={showTriageModal} 
        animationType="slide" 
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTriageModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Triage Ticket
            </ThemedText>
            <TouchableOpacity 
              onPress={submitTriage}
              disabled={triageMutation.isPending}
            >
              <Text style={[
                styles.modalDone,
                triageMutation.isPending && styles.modalDoneDisabled
              ]}>
                {triageMutation.isPending ? 'Processing...' : 'Done'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Route Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Route To</Text>
              <Text style={styles.sectionDescription}>
                Select which cases should be created for this ticket
              </Text>
              
              <View style={styles.routeOptions}>
                {/* Vehicle Option */}
                {!hasVehicleCase && (
                  <TouchableOpacity
                    style={[
                      styles.routeOption,
                      routeTo === 'vehicle' && styles.routeOptionSelected,
                    ]}
                    onPress={() => setRouteTo('vehicle')}
                  >
                    <IconSymbol name="car" size={24} color="#3B82F6" />
                    <View style={styles.routeOptionContent}>
                      <Text style={styles.routeOptionTitle}>Vehicle Case</Text>
                      <Text style={styles.routeOptionDescription}>
                        For mechanical, electrical, or vehicle-specific issues
                      </Text>
                    </View>
                    {routeTo === 'vehicle' && (
                      <IconSymbol name="checkmark.circle.fill" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                )}

                {/* Battery Option */}
                {!hasBatteryCase && (
                  <TouchableOpacity
                    style={[
                      styles.routeOption,
                      routeTo === 'battery' && styles.routeOptionSelected,
                    ]}
                    onPress={() => setRouteTo('battery')}
                  >
                    <IconSymbol name="battery.100" size={24} color="#10B981" />
                    <View style={styles.routeOptionContent}>
                      <Text style={styles.routeOptionTitle}>Battery Case</Text>
                      <Text style={styles.routeOptionDescription}>
                        For battery-related issues, charging problems, or power systems
                      </Text>
                    </View>
                    {routeTo === 'battery' && (
                      <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
                    )}
                  </TouchableOpacity>
                )}

                {/* Both Option */}
                {!hasVehicleCase && !hasBatteryCase && (
                  <TouchableOpacity
                    style={[
                      styles.routeOption,
                      routeTo === 'both' && styles.routeOptionSelected,
                    ]}
                    onPress={() => setRouteTo('both')}
                  >
                    <IconSymbol name="arrow.triangle.branch" size={24} color="#8B5CF6" />
                    <View style={styles.routeOptionContent}>
                      <Text style={styles.routeOptionTitle}>Both Cases</Text>
                      <Text style={styles.routeOptionDescription}>
                        Create both vehicle and battery cases for comprehensive diagnosis
                      </Text>
                    </View>
                    {routeTo === 'both' && (
                      <IconSymbol name="checkmark.circle.fill" size={20} color="#8B5CF6" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Quick Templates */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Quick Templates</Text>
              <Text style={styles.sectionDescription}>
                Tap to add common triage notes
              </Text>
              
              <View style={styles.templatesGrid}>
                {triageTemplates.map((template, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.templateChip}
                    onPress={() => addTemplate(template)}
                  >
                    <Text style={styles.templateText}>{template}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Triage Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Triage Notes</Text>
              <Text style={styles.sectionDescription}>
                Add details about the triage decision and initial assessment
              </Text>
              
              <TextInput
                style={styles.noteInput}
                placeholder="Enter triage notes and initial assessment..."
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  casesContainer: {
    marginBottom: 16,
  },
  casesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  casesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  caseItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  caseActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  caseInactive: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  caseText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  caseTextActive: {
    color: '#065F46',
  },
  caseTextInactive: {
    color: '#6B7280',
  },
  triageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  triageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 8,
  },
  completedSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalDone: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalDoneDisabled: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  routeOptions: {
    gap: 12,
  },
  routeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    gap: 12,
  },
  routeOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  routeOptionContent: {
    flex: 1,
  },
  routeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  routeOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
  },
});
