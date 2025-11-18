import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/stores/authStore';
import { vehiclesService } from '@/services/vehiclesService';
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
      case 'received': return '#6B7280';
      case 'diagnosed': return '#3B82F6';
      case 'in_progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      case 'delivered': return '#059669';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = () => {
    switch (vehicle.status) {
      case 'received': return 'tray';
      case 'diagnosed': return 'stethoscope';
      case 'in_progress': return 'gearshape';
      case 'completed': return 'checkmark.circle';
      case 'delivered': return 'checkmark.circle.fill';
      default: return 'doc.text';
    }
  };

  const getNextStatusAction = () => {
    switch (vehicle.status) {
      case 'received': return { status: 'diagnosed', label: 'Start Diagnosis', icon: 'stethoscope' };
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

      {vehicle.symptoms_observed && (
        <View style={styles.symptomsSection}>
          <Text style={styles.sectionLabel}>Symptoms Observed:</Text>
          <Text style={styles.symptomsText} numberOfLines={2}>
            {vehicle.symptoms_observed}
          </Text>
        </View>
      )}

      <View style={styles.vehicleMeta}>
        {vehicle.vehicle_year && (
          <View style={styles.metaRow}>
            <IconSymbol name="calendar" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{vehicle.vehicle_year}</Text>
          </View>
        )}
        {vehicle.vehicle_color && (
          <View style={styles.metaRow}>
            <IconSymbol name="paintbrush" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{vehicle.vehicle_color}</Text>
          </View>
        )}
        {vehicle.estimated_cost && (
          <View style={styles.metaRow}>
            <IconSymbol name="dollarsign.circle" size={14} color="#6B7280" />
            <Text style={styles.metaText}>₹{Math.round(vehicle.estimated_cost)}</Text>
          </View>
        )}
      </View>

      {nextAction && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: getStatusColor() }]}
            onPress={() => setShowActions(!showActions)}
          >
            <IconSymbol name={nextAction.icon} size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{nextAction.label}</Text>
          </TouchableOpacity>
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
    router.push(`/vehicles/${vehicleId}`);
  };

  const handleStatusUpdate = (id: string, status: string, notes?: string) => {
    statusUpdateMutation.mutate({ id, status, notes });
  };

  // Group vehicles by status
  const vehiclesByStatus = React.useMemo(() => {
    if (!vehicles) return { received: [], diagnosed: [], inProgress: [], completed: [] };

    return {
      received: vehicles.filter(v => v.status === 'received'),
      diagnosed: vehicles.filter(v => v.status === 'diagnosed'),
      inProgress: vehicles.filter(v => v.status === 'in_progress'),
      completed: vehicles.filter(v => ['completed', 'delivered'].includes(v.status)),
    };
  }, [vehicles]);

  if (vehiclesError) {
    return (
      <ThemedView style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color="#EF4444" />
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
              <View style={[styles.summaryIndicator, { backgroundColor: '#6B7280' }]} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{vehiclesByStatus.diagnosed.length}</Text>
              <Text style={styles.summaryLabel}>Diagnosed</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#3B82F6' }]} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{vehiclesByStatus.inProgress.length}</Text>
              <Text style={styles.summaryLabel}>In Progress</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#8B5CF6' }]} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{vehiclesByStatus.completed.length}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#10B981' }]} />
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

        {/* Diagnosed Vehicles */}
        {vehiclesByStatus.diagnosed.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Diagnosed ({vehiclesByStatus.diagnosed.length})
            </ThemedText>
            <View style={styles.vehiclesList}>
              {vehiclesByStatus.diagnosed.map((vehicle) => (
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
            <IconSymbol name="car" size={48} color="#6B7280" />
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
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  summarySection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#111827',
    marginBottom: 16,
  },
  vehiclesList: {
    gap: 12,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
    color: '#111827',
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#374151',
    marginBottom: 4,
  },
  diagnosisText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  symptomsSection: {
    marginBottom: 12,
  },
  symptomsText: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#6B7280',
  },
  actionSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
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
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
    minHeight: 60,
    textAlignVertical: 'top',
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
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
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
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 16,
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
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
