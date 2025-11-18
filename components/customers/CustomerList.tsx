import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Customer, CustomerListProps } from '@/types/customer';
import { BrandColors, Typography, Spacing, BorderRadius } from '@/constants/design-system';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatCustomerDisplay, formatCustomerAddress } from '@/lib/customerMapping';

interface CustomerListItemProps {
  customer: Customer;
  onPress: (customer: Customer) => void;
}

const CustomerListItem: React.FC<CustomerListItemProps> = ({ customer, onPress }) => {
  const { title, subtitle } = formatCustomerDisplay(customer);
  const address = formatCustomerAddress(customer);

  return (
    <TouchableOpacity 
      style={styles.listItem} 
      onPress={() => onPress(customer)}
      activeOpacity={0.7}
    >
      <View style={styles.customerIcon}>
        <IconSymbol name="person.fill" size={20} color={BrandColors.primary} />
      </View>
      
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{title}</Text>
        {subtitle && (
          <Text style={styles.customerSubtitle}>{subtitle}</Text>
        )}
        {address && (
          <Text style={styles.customerAddress} numberOfLines={1}>
            {address}
          </Text>
        )}
        {customer.gst_number && (
          <Text style={styles.gstNumber}>GST: {customer.gst_number}</Text>
        )}
      </View>
      
      <IconSymbol name="chevron.right" size={16} color={BrandColors.ink + '40'} />
    </TouchableOpacity>
  );
};

const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onCustomerSelect,
  loading = false,
  emptyMessage = 'No customers found',
}) => {
  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <CustomerListItem
      customer={item}
      onPress={onCustomerSelect}
    />
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
          <Text style={styles.loadingText}>Searching customers...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name="person.2" size={48} color={BrandColors.ink + '40'} />
        <Text style={styles.emptyTitle}>No Customers Found</Text>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  };

  const renderSeparator = () => <View style={styles.separator} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={customers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={renderSeparator}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          customers.length === 0 && styles.emptyListContent,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: BrandColors.surface,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.base,
    marginVertical: 2,
  },
  customerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  customerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  customerName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginBottom: 2,
  },
  customerSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.primary,
    marginBottom: 2,
  },
  customerAddress: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '60',
    marginBottom: 2,
  },
  gstNumber: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.title,
  },
  separator: {
    height: 1,
    backgroundColor: BrandColors.ink + '10',
    marginHorizontal: Spacing.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '80',
    marginTop: Spacing.base,
  },
  emptyContainer: {
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
  emptyMessage: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: BrandColors.ink + '60',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CustomerList;
