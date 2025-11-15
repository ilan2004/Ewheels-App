import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography, Spacing } from '@/constants/design-system';
import { useAuthStore } from '@/stores/authStore';

export default function FrontDeskDashboard() {
  const { user } = useAuthStore();

  // Mock data for dashboard stats
  const stats = [
    {
      title: 'New Tickets',
      value: '12',
      icon: 'doc.text.fill',
      color: Colors.primary[600],
      bgColor: Colors.primary[50],
    },
    {
      title: 'In Progress',
      value: '8',
      icon: 'clock.fill',
      color: Colors.warning[600],
      bgColor: Colors.warning[50],
    },
    {
      title: 'Completed Today',
      value: '15',
      icon: 'checkmark.circle.fill',
      color: Colors.success[600],
      bgColor: Colors.success[50],
    },
    {
      title: 'Media Files',
      value: '23',
      icon: 'photo.fill',
      color: Colors.info[600],
      bgColor: Colors.info[50],
    },
  ];

  const quickActions = [
    {
      title: 'Create Ticket',
      icon: 'plus.circle.fill',
      color: Colors.primary[600],
      onPress: () => {
        // Navigate to create ticket
        console.log('Create ticket');
      },
    },
    {
      title: 'Capture Photo',
      icon: 'camera.fill',
      color: Colors.success[600],
      onPress: () => {
        // Navigate to camera
        console.log('Capture photo');
      },
    },
    {
      title: 'View Reports',
      icon: 'chart.bar.fill',
      color: Colors.info[600],
      onPress: () => {
        // Navigate to reports
        console.log('View reports');
      },
    },
    {
      title: 'Customer List',
      icon: 'person.3.fill',
      color: Colors.warning[600],
      onPress: () => {
        // Navigate to customers
        console.log('Customer list');
      },
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>
          {user?.firstName || 'Front Desk Manager'}
        </Text>
        <Text style={styles.roleText}>Front Desk Manager</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: stat.bgColor }]}>
              <IconSymbol
                name={stat.icon}
                size={24}
                color={stat.color}
                style={styles.statIcon}
              />
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <IconSymbol
                name={action.icon}
                size={28}
                color={action.color}
                style={styles.actionIcon}
              />
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {[
            { time: '10:30 AM', action: 'New ticket created #TK-001', type: 'create' },
            { time: '10:15 AM', action: 'Photo uploaded for ticket #TK-002', type: 'media' },
            { time: '10:00 AM', action: 'Customer John Doe checked in', type: 'customer' },
            { time: '09:45 AM', action: 'Ticket #TK-003 completed', type: 'complete' },
          ].map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <IconSymbol
                name={
                  activity.type === 'create' ? 'plus.circle.fill' :
                  activity.type === 'media' ? 'photo.fill' :
                  activity.type === 'customer' ? 'person.fill' :
                  'checkmark.circle.fill'
                }
                size={16}
                color={Colors.neutral[600]}
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityAction}>{activity.action}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  welcomeText: {
    fontSize: Typography.fontSize.base,
    color: Colors.neutral[600],
    fontFamily: Typography.fontFamily.regular,
  },
  nameText: {
    fontSize: Typography.fontSize.xl2,
    color: Colors.neutral[900],
    fontFamily: Typography.fontFamily.bold,
    marginTop: Spacing.xs,
  },
  roleText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[600],
    fontFamily: Typography.fontFamily.medium,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.neutral[900],
    fontFamily: Typography.fontFamily.semibold,
    marginBottom: Spacing.base,
  },
  statsContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.base,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.base,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statIcon: {
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.fontSize.xl2,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.xs,
  },
  statTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[600],
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.base,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    padding: Spacing.base,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    marginBottom: Spacing.xs,
  },
  actionTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[700],
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  activityContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  activityList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.base,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  activityContent: {
    flex: 1,
    marginLeft: Spacing.base,
  },
  activityAction: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[900],
    fontFamily: Typography.fontFamily.medium,
  },
  activityTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[500],
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
});
