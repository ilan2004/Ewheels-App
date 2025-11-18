import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { InvoiceCard } from '@/components/invoices/InvoiceCard';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { InvoiceService } from '@/services/invoiceService';
import { Invoice, InvoiceStatus, InvoiceFilters } from '@/types/invoice';
import { BrandColors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/design-system';

interface FilterTabProps {
  label: string;
  count?: number;
  isActive: boolean;
  onPress: () => void;
}

const FilterTab: React.FC<FilterTabProps> = ({ label, count, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.filterTab, isActive && styles.activeFilterTab]}
    onPress={onPress}
  >
    <Text style={[styles.filterTabText, isActive && styles.activeFilterTabText]}>
      {label}
    </Text>
    {count !== undefined && (
      <View style={[styles.countBadge, isActive && styles.activeCountBadge]}>
        <Text style={[styles.countText, isActive && styles.activeCountText]}>
          {count}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);


export default function InvoicesScreen() {
  const { user } = useAuthStore();
  const { activeLocation } = useLocationStore();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  // Fetch invoices
  const {
    data: invoicesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['invoices', activeLocation?.id, statusFilter, searchQuery],
    queryFn: () => {
      const filters: InvoiceFilters = {
        location_id: activeLocation?.id,
      };
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      if (searchQuery.trim()) {
        filters.customer_name = searchQuery.trim();
      }

      return InvoiceService.getInvoices(filters, 1, 50);
    },
    enabled: !!user,
  });

  // Fetch invoice stats
  const { data: stats } = useQuery({
    queryKey: ['invoice-stats', activeLocation?.id],
    queryFn: () => InvoiceService.getInvoiceStats(activeLocation?.id),
    enabled: !!user,
  });

  // Update invoice status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) =>
      InvoiceService.updateInvoiceStatus(invoiceId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update invoice status');
      console.error('Error updating invoice status:', error);
    },
  });

  const invoices = invoicesResponse?.invoices || [];

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      if (searchQuery.trim()) {
        return invoice.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               invoice.number.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [invoices, searchQuery]);

  const handleInvoicePress = (invoice: Invoice) => {
    router.push(`/invoices/${invoice.id}`);
  };

  const handleStatusPress = (invoice: Invoice) => {
    const statusOptions = [
      { label: 'Mark as Draft', value: 'draft' as InvoiceStatus },
      { label: 'Mark as Sent', value: 'sent' as InvoiceStatus },
      { label: 'Mark as Paid', value: 'paid' as InvoiceStatus },
      { label: 'Mark as Void', value: 'void' as InvoiceStatus },
    ].filter(option => option.value !== invoice.status);

    const buttons = statusOptions.map(option => ({
      text: option.label,
      onPress: () => updateStatusMutation.mutate({
        invoiceId: invoice.id,
        status: option.value,
      }),
    }));

    Alert.alert(
      'Update Invoice Status',
      `Current status: ${invoice.status.replace('_', ' ')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...buttons,
      ]
    );
  };

  const handleCreateInvoice = () => {
    router.push('/invoices/create');
  };

  const renderInvoiceItem = ({ item }: { item: Invoice }) => (
    <InvoiceCard
      invoice={item}
      onPress={handleInvoicePress}
      onStatusPress={handleStatusPress}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <IconSymbol name="doc.text" size={48} color={BrandColors.ink + '40'} />
      <Text style={styles.emptyTitle}>No Invoices Found</Text>
      <Text style={styles.emptyText}>
        {statusFilter === 'all' 
          ? 'Create your first invoice to get started'
          : `No ${statusFilter} invoices found`
        }
      </Text>
      {statusFilter === 'all' && (
        <TouchableOpacity style={styles.createFirstButton} onPress={handleCreateInvoice}>
          <Text style={styles.createFirstButtonText}>Create Invoice</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorState}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error Loading Invoices</Text>
          <Text style={styles.errorText}>Please try again</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Invoices</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateInvoice}>
          <IconSymbol name="plus" size={20} color={BrandColors.surface} />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>


      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={16} color={BrandColors.ink + '60'} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoices..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={BrandColors.ink + '60'}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'all', label: 'All', count: stats?.total },
            { key: 'draft', label: 'Draft', count: stats?.draft },
            { key: 'sent', label: 'Sent', count: stats?.sent },
            { key: 'paid', label: 'Paid', count: stats?.paid },
            { key: 'void', label: 'Void', count: stats?.void },
          ]}
          renderItem={({ item }) => (
            <FilterTab
              label={item.label}
              count={item.count}
              isActive={statusFilter === item.key}
              onPress={() => setStatusFilter(item.key as InvoiceStatus | 'all')}
            />
          )}
          contentContainerStyle={styles.filterTabs}
        />
      </View>

      {/* Invoices List */}
      <FlatList
        data={filteredInvoices}
        renderItem={renderInvoiceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={isLoading ? null : renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={BrandColors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  createButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.surface,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.surface,
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink,
  },
  filterSection: {
    paddingBottom: Spacing.base,
  },
  filterTabs: {
    paddingHorizontal: Spacing.lg,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.surface,
    borderWidth: 1,
    borderColor: BrandColors.ink + '20',
    gap: Spacing.xs,
  },
  activeFilterTab: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  filterTabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '80',
  },
  activeFilterTabText: {
    color: BrandColors.surface,
  },
  countBadge: {
    backgroundColor: BrandColors.ink + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeCountBadge: {
    backgroundColor: BrandColors.surface + '40',
  },
  countText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
  },
  activeCountText: {
    color: BrandColors.surface,
  },
  listContainer: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BrandColors.surface + '80',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginTop: Spacing.base,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '60',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  createFirstButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  createFirstButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.surface,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  errorTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: '#EF4444',
    marginTop: Spacing.base,
    marginBottom: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '60',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  retryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.surface,
  },
});
