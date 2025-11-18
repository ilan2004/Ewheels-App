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
import { BrandColors, Typography, Spacing, BorderRadius, ComponentStyles, StatusColors } from '@/constants/design-system';

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
    return StatusColors[status as keyof typeof StatusColors]?.primary || BrandColors.primary;
  };

  return (
    <>
      {/* Add Update Button */}
      <TouchableOpacity
        style={[
          styles.addButton,
          { backgroundColor: StatusColors[currentStatus as keyof typeof StatusColors]?.background || BrandColors.primary + '20' }
        ]}
        onPress={() => setShowModal(true)}
      >
        <IconSymbol 
          name="plus.circle" 
          size={20} 
          color={StatusColors[currentStatus as keyof typeof StatusColors]?.primary || BrandColors.primary} 
        />
        <Text style={[
          styles.addButtonText,
          { color: StatusColors[currentStatus as keyof typeof StatusColors]?.primary || BrandColors.primary }
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
                <ActivityIndicator size="small" color={Colors.primary[600]} />
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
                { backgroundColor: StatusColors[currentStatus as keyof typeof StatusColors]?.background || BrandColors.primary + '20' }
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  { color: StatusColors[currentStatus as keyof typeof StatusColors]?.primary || BrandColors.primary }
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
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.base,
    gap: Spacing.sm,
  },
  addButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing['5xl'],
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '20',
  },
  modalCancel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '60',
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
  },
  modalDone: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
  },
  modalDoneDisabled: {
    color: BrandColors.ink + '40',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },

  statusContext: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
  },
  statusBadge: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
  },
  statusBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  statusDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '60',
    textAlign: 'center',
  },

  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionHeader: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '60',
    marginBottom: Spacing.base,
    lineHeight: Typography.lineHeight.sm,
  },

  templatesGrid: {
    gap: Spacing.sm,
  },
  templateChip: {
    backgroundColor: BrandColors.ink + '10',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
  },
  templateChipSelected: {
    backgroundColor: BrandColors.primary + '10',
    borderColor: BrandColors.primary,
  },
  templateText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '80',
  },
  templateTextSelected: {
    color: BrandColors.primary,
    fontFamily: Typography.fontFamily.semibold,
  },

  textInput: {
    ...ComponentStyles.input,
    padding: Spacing.base,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  characterCount: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '40',
  },
  characterCountError: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
  },

  guidelines: {
    backgroundColor: BrandColors.primary + '05',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: BrandColors.primary + '20',
  },
  guidelinesTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
    marginBottom: Spacing.sm,
  },
  guidelinesText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
    lineHeight: Typography.lineHeight.sm,
  },
});
