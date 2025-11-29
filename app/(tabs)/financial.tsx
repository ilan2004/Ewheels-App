import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  BorderRadius,
  BrandColors,
  Colors,
  Shadows,
  Spacing,
  Typography
} from '@/constants/design-system';
import { useFinancialData } from '@/hooks/useFinancial';
import React, { useState } from 'react';
import {
  Alert,
  LayoutChangeEvent,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

// Import components
import ExpensesManagement from '@/components/financial/ExpensesManagement';
import SalesManagement from '@/components/financial/SalesManagement';
import ReportsScreen from '@/src/screens/dashboard/finances/ReportsScreen';

type TabType = 'sales' | 'expenses' | 'reports';

const tabs: Array<{
  id: TabType;
  title: string;
  icon: any;
}> = [
    {
      id: 'reports',
      title: 'Reports',
      icon: 'doc.text.fill',
    },
    {
      id: 'sales',
      title: 'Sales',
      icon: 'arrow.up.circle.fill',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      icon: 'arrow.down.circle.fill',
    }
  ];

export default function FinancialTab() {
  const [activeTab, setActiveTab] = useState<TabType>('reports');
  const { refreshAll } = useFinancialData();

  // Animation values
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const translateX = useSharedValue(0);

  const handleRefresh = () => {
    try {
      refreshAll();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    }
  };

  const handleTabPress = (tabId: TabType, index: number) => {
    setActiveTab(tabId);
    const tabWidth = tabBarWidth / tabs.length;
    translateX.value = withSpring(index * tabWidth, {
      damping: 25,
      stiffness: 300,
      mass: 0.8,
    });
  };

  const onTabBarLayout = (event: LayoutChangeEvent) => {
    setTabBarWidth(event.nativeEvent.layout.width);
  };

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: tabBarWidth / tabs.length,
    };
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sales':
        return <SalesManagement />;
      case 'expenses':
        return <ExpensesManagement />;
      case 'reports':
        return <ReportsScreen />;
      default:
        return <ReportsScreen />;
    }
  };

  return (
    <View style={styles.container}>
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

      {/* Animated Segmented Tab Bar */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar} onLayout={onTabBarLayout}>
          {/* Animated Indicator */}
          {tabBarWidth > 0 && (
            <Animated.View style={[styles.activeIndicator, animatedIndicatorStyle]} />
          )}

          {/* Tab Items */}
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                onPress={() => handleTabPress(tab.id, index)}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <IconSymbol
                    size={18}
                    name={tab.icon}
                    color={isActive ? BrandColors.primary : Colors.neutral[500]}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      isActive && styles.activeTabText
                    ]}
                  >
                    {tab.title}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </View>
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
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Match Media Hub
    paddingBottom: Spacing.md,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    ...Shadows.sm,
    zIndex: 10,
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
  tabBarContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    zIndex: 5,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.lg,
    padding: 4,
    height: 48,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md - 2,
    ...Shadows.sm,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[500],
  },
  activeTabText: {
    color: BrandColors.primary,
    fontFamily: Typography.fontFamily.semibold,
  },
  content: {
    flex: 1,
  },
});
