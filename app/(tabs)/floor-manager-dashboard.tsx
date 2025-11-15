import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { floorManagerService } from '@/services/floorManagerService';

interface QuickStatProps {
  title: string;
  value: number | string;
  color: string;
  backgroundColor: string;
  icon: string;
  onPress?: () => void;
}

const QuickStat: React.FC<QuickStatProps> = ({
  title,
  value,
  color,
  backgroundColor,
  icon,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.statCard, { borderLeftColor: color, backgroundColor }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.statContent}>
      <View style={styles.statHeader}>
        <IconSymbol name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  </TouchableOpacity>
);

interface TechnicianCardProps {
  technician: {
    id: string;
    name: string;
    email: string;
    activeTickets: number;
    capacity: number;
    oldestTicketDays?: number;
  };
  onPress: () => void;
}

const TechnicianCard: React.FC<TechnicianCardProps> = ({ technician, onPress }) => {
  const utilizationPercent = (technician.activeTickets / technician.capacity) * 100;
  const utilizationColor = 
    utilizationPercent >= 100 ? '#EF4444' : 
    utilizationPercent >= 75 ? '#F59E0B' : 
    '#10B981';

  return (
    <TouchableOpacity style={styles.technicianCard} onPress={onPress}>
      <View style={styles.technicianInfo}>
        <Text style={styles.technicianName}>{technician.name}</Text>
        <Text style={styles.technicianEmail}>{technician.email}</Text>
        <View style={styles.workloadInfo}>
          <Text style={styles.workloadText}>
            {technician.activeTickets}/{technician.capacity} Job Cards
          </Text>
          {technician.oldestTicketDays && technician.oldestTicketDays > 0 && (
            <Text style={styles.oldestTicket}>
              Oldest: {technician.oldestTicketDays} days
            </Text>
          )}
        </View>
      </View>
      <View style={styles.utilizationIndicator}>
        <View
          style={[
            styles.utilizationBar,
            {
              width: `${Math.min(utilizationPercent, 100)}%`,
              backgroundColor: utilizationColor,
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

export default function FloorManagerDashboard() {
  const { user } = useAuthStore();
  const { activeLocation } = useLocationStore();

  // Fetch dashboard stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['floor-manager-stats', user?.id, activeLocation?.id],
    queryFn: () => floorManagerService.getDashboardStats(user!.id, activeLocation?.id),
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch technician overview
  const {
    data: technicians,
    isLoading: techniciansLoading,
    refetch: refetchTechnicians,
  } = useQuery({
    queryKey: ['technicians-overview', activeLocation?.id],
    queryFn: () => floorManagerService.getTechnicianOverview(activeLocation?.id),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const refreshing = statsLoading || techniciansLoading;

  const handleRefresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchTechnicians(),
    ]);
  };

  const handleTechnicianPress = (technicianId: string) => {
    router.push(`/technician-details/${technicianId}`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.firstName 
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Floor Manager';

  if (statsError) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load dashboard</Text>
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
          <View style={styles.headerContent}>
            <ThemedText type="title" style={styles.greeting}>
              {getGreeting()}, {userName}!
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Floor Manager Dashboard
            </ThemedText>
            {activeLocation && (
              <ThemedText style={styles.location}>
                📍 {activeLocation.name}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Assignment Overview
          </ThemedText>
          <View style={styles.statsGrid}>
            <QuickStat
              title="Unassigned"
              value={stats?.unassignedTickets || 0}
              color="#EF4444"
              backgroundColor="#FEF2F2"
              icon="exclamationmark.triangle"
              onPress={() => router.push('/jobcards?filter=unassigned')}
            />
            <QuickStat
              title="In Progress"
              value={stats?.inProgressTickets || 0}
              color="#8B5CF6"
              backgroundColor="#F5F3FF"
              icon="gearshape.2"
              onPress={() => router.push('/jobcards?filter=in_progress')}
            />
            <QuickStat
              title="Due Today"
              value={stats?.dueToday || 0}
              color="#F59E0B"
              backgroundColor="#FFFBEB"
              icon="clock"
              onPress={() => router.push('/jobcards?filter=today')}
            />
            <QuickStat
              title="Overdue"
              value={stats?.overdue || 0}
              color="#DC2626"
              backgroundColor="#FEF2F2"
              icon="clock.badge.exclamationmark"
              onPress={() => router.push('/jobcards?filter=overdue')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/jobcards')}
            >
              <IconSymbol name="doc.text.magnifyingglass" size={32} color="#3B82F6" />
              <Text style={styles.actionTitle}>View Job Cards</Text>
              <Text style={styles.actionSubtitle}>Assign & manage tickets</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/create-technician')}
            >
              <IconSymbol name="person.badge.plus" size={32} color="#8B5CF6" />
              <Text style={styles.actionTitle}>Add Technician</Text>
              <Text style={styles.actionSubtitle}>Create new team member</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Technician Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Team Overview
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/team')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.techniciansContainer}>
            {technicians?.slice(0, 4).map((technician) => (
              <TechnicianCard
                key={technician.id}
                technician={technician}
                onPress={() => handleTechnicianPress(technician.id)}
              />
            ))}
            
            {!techniciansLoading && !technicians?.length && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No technicians found</Text>
              </View>
            )}
          </View>
        </View>
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
    paddingTop: 30,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statContent: {
    gap: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  techniciansContainer: {
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
  },
  technicianInfo: {
    marginBottom: 12,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  technicianEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  workloadInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workloadText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  oldestTicket: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  utilizationIndicator: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  utilizationBar: {
    height: '100%',
    borderRadius: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
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
});
