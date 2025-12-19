import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  BorderRadius,
  BrandColors,
  Colors,
  Shadows,
  Spacing,
  Typography
} from '@/constants/design-system';
import { jobCardsService } from '@/services/jobCardsService';

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
  const activeTickets = technician.activeTickets || 0;

  // Workload calculation (similar to assign-technician)
  const workloadPercentage = Math.min((activeTickets / 8) * 100, 100);

  const getWorkloadColor = () => {
    if (workloadPercentage < 60) return Colors.success[500];
    if (workloadPercentage < 80) return Colors.warning[500];
    return Colors.error[500];
  };

  return (
    <TouchableOpacity
      style={styles.technicianCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.technicianAvatar}>
          <Text style={styles.technicianInitials}>
            {technician.first_name?.[0] || ''}{technician.last_name?.[0] || ''}
          </Text>
        </View>

        <View style={styles.technicianDetails}>
          <Text style={styles.technicianName}>{fullName || 'Unknown Technician'}</Text>
          <Text style={styles.technicianRole}>Technician</Text>

          <View style={styles.workloadContainer}>
            <View style={styles.workloadInfo}>
              <Text style={styles.workloadLabel}>Current Load</Text>
              <Text style={[styles.workloadValue, { color: getWorkloadColor() }]}>
                {activeTickets} / 8 tasks
              </Text>
            </View>
            <View style={styles.workloadBarBg}>
              <View
                style={[
                  styles.workloadBarFill,
                  {
                    width: `${workloadPercentage}%`,
                    backgroundColor: getWorkloadColor()
                  }
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <IconSymbol name="chevron.right" size={20} color={Colors.neutral[400]} />
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
      return data;
    },
    refetchInterval: 60000,
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const handleTechnicianPress = (technicianId: string) => {
    router.push(`/technician-details/${technicianId}`);
  };

  // Filter technicians based on search query and active filter
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'overloaded'>('all');

  const filteredTechnicians = technicians?.filter((technician) => {
    const fullName = `${technician.first_name} ${technician.last_name}`.toLowerCase();
    const email = technician.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || email.includes(query);

    if (!matchesSearch) return false;

    const activeTickets = technician.activeTickets || 0;
    if (activeFilter === 'available') return activeTickets < 6;
    if (activeFilter === 'overloaded') return activeTickets >= 8;

    return true;
  }) || [];

  // Calculate team stats
  const stats = {
    totalTechnicians: technicians?.length || 0,
    totalTasks: technicians?.reduce((sum, tech) => sum + (tech.activeTickets || 0), 0) || 0,
  };

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.neutral[50]} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={BrandColors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Team Management</Text>
          <Text style={styles.headerSubtitle}>Monitor performance and workload</Text>
        </View>

        {/* Team Stats - Premium Gradient Cards */}
        <View style={styles.statsSection}>
          <LinearGradient
            colors={[BrandColors.primary, '#FF9F89']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCardPrimary}
          >
            <View>
              <Text style={styles.statsCardLabelLight}>Total Staff</Text>
              <Text style={styles.statsCardValueLight}>{stats.totalTechnicians}</Text>
            </View>
            <IconSymbol name="person.3.fill" size={32} color="rgba(255,255,255,0.8)" />
          </LinearGradient>

          <View style={styles.statsRow}>
            <View style={styles.statsCardSmall}>
              <IconSymbol name="list.clipboard.fill" size={24} color={BrandColors.title} />
              <View>
                <Text style={styles.statsCardValue}>{stats.totalTasks}</Text>
                <Text style={styles.statsCardLabel}>Active Tasks</Text>
              </View>
            </View>

            {(user?.role === 'admin' || user?.role === 'floor_manager') && (
              <TouchableOpacity
                style={styles.statsCardSmall}
                onPress={() => router.push('/create-technician')}
                activeOpacity={0.7}
              >
                <IconSymbol name="person.badge.plus.fill" size={24} color={BrandColors.primary} />
                <View>
                  <Text style={[styles.statsCardValue, { color: BrandColors.primary }]}>+</Text>
                  <Text style={styles.statsCardLabel}>Add Technician</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* View Mode & Filter Controls */}
        <View style={styles.controlsSection}>
          {/* Admin Toggle */}
          {user?.role === 'admin' && (
            <View style={styles.viewModeToggle}>
              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
                onPress={() => setViewMode('list')}
              >
                <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>List</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'analytics' && styles.viewModeButtonActive]}
                onPress={() => setViewMode('analytics')}
              >
                <Text style={[styles.viewModeText, viewMode === 'analytics' && styles.viewModeTextActive]}>Analytics</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <IconSymbol name="magnifyingglass" size={20} color={Colors.neutral[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search team..."
              placeholderTextColor={Colors.neutral[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" size={16} color={Colors.neutral[400]} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'available' && styles.filterChipActive]}
              onPress={() => setActiveFilter('available')}
            >
              <View style={[styles.dot, { backgroundColor: Colors.success[500] }]} />
              <Text style={[styles.filterChipText, activeFilter === 'available' && styles.filterChipTextActive]}>Available</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'overloaded' && styles.filterChipActive]}
              onPress={() => setActiveFilter('overloaded')}
            >
              <View style={[styles.dot, { backgroundColor: Colors.error[500] }]} />
              <Text style={[styles.filterChipText, activeFilter === 'overloaded' && styles.filterChipTextActive]}>Busy</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Dynamic Content */}
        {viewMode === 'analytics' && user?.role === 'admin' ? (
          <View style={styles.analyticsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Monthly Performance</Text>
            </View>

            {/* Performance Metrics */}
            <View style={styles.performanceGrid}>
              <View style={styles.performanceCard}>
                <View style={styles.iconCircleSuccess}>
                  <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={Colors.success[600]} />
                </View>
                <Text style={styles.performanceValue}>94%</Text>
                <Text style={styles.performanceLabel}>Efficiency</Text>
              </View>
              <View style={styles.performanceCard}>
                <View style={styles.iconCircleWarning}>
                  <IconSymbol name="clock.fill" size={20} color={Colors.warning[600]} />
                </View>
                <Text style={styles.performanceValue}>4.2h</Text>
                <Text style={styles.performanceLabel}>Response</Text>
              </View>
              <View style={styles.performanceCard}>
                <View style={styles.iconCirclePrimary}>
                  <IconSymbol name="checkmark.seal.fill" size={20} color={BrandColors.primary} />
                </View>
                <Text style={styles.performanceValue}>87%</Text>
                <Text style={styles.performanceLabel}>Completion</Text>
              </View>
              <View style={styles.performanceCard}>
                <View style={styles.iconCircleInfo}>
                  <IconSymbol name="star.fill" size={20} color={Colors.info[600]} />
                </View>
                <Text style={styles.performanceValue}>4.8</Text>
                <Text style={styles.performanceLabel}>Rating</Text>
              </View>
            </View>

            {/* Top Performers */}
            <View style={styles.topPerformersSection}>
              <Text style={styles.subsectionTitle}>Top Performers</Text>
              <View style={styles.topPerformersList}>
                {filteredTechnicians.slice(0, 3).map((tech, index) => (
                  <View key={tech.id} style={styles.topPerformerItem}>
                    <View style={[styles.rankBadge, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }]}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.performerInfo}>
                      <Text style={styles.performerName}>{tech.first_name} {tech.last_name}</Text>
                      <Text style={styles.performerMetric}>{95 - index * 3}% efficiency score</Text>
                    </View>
                    <IconSymbol name="trophy.fill" size={20} color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.listSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {filteredTechnicians.length} Team Member{filteredTechnicians.length !== 1 ? 's' : ''}
              </Text>
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
            ) : (
              <View style={styles.emptyContainer}>
                <IconSymbol name="person.slash.fill" size={48} color={Colors.neutral[300]} />
                <Text style={styles.emptyTitle}>No technicians found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Try adjusting your search' : 'No team members added yet'}
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
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50], // Professional Light Gray
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl, // Space for status bar
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    marginTop: 4,
  },

  // Loading/Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.neutral[500],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.neutral[50],
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.error[500],
    marginTop: Spacing.md,
  },
  errorSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.semibold,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statsCardPrimary: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statsCardSmall: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base, // 16px
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  statsCardLabelLight: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  statsCardValueLight: {
    color: Colors.white,
    fontSize: 32,
    fontFamily: Typography.fontFamily.bold,
  },
  statsCardLabel: {
    color: Colors.neutral[500],
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  statsCardValue: {
    color: BrandColors.ink,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
  },

  // Controls
  controlsSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.md,
    padding: 2,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  viewModeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  viewModeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  viewModeTextActive: {
    color: BrandColors.ink,
    fontFamily: Typography.fontFamily.semibold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 44,
    ...Shadows.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: BrandColors.ink,
    height: '100%',
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filtersContent: {
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Lists & Analytics
  listSection: {
    paddingHorizontal: Spacing.lg,
  },
  analyticsSection: {
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  techniciansList: {
    gap: Spacing.md,
  },
  technicianCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  technicianAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary[50], // Soft blue bg
    justifyContent: 'center',
    alignItems: 'center',
  },
  technicianInitials: {
    color: Colors.primary[600],
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },
  technicianDetails: {
    flex: 1,
  },
  technicianName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
  },
  technicianRole: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[400],
    marginBottom: Spacing.xs,
  },
  workloadContainer: {
    gap: 4,
  },
  workloadInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workloadLabel: {
    fontSize: 10,
    color: Colors.neutral[400],
  },
  workloadValue: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
  },
  workloadBarBg: {
    height: 4,
    backgroundColor: Colors.neutral[100],
    borderRadius: 2,
    overflow: 'hidden',
  },
  workloadBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  arrowContainer: {
    justifyContent: 'center',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    marginTop: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
    marginTop: 4,
  },

  // Analytics Cards
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
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  iconCircleSuccess: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconCircleWarning: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warning[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconCirclePrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconCircleInfo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.info[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.ink,
  },
  performanceLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[500],
  },
  topPerformersSection: {
    marginTop: Spacing.md,
  },
  subsectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.title,
    marginBottom: Spacing.md,
  },
  topPerformersList: {
    gap: Spacing.sm,
  },
  topPerformerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    color: Colors.neutral[500],
  },
});
