import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { BrandColors } from '@/constants/design-system';
import { CustomerService } from '@/services/customerService';
import { Customer, CustomerPickerModalProps, CustomerSearchItem } from '@/types/customer';

// Helper function to create customer search items
const createCustomerSearchItem = (customer: Customer): CustomerSearchItem => {
  const subtitleParts = [
    customer.phone,
    customer.contact,
    customer.email,
  ].filter(Boolean);

  return {
    ...customer,
    subtitle: subtitleParts.join(' • ') || 'No contact info',
  };
};

export const CustomerPickerModal: React.FC<CustomerPickerModalProps> = ({
  visible,
  onClose,
  onCustomerSelected,
  onAddNewCustomer,
  locationId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search customers
  const searchCustomers = useCallback(async (query: string = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await CustomerService.searchCustomers({
        query: query.trim(),
        location_id: locationId,
        limit: 50,
      });

      setCustomers(response.customers);
    } catch (err) {
      setError('Failed to search customers');
      console.error('Customer search error:', err);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  // Initial load and search when query changes
  useEffect(() => {
    if (visible) {
      searchCustomers(debouncedQuery);
    }
  }, [visible, debouncedQuery, searchCustomers]);

  // Refresh customers
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await searchCustomers(searchQuery);
    setRefreshing(false);
  }, [searchCustomers, searchQuery]);

  // Convert customers to search items
  const searchItems = useMemo(() => {
    return customers.map(createCustomerSearchItem);
  }, [customers]);

  // Handle customer selection
  const handleCustomerSelect = useCallback((customer: Customer) => {
    onCustomerSelected(customer);
    setSearchQuery('');
  }, [onCustomerSelected]);

  // Handle add new customer
  const handleAddNewCustomer = useCallback(() => {
    onAddNewCustomer();
  }, [onAddNewCustomer]);

  // Handle modal close
  const handleClose = useCallback(() => {
    setSearchQuery('');
    setError(null);
    onClose();
  }, [onClose]);

  // Render customer item
  const renderCustomerItem = useCallback(({ item }: { item: CustomerSearchItem }) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() => handleCustomerSelect(item as any)}
      activeOpacity={0.7}
    >
      <View style={styles.customerIcon}>
        <Ionicons name="person" size={20} color={BrandColors.primary} />
      </View>

      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.customerSubtitle}>{item.subtitle}</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={BrandColors.ink + '40'}
      />
    </TouchableOpacity>
  ), [handleCustomerSelect]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
          <Text style={styles.emptyStateText}>Searching...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="alert-circle" size={48} color={BrandColors.primary + '60'} />
          <Text style={styles.emptyStateText}>Failed to load customers</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => searchCustomers(searchQuery)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="people" size={48} color={BrandColors.ink + '40'} />
        <Text style={styles.emptyStateText}>
          {searchQuery.trim() ? 'No customers found' : 'Start typing to search customers'}
        </Text>
        <Text style={styles.emptyStateSubtext}>
          {searchQuery.trim()
            ? 'Try a different search term or add a new customer'
            : 'Search by name, phone, or email'
          }
        </Text>
      </View>
    );
  }, [loading, error, searchQuery, searchCustomers]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Customer</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={BrandColors.ink} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color={BrandColors.ink + '60'}
              style={styles.searchInputIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search customer by name, phone, or email"
              placeholderTextColor={BrandColors.ink + '60'}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
              autoCorrect={false}
              autoCapitalize="words"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={BrandColors.ink + '60'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Customer List */}
        <View style={styles.listContainer}>
          {searchItems.length > 0 ? (
            <FlatList
              data={searchItems}
              keyExtractor={(item) => item.id}
              renderItem={renderCustomerItem}
              showsVerticalScrollIndicator={true}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[BrandColors.primary]}
                  tintColor={BrandColors.primary}
                />
              }
              contentContainerStyle={styles.listContentContainer}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />
          ) : (
            renderEmptyState()
          )}
        </View>

        {/* Add New Customer Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addNewButton}
            onPress={handleAddNewCustomer}
            activeOpacity={0.8}
          >
            <Ionicons
              name="add-circle"
              size={24}
              color={BrandColors.surface}
              style={styles.addNewIcon}
            />
            <Text style={styles.addNewButtonText}>Add new customer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.title,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.ink + '08',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  searchInputIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: BrandColors.ink,
    paddingVertical: 12,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  listContainer: {
    flex: 1,
  },
  listContentContainer: {
    paddingVertical: 8,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BrandColors.surface,
  },
  customerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
    marginRight: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.ink,
    marginBottom: 2,
  },
  customerSubtitle: {
    fontSize: 14,
    color: BrandColors.ink + '80',
  },
  itemSeparator: {
    height: 1,
    backgroundColor: BrandColors.ink + '08',
    marginLeft: 68,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: BrandColors.ink + '80',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: BrandColors.ink + '60',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: BrandColors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.surface,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: BrandColors.ink + '10',
    backgroundColor: BrandColors.surface,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 56,
  },
  addNewIcon: {
    marginRight: 12,
  },
  addNewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.surface,
  },
});

export default CustomerPickerModal;
