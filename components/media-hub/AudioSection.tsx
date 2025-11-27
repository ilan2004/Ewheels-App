import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { BorderRadius, BrandColors, Colors, Shadows, Spacing, Typography } from '@/constants/design-system';
import AudioList from './AudioList';
import AudioRecorder from './AudioRecorder';

type AudioTab = 'record' | 'list';

export default function AudioSection() {
  const [activeTab, setActiveTab] = useState<AudioTab>('record');

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'record' && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab('record')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'record' && styles.tabTextActive
            ]}>Record</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'list' && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab('list')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'list' && styles.tabTextActive
            ]}>Recordings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'record' ? (
          <AudioRecorder />
        ) : (
          <AudioList />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.surface,
  },
  tabContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: BrandColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.ink + '10',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: BrandColors.ink + '05',
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: BrandColors.ink + '60',
  },
  tabTextActive: {
    color: BrandColors.primary,
    fontFamily: Typography.fontFamily.semibold,
  },
  content: {
    flex: 1,
  },
});
