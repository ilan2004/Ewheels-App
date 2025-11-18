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
import { batteriesService } from '@/services/batteriesService';
import { BatteryRecord } from '@/types';

interface BatteryCardProps {
  battery: BatteryRecord;
  onPress: () => void;
  onStatusUpdate: (id: string, status: string, notes?: string) => void;
  onRunDiagnostics: (id: string) => void;
}

const BatteryCard: React.FC<BatteryCardProps> = ({ 
  battery, 
  onPress, 
  onStatusUpdate, 
  onRunDiagnostics 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [notes, setNotes] = useState('');

  const getStatusColor = () => {
    switch (battery.status) {
      case 'received': return '#6B7280';
      case 'diagnosed': return '#3B82F6';
      case 'in_progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      case 'delivered': return '#059669';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = () => {
    switch (battery.status) {
      case 'received': return 'tray';
      case 'diagnosed': return 'stethoscope';
      case 'in_progress': return 'gearshape';
      case 'completed': return 'checkmark.circle';
      case 'delivered': return 'checkmark.circle.fill';
      default: return 'battery.25';
    }
  };

  const getBMSStatusColor = () => {
    switch (battery.bms_status) {
      case 'ok': return '#10B981';
      case 'faulty': return '#EF4444';
      case 'replaced': return '#3B82F6';
      case 'unknown': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getVoltageHealthColor = (voltage: number) => {
    const healthPercentage = (voltage / battery.voltage) * 100;
    if (healthPercentage >= 90) return '#10B981';
    if (healthPercentage >= 80) return '#F59E0B';
    return '#EF4444';
  };

  const getNextStatusAction = () => {
    switch (battery.status) {
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
      `Mark this battery as ${nextAction.label.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            onStatusUpdate(battery.id, nextAction.status, notes || undefined);
            setShowActions(false);
            setNotes('');
          }
        }
      ]
    );
  };

  const handleRunDiagnostics = () => {
    Alert.alert(
      'Run Diagnostics',
      'This will run comprehensive battery diagnostics including voltage, load test, and cell analysis.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Tests',
          onPress: () => onRunDiagnostics(battery.id)
        }
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.batteryCard} onPress={onPress}>
      <View style={styles.batteryHeader}>
        <View style={styles.batteryTitleRow}>
          <IconSymbol 
            name="battery.100" 
            size={20} 
            color={getStatusColor()} 
          />
          <View style={styles.batteryInfo}>
            <Text style={styles.batterySerial}>{battery.battery_serial}</Text>
            <Text style={styles.batteryDetails}>
              {battery.battery_make} {battery.battery_model} • {battery.voltage}V
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {battery.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Battery Specifications */}
      <View style={styles.specsSection}>
        <View style={styles.specRow}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Type</Text>
            <Text style={styles.specValue}>{battery.battery_type.toUpperCase()}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Capacity</Text>
            <Text style={styles.specValue}>{battery.capacity}Ah</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>BMS</Text>
            <Text style={[styles.specValue, { color: getBMSStatusColor() }]}>
              {battery.bms_status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Diagnostic Data */}
      {(battery.initial_voltage || battery.load_test_result) && (
        <View style={styles.diagnosticsSection}>
          <Text style={styles.sectionLabel}>Diagnostic Results:</Text>
          <View style={styles.diagnosticsGrid}>
            {battery.initial_voltage && (
              <View style={styles.diagnosticItem}>
                <Text style={styles.diagnosticLabel}>Voltage</Text>
                <Text style={[
                  styles.diagnosticValue,
                  { color: getVoltageHealthColor(battery.initial_voltage) }
                ]}>
                  {battery.initial_voltage.toFixed(1)}V
                </Text>
              </View>
            )}
            {battery.load_test_result && (
              <View style={styles.diagnosticItem}>
                <Text style={styles.diagnosticLabel}>Load Test</Text>
                <Text style={[
                  styles.diagnosticValue,
                  { color: battery.load_test_result >= 80 ? '#10B981' : battery.load_test_result >= 60 ? '#F59E0B' : '#EF4444' }
                ]}>
                  {Math.round(battery.load_test_result)}%
                </Text>
              </View>
            )}
            {battery.cells_replaced && battery.cells_replaced > 0 && (
              <View style={styles.diagnosticItem}>
                <Text style={styles.diagnosticLabel}>Cells Replaced</Text>
                <Text style={styles.diagnosticValue}>
                  {battery.cells_replaced}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Repair Information */}
      {battery.repair_type && (
        <View style={styles.repairSection}>
          <Text style={styles.sectionLabel}>Repair Type:</Text>
          <Text style={styles.repairText}>{battery.repair_type}</Text>
        </View>
      )}

      {/* Cost Information */}
      <View style={styles.batteryMeta}>
        {battery.estimated_cost && (
          <View style={styles.metaRow}>
            <IconSymbol name="dollarsign.circle" size={14} color="#6B7280" />
            <Text style={styles.metaText}>Est: ₹{Math.round(battery.estimated_cost)}</Text>
          </View>
        )}
        {battery.final_cost && (
          <View style={styles.metaRow}>
            <IconSymbol name="dollarsign.circle.fill" size={14} color="#10B981" />
            <Text style={styles.metaText}>Final: ₹{Math.round(battery.final_cost)}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {battery.status === 'received' && (
          <TouchableOpacity
            style={[styles.diagnosticButton, { backgroundColor: '#3B82F6' }]}
            onPress={handleRunDiagnostics}
          >
            <IconSymbol name="waveform.path.ecg" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Run Diagnostics</Text>
          </TouchableOpacity>
        )}
        
        {nextAction && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: getStatusColor() }]}
            onPress={() => setShowActions(!showActions)}
          >
            <IconSymbol name={nextAction.icon} size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{nextAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>

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

export default function TechnicianBatteriesScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch technician's assigned battery records
  const {
    data: batteries,
    isLoading: batteriesLoading,
    error: batteriesError,
    refetch: refetchBatteries,
  } = useQuery({
    queryKey: ['technician-batteries', user?.id],
    queryFn: () => batteriesService.getMyBatteries(user?.id),
    refetchInterval: 30000,
    enabled: !!user?.id,
  });

  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      batteriesService.updateStatus(id, status as any, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-batteries'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update battery status. Please try again.');
      console.error('Status update error:', error);
    }
  });

  // Diagnostics mutation
  const diagnosticsMutation = useMutation({
    mutationFn: (id: string) => batteriesService.runDiagnosticTest(id),
    onSuccess: (results, batteryId) => {
      // Update battery with diagnostic results
      batteriesService.updateDiagnostics(batteryId, {
        initial_voltage: results.voltage,
        load_test_result: results.loadTest,
        ir_values: results.irValues,
        cell_voltages: results.cellVoltages,
        bms_status: results.bmsStatus,
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['technician-batteries'] });
        Alert.alert(
          'Diagnostics Complete',
          `Voltage: ${results.voltage.toFixed(1)}V\nLoad Test: ${Math.round(results.loadTest)}%\nBMS Status: ${results.bmsStatus.toUpperCase()}`,
        );
      });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to run diagnostics. Please try again.');
      console.error('Diagnostics error:', error);
    }
  });

  const refreshing = batteriesLoading || statusUpdateMutation.isPending || diagnosticsMutation.isPending;

  const handleRefresh = async () => {
    await refetchBatteries();
  };

  const handleBatteryPress = (batteryId: string) => {
    router.push(`/batteries/${batteryId}`);
  };

  const handleStatusUpdate = (id: string, status: string, notes?: string) => {
    statusUpdateMutation.mutate({ id, status, notes });
  };

  const handleRunDiagnostics = (id: string) => {
    diagnosticsMutation.mutate(id);
  };

  // Group batteries by status
  const batteriesByStatus = React.useMemo(() => {
    if (!batteries) return { received: [], diagnosed: [], inProgress: [], completed: [] };

    return {
      received: batteries.filter(b => b.status === 'received'),
      diagnosed: batteries.filter(b => b.status === 'diagnosed'),
      inProgress: batteries.filter(b => b.status === 'in_progress'),
      completed: batteries.filter(b => ['completed', 'delivered'].includes(b.status)),
    };
  }, [batteries]);

  if (batteriesError) {
    return (
      <ThemedView style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load battery records</Text>
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
            Battery Diagnostics
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Manage battery testing, diagnostics, and repairs
          </ThemedText>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{batteriesByStatus.received.length}</Text>
              <Text style={styles.summaryLabel}>New</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#6B7280' }]} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{batteriesByStatus.diagnosed.length}</Text>
              <Text style={styles.summaryLabel}>Diagnosed</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#3B82F6' }]} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{batteriesByStatus.inProgress.length}</Text>
              <Text style={styles.summaryLabel}>In Progress</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#8B5CF6' }]} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{batteriesByStatus.completed.length}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#10B981' }]} />
            </View>
          </View>
        </View>

        {/* New Batteries */}
        {batteriesByStatus.received.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              New Batteries ({batteriesByStatus.received.length})
            </ThemedText>
            <View style={styles.batteriesList}>
              {batteriesByStatus.received.map((battery) => (
                <BatteryCard
                  key={battery.id}
                  battery={battery}
                  onPress={() => handleBatteryPress(battery.id)}
                  onStatusUpdate={handleStatusUpdate}
                  onRunDiagnostics={handleRunDiagnostics}
                />
              ))}
            </View>
          </View>
        )}

        {/* Diagnosed Batteries */}
        {batteriesByStatus.diagnosed.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Diagnosed ({batteriesByStatus.diagnosed.length})
            </ThemedText>
            <View style={styles.batteriesList}>
              {batteriesByStatus.diagnosed.map((battery) => (
                <BatteryCard
                  key={battery.id}
                  battery={battery}
                  onPress={() => handleBatteryPress(battery.id)}
                  onStatusUpdate={handleStatusUpdate}
                  onRunDiagnostics={handleRunDiagnostics}
                />
              ))}
            </View>
          </View>
        )}

        {/* In Progress */}
        {batteriesByStatus.inProgress.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              In Progress ({batteriesByStatus.inProgress.length})
            </ThemedText>
            <View style={styles.batteriesList}>
              {batteriesByStatus.inProgress.map((battery) => (
                <BatteryCard
                  key={battery.id}
                  battery={battery}
                  onPress={() => handleBatteryPress(battery.id)}
                  onStatusUpdate={handleStatusUpdate}
                  onRunDiagnostics={handleRunDiagnostics}
                />
              ))}
            </View>
          </View>
        )}

        {/* Completed */}
        {batteriesByStatus.completed.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Completed ({batteriesByStatus.completed.length})
            </ThemedText>
            <View style={styles.batteriesList}>
              {batteriesByStatus.completed.map((battery) => (
                <BatteryCard
                  key={battery.id}
                  battery={battery}
                  onPress={() => handleBatteryPress(battery.id)}
                  onStatusUpdate={handleStatusUpdate}
                  onRunDiagnostics={handleRunDiagnostics}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!batteriesLoading && batteries && batteries.length === 0 && (
          <View style={styles.emptyContainer}>
            <IconSymbol name="battery.0" size={48} color="#6B7280" />
            <Text style={styles.emptyTitle}>No Battery Records</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any assigned battery diagnostics at the moment.
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
  batteriesList: {
    gap: 12,
  },
  batteryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  batteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  batteryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  batteryInfo: {
    flex: 1,
  },
  batterySerial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  batteryDetails: {
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
  specsSection: {
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  specItem: {
    alignItems: 'center',
    flex: 1,
  },
  specLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  diagnosticsSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  diagnosticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
  },
  diagnosticItem: {
    alignItems: 'center',
    flex: 1,
  },
  diagnosticLabel: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 2,
  },
  diagnosticValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  repairSection: {
    marginBottom: 12,
  },
  repairText: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
  },
  batteryMeta: {
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
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  diagnosticButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButton: {
    flex: 1,
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
