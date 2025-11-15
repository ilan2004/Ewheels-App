import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { jobCardsService } from '@/services/jobCardsService';

interface StatusUpdateInputProps {
  ticketId: string;
  currentStatus: string;
  onUpdateAdded?: () => void;
}

// Quick action templates for different statuses
const statusTemplates: Record<string, string[]> = {
  reported: [
    'Customer complaint verified and logged',
    'Initial documentation completed',
    'Priority assessment pending',
    'Assigned for triage evaluation',
  ],
  triaged: [
    'Initial assessment completed',
    'Diagnostic tests recommended',
    'Parts requirement identified',
    'Complexity evaluation finished',
    'Ready for technician assignment',
  ],
  in_progress: [
    'Diagnostic tests started',
    'Issue root cause identified',
    'Parts ordered for replacement',
    'Repair work in progress',
    'Quality checks ongoing',
    'Additional testing required',
    'Waiting for parts delivery',
    'Customer approval needed',
  ],
  completed: [
    'Repair work finished successfully',
    'Quality inspection passed',
    'Final testing completed',
    'Documentation updated',
    'Ready for customer pickup',
  ],
  delivered: [
    'Vehicle delivered to customer',
    'Customer satisfaction confirmed',
    'Final documentation provided',
    'Service completed successfully',
  ],
};

export function StatusUpdateInput({ 
  ticketId, 
  currentStatus, 
  onUpdateAdded 
}: StatusUpdateInputProps) {
  const [showModal, setShowModal] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const addUpdateMutation = useMutation({
    mutationFn: (params: { updateText: string }) =>
      jobCardsService.addStatusUpdate({
        ticketId,
        status: currentStatus,
        updateText: params.updateText,
      }),
    onSuccess: () => {
      setShowModal(false);
      setUpdateText('');
      setSelectedTemplate(null);
      onUpdateAdded?.();
      queryClient.invalidateQueries({ queryKey: ['status-updates', ticketId] });
      Alert.alert('Success', 'Status update added successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.message || 'Failed to add status update. Please try again.'
      );
    },
  });

  const templates = statusTemplates[currentStatus] || [];

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setUpdateText(template);
  };

  const handleSubmit = () => {
    if (!updateText.trim()) {
      Alert.alert('Error', 'Please enter an update message');
      return;
    }

    addUpdateMutation.mutate({ updateText: updateText.trim() });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return '#EF4444';
      case 'triaged': return '#F59E0B';
      case 'in_progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      case 'delivered': return '#06B6D4';
      default: return '#6B7280';
    }
  };

  return (
    <>
      {/* Add Update Button */}
      <TouchableOpacity
        style={[
          styles.addButton,
          { backgroundColor: getStatusColor(currentStatus) + '20' }
        ]}
        onPress={() => setShowModal(true)}
      >
        <IconSymbol 
          name="plus.circle" 
          size={20} 
          color={getStatusColor(currentStatus)} 
        />
        <Text style={[
          styles.addButtonText,
          { color: getStatusColor(currentStatus) }
        ]}>
          Add Progress Update
        </Text>
      </TouchableOpacity>

      {/* Update Modal */}
      <Modal 
        visible={showModal} 
        animationType="slide" 
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Add Progress Update
            </ThemedText>
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={addUpdateMutation.isPending || !updateText.trim()}
            >
              {addUpdateMutation.isPending ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text style={[
                  styles.modalDone,
                  (!updateText.trim()) && styles.modalDoneDisabled
                ]}>
                  Add
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Status Context */}
            <View style={styles.statusContext}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(currentStatus) + '20' }
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  { color: getStatusColor(currentStatus) }
                ]}>
                  {currentStatus.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.statusDescription}>
                Add a progress update for the current status
              </Text>
            </View>

            {/* Quick Templates */}
            {templates.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Quick Actions</Text>
                <Text style={styles.sectionDescription}>
                  Tap to use a common update for this status
                </Text>
                
                <View style={styles.templatesGrid}>
                  {templates.map((template, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.templateChip,
                        selectedTemplate === template && styles.templateChipSelected
                      ]}
                      onPress={() => handleTemplateSelect(template)}
                    >
                      <Text style={[
                        styles.templateText,
                        selectedTemplate === template && styles.templateTextSelected
                      ]}>
                        {template}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Custom Update Input */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Update Message</Text>
              <Text style={styles.sectionDescription}>
                Describe what's happening with this job card
              </Text>
              
              <TextInput
                style={styles.textInput}
                placeholder="Enter progress update..."
                value={updateText}
                onChangeText={(text) => {
                  setUpdateText(text);
                  setSelectedTemplate(null);
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.inputFooter}>
                <Text style={styles.characterCount}>
                  {updateText.length}/500 characters
                </Text>
                {updateText.length > 500 && (
                  <Text style={styles.characterCountError}>
                    Message too long
                  </Text>
                )}
              </View>
            </View>

            {/* Guidelines */}
            <View style={styles.guidelines}>
              <Text style={styles.guidelinesTitle}>💡 Tips for good updates:</Text>
              <Text style={styles.guidelinesText}>
                • Be specific about what's been done{'\n'}
                • Mention any issues or delays{'\n'}
                • Include next steps if relevant{'\n'}
                • Keep it concise but informative
              </Text>
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
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

  statusContext: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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

  templatesGrid: {
    gap: 8,
  },
  templateChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  templateText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  templateTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
  },

  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  characterCountError: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },

  guidelines: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 14,
    color: '#B45309',
    lineHeight: 20,
  },
});
