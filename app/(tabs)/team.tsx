import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { jobCardsService } from '@/services/jobCardsService';
import { HeroImageCard, ImageCard } from '@/components/image-card';
import { 
  BrandColors,
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ComponentStyles
} from '@/constants/design-system';

interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  activeTickets?: number;
}

interface TechnicianCardProps {
  technician: Technician;
  onPress: () => void;
}

const TechnicianCard: React.FC<TechnicianCardProps> = ({ technician, onPress }) => {
  const fullName = `${technician.first_name} ${technician.last_name}`.trim();
  const initials = `${technician.first_name?.[0] || ''}${technician.last_name?.[0] || ''}`.toUpperCase();
  const activeTickets = technician.activeTickets || 0;
  
  return (
    <TouchableOpacity style={styles.technicianCard} onPress={onPress}>
      <View style={styles.technicianHeader}>
        <View style={styles.technicianInfo}>
          <ImageCard
            source={require('@/assets/images/custom/technician-profile.png')}
            size="sm"
            style={styles.technicianAvatar}
          />
          <View style={styles.technicianDetails}>
            <Text style={styles.technicianName}>{fullName || 'Unknown Technician'}</Text>
            <Text style={styles.technicianEmail}>{technician.email || 'No email'}</Text>
          </View>
        </View>
        <View style={styles.technicianStats}>
          <Text style={styles.activeTasksCount}>
            {activeTickets}
          </Text>
          <Text style={styles.activeTasksLabel}>
            Active Tasks
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function TeamScreen() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  
  // Fetch technicians list
  const {
    data: technicians,
    isLoading,
    error,
    refetch,
  } = useQuery<Technician[]>({
    queryKey: ['technicians-list'],
    queryFn: async () => {
      const data = await jobCardsService.getTechnicians();
      // Add active tickets count (mock for now)
      return data.map((tech, index) => ({
        ...tech,
        activeTickets: [3, 6, 2, 8, 4, 1][index % 6] || 0,
      }));
    },
    refetchInterval: 60000,
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const handleTechnicianPress = (technicianId: string) => {
    router.push(`/technician-details/${technicianId}`);
  };

  // Filter technicians based on search query
  const filteredTechnicians = technicians?.filter((technician) => {
    const fullName = `${technician.first_name} ${technician.last_name}`.toLowerCase();
    const email = technician.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  }) || [];

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        <Text style={styles.loadingText}>Loading team data...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={Colors.error[500]} />
        <Text style={styles.errorText}>Failed to load team data</Text>
        <Text style={styles.errorSubtext}>Please check your connection and try again</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate team stats
  const stats = {
    totalTechnicians: technicians?.length || 0,
    totalTasks: technicians?.reduce((sum, tech) => sum + (tech.activeTickets || 0), 0) || 0,
    available: technicians?.filter(tech => (tech.activeTickets || 0) < 6).length || 0,
    overloaded: technicians?.filter(tech => (tech.activeTickets || 0) >= 8).length || 0,
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >

        {/* Team Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalTechnicians}</Text>
              <Text style={styles.statLabel}>Technicians</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalTasks}</Text>
              <Text style={styles.statLabel}>Active Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: stats.available > 0 ? Colors.success[500] : Colors.error[500] }]}>
                {stats.available}
              </Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: stats.overloaded > 0 ? Colors.error[500] : Colors.success[500] }]}>
                {stats.overloaded}
              </Text>
              <Text style={styles.statLabel}>Overloaded</Text>
            </View>
          </View>
        </View>

        {/* Admin View Mode Toggle */}
        {user?.role === 'admin' && (
          <View style={styles.viewModeSection}>
            <View style={styles.viewModeToggle}>
              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
                onPress={() => setViewMode('list')}
              >
                <IconSymbol name="list.bullet" size={16} color={viewMode === 'list' ? Colors.white : Colors.neutral[600]} />
                <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>Team List</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'analytics' && styles.viewModeButtonActive]}
                onPress={() => setViewMode('analytics')}
              >
                <IconSymbol name="chart.bar" size={16} color={viewMode === 'analytics' ? Colors.white : Colors.neutral[600]} />
                <Text style={[styles.viewModeText, viewMode === 'analytics' && styles.viewModeTextActive]}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Search and Filter Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <IconSymbol name="magnifyingglass" size={20} color={Colors.neutral[500]} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search technicians..."
                placeholderTextColor={Colors.neutral[400]}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={Colors.neutral[400]} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <IconSymbol name="line.3.horizontal.decrease.circle" size={24} color={Colors.neutral[600]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content based on view mode */}
        {viewMode === 'analytics' && user?.role === 'admin' ? (
          <View style={styles.analyticsSection}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Performance Analytics
              </ThemedText>
            </View>
            
            {/* Performance Metrics */}
            <View style={styles.performanceGrid}>
              <View style={styles.performanceCard}>
                <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={Colors.success[600]} />
                <Text style={styles.performanceValue}>94%</Text>
                <Text style={styles.performanceLabel}>Average Efficiency</Text>
              </View>
              <View style={styles.performanceCard}>
                <IconSymbol name="clock" size={24} color={Colors.warning[600]} />
                <Text style={styles.performanceValue}>4.2h</Text>
                <Text style={styles.performanceLabel}>Avg Response Time</Text>
              </View>
              <View style={styles.performanceCard}>
                <IconSymbol name="checkmark.seal" size={24} color={Colors.primary[600]} />
                <Text style={styles.performanceValue}>87%</Text>
                <Text style={styles.performanceLabel}>Completion Rate</Text>
              </View>
              <View style={styles.performanceCard}>
                <IconSymbol name="star.fill" size={24} color={Colors.info[600]} />
                <Text style={styles.performanceValue}>4.8</Text>
                <Text style={styles.performanceLabel}>Avg Rating</Text>
              </View>
            </View>

            {/* Top Performers */}
            <View style={styles.topPerformersSection}>
              <Text style={styles.subsectionTitle}>Top Performers This Month</Text>
              <View style={styles.topPerformersList}>
                {filteredTechnicians.slice(0, 3).map((tech, index) => (
                  <View key={tech.id} style={styles.topPerformerItem}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.performerInfo}>
                      <Text style={styles.performerName}>{tech.first_name} {tech.last_name}</Text>
                      <Text style={styles.performerMetric}>{95 - index * 3}% efficiency</Text>
                    </View>
                    <IconSymbol name="trophy.fill" size={16} color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.listSection}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Team Members ({filteredTechnicians.length})
              </ThemedText>
              {user?.role === 'admin' && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push('/create-technician')}
                >
                  <IconSymbol name="plus.circle.fill" size={20} color={Colors.white} />
                  <Text style={styles.createButtonText}>Add Technician</Text>
                </TouchableOpacity>
              )}
            </View>

          {filteredTechnicians.length > 0 ? (
            <View style={styles.techniciansList}>
              {filteredTechnicians.map((technician) => (
                <TechnicianCard
                  key={technician.id}
                  technician={technician}
                  onPress={() => handleTechnicianPress(technician.id)}
                />
              ))}
            </View>
          ) : searchQuery ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="magnifyingglass" size={64} color={Colors.neutral[400]} />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search criteria
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <IconSymbol name="person.3" size={64} color={Colors.neutral[400]} />
              <Text style={styles.emptyTitle}>No technicians found</Text>
              <Text style={styles.emptySubtitle}>
                No team members are currently available
              </Text>
            </View>
          )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.neutral[500],
  },
  
  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.neutral[50],
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.error[500],
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryButton: {
    ...ComponentStyles.button.primary,
  },
  retryText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold as any,
    fontSize: Typography.fontSize.base,
  },
  
  
  // Stats section
  statsSection: {
    padding: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.base,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xl2,
    fontWeight: Typography.fontWeight.bold as any,
    color: BrandColors.ink,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[500],
    marginTop: Spacing.xs,
  },
  
  // Search section
  searchSection: {
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    ...Shadows.base,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: BrandColors.ink,
  },
  filterButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.base,
  },
  
  // List section
  listSection: {
    padding: Spacing.lg,
    paddingTop: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: BrandColors.ink,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    ...ComponentStyles.button.primary,
    gap: Spacing.sm,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
  },
  
  // Technicians list
  techniciansList: {
    gap: Spacing.md,
  },
  technicianCard: {
    ...ComponentStyles.card,
  },
  technicianHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  technicianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  technicianAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  technicianInitials: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold as any,
  },
  technicianDetails: {
    flex: 1,
  },
  technicianName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: BrandColors.ink,
  },
  technicianEmail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[500],
    marginTop: Spacing.xs,
  },
  technicianStats: {
    alignItems: 'flex-end',
  },
  activeTasksCount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: BrandColors.primary,
    marginBottom: Spacing.xs,
  },
  activeTasksLabel: {
    fontSize: 11,
    color: Colors.neutral[500],
    fontWeight: Typography.fontWeight.medium as any,
  },
  
  // View Mode Toggle
  viewModeSection: {
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  viewModeButtonActive: {
    backgroundColor: BrandColors.primary,
    ...Shadows.sm,
  },
  viewModeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  viewModeTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },
  
  // Analytics Section
  analyticsSection: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  performanceCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.base,
  },
  performanceValue: {
    fontSize: Typography.fontSize.xl2,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.ink,
  },
  performanceLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  topPerformersSection: {
    marginTop: Spacing.lg,
  },
  subsectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginBottom: Spacing.base,
  },
  topPerformersList: {
    gap: Spacing.sm,
  },
  topPerformerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
  },
  performerMetric: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.success[600],
    marginTop: Spacing.xs,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: BrandColors.ink,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
});
