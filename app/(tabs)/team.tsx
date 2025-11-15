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

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { jobCardsService } from '@/services/jobCardsService';
import { HeroImageCard, ImageCard } from '@/components/image-card';
import { Colors, Typography, Spacing, ComponentStyles } from '@/constants/design-system';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
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
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading team data...</Text>
      </ThemedView>
    );
  }

  // Error state
  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load team data</Text>
        <Text style={styles.errorSubtext}>Please check your connection and try again</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </ThemedView>
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
    <ThemedView style={styles.container}>
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
              <Text style={[styles.statValue, { color: stats.available > 0 ? '#10B981' : '#EF4444' }]}>
                {stats.available}
              </Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: stats.overloaded > 0 ? '#EF4444' : '#10B981' }]}>
                {stats.overloaded}
              </Text>
              <Text style={styles.statLabel}>Overloaded</Text>
            </View>
          </View>
        </View>

        {/* Search and Filter Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <IconSymbol name="magnifyingglass" size={20} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search technicians..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <IconSymbol name="xmark.circle.fill" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <IconSymbol name="line.3.horizontal.decrease.circle" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Technicians List */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Team Members ({filteredTechnicians.length})
            </ThemedText>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/create-technician')}
            >
              <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Add Technician</Text>
            </TouchableOpacity>
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
              <IconSymbol name="magnifyingglass" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search criteria
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <IconSymbol name="person.3" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No technicians found</Text>
              <Text style={styles.emptySubtitle}>
                No team members are currently available
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  
  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  
  
  // Stats section
  statsSection: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  
  // Search section
  searchSection: {
    padding: 20,
    paddingBottom: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  
  // List section
  listSection: {
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
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Technicians list
  techniciansList: {
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
  technicianHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  technicianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  technicianAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  technicianInitials: {
    color: '#FFFFFF',
    fontSize: 16,
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
  technicianStats: {
    alignItems: 'flex-end',
  },
  activeTasksCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 2,
  },
  activeTasksLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
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
