import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
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
    if (workloadPercentage < 60) return '#10B981'; // green
    if (workloadPercentage < 80) return '#F59E0B'; // orange
    return '#EF4444'; // red
  };

  return (
    <TouchableOpacity
      style={[
        styles.technicianCard,
        isSelected && styles.technicianCardSelected,
      ]}
      onPress={() => onSelect(technician)}
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
          <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function AssignTechnicianScreen() {
  const { ticketId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);

  // Fetch ticket details
  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', ticketId],
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
    mutationFn: ({ ticketId, technicianId }: { ticketId: string; technicianId: string }) =>
      jobCardsService.assignTicket(ticketId, technicianId),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['team-workload'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      
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
    onError: (error) => {
      Alert.alert(
        'Assignment Failed',
        'Failed to assign the ticket. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Assignment error:', error);
    },
  });

  const handleAssign = () => {
    if (!selectedTechnician) {
      Alert.alert('No Selection', 'Please select a technician first.');
      return;
    }

    if (!ticketId) {
      Alert.alert('Error', 'No ticket ID provided.');
      return;
    }

    Alert.alert(
      'Confirm Assignment',
      `Assign this ticket to ${selectedTechnician.name || `${selectedTechnician.first_name} ${selectedTechnician.last_name}`}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: () => {
            assignMutation.mutate({
              ticketId: ticketId as string,
              technicianId: selectedTechnician.id,
            });
          },
        },
      ]
    );
  };

  const getWorkloadForTechnician = (technicianId: string): number => {
    const techWorkload = workload.find(w => w.assignee === technicianId);
    return techWorkload?.count || 0;
  };

  if (ticketLoading || techniciansLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </ThemedView>
    );
  }

  if (techniciansError) {
    return (
      <ThemedView style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color="#EF4444" />
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>
            Assign Technician
          </ThemedText>
          {ticket && (
            <Text style={styles.headerSubtitle}>
              {ticket.ticket_number || ticket.ticketNumber}
            </Text>
          )}
        </View>
      </View>

      {/* Ticket Info */}
      {ticket && (
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

      {/* Technicians List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Select Technician</Text>
        <Text style={styles.sectionSubtitle}>
          {technicians.length} available technicians
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {technicians.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.3" size={48} color="#9CA3AF" />
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
                onSelect={setSelectedTechnician}
                workload={getWorkloadForTechnician(technician.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Assign Button */}
      {technicians.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.assignButton,
              (!selectedTechnician || assignMutation.isPending) && styles.assignButtonDisabled,
            ]}
            onPress={handleAssign}
            disabled={!selectedTechnician || assignMutation.isPending}
          >
            {assignMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="person.badge.plus" size={20} color="#FFFFFF" />
                <Text style={styles.assignButtonText}>
                  Assign Ticket
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  ticketInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  ticketInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ticketInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 80,
    fontWeight: '500',
  },
  ticketInfoValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
    fontWeight: '600',
  },
  sectionHeader: {
    padding: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  techniciansList: {
    gap: 12,
  },
  technicianCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  technicianCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  technicianHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  technicianInfo: {
    flex: 1,
    marginRight: 12,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  technicianNameSelected: {
    color: '#059669',
  },
  technicianEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  technicianEmailSelected: {
    color: '#047857',
  },
  workloadContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  workloadText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  workloadTextSelected: {
    color: '#047857',
  },
  workloadBar: {
    width: 60,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  workloadProgress: {
    height: 6,
    borderRadius: 3,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  assignButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  assignButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
