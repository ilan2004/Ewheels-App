import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { StatusIcon } from '@/components/empty-states';
import { HorizontalServiceProgress } from '@/components/progress/HorizontalServiceProgress';
import { StatusUpdateInput } from '@/components/status/StatusUpdateInput';
import { StatusUpdatesTimeline } from '@/components/status/StatusUpdatesTimeline';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TriageManagement } from '@/components/triage/TriageManagement';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, BrandColors, Colors, ComponentStyles, PriorityColors, Spacing, StatusColors, Typography } from '@/constants/design-system';
import { batteriesService } from '@/services/batteriesService';
import { jobCardsService } from '@/services/jobCardsService';
import { vehiclesService } from '@/services/vehiclesService';
import { useAuthStore } from '@/stores/authStore';

import { AudioPlayerModal } from '@/components/modals/AudioPlayerModal';
import { ImageViewerModal } from '@/components/modals/ImageViewerModal';

export default function JobCardDetailScreen() {
  const { user } = useAuthStore();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();

  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedAudio, setSelectedAudio] = useState<{ id: string; url: string; name: string; duration?: number } | null>(null);
  const queryClient = useQueryClient();

  // Fetch ticket details
  const {
    data: ticket,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ticket-detail', ticketId],
    queryFn: () => jobCardsService.getTicketById(ticketId!),
    enabled: !!ticketId,
  });

  // Fetch technicians for name lookup
  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => jobCardsService.getTechnicians(),
  });

  // Fetch ticket attachments
  const { data: attachments = [] } = useQuery({
    queryKey: ['ticket-attachments', ticketId],
    queryFn: () => jobCardsService.getTicketAttachments(ticketId!),
    enabled: !!ticketId,
  });

  // Fetch status updates
  const { data: statusUpdates = [], refetch: refetchStatusUpdates } = useQuery({
    queryKey: ['status-updates', ticketId],
    queryFn: () => jobCardsService.getStatusUpdates(ticketId!),
    enabled: !!ticketId,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Fetch vehicle intake record if ticket has one
  const { data: vehicleRecord } = useQuery({
    queryKey: ['vehicle-record', ticket?.vehicle_record_id],
    queryFn: () => vehiclesService.getVehicleRecordById(ticket!.vehicle_record_id!),
    enabled: !!ticket?.vehicle_record_id,
  });

  // Fetch vehicle case details if ticket has a vehicle case
  const { data: vehicleCase } = useQuery({
    queryKey: ['vehicle-case', ticket?.vehicle_case_id],
    queryFn: () => vehiclesService.getVehicleCaseById(ticket!.vehicle_case_id!),
    enabled: !!ticket?.vehicle_case_id,
  });

  // Fetch battery intake records (array) by service_ticket_id
  const { data: batteryRecords = [] } = useQuery({
    queryKey: ['battery-records', ticketId],
    queryFn: () => batteriesService.getBatteryRecordsByTicket(ticketId!),
    enabled: !!ticketId,
  });

  // Fetch battery cases (array) by service_ticket_id
  const { data: batteryCases = [] } = useQuery({
    queryKey: ['battery-cases', ticketId],
    queryFn: () => batteriesService.getBatteryCasesByTicket(ticketId!),
    enabled: !!ticketId,
  });



  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      jobCardsService.updateTicketStatus(ticketId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
    },
  });



  const handleStatusUpdate = (status: string) => {
    Alert.alert(
      'Update Status',
      `Change status to "${status.replace('_', ' ')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => updateStatusMutation.mutate(status),
        },
      ]
    );
  };

  // Media click handlers
  const handleImageClick = (attachmentId: string) => {
    const imageAttachments = attachments
      .filter(att => (att.attachmentType === 'photo' || att.attachment_type === 'photo') && imageUrls[att.id])
      .map(att => ({
        id: att.id,
        url: imageUrls[att.id],
        name: att.originalName || att.original_name || att.fileName || att.file_name || 'Image'
      }));

    const index = imageAttachments.findIndex(img => img.id === attachmentId);
    if (index >= 0) {
      setSelectedImageIndex(index);
      setShowImageViewer(true);
    }
  };

  const handleAudioClick = (attachmentId: string) => {
    const attachment = attachments.find(att => att.id === attachmentId);
    const audioUrl = audioUrls[attachmentId];

    if (attachment && audioUrl) {
      setSelectedAudio({
        id: attachment.id,
        url: audioUrl,
        name: attachment.originalName || attachment.original_name || attachment.fileName || attachment.file_name || 'Audio',
        duration: attachment.duration
      });
      setShowAudioPlayer(true);
    }
  };

  // Helper function to get technician name
  const getTechnicianName = (technicianId: string): string => {
    if (!technicianId) return 'Unassigned';
    const technician = technicians.find(t => t.id === technicianId);
    if (!technician) return technicianId; // Fallback to ID if name not found
    return `${technician.first_name || ''} ${technician.last_name || ''}`.trim() || technician.email || technicianId;
  };

  // Helper function to get creator name
  const getCreatorName = (ticket: any): string => {
    if (ticket.creator) {
      // Use the creator information from the API join
      return ticket.creator.username || ticket.creator.email || 'Unknown';
    }
    // Fallback: if no creator info, return 'Unknown' instead of showing user ID
    return 'Unknown';
  };

  // Load media URLs for attachments
  React.useEffect(() => {
    const loadMediaUrls = async () => {
      for (const attachment of attachments) {
        const isPhoto = attachment.attachmentType === 'photo' || attachment.attachment_type === 'photo';
        const isAudio = attachment.attachmentType === 'audio' || attachment.attachment_type === 'audio';
        const storagePath = attachment.storagePath || attachment.storage_path;
        const attachmentType = attachment.attachmentType || attachment.attachment_type;

        if (isPhoto && storagePath && !imageUrls[attachment.id]) {
          try {
            const signedUrl = await jobCardsService.getAttachmentSignedUrl(storagePath, attachmentType);
            if (signedUrl) {
              setImageUrls(prev => ({ ...prev, [attachment.id]: signedUrl }));
            }
          } catch (error) {
            console.error('Error loading image URL for attachment:', attachment.id, error);
          }
        } else if (isAudio && storagePath && !audioUrls[attachment.id]) {
          try {
            const signedUrl = await jobCardsService.getAttachmentSignedUrl(storagePath, attachmentType);
            if (signedUrl) {
              setAudioUrls(prev => ({ ...prev, [attachment.id]: signedUrl }));
            }
          } catch (error) {
            console.error('Error loading audio URL for attachment:', attachment.id, error);
          }
        }
      }
    };

    if (attachments.length > 0) {
      loadMediaUrls();
    }
  }, [attachments, imageUrls, audioUrls]);

  // Local state for optimistic updates
  const [localCompleted, setLocalCompleted] = React.useState<string[]>([]);

  // Sync local state with ticket data
  React.useEffect(() => {
    if (ticket?.completed_complaints) {
      setLocalCompleted(ticket.completed_complaints.map((c: string) => c.trim()));
    } else {
      setLocalCompleted([]);
    }
  }, [ticket?.completed_complaints]);

  // Parse complaints
  const complaints = React.useMemo(() => {
    if (!ticket) return [];

    const rawComplaint: any = ticket.customer_complaint || (ticket as any).symptom;
    let parsedComplaints: string[] = [];

    if (Array.isArray(rawComplaint)) {
      parsedComplaints = rawComplaint.map((c: string) => c.trim());
    } else if (typeof rawComplaint === 'string') {
      try {
        const parsed = JSON.parse(rawComplaint);
        if (Array.isArray(parsed)) parsedComplaints = parsed.map((c: any) => String(c).trim());
        else parsedComplaints = [rawComplaint.trim()];
      } catch (e) {
        if (rawComplaint.trim().startsWith('[') && rawComplaint.trim().endsWith(']')) {
          try {
            const fixed = rawComplaint.replace(/'/g, '"');
            const parsed = JSON.parse(fixed);
            if (Array.isArray(parsed)) parsedComplaints = parsed.map((c: any) => String(c).trim());
            else parsedComplaints = [rawComplaint.trim()];
          } catch (e2) {
            parsedComplaints = [rawComplaint.trim()];
          }
        } else {
          parsedComplaints = [rawComplaint.trim()];
        }
      }
    }
    return parsedComplaints;
  }, [ticket]);

  const handleToggleComplaint = async (complaint: string) => {
    if (!ticket) return;

    const targetComplaint = complaint.trim();
    const isCompleted = localCompleted.includes(targetComplaint);

    // Optimistic update
    const newCompleted = isCompleted
      ? localCompleted.filter(c => c !== targetComplaint)
      : [...localCompleted, targetComplaint];

    setLocalCompleted(newCompleted);
  };

  const handleSaveComplaints = async () => {
    if (!ticket) return;

    try {
      await jobCardsService.updateCompletedComplaints(ticket.id, localCompleted);
      Alert.alert('Success', 'Complaint checklist updated successfully');
      refetch(); // Refresh data to ensure sync
    } catch (error) {
      console.error('Error saving complaints:', error);
      Alert.alert('Error', 'Failed to save complaint checklist');
    }
  };

  const getStatusColor = (status: string) => {
    return StatusColors[status as keyof typeof StatusColors]?.primary || BrandColors.primary;
  };

  const getPriorityColor = (priority: number) => {
    const priorityMap = {
      1: PriorityColors[1],
      2: PriorityColors[2],
      3: PriorityColors[3],
    };
    return priorityMap[priority as keyof typeof priorityMap] || BrandColors.ink + '60';
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return 'High Priority';
      case 2: return 'Medium Priority';
      case 3: return 'Low Priority';
      default: return 'Unknown Priority';
    }
  };

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'reported':
        // No direct status action; use Triage & Case Management instead
        return [];
      case 'triaged':
        return ['in_progress'];
      case 'in_progress':
        return ['completed'];
      default:
        return [];
    }
  };

  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Error',
            headerBackTitle: 'Back',
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
          }}
        />
        <ThemedView style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load ticket details</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </ThemedView>
      </>
    );
  }

  if (!ticket && !isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Not Found',
            headerBackTitle: 'Back',
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
          }}
        />
        <ThemedView style={styles.errorContainer}>
          <Text style={styles.errorText}>Ticket not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </ThemedView>
      </>
    );
  }

  const nextStatusOptions = ticket ? getNextStatusOptions(ticket.status) : [];

  // Due Date Logic
  const dueDate = ticket?.due_date || ticket?.dueDate;
  const now = new Date();
  const due = dueDate ? new Date(dueDate) : null;

  let daysRemaining: number | null = null;
  let isOverdue = false;
  let isDueToday = false;
  let isDueTomorrow = false;

  if (due) {
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    daysRemaining = diffDays;
    isOverdue = diffTime < 0;
    isDueToday = new Date(due).toDateString() === now.toDateString();
    isDueTomorrow = !isDueToday && diffDays === 1;
  }

  const isUrgent = isOverdue || isDueToday || isDueTomorrow;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Job Card Details',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: BrandColors.surface,
          },
          headerTitleStyle: {
            fontFamily: Typography.fontFamily.semibold,
            color: BrandColors.title,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                if (ticket?.assigned_to || ticket?.assignedTo) {
                  refetch();
                } else {
                  router.push(`/jobcards/assign-technician?ticketId=${ticketId}`);
                }
              }}
              style={{ marginRight: 16 }}
            >
              <IconSymbol
                name={(ticket?.assigned_to || ticket?.assignedTo) ? "arrow.triangle.2.circlepath" : "person.badge.plus"}
                size={24}
                color="#3B82F6"
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
        >
          {isLoading && !ticket && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading ticket details...</Text>
            </View>
          )}

          {ticket && (
            <>
              {/* Due Date Banner */}
              {dueDate && (
                <View style={[
                  styles.dueDateBanner,
                  isUrgent ? styles.dueDateBannerUrgent : styles.dueDateBannerNormal
                ]}>
                  <IconSymbol
                    name={isUrgent ? "exclamationmark.circle.fill" : "calendar"}
                    size={20}
                    color={isUrgent ? Colors.error[600] : Colors.neutral[600]}
                  />
                  <Text style={[
                    styles.dueDateText,
                    isUrgent ? styles.dueDateTextUrgent : styles.dueDateTextNormal
                  ]}>
                    {isOverdue ? `Overdue by ${Math.abs(daysRemaining ?? 0)} days` :
                      isDueToday ? 'Due Today' :
                        isDueTomorrow ? 'Due Tomorrow' :
                          `Due in ${daysRemaining} days (${new Date(dueDate).toLocaleDateString()})`}
                  </Text>
                </View>
              )}

              {/* Status Progress */}
              <HorizontalServiceProgress
                currentStatus={ticket.status}
              />

              {/* Ticket Header Card */}
              <View style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketHeaderLeft}>
                    <View style={styles.ticketNumberContainer}>
                      <IconSymbol name="doc.text.fill" size={20} color="#3B82F6" />
                      <Text style={styles.ticketNumber}>{ticket.ticket_number || ticket.ticketNumber}</Text>
                    </View>
                    <View style={styles.ticketBadges}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                        <StatusIcon status={ticket.status as any} size="sm" />
                        <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                          {ticket.status.replace('_', ' ')}
                        </Text>
                      </View>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority ?? 0) }]}>
                        <IconSymbol name="exclamationmark.circle.fill" size={14} color="#FFFFFF" />
                        <Text style={styles.priorityText}>{getPriorityText(ticket.priority ?? 0)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Customer Complaint Card */}
              <View style={styles.ticketCard}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  <IconSymbol name="exclamationmark.bubble.fill" size={18} color={BrandColors.title} /> Customer Complaint
                </ThemedText>
                <View style={styles.complaintList}>
                  {complaints.map((complaint, index) => {
                    const isCompleted = localCompleted.includes(complaint);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.complaintItem}
                        onPress={() => handleToggleComplaint(complaint)}
                      >
                        <View style={[styles.checkbox, isCompleted && styles.checkboxChecked]}>
                          {isCompleted && <IconSymbol name="checkmark" size={12} color="#FFFFFF" />}
                        </View>
                        <Text style={[styles.symptomText, isCompleted && styles.symptomTextCompleted]}>
                          {complaint}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Save Button for Complaints */}
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    JSON.stringify(localCompleted.sort()) === JSON.stringify((ticket.completed_complaints || []).map((c: string) => c.trim()).sort()) && styles.saveButtonDisabled
                  ]}
                  onPress={handleSaveComplaints}
                  disabled={JSON.stringify(localCompleted.sort()) === JSON.stringify((ticket.completed_complaints || []).map((c: string) => c.trim()).sort())}
                >
                  <Text style={styles.saveButtonText}>Save Checklist Changes</Text>
                </TouchableOpacity>
              </View>

              {/* Customer Info Card */}
              <View style={styles.ticketCard}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  <IconSymbol name="person.fill" size={18} color={BrandColors.title} /> Customer Information
                </ThemedText>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <IconSymbol name="person.circle" size={16} color="#6B7280" />
                      <Text style={styles.infoLabel}>Name</Text>
                    </View>
                    <Text style={styles.infoValue}>{ticket.customer?.name || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <IconSymbol name="phone.fill" size={16} color="#6B7280" />
                      <Text style={styles.infoLabel}>Contact</Text>
                    </View>
                    <Text style={styles.infoValue}>{ticket.customer?.contact || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <IconSymbol name="envelope.fill" size={16} color="#6B7280" />
                      <Text style={styles.infoLabel}>Email</Text>
                    </View>
                    <Text style={styles.infoValue}>{ticket.customer?.email || 'N/A'}</Text>
                  </View>
                  {(ticket.vehicle_reg_no || ticket.vehicleRegNo) && (
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <IconSymbol name="car.fill" size={16} color="#6B7280" />
                        <Text style={styles.infoLabel}>Vehicle</Text>
                      </View>
                      <Text style={styles.infoValue}>{ticket.vehicle_reg_no || ticket.vehicleRegNo}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Customer Bringing Card */}
              {ticket.customer_bringing && (
                <View style={styles.ticketCard}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    <IconSymbol name="shippingbox" size={18} color={BrandColors.title} /> What Customer Brought
                  </ThemedText>
                  <View style={styles.infoCard}>
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
                  </View>
                </View>
              )}

              {/* Triage Management Card */}
              <View style={styles.ticketCard}>
                <TriageManagement
                  ticket={ticket}
                  onTriageComplete={() => {
                    refetch(); // Refresh ticket data
                    refetchStatusUpdates(); // Refresh status updates
                  }}
                />
              </View>

              {/* Vehicle Details Card */}
              {(ticket.customer_bringing === 'vehicle' || ticket.customer_bringing === 'both') && vehicleRecord && (
                <View style={styles.ticketCard}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    <IconSymbol name="car.fill" size={18} color={BrandColors.title} /> Vehicle Details
                  </ThemedText>
                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <IconSymbol name="number" size={16} color="#6B7280" />
                        <Text style={styles.infoLabel}>Registration No.</Text>
                      </View>
                      <Text style={styles.infoValue}>{vehicleRecord.vehicle_reg_no}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <IconSymbol name="flag.fill" size={16} color={getStatusColor(vehicleRecord.status)} />
                        <Text style={styles.infoLabel}>Intake Status</Text>
                      </View>
                      <Text style={[styles.infoValue, { color: getStatusColor(vehicleRecord.status) }]}>
                        {vehicleRecord.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <IconSymbol name="building.2" size={16} color="#6B7280" />
                        <Text style={styles.infoLabel}>Make</Text>
                      </View>
                      <Text style={styles.infoValue}>{vehicleRecord.vehicle_make}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <IconSymbol name="car.fill" size={16} color="#6B7280" />
                        <Text style={styles.infoLabel}>Model</Text>
                      </View>
                      <Text style={styles.infoValue}>{vehicleRecord.vehicle_model}</Text>
                    </View>
                    {vehicleRecord.vehicle_year && (
                      <View style={styles.infoRow}>
                        <View style={styles.infoLabelContainer}>
                          <IconSymbol name="calendar" size={16} color="#6B7280" />
                          <Text style={styles.infoLabel}>Year</Text>
                        </View>
                        <Text style={styles.infoValue}>{vehicleRecord.vehicle_year}</Text>
                      </View>
                    )}
                    {vehicleRecord.vin_number && (
                      <View style={styles.infoRow}>
                        <View style={styles.infoLabelContainer}>
                          <IconSymbol name="barcode" size={16} color="#6B7280" />
                          <Text style={styles.infoLabel}>VIN Number</Text>
                        </View>
                        <Text style={styles.infoValue}>{vehicleRecord.vin_number}</Text>
                      </View>
                    )}
                    {vehicleRecord.vehicle_type && (
                      <View style={styles.infoRow}>
                        <View style={styles.infoLabelContainer}>
                          <IconSymbol name="car.2" size={16} color="#6B7280" />
                          <Text style={styles.infoLabel}>Vehicle Type</Text>
                        </View>
                        <Text style={styles.infoValue}>{vehicleRecord.vehicle_type}</Text>
                      </View>
                    )}
                    {vehicleRecord.condition_notes && (
                      <View style={styles.infoRow}>
                        <View style={styles.infoLabelContainer}>
                          <IconSymbol name="doc.text" size={16} color="#6B7280" />
                          <Text style={styles.infoLabel}>Intake Condition</Text>
                        </View>
                        <Text style={styles.infoValue}>{vehicleRecord.condition_notes}</Text>
                      </View>
                    )}
                    {vehicleCase && vehicleCase.initial_diagnosis && (
                      <View style={styles.infoRow}>
                        <View style={styles.infoLabelContainer}>
                          <IconSymbol name="stethoscope" size={16} color="#F59E0B" />
                          <Text style={styles.infoLabel}>Initial Diagnosis</Text>
                        </View>
                        <Text style={styles.infoValue}>{vehicleCase.initial_diagnosis}</Text>
                      </View>
                    )}
                    {vehicleCase && vehicleCase.diagnostic_notes && (
                      <View style={styles.infoRow}>
                        <View style={styles.infoLabelContainer}>
                          <IconSymbol name="wrench.and.screwdriver" size={16} color="#10B981" />
                          <Text style={styles.infoLabel}>Service Diagnostics</Text>
                        </View>
                        <Text style={styles.infoValue}>{vehicleCase.diagnostic_notes}</Text>
                      </View>
                    )}
                    {vehicleCase && (
                      <View style={styles.infoRow}>
                        <View style={styles.infoLabelContainer}>
                          <IconSymbol name="gear" size={16} color="#8B5CF6" />
                          <Text style={styles.infoLabel}>Service Status</Text>
                        </View>
                        <Text style={[styles.infoValue, { color: getStatusColor(vehicleCase.status) }]}>
                          {vehicleCase.status.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {vehicleRecord.received_date && (
                      <View style={styles.infoRow}>
                        <View style={styles.infoLabelContainer}>
                          <IconSymbol name="calendar.badge.clock" size={16} color="#6B7280" />
                          <Text style={styles.infoLabel}>Received</Text>
                        </View>
                        <Text style={styles.infoValue}>
                          {new Date(vehicleRecord.received_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    )}
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <IconSymbol name="calendar.badge.plus" size={16} color="#6B7280" />
                        <Text style={styles.infoLabel}>Intake Created</Text>
                      </View>
                      <Text style={styles.infoValue}>
                        {new Date(vehicleRecord.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Battery Details Card */}
              {(ticket.customer_bringing === 'battery' || ticket.customer_bringing === 'both') && batteryRecords.length > 0 && (
                <View style={styles.ticketCard}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    <IconSymbol name="battery.100" size={18} color={BrandColors.title} /> Battery Details ({batteryRecords.length} {batteryRecords.length === 1 ? 'Battery' : 'Batteries'})
                  </ThemedText>
                  {batteryRecords.map((batteryRecord, index) => {
                    // Find corresponding battery case
                    const batteryCase = batteryCases.find(bc => bc.battery_record_id === batteryRecord.id);

                    return (
                      <View key={batteryRecord.id} style={[styles.infoCard, index > 0 && { marginTop: 12 }]}>
                        {batteryRecords.length > 1 && (
                          <Text style={styles.batteryCardHeader}>Battery {index + 1}</Text>
                        )}
                        <View style={styles.infoRow}>
                          <View style={styles.infoLabelContainer}>
                            <IconSymbol name="number" size={16} color="#6B7280" />
                            <Text style={styles.infoLabel}>Serial Number</Text>
                          </View>
                          <Text style={styles.infoValue}>{batteryRecord.serial_number}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <View style={styles.infoLabelContainer}>
                            <IconSymbol name="flag.fill" size={16} color={getStatusColor(batteryRecord.status)} />
                            <Text style={styles.infoLabel}>Intake Status</Text>
                          </View>
                          <Text style={[styles.infoValue, { color: getStatusColor(batteryRecord.status) }]}>
                            {batteryRecord.status.replace('_', ' ').toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <View style={styles.infoLabelContainer}>
                            <IconSymbol name="building.2" size={16} color="#6B7280" />
                            <Text style={styles.infoLabel}>Brand</Text>
                          </View>
                          <Text style={styles.infoValue}>{batteryRecord.brand}</Text>
                        </View>
                        {batteryRecord.model && (
                          <View style={styles.infoRow}>
                            <View style={styles.infoLabelContainer}>
                              <IconSymbol name="battery.50" size={16} color="#6B7280" />
                              <Text style={styles.infoLabel}>Model</Text>
                            </View>
                            <Text style={styles.infoValue}>{batteryRecord.model}</Text>
                          </View>
                        )}
                        <View style={styles.infoRow}>
                          <View style={styles.infoLabelContainer}>
                            <IconSymbol name="gear" size={16} color="#6B7280" />
                            <Text style={styles.infoLabel}>Battery Type</Text>
                          </View>
                          <Text style={styles.infoValue}>{batteryRecord.battery_type.toUpperCase()}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <View style={styles.infoLabelContainer}>
                            <IconSymbol name="bolt.circle" size={16} color="#F59E0B" />
                            <Text style={styles.infoLabel}>Voltage</Text>
                          </View>
                          <Text style={styles.infoValue}>{batteryRecord.voltage}V</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <View style={styles.infoLabelContainer}>
                            <IconSymbol name="bolt.fill" size={16} color="#10B981" />
                            <Text style={styles.infoLabel}>Capacity</Text>
                          </View>
                          <Text style={styles.infoValue}>{batteryRecord.capacity} Ah</Text>
                        </View>
                        {batteryRecord.cell_type && (
                          <View style={styles.infoRow}>
                            <View style={styles.infoLabelContainer}>
                              <IconSymbol name="circle.grid.3x3" size={16} color="#6B7280" />
                              <Text style={styles.infoLabel}>Cell Type</Text>
                            </View>
                            <Text style={styles.infoValue}>{batteryRecord.cell_type}</Text>
                          </View>
                        )}
                        {batteryRecord.repair_notes && (
                          <View style={styles.infoRow}>
                            <View style={styles.infoLabelContainer}>
                              <IconSymbol name="doc.text" size={16} color="#F59E0B" />
                              <Text style={styles.infoLabel}>Intake Condition</Text>
                            </View>
                            <Text style={styles.infoValue}>{batteryRecord.repair_notes}</Text>
                          </View>
                        )}
                        {batteryCase && batteryCase.initial_diagnosis && (
                          <View style={styles.infoRow}>
                            <View style={styles.infoLabelContainer}>
                              <IconSymbol name="stethoscope" size={16} color="#F59E0B" />
                              <Text style={styles.infoLabel}>Initial Diagnosis</Text>
                            </View>
                            <Text style={styles.infoValue}>{batteryCase.initial_diagnosis}</Text>
                          </View>
                        )}
                        {batteryCase && batteryCase.repair_type && (
                          <View style={styles.infoRow}>
                            <View style={styles.infoLabelContainer}>
                              <IconSymbol name="wrench.and.screwdriver" size={16} color="#10B981" />
                              <Text style={styles.infoLabel}>Repair Type</Text>
                            </View>
                            <Text style={styles.infoValue}>{batteryCase.repair_type}</Text>
                          </View>
                        )}
                        {batteryCase && (
                          <View style={styles.infoRow}>
                            <View style={styles.infoLabelContainer}>
                              <IconSymbol name="gear" size={16} color="#8B5CF6" />
                              <Text style={styles.infoLabel}>Service Status</Text>
                            </View>
                            <Text style={[styles.infoValue, { color: getStatusColor(batteryCase.status) }]}>
                              {batteryCase.status.replace('_', ' ').toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.infoRow}>
                          <View style={styles.infoLabelContainer}>
                            <IconSymbol name="calendar.badge.plus" size={16} color="#6B7280" />
                            <Text style={styles.infoLabel}>Intake Created</Text>
                          </View>
                          <Text style={styles.infoValue}>
                            {new Date(batteryRecord.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Description Card */}
              {ticket.description && (
                <View style={styles.ticketCard}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    <IconSymbol name="doc.text" size={18} color={BrandColors.title} /> Description
                  </ThemedText>
                  <View style={styles.infoCard}>
                    <Text style={styles.descriptionText}>{ticket.description || ticket.customer_complaint}</Text>
                  </View>
                </View>
              )}

              {/* Intake Media Card */}
              {attachments.length > 0 && (
                <View style={styles.ticketCard}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    <IconSymbol name="camera" size={18} color={BrandColors.title} /> Intake Media
                  </ThemedText>
                  <View style={styles.infoCard}>
                    <View style={styles.mediaStats}>
                      {attachments.filter(att => att.attachmentType === 'photo' || att.attachment_type === 'photo').length > 0 && (
                        <View style={styles.mediaStatItem}>
                          <IconSymbol name="photo" size={16} color="#6B7280" />
                          <Text style={styles.mediaStatText}>
                            {attachments.filter(att => att.attachmentType === 'photo' || att.attachment_type === 'photo').length} photos
                          </Text>
                        </View>
                      )}
                      {attachments.filter(att => att.attachmentType === 'audio' || att.attachment_type === 'audio').length > 0 && (
                        <View style={styles.mediaStatItem}>
                          <IconSymbol name="mic" size={16} color="#6B7280" />
                          <Text style={styles.mediaStatText}>
                            {attachments.filter(att => att.attachmentType === 'audio' || att.attachment_type === 'audio').length} audio files
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Media Grid */}
                    <View style={styles.mediaGrid}>
                      {attachments.map((attachment) => {
                        const isPhoto = attachment.attachmentType === 'photo' || attachment.attachment_type === 'photo';
                        const isAudio = attachment.attachmentType === 'audio' || attachment.attachment_type === 'audio';
                        const imageUrl = imageUrls[attachment.id];
                        const audioUrl = audioUrls[attachment.id];
                        const fileName = attachment.originalName || attachment.original_name || attachment.fileName || attachment.file_name;
                        const fileSize = attachment.fileSize || attachment.file_size;

                        return (
                          <TouchableOpacity
                            key={attachment.id}
                            style={styles.mediaItem}
                            onPress={() => {
                              if (isPhoto) {
                                handleImageClick(attachment.id);
                              } else if (isAudio) {
                                handleAudioClick(attachment.id);
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            {isPhoto ? (
                              <View style={styles.photoItem}>
                                {imageUrl ? (
                                  <View style={styles.imageContainer}>
                                    <Image
                                      source={{ uri: imageUrl }}
                                      style={styles.attachmentImage}
                                      resizeMode="cover"
                                    />
                                    <View style={styles.imageOverlay}>
                                      <IconSymbol name="eye.fill" size={16} color="#FFFFFF" />
                                    </View>
                                  </View>
                                ) : (
                                  <View style={styles.imagePlaceholder}>
                                    <IconSymbol name="photo.fill" size={24} color="#3B82F6" />
                                  </View>
                                )}
                                <Text style={styles.mediaFileName} numberOfLines={2}>
                                  {fileName}
                                </Text>
                                <Text style={styles.mediaFileSize}>
                                  {fileSize ? (fileSize / (1024 * 1024)).toFixed(1) + ' MB' : 'Image'}
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.audioItem}>
                                <View style={styles.audioIconContainer}>
                                  <IconSymbol name="waveform" size={24} color="#10B981" />
                                  <View style={styles.playIconOverlay}>
                                    <IconSymbol name="play.fill" size={12} color="#FFFFFF" />
                                  </View>
                                </View>
                                <Text style={styles.mediaFileName} numberOfLines={2}>
                                  {fileName}
                                </Text>
                                <Text style={styles.mediaFileSize}>
                                  {attachment.duration ? `${attachment.duration}s` : 'Audio'}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}


              {/* Assignment Info Card */}
              <View style={styles.ticketCard}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  <IconSymbol name="person.badge.clock" size={18} color={BrandColors.title} /> Assignment Details
                </ThemedText>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <IconSymbol name="flag.fill" size={16} color={getStatusColor(ticket.status)} />
                      <Text style={styles.infoLabel}>Status</Text>
                    </View>
                    <Text style={[styles.infoValue, { color: getStatusColor(ticket.status) }]}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <IconSymbol name={(ticket.assigned_to || ticket.assignedTo) ? "person.fill" : "person.badge.plus"} size={16} color={(ticket.assigned_to || ticket.assignedTo) ? "#10B981" : "#F59E0B"} />
                      <Text style={styles.infoLabel}>Assigned to</Text>
                    </View>
                    <Text style={[styles.infoValue, { color: (ticket.assigned_to || ticket.assignedTo) ? '#10B981' : '#F59E0B' }]}>
                      {getTechnicianName(ticket.assigned_to || ticket.assignedTo || '')}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <IconSymbol name="person.crop.circle" size={16} color="#6B7280" />
                      <Text style={styles.infoLabel}>Created By</Text>
                    </View>
                    <Text style={styles.infoValue}>
                      {getCreatorName(ticket)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <IconSymbol name="calendar.badge.plus" size={16} color="#6B7280" />
                      <Text style={styles.infoLabel}>Created At</Text>
                    </View>
                    <Text style={styles.infoValue}>
                      {(ticket.created_at || ticket.createdAt) ? new Date((ticket.created_at || ticket.createdAt)!).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) : 'N/A'}
                    </Text>
                  </View>
                  {(ticket.assigned_at || ticket.assignedAt) && (
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <IconSymbol name="calendar.badge.checkmark" size={16} color="#6B7280" />
                        <Text style={styles.infoLabel}>Assigned</Text>
                      </View>
                      <Text style={styles.infoValue}>
                        {new Date((ticket.assigned_at || ticket.assignedAt)!).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  {(ticket.due_date || ticket.dueDate) && (
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <IconSymbol name="clock" size={16} color={new Date((ticket.due_date || ticket.dueDate)!).getTime() < new Date().getTime() ? "#EF4444" : "#6B7280"} />
                        <Text style={styles.infoLabel}>Due Date</Text>
                      </View>
                      <Text style={[styles.infoValue, { color: new Date((ticket.due_date || ticket.dueDate)!).getTime() < new Date().getTime() ? '#EF4444' : '#111827' }]}>
                        {new Date((ticket.due_date || ticket.dueDate)!).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
                {/* Floor Manager Assign Button */}
                {(user?.role === 'floor_manager' || user?.role === 'admin') && (
                  <TouchableOpacity
                    style={styles.secondaryAssignButton}
                    onPress={() => router.push(`/jobcards/assign-technician?ticketId=${ticketId}`)}
                  >
                    <IconSymbol name="person.badge.plus" size={20} color={BrandColors.primary} />
                    <Text style={styles.secondaryAssignButtonText}>
                      {(ticket.assigned_to || ticket.assignedTo) ? 'Reassign Technician' : 'Assign Technician'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Status Actions Card */}
              {nextStatusOptions.length > 0 && (
                <View style={styles.ticketCard}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    <IconSymbol name="arrow.forward.circle" size={18} color={BrandColors.title} /> Status Actions
                  </ThemedText>
                  <View style={styles.statusActions}>
                    {nextStatusOptions.map((status) => {
                      const getStatusIcon = (status: string) => {
                        switch (status) {
                          case 'triaged': return 'magnifyingglass';
                          case 'in_progress': return 'hammer';
                          case 'completed': return 'checkmark.circle.fill';
                          default: return 'arrow.forward';
                        }
                      };

                      return (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusActionButton,
                            { backgroundColor: StatusColors[status as keyof typeof StatusColors]?.background || BrandColors.primary + '20' },
                          ]}
                          onPress={() => handleStatusUpdate(status)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.statusActionContent}>
                            <IconSymbol
                              name={getStatusIcon(status)}
                              size={20}
                              color={StatusColors[status as keyof typeof StatusColors]?.primary || BrandColors.primary}
                            />
                            <Text style={[styles.statusActionText, { color: StatusColors[status as keyof typeof StatusColors]?.primary || BrandColors.primary }]}>
                              Mark as {status.replace('_', ' ')}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Status Updates - Progress Timeline Card */}
              <View style={styles.ticketCard}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  <IconSymbol name="clock" size={18} color={BrandColors.title} /> Progress Updates
                </ThemedText>

                <View style={styles.statusUpdatesCard}>
                  {/* Add Update Button */}
                  <StatusUpdateInput
                    ticketId={ticketId}
                    currentStatus={ticket.status}
                    onUpdateAdded={() => {
                      refetchStatusUpdates();
                      refetch(); // Also refresh main ticket data
                    }}
                  />

                  {/* Updates Timeline */}
                  <StatusUpdatesTimeline
                    updates={statusUpdates}
                    currentStatus={ticket.status}
                    canDelete={false} // For now, don't allow deletion
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>



        {/* Image Viewer Modal */}
        <ImageViewerModal
          visible={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          images={attachments
            .filter(att => (att.attachmentType === 'photo' || att.attachment_type === 'photo') && imageUrls[att.id])
            .map(att => ({
              id: att.id,
              url: imageUrls[att.id],
              name: att.originalName || att.original_name || att.fileName || att.file_name || 'Image'
            }))}
          initialIndex={selectedImageIndex}
        />

        {/* Audio Player Modal */}
        <AudioPlayerModal
          visible={showAudioPlayer}
          onClose={() => setShowAudioPlayer(false)}
          audio={selectedAudio}
        />
      </ThemedView >
    </>
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
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginBottom: Spacing.base,
  },
  ticketCard: {
    ...ComponentStyles.card,
    padding: Spacing.lg,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  ticketHeaderLeft: {
    flex: 1,
    marginRight: Spacing.base,
  },
  ticketNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  ticketNumber: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginBottom: Spacing.sm,
  },
  ticketBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  priorityText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  secondaryAssignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: BrandColors.primary + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: BrandColors.primary + '20',
  },
  secondaryAssignButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.primary,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'capitalize',
  },
  symptom: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.title,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
    lineHeight: Typography.lineHeight.sm,
  },
  infoCard: {
    ...ComponentStyles.card,
    padding: Spacing.base,
    gap: Spacing.md,
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
  statusActions: {
    gap: Spacing.md,
  },
  statusActionButton: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statusActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusActionText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'capitalize',
  },
  statusUpdatesCard: {
    ...ComponentStyles.card,
    overflow: 'hidden',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.primary,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  retryButton: {
    ...ComponentStyles.button.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  retryText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.surface,
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
  modalSpacer: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  technicianOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  technicianOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  technicianAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  technicianInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  technicianDetails: {
    flex: 1,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  technicianEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    padding: Spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '60',
  },
  // Description styles
  descriptionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
    lineHeight: Typography.lineHeight.sm,
  },
  // Media styles
  mediaStats: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginBottom: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '20',
  },
  mediaStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  mediaStatText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '60',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  mediaItem: {
    width: '48%',
    minWidth: 120,
  },
  photoItem: {
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: BrandColors.primary + '10',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: BrandColors.primary + '30',
  },
  audioItem: {
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: BrandColors.title + '10',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: BrandColors.title + '30',
  },
  imageOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconOverlay: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#10B981',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaFileName: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  mediaFileSize: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginBottom: 6,
  },
  // Due Date Picker Styles
  assignmentSummary: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '700',
  },
  dueDateSection: {
    marginBottom: 24,
  },
  dueDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  dueDateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  quickDateOptions: {
    marginBottom: 20,
  },
  quickDateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quickDateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickDateButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickDateButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  assignButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  batteryCardHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 12,
    textAlign: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  complaintList: {
    gap: 12,
    marginBottom: Spacing.sm,
    marginTop: 8,
  },
  complaintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: BrandColors.primary,
  },
  symptomText: {
    flex: 1,
    fontSize: 16, // Increased from sm (14)
    fontWeight: '500',
    color: '#1F2937', // Darker for better contrast
    lineHeight: 24,
  },
  symptomTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  saveButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonDisabled: {
    backgroundColor: BrandColors.ink + '20',
  },
  saveButtonText: {
    color: BrandColors.surface,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  dueDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  dueDateBannerUrgent: {
    backgroundColor: Colors.error[50],
    borderColor: Colors.error[200],
  },
  dueDateBannerNormal: {
    backgroundColor: Colors.neutral[50],
    borderColor: Colors.neutral[200],
  },
  dueDateText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
  },
  dueDateTextUrgent: {
    color: Colors.error[700],
  },
  dueDateTextNormal: {
    color: Colors.neutral[700],
  },
});


