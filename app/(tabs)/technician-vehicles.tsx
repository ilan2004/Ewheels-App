import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandColors, Colors, Shadows } from '@/constants/design-system';
import { vehiclesService } from '@/services/vehiclesService';
import { useAuthStore } from '@/stores/authStore';
import { VehicleCase } from '@/types';

interface VehicleCardProps {
  vehicle: VehicleCase;
  onPress: () => void;
  onStatusUpdate: (id: string, status: string, notes?: string) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onPress, onStatusUpdate }) => {
  const [showActions, setShowActions] = useState(false);
  const [notes, setNotes] = useState('');

  const getStatusColor = () => {
    switch (vehicle.status) {
      case 'received': return '#EF4444'; // Reported/New (Red)
      case 'triaged': return '#F59E0B'; // Triaged (Amber/Orange)
      case 'diagnosed': return '#F59E0B'; // Legacy support
      case 'in_progress': return '#499588'; // In Progress (Greenish)
      case 'completed': return '#387868'; // Completed (Dark Green/Teal)
      case 'delivered': return '#059669'; // Delivered
      default: return Colors.neutral[500];
    }
  };

  const getStatusIcon = () => {
    switch (vehicle.status) {
      case 'received': return 'tray';
      case 'triaged': return 'list.bullet';
      case 'diagnosed': return 'list.bullet';
      case 'in_progress': return 'gearshape';
      case 'completed': return 'checkmark.circle';
      case 'delivered': return 'checkmark.circle.fill';
      default: return 'doc.text';
    }
  };

  const getNextStatusAction = () => {
    switch (vehicle.status) {
      case 'received': return { status: 'triaged', label: 'View Vehicle Case', icon: 'doc.text' };
      case 'triaged': return { status: 'in_progress', label: 'Begin Repair', icon: 'gearshape' };
      case 'diagnosed': return { status: 'in_progress', label: 'Begin Repair', icon: 'gearshape' };
      case 'in_progress': return { status: 'completed', label: 'Mark Complete', icon: 'checkmark.circle' };
      case 'completed': return { status: 'delivered', label: 'Mark Delivered', icon: 'checkmark.circle.fill' };
      default: return null;
    }
  };

  const nextAction = getNextStatusAction();

  const handleStatusUpdate = () => {
    if (!nextAction) return;

    Alert.alert(
      'Update Status',
      `Mark this vehicle as ${nextAction.label.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            onStatusUpdate(vehicle.id, nextAction.status, notes || undefined);
            setShowActions(false);
            setNotes('');
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.vehicleCard} onPress={onPress}>
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleTitleRow}>
          <IconSymbol
            name={getStatusIcon()}
            size={20}
            color={getStatusColor()}
          />
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleRegNo}>{vehicle.vehicle_reg_no}</Text>
            <Text style={styles.vehicleDetails}>
              {vehicle.vehicle_make} {vehicle.vehicle_model}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {vehicle.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {vehicle.initial_diagnosis && (
        <View style={styles.diagnosisSection}>
          <Text style={styles.sectionLabel}>Initial Diagnosis:</Text>
          <Text style={styles.diagnosisText}>{vehicle.initial_diagnosis}</Text>
        </View>
      )}

      {vehicle.service_ticket?.customer_complaint && (
        <View style={styles.symptomsSection}>
          <Text style={styles.sectionLabel}>Customer Complaint:</Text>
          <Text style={styles.symptomsText} numberOfLines={2}>
            {vehicle.service_ticket.customer_complaint}
          </Text>
        </View>
      )}

      <View style={styles.vehicleMeta}>
        {vehicle.vehicle_year && (
          <View style={styles.metaRow}>
            <IconSymbol name="calendar" size={14} color={Colors.neutral[500]} />
            <Text style={styles.metaText}>{vehicle.vehicle_year}</Text>
          </View>
        )}
        {vehicle.estimated_cost && (
          <View style={styles.metaRow}>
            <IconSymbol name="dollarsign.circle" size={14} color={Colors.neutral[500]} />
            <Text style={styles.metaText}>₹{Math.round(vehicle.estimated_cost)}</Text>
          </View>
        )}
      </View>

      {nextAction && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: getStatusColor(), flex: 1 }]}
            onPress={() => {
              if (vehicle.status === 'received') {
                onPress(); // Just navigate for "View Vehicle Case"
              } else {
                setShowActions(!showActions);
              }
            }}
          >
            <IconSymbol name={nextAction.icon as any} size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{nextAction.label}</Text>
          </TouchableOpacity>

          {vehicle.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.neutral[600], flex: 1 }]}
              onPress={onPress}
            >
              <IconSymbol name="pencil.circle" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Update Status</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {showActions && nextAction && (
        <View style={styles.notesSection}>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes (optional)..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.neutral[400]}
          />
          <View style={styles.notesActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowActions(false);
                setNotes('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleStatusUpdate}
            >
              <Text style={styles.confirmButtonText}>Update Status</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function TechnicianVehiclesScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch technician's assigned vehicle cases
  const {
    data: vehicles,
    isLoading: vehiclesLoading,
    error: vehiclesError,
    refetch: refetchVehicles,
  } = useQuery({
    queryKey: ['technician-vehicles', user?.id],
    queryFn: () => vehiclesService.getMyVehicles(user?.id),
    refetchInterval: 30000,
    enabled: !!user?.id,
  });

  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      vehiclesService.updateStatus(id, status as any, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-vehicles'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update vehicle status. Please try again.');
      console.error('Status update error:', error);
    }
  });

  const refreshing = vehiclesLoading || statusUpdateMutation.isPending;

  const handleRefresh = async () => {
    await refetchVehicles();
  };

  const handleVehiclePress = (vehicleId: string) => {
    const vehicle = vehicles?.find(v => v.id === vehicleId);
    if (vehicle?.service_ticket_id) {
      router.push(`/jobcards/${vehicle.service_ticket_id}`);
    }
  };

  const handleStatusUpdate = (id: string, status: string, notes?: string) => {
    statusUpdateMutation.mutate({ id, status, notes });
  };

  // Group vehicles by status
  const vehiclesByStatus = React.useMemo(() => {
    if (!vehicles) return { received: [], triaged: [], inProgress: [], completed: [] };

    return {
      received: vehicles.filter(v => v.status === 'received'),
      triaged: vehicles.filter(v => v.status === 'triaged' || v.status === 'diagnosed'),
      inProgress: vehicles.filter(v => v.status === 'in_progress'),
      completed: vehicles.filter(v => ['completed', 'delivered'].includes(v.status)),
    };
  }, [vehicles]);

  if (vehiclesError) {
    return (
      <ThemedView style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={Colors.error[500]} />
        <Text style={styles.errorText}>Failed to load vehicle cases</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Vehicle Cases
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Manage your assigned vehicle repairs and diagnostics
          </ThemedText>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{vehiclesByStatus.received.length}</Text>
              <Text style={styles.summaryLabel}>New</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#EF4444' }]} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{vehiclesByStatus.triaged.length}</Text>
              <Text style={styles.summaryLabel}>Triaged</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#F59E0B' }]} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{vehiclesByStatus.inProgress.length}</Text>
              <Text style={styles.summaryLabel}>In Progress</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#499588' }]} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{vehiclesByStatus.completed.length}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#387868' }]} />
            </View>
          </View>
        </View>

        {/* New Vehicles */}
        {vehiclesByStatus.received.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              New Vehicles ({vehiclesByStatus.received.length})
            </ThemedText>
            <View style={styles.vehiclesList}>
              {vehiclesByStatus.received.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onPress={() => handleVehiclePress(vehicle.id)}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </View>
          </View>
        )}

        {/* Triaged Vehicles */}
        {vehiclesByStatus.triaged.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Triaged ({vehiclesByStatus.triaged.length})
            </ThemedText>
            <View style={styles.vehiclesList}>
              {vehiclesByStatus.triaged.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onPress={() => handleVehiclePress(vehicle.id)}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </View>
          </View>
        )}

        {/* In Progress */}
        {vehiclesByStatus.inProgress.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              In Progress ({vehiclesByStatus.inProgress.length})
            </ThemedText>
            <View style={styles.vehiclesList}>
              {vehiclesByStatus.inProgress.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onPress={() => handleVehiclePress(vehicle.id)}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </View>
          </View>
        )}

        {/* Completed */}
        {vehiclesByStatus.completed.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Completed ({vehiclesByStatus.completed.length})
            </ThemedText>
            <View style={styles.vehiclesList}>
              {vehiclesByStatus.completed.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onPress={() => handleVehiclePress(vehicle.id)}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!vehiclesLoading && vehicles && vehicles.length === 0 && (
          <View style={styles.emptyContainer}>
            <IconSymbol name="car" size={48} color={Colors.neutral[400]} />
            <Text style={styles.emptyTitle}>No Vehicle Cases</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any assigned vehicle cases at the moment.
            </Text>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandColors.ink,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.neutral[500],
    marginTop: 4,
  },
  summarySection: {
    padding: 20,
    backgroundColor: BrandColors.surface,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    ...Shadows.sm,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandColors.ink,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.neutral[500],
    marginTop: 4,
  },
  summaryIndicator: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    marginTop: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.ink,
    marginBottom: 16,
  },
  vehiclesList: {
    gap: 12,
  },
  vehicleCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.sm,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleRegNo: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.ink,
  },
  vehicleDetails: {
    fontSize: 14,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  diagnosisSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginBottom: 4,
  },
  diagnosisText: {
    fontSize: 14,
    color: Colors.neutral[500],
    lineHeight: 20,
  },
  symptomsSection: {
    marginBottom: 12,
  },
  symptomsText: {
    fontSize: 14,
    color: Colors.neutral[500],
    lineHeight: 20,
  },
  vehicleMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.neutral[500],
  },
  actionSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    paddingTop: 12,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  notesSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    paddingTop: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: Colors.neutral[50],
    minHeight: 60,
    textAlignVertical: 'top',
    color: BrandColors.ink,
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: Colors.neutral[500],
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: BrandColors.surface,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error[500],
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.ink,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
});
