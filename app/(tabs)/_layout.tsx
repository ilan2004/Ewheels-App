import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { View, Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Logo } from '@/components/logo';
import { Colors as LegacyColors } from '@/constants/theme';
import { Colors, Typography, Spacing, ComponentStyles, BrandColors } from '@/constants/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { canAccessNavigation, isManagerLevel, isFloorManager, isFrontDeskManager } from '@/lib/permissions';

// Define common screen options to avoid repetition
// Uses BrandColors for app-wide chrome
const getCommonScreenOptions = (colorScheme: any, accentColor: string) => ({
  tabBarActiveTintColor: BrandColors.primary,
  tabBarInactiveTintColor: BrandColors.surface,
  headerShown: true,
  headerStyle: {
    ...ComponentStyles.header,
    height: 100,
    backgroundColor: BrandColors.surface,
  },
  headerTitleStyle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.lg,
    color: BrandColors.title,
  },
  headerTintColor: BrandColors.primary,
  headerLeft: () => (
    <View style={{ marginLeft: Spacing.base }}>
      <Logo width={100} height={32} />
    </View>
  ),
  tabBarStyle: {
    ...ComponentStyles.tabBar,
    borderTopWidth: 0,
    backgroundColor: BrandColors.shellDark,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 8,
  },
  tabBarLabelStyle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    marginTop: 2,
    marginBottom: Platform.OS === 'ios' ? 0 : 2,
  },
  tabBarIconStyle: {
    marginTop: Platform.OS === 'ios' ? 4 : 2,
  },
  tabBarButton: HapticTab,
});

// Define all screens that should never appear as tab buttons
const getAllHiddenScreens = () => [
  'index',
  'explore',
  'dashboard',
  'floor-manager-dashboard',
  'front-desk-dashboard',
  'jobcards',
  'notifications',
  'profile',
  'team',
  'technician',
  'technician-jobcards',
  'technician-profile',
  'camera', // Legacy - replaced by media-hub
  'media-library', // Legacy - replaced by media-hub
  'record-audio', // Legacy - replaced by media-hub
  'recording-player',
  'front-desk-profile',
  'media-hub', // Only shown for front desk managers
];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuthStore();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = user.role;
  const allScreens = getAllHiddenScreens();

  // TECHNICIAN: Simple 2-tab interface
  if (role === 'technician') {
    const visibleScreens = ['technician-jobcards', 'technician-profile'];
    const hiddenScreens = allScreens.filter(screen => !visibleScreens.includes(screen));

    return (
      <Tabs screenOptions={getCommonScreenOptions(colorScheme, Colors.success[600])}>
        <Tabs.Screen
          name="technician-jobcards"
          options={{
            title: 'My Work',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="doc.text.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="technician-profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="person.crop.circle.fill" color={color} />,
          }}
        />
        {hiddenScreens.map(screen => (
          <Tabs.Screen key={screen} name={screen} options={{ href: null }} />
        ))}
      </Tabs>
    );
  }

  // FLOOR MANAGER: Assignment-focused 4-tab interface
  if (role === 'floor_manager') {
    const visibleScreens = ['dashboard', 'jobcards', 'team', 'profile'];
    const hiddenScreens = allScreens.filter(screen => !visibleScreens.includes(screen));

    return (
      <Tabs screenOptions={getCommonScreenOptions(colorScheme, Colors.primary[600])}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="jobcards"
          options={{
            title: 'Job Cards',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="doc.text.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="team"
          options={{
            title: 'Team',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="person.3.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="person.crop.circle.fill" color={color} />,
          }}
        />
        {hiddenScreens.map(screen => (
          <Tabs.Screen key={screen} name={screen} options={{ href: null }} />
        ))}
      </Tabs>
    );
  }

  // FRONT DESK MANAGER: Media-focused 3-tab interface with unified Media Hub
  if (role === 'front_desk_manager' || role === 'manager') {
    const visibleScreens = ['front-desk-dashboard', 'media-hub', 'front-desk-profile'];
    const hiddenScreens = allScreens.filter(screen => !visibleScreens.includes(screen));

    return (
      <Tabs screenOptions={getCommonScreenOptions(colorScheme, Colors.primary[600])}>
        <Tabs.Screen
          name="front-desk-dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="media-hub"
          options={{
            title: 'Media',
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="camera.viewfinder" color={color} />,
          }}
        />
        <Tabs.Screen
          name="front-desk-profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="person.crop.circle.fill" color={color} />,
          }}
        />
        {hiddenScreens.map(screen => (
          <Tabs.Screen key={screen} name={screen} options={{ href: null }} />
        ))}
      </Tabs>
    );
  }

  // ADMIN: Full access with all management features
  if (role === 'admin') {
    const visibleScreens = ['dashboard', 'jobcards', 'team', 'notifications', 'profile'];
    const hiddenScreens = allScreens.filter(screen => !visibleScreens.includes(screen));

    return (
      <Tabs screenOptions={getCommonScreenOptions(colorScheme, Colors.error[600])}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="jobcards"
          options={{
            title: 'Job Cards',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="doc.text.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="team"
          options={{
            title: 'Team',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="person.3.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="bell.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="person.crop.circle.fill" color={color} />,
          }}
        />
        {hiddenScreens.map(screen => (
          <Tabs.Screen key={screen} name={screen} options={{ href: null }} />
        ))}
      </Tabs>
    );
  }

  // FALLBACK: Basic navigation for unknown roles
  return (
    <Tabs screenOptions={getCommonScreenOptions(colorScheme, Colors.neutral[600])}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="person.crop.circle.fill" color={color} />,
        }}
      />
      {allScreens.filter(s => !['dashboard', 'profile'].includes(s)).map(screen => (
        <Tabs.Screen key={screen} name={screen} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
