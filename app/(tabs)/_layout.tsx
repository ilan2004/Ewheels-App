import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Logo } from '@/components/logo';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandColors, Colors, ComponentStyles, Spacing, Typography } from '@/constants/design-system';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';

// Define common screen options to avoid repetition
// Uses BrandColors for app-wide chrome
const getCommonScreenOptions = (colorScheme: any, accentColor: string) => ({
  tabBarActiveTintColor: BrandColors.primary,
  tabBarInactiveTintColor: BrandColors.surface + '80', // 50% opacity for inactive
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
  'technician-vehicles',
  'technician-batteries',
  'camera', // Legacy - replaced by media-hub
  'media-library', // Legacy - replaced by media-hub
  'record-audio', // Legacy - replaced by media-hub
  'recording-player',
  'front-desk-profile',
  // 'media-hub' removed from hidden list - now available to both front desk and floor managers
  'invoices', // Only shown for front desk managers
  'financial', // Only shown for admin
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

  // TECHNICIAN: 5-tab interface with Vehicles, Batteries, and Media Hub
  if (role === 'technician') {
    const visibleScreens = ['technician-jobcards', 'technician-vehicles', 'media-hub', 'technician-batteries', 'technician-profile'];
    const hiddenScreens = allScreens.filter(screen => !visibleScreens.includes(screen));

    return (
      <Tabs screenOptions={getCommonScreenOptions(colorScheme, BrandColors.primary)}>
        <Tabs.Screen
          name="technician-jobcards"
          options={{
            title: 'My Work',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="doc.text.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="technician-vehicles"
          options={{
            title: 'Vehicles',
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="car.fill" color={color} />,
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
          name="technician-batteries"
          options={{
            title: 'Batteries',
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="battery.100" color={color} />,
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

  // FLOOR MANAGER: Assignment-focused 5-tab interface
  if (role === 'floor_manager') {
    const visibleScreens = ['dashboard', 'jobcards', 'team', 'media-hub', 'profile'];
    const hiddenScreens = allScreens.filter(screen => !visibleScreens.includes(screen));

    return (
      <Tabs screenOptions={getCommonScreenOptions(colorScheme, BrandColors.primary)}>
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
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="doc.text.fill" color={color} />,
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

  // FRONT DESK MANAGER: Media and billing-focused 4-tab interface
  if (role === 'front_desk_manager' || role === 'manager') {
    const visibleScreens = ['front-desk-dashboard', 'invoices', 'media-hub', 'front-desk-profile'];
    const hiddenScreens = allScreens.filter(screen => !visibleScreens.includes(screen));

    return (
      <Tabs screenOptions={getCommonScreenOptions(colorScheme, BrandColors.primary)}>
        <Tabs.Screen
          name="front-desk-dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="invoices"
          options={{
            title: 'Invoices',
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="doc.text" color={color} />,
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
    const visibleScreens = ['dashboard', 'jobcards', 'media-hub', 'financial', 'profile'];
    const hiddenScreens = allScreens.filter(screen => !visibleScreens.includes(screen));

    return (
      <Tabs screenOptions={getCommonScreenOptions(colorScheme, BrandColors.primary)}>
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
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="doc.text.fill" color={color} />,
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
          name="financial"
          options={{
            title: 'Finance',
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={22} name="dollarsign.circle.fill" color={color} />,
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
    <Tabs screenOptions={getCommonScreenOptions(colorScheme, BrandColors.primary)}>
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
