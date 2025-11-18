import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFinancialData } from '@/hooks/useFinancial';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  BrandColors,
  FinancialColors,
} from '@/constants/design-system';

// Import components (these will be created next)
import FinancialOverview from '@/components/financial/FinancialOverview';
import SalesManagement from '@/components/financial/SalesManagement';
import ExpensesManagement from '@/components/financial/ExpensesManagement';

type TabType = 'overview' | 'sales' | 'expenses';

const tabs: Array<{
  id: TabType;
  title: string;
  icon: any;
  description: string;
}> = [
  {
    id: 'overview',
    title: 'Overview',
    icon: 'chart.bar.fill',
    description: 'Financial KPIs and insights'
  },
  {
    id: 'sales',
    title: 'Sales',
    icon: 'arrow.up.circle.fill',
    description: 'Manage sales and revenue'
  },
  {
    id: 'expenses',
    title: 'Expenses',
    icon: 'arrow.down.circle.fill',
    description: 'Track expenses and costs'
  }
];

export default function FinancialTab() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { refreshAll } = useFinancialData();

  const handleRefresh = () => {
    try {
      refreshAll();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <FinancialOverview onRefresh={handleRefresh} />;
      case 'sales':
        return <SalesManagement />;
      case 'expenses':
        return <ExpensesManagement />;
      default:
        return <FinancialOverview onRefresh={handleRefresh} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={BrandColors.surface} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Financial Management</Text>
          <Text style={styles.headerSubtitle}>Track sales, expenses, and profitability</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          accessibilityLabel="Refresh financial data"
        >
          <IconSymbol size={20} name="arrow.clockwise" color={BrandColors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.id)}
              accessibilityLabel={`Switch to ${tab.title} tab`}
              accessibilityState={{ selected: activeTab === tab.id }}
            >
              <IconSymbol
                size={20}
                name={tab.icon}
                color={activeTab === tab.id ? BrandColors.primary : BrandColors.ink}
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: BrandColors.title,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[600],
  },
  refreshButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.base,
    backgroundColor: BrandColors.primary + '15',
  },
  tabContainer: {
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  tabScrollContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#ebe8df',
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'transparent',
    minWidth: 100,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    ...Shadows.sm,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: BrandColors.ink,
    marginLeft: Spacing.xs,
  },
  activeTabText: {
    color: BrandColors.primary,
  },
  content: {
    flex: 1,
  },
});
