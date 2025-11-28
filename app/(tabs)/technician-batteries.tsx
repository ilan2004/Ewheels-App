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
import { batteriesService } from '@/services/batteriesService';
import { useAuthStore } from '@/stores/authStore';
import { BatteryCase } from '@/types';

interface BatteryCardProps {
  battery: BatteryCase;
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
    switch (battery.status) {
      case 'received': return 'tray';
      case 'triaged': return 'list.bullet';
      case 'diagnosed': return 'list.bullet';
      case 'in_progress': return 'gearshape';
      case 'completed': return 'checkmark.circle';
      case 'delivered': return 'checkmark.circle.fill';
      default: return 'battery.25';
    }
  };

  const getBMSStatusColor = () => {
    switch (battery.bms_status || 'unknown') {
      case 'ok': return Colors.success[500];
      case 'faulty': return Colors.error[500];
      case 'replaced': return Colors.primary[500];
      case 'unknown': return Colors.neutral[500];
      default: return Colors.neutral[500];
    }
  };

  const getVoltageHealthColor = (voltage: number) => {
    if (!battery.voltage) return Colors.neutral[500];
    const healthPercentage = (voltage / battery.voltage) * 100;
    if (healthPercentage >= 90) return Colors.success[500];
    if (healthPercentage >= 80) return Colors.warning[500];
    return Colors.error[500];
  };

  const getNextStatusAction = () => {
    switch (battery.status) {
      case 'received': return { status: 'triaged', label: 'View Battery Case', icon: 'doc.text' };
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
            name={getStatusIcon()}
            size={20}
            color={getStatusColor()}
          />
          <View style={styles.batteryInfo}>
            <Text style={styles.batterySerial}>{battery.battery_serial}</Text>
            <Text style={styles.batteryDetails}>
              {battery.battery_make} {battery.battery_model} • {battery.voltage || 0}V
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
            <Text style={styles.specValue}>{(battery.battery_type || 'Unknown').toUpperCase()}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Capacity</Text>
            <Text style={styles.specValue}>{battery.capacity || 0}Ah</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>BMS</Text>
            <Text style={[styles.specValue, { color: getBMSStatusColor() }]}>
              {(battery.bms_status || 'unknown').toUpperCase()}
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
                  { color: battery.load_test_result >= 80 ? Colors.success[500] : battery.load_test_result >= 60 ? Colors.warning[500] : Colors.error[500] }
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
            <IconSymbol name="dollarsign.circle" size={14} color={Colors.neutral[500]} />
            <Text style={styles.metaText}>Est: ₹{Math.round(battery.estimated_cost)}</Text>
          </View>
        )}
        {battery.final_cost && (
          <View style={styles.metaRow}>
            <IconSymbol name="dollarsign.circle.fill" size={14} color={Colors.success[500]} />
            <Text style={styles.metaText}>Final: ₹{Math.round(battery.final_cost)}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {nextAction && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: getStatusColor(), flex: 1 }]}
            onPress={() => {
              if (battery.status === 'received') {
                onPress(); // Just navigate for "View Battery Case"
              } else {
                setShowActions(!showActions);
              }
            }}
          >
            <IconSymbol name={nextAction.icon as any} size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{nextAction.label}</Text>
          </TouchableOpacity>

          {battery.status === 'in_progress' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.neutral[600], flex: 1 }]}
            onPress={onPress}
          >
            <IconSymbol name="pencil.circle" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Update Status</Text>
          </TouchableOpacity>
        )}
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
    const battery = batteries?.find(b => b.id === batteryId);
    if (battery?.service_ticket_id) {
      router.push(`/jobcards/${battery.service_ticket_id}`);
    }
  };

  const handleStatusUpdate = (id: string, status: string, notes?: string) => {
    statusUpdateMutation.mutate({ id, status, notes });
  };

  const handleRunDiagnostics = (id: string) => {
    diagnosticsMutation.mutate(id);
  };

  // Group batteries by status
  const batteriesByStatus = React.useMemo(() => {
    if (!batteries) return { received: [], triaged: [], inProgress: [], completed: [] };

    return {
      received: batteries.filter(b => b.status === 'received'),
      triaged: batteries.filter(b => b.status === 'triaged' || b.status === 'diagnosed'),
      inProgress: batteries.filter(b => b.status === 'in_progress'),
      completed: batteries.filter(b => ['completed', 'delivered'].includes(b.status)),
    };
  }, [batteries]);

  if (batteriesError) {
    return (
      <ThemedView style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={Colors.error[500]} />
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
              <View style={[styles.summaryIndicator, { backgroundColor: '#EF4444' }]} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{batteriesByStatus.triaged.length}</Text>
              <Text style={styles.summaryLabel}>Triaged</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#F59E0B' }]} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{batteriesByStatus.inProgress.length}</Text>
              <Text style={styles.summaryLabel}>In Progress</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#499588' }]} />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{batteriesByStatus.completed.length}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
              <View style={[styles.summaryIndicator, { backgroundColor: '#387868' }]} />
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

        {/* Triaged Batteries */}
        {batteriesByStatus.triaged.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Triaged ({batteriesByStatus.triaged.length})
            </ThemedText>
            <View style={styles.batteriesList}>
              {batteriesByStatus.triaged.map((battery) => (
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
            <IconSymbol name="battery.0" size={48} color={Colors.neutral[400]} />
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
  batteriesList: {
    gap: 12,
  },
  batteryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.sm,
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
    color: BrandColors.ink,
  },
  batteryDetails: {
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
  specsSection: {
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    padding: 12,
  },
  specItem: {
    alignItems: 'center',
    flex: 1,
  },
  specLabel: {
    fontSize: 11,
    color: Colors.neutral[500],
    marginBottom: 2,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.ink,
  },
  diagnosticsSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral[700],
    marginBottom: 8,
  },
  diagnosticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.info[50],
    borderRadius: 8,
    padding: 12,
  },
  diagnosticItem: {
    alignItems: 'center',
    flex: 1,
  },
  diagnosticLabel: {
    fontSize: 11,
    color: Colors.neutral[700],
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
    color: Colors.neutral[500],
    backgroundColor: Colors.warning[100],
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
    color: Colors.neutral[500],
  },
  actionSection: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
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
